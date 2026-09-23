<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** Provider data is normalized here; browser input never supplies a download URL. */
final class CatalogSources
{
    public function available(): array
    {
        return ['modrinth' => true, 'spigot' => true, 'curseforge' => (bool) config('vinuscatalog.curseforge_key')];
    }

    public static function trustedUrl(string $url, string $source, bool $image = false): bool
    {
        $parts = parse_url($url);
        $hosts = $source === 'spigot' ? ($image ? ['www.spigotmc.org'] : ['api.spiget.org', 'cdn.spiget.org', 'spigotmc.org', 'www.spigotmc.org'])
            : ($image ? ['media.forgecdn.net', 'mediafilez.forgecdn.net'] : ['edge.forgecdn.net', 'mediafilez.forgecdn.net']);
        return is_array($parts) && ($parts['scheme'] ?? '') === 'https' && in_array($parts['host'] ?? '', $hosts, true)
            && !isset($parts['user'], $parts['pass']) && !isset($parts['user']) && !isset($parts['port']) && !isset($parts['fragment'])
            && !preg_match('/[\x00-\x20\\\\]/', $url);
    }

    public function get(string $source, string $path, array $query = []): array
    {
        abort_unless(in_array($source, ['spigot', 'curseforge'], true), 422);
        if ($source === 'curseforge') abort_unless($this->available()['curseforge'], 503, 'CurseForge attend sa clé API. Configurez VINUS_CURSEFORGE_API_KEY sur le panel.');
        return Cache::remember('vinuscatalog:'.$source.':'.hash('sha256', $path.json_encode($query)), 120, function () use ($source, $path, $query) {
            $client = Http::withUserAgent('VinusPanel/3 (github.com/yhanottv/VinusPanel)')->acceptJson()->timeout(20)->connectTimeout(5)->withOptions(['allow_redirects' => false]);
            if ($source === 'curseforge') $client = $client->withHeaders(['x-api-key' => config('vinuscatalog.curseforge_key')]);
            $response = $client->get(($source === 'spigot' ? 'https://api.spiget.org/v2/' : 'https://api.curseforge.com/v1/').$path, $query);
            abort_unless($response->successful() && is_array($response->json()), 502, 'Le catalogue '.($source === 'spigot' ? 'SpigotMC' : 'CurseForge').' est indisponible. Réessayez plus tard.');
            return $response->json();
        });
    }

    public function search(string $source, string $kind, array $options, string $game): array
    {
        $offset = (int) ($options['offset'] ?? 0);
        $query = $options['query'] ?? '';
        $sort = $options['sort'] ?? 'relevance';
        if ($source === 'spigot') {
            abort_unless($kind === 'plugins', 422, 'SpigotMC propose des plugins.');
            $result = $this->get($source, $query ? 'search/resources/'.rawurlencode($query) : 'resources/free', ['size' => 12, 'page' => intdiv($offset, 12) + 1, 'sort' => $sort === 'updated' ? '-updateDate' : '-downloads', 'fields' => 'id,name,tag,author,downloads,icon,updateDate,external,premium,testedVersions']);
            $hits = array_map(function ($hit) {
                $url = 'https://www.spigotmc.org/'.ltrim($hit['icon']['url'] ?? '', '/');
                return ['project_id' => (string) $hit['id'], 'title' => html_entity_decode(strip_tags($hit['name'])), 'description' => html_entity_decode(strip_tags($hit['tag'] ?? '')), 'downloads' => $hit['downloads'] ?? 0, 'icon_url' => self::trustedUrl($url, 'spigot', true) ? $url : null, 'page_url' => 'https://www.spigotmc.org/resources/'.$hit['id'].'/', 'external' => (bool) ($hit['external'] ?? false), 'premium' => (bool) ($hit['premium'] ?? false), 'tested_versions' => $hit['testedVersions'] ?? []];
            }, $result);
            return ['hits' => $hits, 'total' => null, 'has_more' => count($result) === 12];
        }
        $class = ['plugins' => 5, 'mods' => 6, 'modpacks' => 4471, 'worlds' => 17][$kind] ?? null;
        abort_unless($class, 422);
        $params = ['gameId' => 432, 'classId' => $class, 'searchFilter' => $query, 'index' => $offset, 'pageSize' => 12, 'sortField' => $sort === 'updated' ? 3 : 6, 'sortOrder' => 'desc'];
        if ($game) $params['gameVersion'] = $game;
        if (!empty($options['category'])) $params['categoryId'] = (int) $options['category'];
        $result = $this->get($source, 'mods/search', $params);
        $hits = array_map(function ($hit) {
            $url = $hit['logo']['thumbnailUrl'] ?? '';
            return ['project_id' => (string) $hit['id'], 'title' => $hit['name'], 'description' => $hit['summary'], 'author' => implode(', ', array_column($hit['authors'] ?? [], 'name')), 'downloads' => $hit['downloadCount'], 'icon_url' => self::trustedUrl($url, 'curseforge', true) ? $url : null, 'page_url' => 'https://www.curseforge.com/minecraft/'.([5 => 'bukkit-plugins', 6 => 'mc-mods', 17 => 'worlds', 4471 => 'modpacks'][$hit['classId']] ?? 'mc-mods').'/'.rawurlencode($hit['slug'])];
        }, $result['data']);
        return ['hits' => $hits, 'total' => $result['pagination']['totalCount'], 'has_more' => $offset + count($hits) < $result['pagination']['totalCount']];
    }

