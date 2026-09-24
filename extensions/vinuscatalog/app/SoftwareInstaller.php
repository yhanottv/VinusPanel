<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Support\Str;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Services\Servers\StartupModificationService;
use Pterodactyl\Services\Servers\SuspensionService;

final class SoftwareInstaller
{
    public const STARTUP = 'java -Xms128M -XX:MaxRAMPercentage=90.0 -Dterminal.jline=false -Dterminal.ansi=true -jar server.jar nogui';
    private const ROOTS = ['server.jar', 'libraries', 'versions', 'cache', 'unix_args.txt', 'user_jvm_args.txt', 'run.sh', 'run.bat'];

    public static function recordPath(Server $server): string { return storage_path('app/vinussoftware/'.$server->uuid.'.json'); }

    public static function image(Server $server, int $java): string
    {
        // Only use an image already approved by the administrator for this egg.
        foreach ($server->egg->docker_images as $image) if (preg_match('/(?:java[_-]|:)(\d+)(?:$|[-_])/', $image, $match) && (int) $match[1] === $java) return $image;
        abort(422, 'Java '.$java.' n’est pas configuré parmi les images autorisées de cet egg.');
    }

    public function __construct(private InstallDownload $download, private InstallFiles $files, private DaemonServerRepository $daemon, private StartupModificationService $startup, private SuspensionService $suspension) {}

