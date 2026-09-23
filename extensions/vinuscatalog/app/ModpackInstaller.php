<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Support\Str;
use Pterodactyl\Models\{Server, User};
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Services\Servers\{StartupModificationService, SuspensionService};

class ModpackInstaller
{
    public function __construct(private InstallDownload $download, private InstallFiles $files, private DaemonServerRepository $daemon, private StartupModificationService $startup, private SuspensionService $suspension) {}

    public function install(Server $server, array $plan, array $optional = []): array
    {
        ignore_user_abort(true); set_time_limit(600);
        $batch = 'vinus-modpack-'.Str::lower(Str::random(16));
        $local = storage_path('app/vinussoftware/tmp/'.$batch);
        abort_unless(is_dir($local) || mkdir($local, 0700, true), 500);
        $repository = $this->files->setServer($server);
        $promoted = []; $replaced = []; $suspended = false; $rollbackFailed = false;
        $recordPath = SoftwareInstaller::recordPath($server);
        $catalogPath = storage_path('app/vinuscatalog/'.$server->uuid.'.json');
        $oldRecord = is_file($recordPath) ? file_get_contents($recordPath) : null;
        $oldCatalog = is_file($catalogPath) ? file_get_contents($catalogPath) : null;
        $old = ['startup' => $server->startup, 'docker_image' => $server->image, 'skip_scripts' => $server->skip_scripts];
        $runtime = $plan['runtime']; $image = SoftwareInstaller::image($server, (int) $runtime['java']);
        $this->download->deadline = microtime(true) + 450;
        try {
            abort_unless(in_array($this->daemon->setServer($server)->getDetails()['state'] ?? '', ['offline','stopped'], true), 409, 'Arrêtez le serveur avant d’installer un modpack.');
            $archive = $local.'/pack.part'; $artifact = $plan['artifact'];
            if(($plan['source']??'modrinth')==='curseforge') {
                (new ArchiveCatalog(new CatalogSources(),$this->download))->download($artifact,$archive);
                abort_unless(hash_equals($artifact['sha512'],hash_file('sha512',$archive)),409,'Le pack serveur a changé depuis l’aperçu.');
                $pack=CurseForgeModpack::read($archive,$plan['pack_runtime']);
            } else {
                $this->download->fetch($artifact['url'], $archive, $artifact['size'], $artifact['sha512']);
                $pack = ModpackManifest::read($archive, 'modrinth');
            }
            abort_unless($pack['runtime']['minecraft'] === $runtime['version'] && $pack['runtime']['software'] === $runtime['software'], 422, 'Le logiciel ne correspond pas au modpack.');
            $optionalPaths = array_column(array_filter($pack['files'], fn ($f) => $f['optional']), 'path');
            abort_unless(!array_diff($optional, $optionalPaths), 422, 'Sélection de fichiers optionnels invalide.');
            $estimate = $pack['size'] + array_sum(array_column($pack['overrides'], 'size')) + array_sum(array_column($runtime['steps'], 'size'));
            abort_unless(disk_free_space($local) > 3 * $estimate + 134217728, 422, 'Espace temporaire insuffisant sur le panel pour préparer ce pack.');
            $files = []; $downloads = [];
            foreach ($runtime['steps'] as $step) {
                if ($step['type'] === 'download') {
                    $target = $local.'/runtime-'.count($downloads).'.part';
                    $this->download->fetch($step['url'], $target, $step['size']);
                    InstallArchive::entries($target); $downloads[$step['file']] = $target;
                    if ($step['file'] === 'server.jar') ModpackBundle::add($files, 'server.jar', $target);
                } elseif ($step['type'] === 'unzip') {
                    abort_unless($step['location'] === '.' && isset($downloads[$step['file']]), 422, 'Extraction du logiciel non reconnue.');
                    ModpackBundle::extract($downloads[$step['file']], InstallArchive::entries($downloads[$step['file']]), $local, $files, false);
                }
            }
            foreach ($pack['files'] as $file) {
                if ($file['optional'] && !in_array($file['path'], $optional, true)) continue;
                abort_unless(ModpackBundle::packPath($file['path']), 422, 'Fichier réservé dans le modpack.');
                $target = $local.'/mod-'.bin2hex(random_bytes(12)).'.part'; $failure = null;
                foreach ($file['urls'] as $url) {
                    try { $this->download->fetch($url, $target, $file['size'], $file['sha512']); $failure = null; break; }
                    catch (\Throwable $error) { $failure = $error; }
                }
                if ($failure) throw $failure;
                ModpackBundle::add($files, $file['path'], $target);
            }
            ModpackBundle::extract($archive, $pack['overrides'], $local, $files, true);
            if ($pack['runtime']['software'] === 'FABRIC') foreach ($files as $path => $file) {
                if (str_starts_with($path, 'mods/') && preg_match('/\.jar$/iD', $path)) ModpackBundle::checkFabric($file, $pack['runtime']['loader_version'], basename($path));
            }
            if (isset($files['server.properties'])) abort_unless(filesize($files['server.properties']) <= 1048576, 422, 'Le fichier server.properties est trop volumineux.');
            $properties = isset($files['server.properties']) ? file_get_contents($files['server.properties']) : '';
            $propertiesFile = $local.'/properties.part';
            abort_unless(file_put_contents($propertiesFile, ModpackBundle::properties($properties, (int) $server->allocation->port)) !== false, 500);
            ModpackBundle::add($files, 'server.properties', $propertiesFile, true);
            abort_unless(microtime(true) < $this->download->deadline, 422, 'La préparation a dépassé le délai autorisé ; le serveur est inchangé.');
            ModpackBundle::zip($files, $local.'/prepared.zip');
            $server = $server->fresh(); $server->validateCurrentState();
            abort_unless($server->startup === $old['startup'] && $server->image === $old['docker_image'], 409, 'Le démarrage du serveur a changé.');
            $details = $this->daemon->setServer($server)->getDetails();
            abort_unless(in_array($details['state'] ?? '', ['offline','stopped'], true), 409, 'Le serveur a été démarré pendant la préparation.');
            $required = array_sum(array_map('filesize', $files)) + filesize($local.'/prepared.zip');
            if ($server->disk > 0) abort_unless(($details['resources']['disk_bytes'] ?? 0) + $required <= $server->disk * 1048576, 422, 'Espace disque insuffisant pour conserver les anciens fichiers et préparer ce pack.');
            // Lock power/SFTP only during upload and replacement. Existing EULA acceptance is preserved.
            $this->suspension->toggle($server); $suspended = true;
            $repository->createDirectory($batch, '/');
            $repository->createDirectory('prepared', '/'.$batch);
            $repository->createDirectory('previous', '/'.$batch);
            $repository->putContent('/'.$batch.'/runtime.json', json_encode(['previous' => $old, 'profile' => $oldRecord ? json_decode($oldRecord, true) : null, 'catalog' => $oldCatalog ? json_decode($oldCatalog, true) : null, 'modpack' => array_intersect_key($plan, array_flip(['project','version','title','release']))], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT));
            $repository->upload('/'.$batch.'/prepared/bundle.zip', $local.'/prepared.zip');
            $repository->decompressFile('/'.$batch.'/prepared', 'bundle.zip');
            $repository->deleteFiles('/'.$batch.'/prepared', ['bundle.zip']);
            $staged = $repository->getDirectory('/'.$batch.'/prepared');
            $expected = array_unique(array_map(fn ($path) => explode('/', $path)[0], array_keys($files)));
            $actual = array_column($staged, 'name');
            abort_unless(!array_diff($expected, $actual) && !array_diff($actual, $expected), 422, 'Le serveur préparé est incomplet.');
            foreach ($staged as $entry) abort_unless(!$entry['symlink'], 422, 'Un lien est présent dans les fichiers préparés.');
            foreach ($repository->getDirectory('/') as $entry) {
                $name = $entry['name'];
                if ($name === 'eula.txt' || str_starts_with(strtolower($name), 'vinus-')) continue;
                $repository->renameFiles('/', [['from' => $name, 'to' => $batch.'/previous/'.$name]]); $replaced[] = $name;
            }
            foreach ($actual as $name) {
                $repository->renameFiles('/', [['from' => $batch.'/prepared/'.$name, 'to' => $name]]); $promoted[] = $name;
            }
            $server = $this->startup->setUserLevel(User::USER_LEVEL_ADMIN)->handle($server, ['startup' => SoftwareInstaller::STARTUP, 'docker_image' => $image, 'skip_scripts' => $old['skip_scripts']]);
            $profile = ServerSoftware::profile($runtime['software'], $runtime['version'], $runtime['label']);
            $record = ['profile' => $profile, 'startup' => SoftwareInstaller::STARTUP, 'image' => $image, 'build' => $runtime['build'], 'backup' => $batch, 'installed_at' => now()->toIso8601String(), 'modpack' => ['source' => $plan['source']??'modrinth','project' => $plan['project'],'version' => $plan['version'],'title' => $plan['title'],'sha512' => $artifact['sha512']]];
            abort_unless(file_put_contents($recordPath.'.tmp', json_encode($record, JSON_THROW_ON_ERROR)) !== false && rename($recordPath.'.tmp', $recordPath), 500, 'Impossible d’enregistrer le pack installé.');
            if (is_file($catalogPath)) abort_unless(unlink($catalogPath), 500, 'Impossible de mettre à jour les extensions installées.');
            $this->suspension->toggle($server, SuspensionService::ACTION_UNSUSPEND); $suspended = false;
            return ['profile' => $profile, 'backup' => $batch, 'message' => $plan['title'].' installé. Le serveur reste arrêté. Les anciens fichiers sont disponibles dans le dossier de récupération.'];
        } catch (\Throwable $error) {
            if ($suspended) {
                try {
                    foreach (array_reverse($promoted) as $name) $repository->renameFiles('/', [['from' => $name, 'to' => $batch.'/prepared/'.$name]]);
                    foreach (array_reverse($replaced) as $name) $repository->renameFiles('/', [['from' => $batch.'/previous/'.$name, 'to' => $name]]);
                    $server = $this->startup->setUserLevel(User::USER_LEVEL_ADMIN)->handle($server->fresh(), $old);
                    foreach ([$recordPath => $oldRecord, $catalogPath => $oldCatalog] as $path => $content) {
                        if ($content === null) { if (is_file($path) && !unlink($path)) throw new \RuntimeException('Record rollback failed'); }
                        elseif (file_put_contents($path, $content) === false) throw new \RuntimeException('Record rollback failed');
                    }
                } catch (\Throwable $rollback) { $rollbackFailed = true; report($rollback); }
            }
            if ($rollbackFailed) abort(500, 'Restauration interrompue. Le serveur reste verrouillé ; un administrateur doit restaurer '.$batch.'/previous et runtime.json.');
            throw $error;
        } finally {
            $this->download->deadline = null;
            if ($suspended && !$rollbackFailed) $this->suspension->toggle($server->fresh(), SuspensionService::ACTION_UNSUSPEND);
            foreach (glob($local.'/*') ?: [] as $file) if (is_file($file)) unlink($file);
            if (is_dir($local)) rmdir($local);
        }
    }
}