    public function versions(string $source, string $project, string $game): array
    {
        abort_unless(ctype_digit($project), 422);
        if ($source === 'spigot') {
            $meta = $this->get($source, 'resources/'.$project);
            abort_unless(empty($meta['external']) && empty($meta['premium']), 422, 'Ce plugin se télécharge sur le site de son auteur. Ouvrez sa fiche SpigotMC.');
            return array_map(fn ($v) => ['id' => (string) $v['id'], 'name' => $v['name'], 'date' => gmdate('c', $v['releaseDate']), 'game_versions' => $meta['testedVersions'] ?? []], $this->get($source, 'resources/'.$project.'/versions', ['size' => 100, 'sort' => '-releaseDate']));
        }
        return array_map(fn ($v) => ['id' => (string) $v['id'], 'name' => $v['displayName'], 'date' => $v['fileDate'], 'game_versions' => $v['gameVersions']], array_values(array_filter($this->get($source, 'mods/'.$project.'/files', array_filter(['gameVersion' => $game, 'pageSize' => 50]))['data'], fn ($v) => $v['isAvailable'] && $v['releaseType'] === 1)));
    }

    /** Fetch a bounded artifact from a provider-owned host, validating every redirect. */
    public function download(string $source, string $url): string
    {
        for ($redirect = 0; $redirect < 4; $redirect++) {
            abort_unless(self::trustedUrl($url, $source), 422, 'Origine de téléchargement non prise en charge. Ouvrez la fiche du projet.');
            $temp = tmpfile();
            abort_unless($temp, 503);
            try {
                $client = Http::withUserAgent('VinusPanel/3 (github.com/yhanottv/VinusPanel)')->timeout(60)->connectTimeout(5)->withOptions(['allow_redirects' => false, 'sink' => $temp, 'progress' => function ($total, $downloaded) { if (max($total, $downloaded) > 25 * 1024 * 1024) throw new HttpException(422, 'Ce fichier dépasse 25 Mio.'); }]);
                if ($source === 'curseforge') $client = $client->withHeaders(['x-api-key' => config('vinuscatalog.curseforge_key')]);
                $response = $client->get($url);
                if ($response->redirect()) { $url = $response->header('Location'); continue; }
                abort_unless($response->successful(), 502, 'Le fournisseur a refusé le téléchargement.');
                rewind($temp); $content = stream_get_contents($temp, 25 * 1024 * 1024 + 1);
                abort_unless(strlen($content) <= 25 * 1024 * 1024 && str_starts_with($content, "PK\x03\x04"), 422, 'Le téléchargement ne contient pas un fichier JAR valide.');
                return $content;
            } finally { fclose($temp); }
        }
        throw new HttpException(502, 'Trop de redirections du fournisseur.');
    }

