<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Support\Facades\Cache;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\VinusSoftware;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;

/** Install only bundled, checksum-verified companions. Never execute remote build scripts. */
final class PlayerCompanion
{
    public function __construct(private InstallFiles $files, private DaemonServerRepository $daemon) {}

    public static function select(array $profile, array $artifacts): ?array
    {
        if ($profile['proxy'] ?? false) return null;
        $plugins = array_intersect($profile['categories']['plugins'] ?? [], ['paper', 'spigot', 'bukkit']);
        $mods = array_intersect($profile['categories']['mods'] ?? [], ['fabric', 'forge', 'neoforge']);
        // Hybrids must receive exactly one bridge; Bukkit is preferred.
        $loaders = $plugins ? ['bukkit'] : array_values($mods);
        foreach ($artifacts as $artifact) {
            if (in_array($artifact['loader'] ?? '', $loaders, true) && in_array($profile['game_version'] ?? '', $artifact['minecraft'] ?? [], true)) return $artifact;
        }
        return null;
    }

    private function artifacts(): array
    {
        $path = __DIR__.'/player-artifacts/manifest.json';
        return is_file($path) ? (json_decode(file_get_contents($path), true, 32, JSON_THROW_ON_ERROR)['artifacts'] ?? []) : [];
    }

    private function loaderVersion(Server $server, array $profile): ?string
    {
        if (is_string($profile['loader_version'] ?? null)) return $profile['loader_version'];
        // Older catalogue records have an exact build ID but no loader version. Resolve that ID,
        // never the latest build, without reinstalling or changing the server's recorded settings.
        $path = storage_path('app/vinussoftware/'.$server->uuid.'.json');
        if (!is_file($path) || filesize($path) > 1048576) return null;
        try {
            $record = json_decode(file_get_contents($path), true, 32, JSON_THROW_ON_ERROR);
            if (($record['startup'] ?? null) !== $server->startup || ($record['image'] ?? null) !== $server->image || !is_int($record['build'] ?? null)) return null;
            $type = strtoupper($profile['software'] ?? ''); $version = $profile['game_version'] ?? '';
            if (!in_array($type, ['FABRIC', 'FORGE', 'NEOFORGE'], true) || !preg_match('/^\d+\.\d+(?:\.\d+)?$/D', $version)) return null;
            $response = app(ServerSoftware::class)->get('builds/'.$type.'/'.$version);
            foreach ($response['builds'] ?? [] as $build) {
                if (($build['id'] ?? null) === $record['build'] && ($build['type'] ?? null) === $type && ($build['versionId'] ?? null) === $version) {
                    return is_string($build['projectVersionId'] ?? null) ? $build['projectVersionId'] : null;
                }
            }
        } catch (\Throwable $ignored) { /* An unavailable catalogue cannot establish compatibility. */ }
        return null;
    }

    public function availability(Server $server): array
    {
        $profile = VinusSoftware::forServer($server);
        return $this->describe($profile, $server->image, $this->loaderVersion($server, $profile));
    }

    public function offer(array $plan, string $image): array
    {
        $profile = ServerSoftware::profile($plan['software'], $plan['version'], $plan['label']);
        return $this->describe($profile, $image, $plan['loader_version'] ?? null);
    }

    private function describe(array $profile, string $image, ?string $loaderVersion): array
    {
        $artifact = self::select($profile, $this->artifacts());
        $loaderVerified = !$artifact || $artifact['loader'] === 'bukkit' || in_array($loaderVersion, $artifact['loader_versions'] ?? [], true);
        $java = preg_match('/(?:^|[:\/_-])java[_-]?(\d{1,2})(?:$|[^0-9])/i', $image, $m) ? (int) $m[1] : null;
        $supported = $artifact && $loaderVerified && $java !== null && $java >= max($artifact['java'], version_compare($profile['game_version'] ?? '0', '1.20.5', '>=') ? 21 : 17);
        return ['supported' => (bool) $supported, 'software' => $profile['software'], 'minecraft' => $profile['game_version'],
            'kind' => $artifact ? ($artifact['loader'] === 'bukkit' ? 'plugin' : 'mod') : null,
            'reason' => !$artifact ? 'unsupported' : (!$loaderVerified ? 'loader' : ($supported ? null : 'java')),
            'read_only' => $artifact['read_only'] ?? true];
    }

