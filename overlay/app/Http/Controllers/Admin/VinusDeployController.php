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
     * Nombre de coeurs CPU visibles par le panel : cgroup v2, cgroup v1,
     * nproc, dans cet ordre.
     */
    private function cpuCores(): int
    {
        $quota = null;
        if (is_file('/sys/fs/cgroup/cpu.max')) {
            $line = trim((string) file_get_contents('/sys/fs/cgroup/cpu.max'));
            if ($line !== '' && $line !== 'max') {
                [$quota, $period] = array_pad(explode(' ', $line), 2, '100000');
                if ((int) $period > 0) {
                    $quota = max(1, (int) ceil(((int) $quota) / ((int) $period)));
                }
            }
        }
        if ($quota === null && is_file('/sys/fs/cgroup/cpu/cpu.cfs_quota_us')) {
            $q = (int) file_get_contents('/sys/fs/cgroup/cpu/cpu.cfs_quota_us');
            $p = (int) file_get_contents('/sys/fs/cgroup/cpu/cpu.cfs_period_us');
            if ($q > 0 && $p > 0) {
                $quota = max(1, (int) ceil($q / $p));
            }
        }
        if ($quota === null) {
            $cores = (int) shell_exec('nproc 2>/dev/null') ?: (int) (@shell_exec('getconf _NPROCESSORS_ONLN 2>/dev/null') ?: 0);
            return max(1, $cores);
        }

        return max(1, (int) $quota);
    }

    /**
     * Presets de RAM deduits de la memoire reelle allouable du noeud.
     */
    private function memoryPresets(int $nodeMemory): array
    {
        $labels = [
            1024 => 'Small Testing Server',
            2048 => 'Small Testing Server',
            4096 => 'Starter Survival',
            8192 => 'Medium Survival Server',
            16384 => 'Large Community Server',
            24576 => 'Heavy Modpack Server',
            32768 => 'High-Traffic Network',
            49152 => 'Enterprise Workload',
            65536 => 'Extreme Performance',
        ];

        $presets = [];
        foreach ([1024, 2048, 4096, 8192, 16384, 24576, 32768, 49152, 65536] as $value) {
            if ($value <= $nodeMemory) {
                $presets[] = ['value' => $value, 'label' => $labels[$value] ?? 'Serveur'];
            }
        }
        // Le noeud peut permettre plus que le dernier preset standard : on
        // ajoute le maximum reel comme choix final.
        if ($nodeMemory > 1024 && empty($presets)) {
            $presets[] = ['value' => 1024, 'label' => 'Small Testing Server'];
        }
        $last = end($presets);
        if ($last === false || (int) $last['value'] < $nodeMemory) {
            $rounded = (int) (floor($nodeMemory / 1024) * 1024);
            if ($rounded > 0 && ($last === false || (int) $last['value'] < $rounded)) {
                $presets[] = ['value' => $rounded, 'label' => 'Maximum du serveur'];
            }
        }

        return array_values($presets);
    }

    /**
     * Presets de CPU deduits du nombre de coeurs reels.
     */
    private function cpuPresets(int $cores): array
    {
        $limit = $cores * 100;
        $presets = [];
        foreach ([100, 200, 300, 400, 600, 800] as $value) {
            if ($value <= $limit) {
                $presets[] = $value;
            }
        }
        $presets[] = $limit;

        return array_values(array_unique($presets));
    }

    /**
     * Everything the first-login wizard needs: nodes with free allocations,
     * nests and eggs (with their variables) and the list of owners.
     */
    public function data(): JsonResponse
    {
        $cores = $this->cpuCores();

        $nodes = Node::query()->orderBy('id')->get()->map(fn (Node $node) => [
            'id' => $node->id,
            'name' => $node->name,
            'fqdn' => $node->fqdn,
            'memory' => (int) $node->memory,
            'disk' => (int) $node->disk,
            'memory_overallocate' => (int) $node->memory_overallocate,
            'disk_overallocate' => (int) $node->disk_overallocate,
            'memory_presets' => $this->memoryPresets((int) $node->memory),
            'cpu_presets' => $this->cpuPresets($cores),
            'cpu_cores' => $cores,
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