    public function resolve(string $source, string $project, string $version, string $kind, array $loaders, string $game): array
    {
        abort_unless(ctype_digit($project) && ctype_digit($version), 422);
        $result = []; $visiting = [];
        $visit = function (string $id, string $fileId, int $depth = 0) use (&$visit, &$result, &$visiting, $source, $kind, $loaders, $game) {
            abort_unless($depth <= 12 && count($visiting) < 20, 422, 'Trop de dépendances.');
            if (isset($visiting[$id])) { abort_unless($visiting[$id] === $fileId, 422, 'Versions de dépendances incompatibles.'); return; }
            $visiting[$id] = $fileId;
            if ($source === 'spigot') {
                abort_unless($kind === 'plugins' && array_intersect($loaders, ['bukkit','spigot','paper','purpur','folia','bungeecord']), 422, 'Ce serveur ne prend pas en charge les plugins SpigotMC.');
                $meta = $this->get($source, 'resources/'.$id);
                abort_unless(empty($meta['external']) && empty($meta['premium']), 422, 'Installation automatique indisponible pour les plugins externes ou payants.');
                $file = $this->get($source, 'resources/'.$id.'/versions/'.$fileId);
                abort_unless((string) ($file['resource'] ?? '') === $id, 422, 'Version étrangère au projet.');
                $title = html_entity_decode(strip_tags($meta['name'])); $label = $file['name'];
                $url = 'https://api.spiget.org/v2/resources/'.$id.((string) ($meta['version']['id'] ?? '') === $fileId ? '/download' : '/versions/'.$fileId.'/download');
                $filename = 'spigot-'.$id.'-'.$fileId.'.jar';
            } else {
                $meta = $this->get($source, 'mods/'.$id)['data'];
                abort_unless(($meta['gameId'] ?? 0) === 432 && ($meta['classId'] ?? 0) === ($kind === 'mods' ? 6 : 5), 422, 'Projet incompatible avec cette catégorie.');
                $file = $this->get($source, 'mods/'.$id.'/files/'.$fileId)['data'];
                abort_unless((string) $file['modId'] === $id && $file['isAvailable'] && in_array($game, $file['gameVersions'], true), 422, 'Version Minecraft incompatible.');
                if ($kind === 'mods') abort_unless(array_intersect(array_map('strtolower', $file['gameVersions']), $loaders), 422, 'Mod loader incompatible.');
                $filename = $file['fileName']; $url = $file['downloadUrl'] ?? ''; $title = $meta['name']; $label = $file['displayName'];
                abort_unless(preg_match('/^[a-zA-Z0-9][a-zA-Z0-9._+() -]{0,180}\.jar$/D', $filename), 422, 'Nom de fichier non pris en charge.');
                foreach ($file['dependencies'] ?? [] as $dep) {
                    if ($dep['relationType'] !== 3) continue;
                    $candidates = $this->versions($source, (string) $dep['modId'], $game);
                    if ($kind === 'mods') $candidates = array_values(array_filter($candidates, fn ($v) => array_intersect(array_map('strtolower', $v['game_versions']), $loaders)));
                    abort_unless($candidates, 422, 'Dépendance compatible introuvable.');
                    $visit((string) $dep['modId'], $candidates[0]['id'], $depth + 1);
                }
            }
            $content = $this->download($source, $url);
            if ($source === 'curseforge') {
                $hash = collect($file['hashes'])->firstWhere('algo', 1)['value'] ?? null;
                abort_unless($hash && hash_equals(strtolower($hash), sha1($content)) && strlen($content) === $file['fileLength'], 502, 'Intégrité CurseForge non vérifiée.');
            }
            $page = $source === 'spigot' ? 'https://www.spigotmc.org/resources/'.$id.'/' : (!empty($meta['slug']) ? 'https://www.curseforge.com/minecraft/'.($kind === 'mods' ? 'mc-mods' : 'bukkit-plugins').'/'.rawurlencode($meta['slug']) : null);
            $result[$id] = ['source' => $source, 'page_url' => $page, 'project_id' => $source.':'.$id, 'version_id' => $fileId, 'version' => $label, 'title' => $title, 'filename' => $filename, 'url' => $url, 'size' => strlen($content), 'sha512' => hash('sha512', $content)];
        };
        $visit($project, $version);
        abort_unless(count(array_unique(array_column($result, 'filename'))) === count($result) && array_sum(array_column($result, 'size')) <= 100 * 1024 * 1024, 422, 'Lot trop volumineux ou noms de fichiers en conflit.');
        return array_values($result);
    }
}
