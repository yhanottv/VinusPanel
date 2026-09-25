<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Servers\ServerCreationService;

class VinusDeployController extends Controller
{
    public function __construct(private ServerCreationService $creationService)
    {
    }

    /**
     * Everything the first-login wizard needs: nodes with free allocations,
     * nests and eggs (with their variables) and the list of owners.
     */
    public function data(): JsonResponse
    {
        $nodes = Node::query()->orderBy('id')->get()->map(fn (Node $node) => [
            'id' => $node->id,
            'name' => $node->name,
            'fqdn' => $node->fqdn,
            'memory' => (int) $node->memory,
            'disk' => (int) $node->disk,
            'memory_overallocate' => (int) $node->memory_overallocate,
            'disk_overallocate' => (int) $node->disk_overallocate,
            'allocations' => Allocation::query()
                ->where('node_id', $node->id)
                ->whereNull('server_id')
                ->orderBy('port')
                ->get(['id', 'ip', 'port', 'ip_alias'])
                ->map(fn (Allocation $allocation) => [
                    'id' => $allocation->id,
                    'ip' => $allocation->ip,
                    'port' => $allocation->port,
                    'alias' => $allocation->ip_alias,
                ])->values(),
        ])->values();

        $nests = Nest::query()->with(['eggs' => fn ($query) => $query->orderBy('name')])->orderBy('id')->get()
            ->map(fn (Nest $nest) => [
                'id' => $nest->id,
                'name' => $nest->name,
                'eggs' => $nest->eggs->map(fn (Egg $egg) => [
                    'id' => $egg->id,
                    'name' => $egg->name,
                    'startup' => $egg->startup,
                    'images' => array_values($egg->docker_images ?? []),
                    'variables' => $egg->variables->map(fn ($variable) => [
                        'env_variable' => $variable->env_variable,
                        'name' => $variable->name,
                        'default_value' => (string) $variable->default_value,
                        'rules' => (string) $variable->rules,
                    ])->values(),
                ])->values(),
            ])->values();

        $users = User::query()->orderBy('id')->get(['id', 'email', 'username'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
            ])->values();

        return response()->json(['nodes' => $nodes, 'nests' => $nests, 'users' => $users]);
    }

    /**
     * Create a server from the wizard payload. The full Pterodactyl payload
     * (startup, image, egg variables) is derived from the chosen egg.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:1', 'max:191'],
            'owner_id' => ['required', 'integer', 'exists:users,id'],
            'egg_id' => ['required', 'integer', 'exists:eggs,id'],
            'allocation_id' => ['required', 'integer', 'exists:allocations,id'],
            'memory' => ['required', 'integer', 'min:128'],
            'disk' => ['required', 'integer', 'min:128'],
            'cpu' => ['sometimes', 'integer', 'min:0', 'max:2000'],
            'description' => ['sometimes', 'nullable', 'string', 'max:191'],
            'environment' => ['sometimes', 'array'],
            'environment.*' => ['nullable', 'string', 'max:191'],
            'start_on_completion' => ['sometimes', 'boolean'],
        ]);

        $egg = Egg::query()->with('variables')->findOrFail($data['egg_id']);
        $allocation = Allocation::query()->findOrFail($data['allocation_id']);
        if (!empty($allocation->server_id)) {
            return response()->json(['message' => 'Ce port est deja utilise.'], 422);
        }

        $node = Node::query()->findOrFail($allocation->node_id);
        $memoryLimit = (int) ($node->memory * (1 + $node->memory_overallocate / 100));
        $diskLimit = (int) ($node->disk * (1 + $node->disk_overallocate / 100));
        if ($data['memory'] > $memoryLimit || $data['disk'] > $diskLimit) {
            return response()->json(['message' => 'La memoire ou le disque depasse la capacite du noeud.'], 422);
        }

        $images = array_values($egg->docker_images ?? []);
        if (empty($images)) {
            return response()->json(['message' => "Cette egg n'a pas d'image Docker."], 422);
        }

        $environment = [];
        foreach ($egg->variables as $variable) {
            $environment[$variable->env_variable] = (string) $variable->default_value;
        }
        foreach (($data['environment'] ?? []) as $key => $value) {
            $environment[$key] = (string) $value;
        }

        try {
            $server = $this->creationService->handle([
                'name' => $data['name'],
                'description' => $data['description'] ?? '',
                'owner_id' => (int) $data['owner_id'],
                'node_id' => (int) $node->id,
                'nest_id' => (int) $egg->nest_id,
                'egg_id' => (int) $egg->id,
                'allocation_id' => (int) $allocation->id,
                'memory' => (int) $data['memory'],
                'swap' => 0,
                'io' => 500,
                'cpu' => (int) ($data['cpu'] ?? 100),
                'disk' => (int) $data['disk'],
                'startup' => (string) $egg->startup,
                'image' => (string) $images[0],
                'environment' => $environment,
                'skip_scripts' => false,
                'start_on_completion' => (bool) ($data['start_on_completion'] ?? false),
                'database_limit' => 0,
                'allocation_limit' => 0,
                'backup_limit' => 0,
            ]);
        } catch (\Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'ok' => true,
            'server' => [
                'id' => $server->id,
                'uuid' => $server->uuid,
                'identifier' => $server->uuidShort,
                'name' => $server->name,
            ],
        ]);
    }
}