    public function install(Server $server, array $plan): array
    {
        ignore_user_abort(true); set_time_limit(600);
        $batch = 'vinus-software-'.Str::lower(Str::random(16));
        $local = storage_path('app/vinussoftware/tmp/'.$batch);
        abort_unless(is_dir($local) || mkdir($local, 0700, true), 500);
        $repository = $this->files->setServer($server);
        $prepared = []; $uploaded = []; $promoted = []; $replaced = []; $suspended = false; $rollbackFailed = false;
        $recordPath = self::recordPath($server);
        $oldRecord = is_file($recordPath) ? file_get_contents($recordPath) : null;
        $old = ['startup' => $server->startup, 'docker_image' => $server->image, 'skip_scripts' => $server->skip_scripts];
        $image = self::image($server, (int) $plan['java']);
        try {
            // All downloads and ZIP validation happen before touching the game server.
            foreach ($plan['steps'] as $step) {
                if ($step['type'] !== 'download') continue;
                abort_unless(ServerSoftware::safePath($step['file']) && !isset($prepared[$step['file']]), 422, 'Fichier d’installation dupliqué.');
                $target = $local.'/'.count($prepared).'.download';
                $this->download->fetch($step['url'], $target, $step['size']);
                $entries = InstallArchive::entries($target);
                $prepared[$step['file']] = ['local' => $target, 'entries' => $entries, 'sha512' => hash_file('sha512', $target)];
            }
            $roots = [];
            foreach ($plan['steps'] as $step) {
                if ($step['type'] === 'download') {
                    if (str_ends_with($step['file'], '.jar')) {
                        abort_unless($step['file'] === 'server.jar', 422, 'Lanceur non reconnu.');
                        $roots['server.jar'] = true;
                    }
                } elseif ($step['type'] === 'unzip') {
                    abort_unless($step['location'] === '.' && isset($prepared[$step['file']]), 422, 'Extraction de logiciel non reconnue.');
                    foreach ($prepared[$step['file']]['entries'] as $entry) {
                        $root = explode('/', $entry['path'])[0];
                        abort_unless(in_array($root, self::ROOTS, true), 422, 'L’archive contient un fichier qui ne fait pas partie du logiciel.');
                        $roots[$root] = true;
                    }
                }
            }
            abort_unless(isset($roots['server.jar']), 422, 'L’archive ne fournit pas de lanceur server.jar.');
            $server = $server->fresh(); $server->validateCurrentState();
            abort_unless($server->startup === $old['startup'] && $server->image === $old['docker_image'], 409, 'La configuration de démarrage a changé.');
            abort_unless(in_array($this->daemon->setServer($server)->getDetails()['state'] ?? '', ['offline', 'stopped'], true), 409, 'Arrêtez le serveur avant de changer de logiciel.');
            // Wings suspension also prevents starts through an existing WebSocket or SFTP writes.
            // It lasts only for the file swap; the server is never started automatically.
            $this->suspension->toggle($server); $suspended = true;
            $repository->createDirectory($batch, '/');
            $repository->createDirectory('prepared', '/'.$batch);
            $repository->createDirectory('previous', '/'.$batch);
            $repository->putContent('/'.$batch.'/runtime.json', json_encode(['previous' => $old, 'profile' => $oldRecord ? json_decode($oldRecord, true) : null, 'selection' => array_intersect_key($plan, array_flip(['software','version','build','label','java']))], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            foreach ($prepared as $name => $file) {
                $repository->upload('/'.$batch.'/prepared/'.$name, $file['local']);
                $uploaded[] = $name;
            }
            foreach ($plan['steps'] as $step) if ($step['type'] === 'unzip') {
                $repository->decompressFile('/'.$batch.'/prepared', $step['file']);
                $repository->deleteFiles('/'.$batch.'/prepared', [$step['file']]);
            }
            $staged = array_column($repository->getDirectory('/'.$batch.'/prepared'), null, 'name');
            abort_unless(isset($staged['server.jar']) && $staged['server.jar']['file'] && !$staged['server.jar']['symlink'], 422, 'Le lanceur préparé est absent.');
            foreach (array_keys($roots) as $name) abort_unless(isset($staged[$name]) && !$staged[$name]['symlink'], 422, 'Fichier préparé non valide.');
            $existing = array_column($repository->getDirectory('/'), null, 'name');
            foreach (array_keys($roots) as $name) {
                if (isset($existing[$name])) {
                    $repository->renameFiles('/', [['from' => $name, 'to' => $batch.'/previous/'.$name]]);
                    $replaced[] = $name;
                }
                $repository->renameFiles('/', [['from' => $batch.'/prepared/'.$name, 'to' => $name]]);
                $promoted[] = $name;
            }
            $server = $this->startup->setUserLevel(User::USER_LEVEL_ADMIN)->handle($server, ['startup' => self::STARTUP, 'docker_image' => $image, 'skip_scripts' => $old['skip_scripts']]);
            $profile = ServerSoftware::profile($plan['software'], $plan['version'], $plan['label']);
            $profile['loader_version'] = $plan['loader_version'] ?? null;
            $record = ['profile' => $profile, 'startup' => self::STARTUP, 'image' => $image, 'build' => $plan['build'], 'backup' => $batch, 'installed_at' => now()->toIso8601String(), 'artifacts' => array_map(fn ($f) => $f['sha512'], $prepared)];
            abort_unless(file_put_contents($recordPath.'.tmp', json_encode($record, JSON_THROW_ON_ERROR)) !== false && rename($recordPath.'.tmp', $recordPath), 500, 'Impossible d’enregistrer le logiciel installé.');
            $this->suspension->toggle($server, SuspensionService::ACTION_UNSUSPEND); $suspended = false;
            return ['profile' => $profile, 'backup' => $batch, 'message' => 'Logiciel installé. Le serveur reste arrêté ; vérifiez vos extensions avant de le démarrer.'];
        } catch (\Throwable $error) {
            if ($suspended) {
                try {
                    foreach (array_reverse($promoted) as $name) $repository->renameFiles('/', [['from' => $name, 'to' => $batch.'/prepared/'.$name]]);
                    foreach (array_reverse($replaced) as $name) $repository->renameFiles('/', [['from' => $batch.'/previous/'.$name, 'to' => $name]]);
                    $server = $this->startup->setUserLevel(User::USER_LEVEL_ADMIN)->handle($server->fresh(), $old);
                    if ($oldRecord === null) { if (is_file($recordPath)) unlink($recordPath); }
                    else file_put_contents($recordPath, $oldRecord);
                } catch (\Throwable $rollback) { $rollbackFailed = true; report($rollback); }
            }
            if ($rollbackFailed) abort(500, 'Restauration interrompue. Le serveur reste verrouillé ; un administrateur doit restaurer les fichiers depuis '.$batch.'/previous et runtime.json.');
            throw $error;
        } finally {
            // Never unlock a partially restored server. Keep its recovery directory intact.
            if ($suspended && !$rollbackFailed) $this->suspension->toggle($server->fresh(), SuspensionService::ACTION_UNSUSPEND);
            foreach (glob($local.'/*.download') ?: [] as $file) unlink($file);
            if (is_dir($local)) rmdir($local);
        }
    }
}