    public function install(Server $server): array
    {
        $lock = Cache::lock('vinuscatalog:install:'.$server->uuid, 120);
        abort_unless($lock->get(), 409, 'Une installation est déjà en cours.');
        try {
            $server = $server->fresh(); $server->validateCurrentState();
            $profile = VinusSoftware::forServer($server);
            $artifact = self::select($profile, $this->artifacts());
            abort_unless($artifact && $this->availability($server)['supported'], 422, 'Aucune liaison vérifiée pour ce logiciel, cette version Minecraft et cette version Java.');
            abort_unless(preg_match('/^vinus-players-[a-z0-9.\-]+\.jar$/D', $artifact['file'] ?? '') && preg_match('/^[a-f0-9]{64}$/D', $artifact['sha256'] ?? ''), 500, 'Manifeste de liaison invalide.');
            $local = __DIR__.'/player-artifacts/'.$artifact['file'];
            abort_unless(is_file($local) && hash_equals($artifact['sha256'], hash_file('sha256', $local)), 500, 'Le fichier de liaison est absent ou endommagé.');
            $repo = $this->files->setServer($server);
            $roots = array_column($repo->getDirectory('/'), null, 'name');
            // Also scan the other loader directory: a hybrid must never run both bridges.
            foreach (['plugins', 'mods'] as $directory) {
                if (!isset($roots[$directory])) continue;
                abort_unless(!$roots[$directory]['file'] && !$roots[$directory]['symlink'], 409, 'Le dossier des extensions ne peut pas être utilisé.');
                foreach ($repo->getDirectory('/'.$directory) as $entry) {
                    if (preg_match('/^vinus[-_]?players.*\.jar$/i', $entry['name'])) return ['status' => 'existing', 'message' => 'Une liaison existe déjà. Démarrez le serveur ou vérifiez sa compatibilité dans la console.'];
                }
            }
            abort_unless(in_array($this->daemon->setServer($server)->getDetails()['state'] ?? '', ['offline', 'stopped'], true), 409, 'Arrêtez le serveur avant d’installer la liaison joueurs.');
            $directory = $artifact['loader'] === 'bukkit' ? 'plugins' : 'mods';
            if (!isset($roots[$directory])) $repo->createDirectory($directory, '/');
            // A non-JAR temporary name is never loaded if a concurrent start occurs.
            $temporary = '.vinus-players-'.bin2hex(random_bytes(8)).'.tmp';
            try {
                $repo->upload('/'.$directory.'/'.$temporary, $local);
                $remote = $repo->getContent('/'.$directory.'/'.$temporary, 1048576);
                abort_unless(hash_equals($artifact['sha256'], hash('sha256', $remote)), 502, 'La copie de la liaison est incomplète.');
                abort_unless(in_array($this->daemon->setServer($server)->getDetails()['state'] ?? '', ['offline', 'stopped'], true), 409, 'Le serveur a démarré pendant l’installation. Arrêtez-le et réessayez.');
                abort_unless(VinusSoftware::forServer($server->fresh()) === $profile && $server->fresh()->image === $server->image, 409, 'La configuration du serveur a changé.');
                $repo->renameFiles('/'.$directory, [['from' => $temporary, 'to' => $artifact['file']]]);
            } finally {
                // Only the unique temporary upload can be removed; never touch an installed JAR.
                try { $repo->deleteFiles('/'.$directory, [$temporary]); } catch (\Throwable $ignored) {}
            }
            return ['status' => 'installed', 'message' => 'Liaison installée. Démarrez le serveur pour activer les données en direct.'];
        } finally { $lock->release(); }
    }

    /** Old queued jobs omit consent and must never install a bridge. */
    public function automatic(Server $server, bool $accepted = false): array
    {
        if (!$accepted) return ['status' => 'declined'];
        try {
            if (!$this->availability($server)['supported']) return ['status' => 'unsupported'];
            return $this->install($server);
        } catch (\Throwable $error) {
            report($error);
            // Keep the successful software installation, but report the separate bridge failure.
            return ['status' => 'failed'];
        }
    }
}
