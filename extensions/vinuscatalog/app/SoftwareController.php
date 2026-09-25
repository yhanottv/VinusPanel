<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;

final class SoftwareController extends Controller
{
    public function __construct(private ServerSoftware $software, private SoftwareInstaller $installer) {}

    private function access(Request $request, Server $server, bool $write = false): void
    {
        foreach ($write ? ['startup.read','startup.update','settings.reinstall','file.read','file.read-content','file.create','file.update','file.delete'] : ['startup.read'] as $permission) abort_unless($request->user()->can($permission, $server), 403);
    }

    public function types(Request $request, Server $server): array
    {
        $this->access($request, $server);
        return ['groups' => $this->software->types()];
    }

    public function versions(Request $request, Server $server): array
    {
        $this->access($request, $server);
        $data = $request->validate(['type' => 'required|string|max:40']);
        return ['versions' => $this->software->versions($data['type'])];
    }

    public function builds(Request $request, Server $server): array
    {
        $this->access($request, $server);
        $data = $request->validate(['type' => 'required|string|max:40', 'version' => 'required|string|max:81']);
        return ['builds' => $this->software->builds($data['type'], $data['version'])];
    }

    public function plan(Request $request, Server $server): array
    {
        $this->access($request, $server, true);
        $data = $request->validate(['type' => 'required|string|max:40', 'version' => 'required|string|max:81', 'build' => 'required|integer|min:1']);
        $plan = $this->software->plan($data['type'], $data['version'], $data['build']);
        $image = SoftwareInstaller::image($server, (int) $plan['java']);
        $token = Str::random(48);
        Cache::put('vinussoftware:plan:'.$token, ['user' => $request->user()->id, 'server' => $server->uuid, 'startup' => $server->startup, 'image' => $server->image, 'plan' => $plan], 600);
        return ['companion' => app(PlayerCompanion::class)->offer($plan, $image) + ['can_install' => $request->user()->can('control.console', $server)], 'token' => $token, 'java' => $plan['java'], 'image' => $image, 'label' => $plan['label'], 'size' => array_sum(array_column($plan['steps'], 'size'))];
    }

    public function install(Request $request, Server $server): array
    {
        $this->access($request, $server, true);
        $data = $request->validate(['token' => 'required|regex:/^[a-zA-Z0-9]{48}$/D', 'install_players' => 'required|boolean']);
        $token = $data['token'];
        $accepted = $request->boolean('install_players');
        if ($accepted) abort_unless($request->user()->can('control.console', $server), 403);
        $lock = Cache::lock('vinuscatalog:install:'.$server->uuid, 900);
        abort_unless($lock->get(), 409, 'Une installation est déjà en cours.');
        try {
            $saved = Cache::get('vinussoftware:plan:'.$token);
            abort_unless($saved && $saved['user'] === $request->user()->id && $saved['server'] === $server->uuid, 422, 'Cet aperçu a expiré ou a déjà été utilisé.');
            abort_unless($server->startup === $saved['startup'] && $server->image === $saved['image'], 409, 'La configuration du serveur a changé.');
            $server->validateCurrentState();
            Cache::forget('vinussoftware:plan:'.$token);
            $result = $this->installer->install($server, $saved['plan']);
            if (!$accepted) $result['companion_followup'] = CompanionReminder::queue($request->user()->id, $server->uuid);
        } finally { $lock->release(); }
        $result['companion'] = app(PlayerCompanion::class)->automatic($server->fresh(), $accepted);
        return $result;
    }
}
