<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class CatalogController extends Controller
{
    public function __construct(private Modrinth $catalog, private DaemonFileRepository $files, private DaemonServerRepository $daemon) {}

    private function access(Request $request, Server $server, bool $write = false): void
    {
        $permissions = $write ? ['file.read', 'file.read-content', 'file.create', 'file.update'] : ['file.read'];
        foreach ($permissions as $permission) abort_unless($request->user()->can($permission, $server), 403);
    }

    private function detect(Server $server): array
    {
        $variables = [];
        foreach ($server->variables as $variable) {
            // Only version/loader metadata is consumed; never return environment values.
            if (in_array($variable->env_variable, ['MC_VERSION', 'MINECRAFT_VERSION', 'MINECRAFT_VER', 'MC_VER', 'LOADER', 'MOD_LOADER', 'SOFTWARE', 'SERVER_TYPE', 'SERVER_JARFILE', 'JARFILE', 'SERVER_JAR_PATH'], true)) {
                $variables[$variable->env_variable] = $variable->server_value ?? $variable->default_value;
            }
        }
        $overrides = config('vinuscatalog.egg_profiles', []);
        $servers = config('vinuscatalog.server_profiles', []);
        return Detection::detect($server->egg->name, $variables, $servers[$server->uuid] ?? $overrides[$server->egg->uuid] ?? null);
    }

    private function selection(Request $request, Server $server): array
    {
        $input = $request->validate(['kind' => 'required|in:mods,plugins', 'game_version' => 'required|string|max:30']);
        $profile = $this->detect($server);
        abort_unless(isset($profile['categories'][$input['kind']]), 422, 'Cette catégorie ne correspond pas au logiciel détecté.');
        abort_unless(in_array($input['game_version'], $this->catalog->versions(), true), 422, 'Version Minecraft non reconnue.');
        if ($profile['game_version'] !== null) {
            abort_unless($profile['game_version'] === $input['game_version'], 409, 'La version sélectionnée ne correspond plus à celle du serveur.');
        }
        return [$profile, $input, $profile['categories'][$input['kind']]];
    }

    private function manifestPath(Server $server): string
    {
        return storage_path('app/vinuscatalog/'.$server->uuid.'.json');
    }

    private function installed(Server $server): array
    {
        $path = $this->manifestPath($server);
        return is_file($path) ? (json_decode(file_get_contents($path), true, 64, JSON_THROW_ON_ERROR) ?: []) : [];
    }

    public function profile(Request $request, Server $server): array
    {
        $this->access($request, $server);
        return ['profile' => $this->detect($server), 'versions' => $this->catalog->versions(), 'installed' => array_values($this->installed($server))];
    }

    public function search(Request $request, Server $server): array
    {
        $this->access($request, $server);
        [$profile, $input, $loaders] = $this->selection($request, $server);
        $options = $request->validate(['query' => 'nullable|string|max:120', 'offset' => 'nullable|integer|min:0|max:10000', 'sort' => 'nullable|in:relevance,downloads,updated']);
        // Match every published project type: a project can provide both mod and plugin releases.
        $facets = [['all_project_types:'.($input['kind'] === 'mods' ? 'mod' : 'plugin')], array_map(fn ($loader) => 'categories:'.$loader, $loaders), ['versions:'.$input['game_version']], ['server_side!=unsupported']];
        $result = $this->catalog->get('search', ['query' => $options['query'] ?? '', 'offset' => $options['offset'] ?? 0, 'limit' => 12, 'index' => $options['sort'] ?? 'relevance', 'facets' => json_encode($facets)]);
        return ['hits' => array_map(fn ($hit) => array_merge(array_intersect_key($hit, array_flip(['project_id', 'title', 'description', 'author', 'downloads', 'date_modified'])), ['icon_url' => Modrinth::icon($hit['icon_url'] ?? null)]), $result['hits'] ?? []), 'total' => $result['total_hits'] ?? 0];
    }

    public function plan(Request $request, Server $server): array
    {
        $this->access($request, $server, true);
        [$profile, $input, $loaders] = $this->selection($request, $server);
        $project = $request->validate(['project_id' => 'required|regex:/^[a-zA-Z0-9]{8}$/D'])['project_id'];
        $files = $this->catalog->resolve($project, $loaders, $input['game_version']);
        $installed = $this->installed($server);
        foreach ($files as &$file) {
            $previous = $installed[$input['kind'].':'.$file['project_id']] ?? null;
            $file['action'] = $previous && $previous['version_id'] === $file['version_id'] ? 'verify' : ($previous ? 'update' : 'install');
            $file['previous'] = $previous;
        }
        unset($file);
        $token = Str::random(48);
        Cache::put('vinuscatalog:plan:'.$token, ['user' => $request->user()->id, 'server' => $server->uuid, 'profile' => $profile, 'selection' => $input, 'files' => $files], 300);
        return ['token' => $token, 'files' => array_map(fn ($file) => array_intersect_key($file, array_flip(['project_id', 'title', 'version', 'filename', 'size', 'action'])), $files)];
    }

    public function install(Request $request, Server $server): array
    {
        $this->access($request, $server, true);
        $token = $request->validate(['token' => 'required|regex:/^[a-zA-Z0-9]{48}$/D'])['token'];
        $plan = Cache::get('vinuscatalog:plan:'.$token);
        abort_unless($plan && $plan['user'] === $request->user()->id && $plan['server'] === $server->uuid, 422, 'Aperçu expiré. Préparez à nouveau l’installation.');
        abort_unless($plan['profile'] === $this->detect($server), 409, 'La configuration du serveur a changé.');
        $server->validateCurrentState();
        $lock = Cache::lock('vinuscatalog:install:'.$server->uuid, 600);
        abort_unless($lock->get(), 409, 'Une installation est déjà en cours sur ce serveur.');
        try {
            // Revalidate after acquiring the lock: another request may have consumed this token.
            abort_unless(Cache::get('vinuscatalog:plan:'.$token) === $plan, 422, 'Cet aperçu a expiré ou a déjà été utilisé. Préparez une nouvelle installation.');
            abort_unless(array_sum(array_column($plan['files'], 'size')) <= 100 * 1024 * 1024, 422, 'Ce lot dépasse 100 Mio.');
            set_time_limit(300);
            $state = $this->daemon->setServer($server)->getDetails()['state'] ?? null;
            abort_unless(in_array($state, ['offline', 'stopped'], true), 409, 'Arrêtez le serveur avant d’installer ou mettre à jour une extension.');
            $repository = $this->files->setServer($server);
            $kind = $plan['selection']['kind'];
            $installed = $this->installed($server);
            $root = $repository->getDirectory('/');
            if (!collect($root)->contains('name', $kind)) $repository->createDirectory($kind, '/');
            $existing = array_column($repository->getDirectory('/'.$kind), null, 'name');
            // Check all collisions and managed old files before downloading or replacing anything.
            foreach ($plan['files'] as $file) {
                $key = $kind.':'.$file['project_id'];
                abort_unless(($installed[$key] ?? null) === $file['previous'], 409, 'L’installation a changé depuis l’aperçu.');
                if (isset($existing[$file['filename']]) && ($file['previous']['filename'] ?? null) !== $file['filename']) {
                    throw new HttpException(409, 'Le fichier '.$file['filename'].' existe déjà. Aucun fichier non géré ne sera remplacé.');
                }
                if ($file['previous'] && isset($existing[$file['previous']['filename']])) {
                    $content = $repository->getContent('/'.$kind.'/'.$file['previous']['filename'], 25 * 1024 * 1024);
                    abort_unless(hash_equals($file['previous']['sha512'], hash('sha512', $content)), 409, 'Un fichier installé a été modifié manuellement. Vérifiez-le avant la mise à jour.');
                    unset($content);
                }
            }
            // Consume before the first download, including when a later step fails.
            Cache::forget('vinuscatalog:plan:'.$token);
            $batch = 'vinus-'.Str::lower(Str::random(12));
            $repository->createDirectory($batch, '/');
            $prepared = [];
            foreach ($plan['files'] as $file) {
                if ($file['action'] === 'verify' && isset($existing[$file['filename']])) continue;
                $temp = tmpfile();
                if (!$temp) throw new HttpException(503, 'Impossible de préparer le téléchargement.');
                try {
                    $response = Http::withUserAgent('VinusCatalog/1.0 (github.com/yhanottv/VinusPanel)')->timeout(45)->connectTimeout(5)
                        ->withOptions(['allow_redirects' => false, 'sink' => $temp, 'progress' => function ($total, $downloaded) {
                            if ($total > 25 * 1024 * 1024 || $downloaded > 25 * 1024 * 1024) throw new \RuntimeException('Download exceeds size limit.');
                        }])->get($file['url']);
                    abort_unless($response->successful(), 502, 'Le téléchargement a échoué. Les fichiers actifs sont conservés.');
                    rewind($temp);
                    $content = stream_get_contents($temp, 25 * 1024 * 1024 + 1);
                    abort_unless(strlen($content) === $file['size'] && hash_equals($file['sha512'], hash('sha512', $content)), 502, 'L’intégrité du téléchargement ne correspond pas au catalogue.');
                    $repository->putContent('/'.$batch.'/'.$file['filename'], $content);
                    unset($content);
                    $prepared[] = $file;
                } finally {
                    fclose($temp);
                }
            }
            // Downloading all dependencies finishes before the first active file is replaced.
            $state = $this->daemon->setServer($server)->getDetails()['state'] ?? null;
            abort_unless(in_array($state, ['offline', 'stopped'], true), 409, 'Le serveur a été démarré pendant la préparation. Les téléchargements restent dans /'.$batch.'.');
            $path = $this->manifestPath($server);
            if (!is_dir(dirname($path))) mkdir(dirname($path), 0750, true);
            abort_unless(is_writable(dirname($path)), 503, 'Le suivi des installations ne peut pas être enregistré.');
            $committed = [];
            $recoveryFailed = false;
            try {
            foreach ($prepared as $file) {
                $old = $file['previous'];
                $moved = false;
                if ($old && isset($existing[$old['filename']])) {
                    $repository->renameFiles('/', [['from' => $kind.'/'.$old['filename'], 'to' => $batch.'/backup-'.$old['filename']]]);
                    $moved = true;
                }
                try {
                    $repository->renameFiles('/', [['from' => $batch.'/'.$file['filename'], 'to' => $kind.'/'.$file['filename']]]);
                } catch (\Throwable $error) {
                    if ($moved) {
                        try { $repository->renameFiles('/', [['from' => $batch.'/backup-'.$old['filename'], 'to' => $kind.'/'.$old['filename']]]); }
                        catch (\Throwable $recoveryError) { $recoveryFailed = true; }
                    }
                    throw $error;
                }
                $committed[] = ['file' => $file, 'moved' => $moved];
                $installed[$kind.':'.$file['project_id']] = array_merge(array_intersect_key($file, array_flip(['project_id', 'title', 'version_id', 'version', 'filename', 'sha512', 'icon_url'])), ['kind' => $kind, 'game_version' => $plan['selection']['game_version']]);
            }
            if ($prepared) {
                $temporary = $path.'.'.$token.'.tmp';
                if (file_put_contents($temporary, json_encode($installed, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR), LOCK_EX) === false || !rename($temporary, $path)) {
                    throw new HttpException(500, 'Impossible d’enregistrer le suivi de l’installation.');
                }
            }
            } catch (\Throwable $error) {
                foreach (array_reverse($committed) as $change) {
                    $file = $change['file'];
                    try {
                        $repository->renameFiles('/', [['from' => $kind.'/'.$file['filename'], 'to' => $batch.'/'.$file['filename']]]);
                        if ($change['moved']) $repository->renameFiles('/', [['from' => $batch.'/backup-'.$file['previous']['filename'], 'to' => $kind.'/'.$file['previous']['filename']]]);
                    } catch (\Throwable $recoveryError) { $recoveryFailed = true; }
                }
                throw new HttpException(500, $recoveryFailed
                    ? 'Installation interrompue. Vérifiez /'.$kind.' et récupérez les anciens fichiers dans /'.$batch.' avant de démarrer le serveur.'
                    : 'Installation annulée ; les changements terminés ont été restaurés. Les téléchargements restent dans /'.$batch.'.', $error);
            }
            Cache::forget('vinuscatalog:plan:'.$token);
            Activity::event('server:file.write')->property('directory', '/'.$kind)->property('source', 'vinuscatalog')->property('projects', array_column($plan['files'], 'project_id'))->log();
            return ['message' => $prepared ? 'Installation terminée. Les anciens fichiers sont conservés dans /'.$batch.'. Démarrez le serveur quand vous êtes prêt.' : 'Les fichiers sont déjà à jour et leur intégrité a été vérifiée.', 'installed' => array_values($installed)];
        } finally {
            $lock->release();
        }
    }
}
