<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class Modrinth
{
    public static function icon($url): ?string
    {
        if (!is_string($url) || strlen($url) > 600) return null;
        return preg_match('~^https://cdn\.modrinth\.com/(?:data|cached_images)/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp|gif)$~D', $url) ? $url : null;
    }

    public function get(string $path, array $query = [], int $ttl = 120): array
    {
        return Cache::remember('vinuscatalog:api:'.hash('sha256', $path.json_encode($query)), $ttl, function () use ($path, $query) {
            $response = Http::withUserAgent('VinusCatalog/1.0 (github.com/yhanottv/VinusPanel)')
                ->acceptJson()->timeout(15)->connectTimeout(5)->withOptions(['allow_redirects' => false])
                ->get('https://api.modrinth.com/v2/'.$path, $query);
            if (!$response->successful()) {
                throw new HttpException(502, 'Le catalogue Modrinth est momentanément indisponible. Réessayez dans quelques instants.');
            }
            $data = $response->json();
            if (!is_array($data)) throw new HttpException(502, 'Réponse du catalogue invalide.');
            return $data;
        });
    }

    public function versions(): array
    {
        return array_values(array_column(array_filter($this->get('tag/game_version', [], 3600), fn ($v) => ($v['version_type'] ?? '') === 'release'), 'version'));
    }

    public function latest(string $project, array $loaders, string $game): array
    {
        $versions = $this->get('project/'.rawurlencode($project).'/version', ['loaders' => json_encode($loaders), 'game_versions' => json_encode([$game])]);
        $versions = array_values(array_filter($versions, fn ($v) => ($v['version_type'] ?? '') === 'release' && ($v['status'] ?? 'listed') === 'listed'));
        usort($versions, fn ($a, $b) => strcmp($b['date_published'] ?? '', $a['date_published'] ?? ''));
        if (!$versions) throw new HttpException(422, 'Aucune version stable compatible n’est publiée pour ce projet.');
        return $versions[0];
    }

    public static function artifact(array $version, array $loaders, string $game): array
    {
        if (!array_intersect($loaders, $version['loaders'] ?? []) || !in_array($game, $version['game_versions'] ?? [], true)) {
            throw new HttpException(422, 'Une dépendance ne correspond pas au logiciel ou à la version Minecraft du serveur.');
        }
        $files = array_values(array_filter($version['files'] ?? [], fn ($file) => ($file['primary'] ?? false) && preg_match('/\.jar$/i', $file['filename'] ?? '')));
        if (!$files) $files = array_values(array_filter($version['files'] ?? [], fn ($file) => preg_match('/\.jar$/i', $file['filename'] ?? '')));
        if (count($files) !== 1) throw new HttpException(422, 'Le fichier JAR principal ne peut pas être choisi automatiquement.');
        $file = $files[0];
        $url = parse_url($file['url'] ?? '');
        $filename = $file['filename'] ?? '';
        if (($url['scheme'] ?? '') !== 'https' || ($url['host'] ?? '') !== 'cdn.modrinth.com'
            || isset($url['user']) || isset($url['pass']) || isset($url['port']) || isset($url['query']) || isset($url['fragment'])
            || !str_starts_with($url['path'] ?? '', '/data/') || !preg_match('/^[a-zA-Z0-9][a-zA-Z0-9._+() -]{0,180}\.jar$/D', $filename)
            || !preg_match('/^[a-f0-9]{128}$/D', $file['hashes']['sha512'] ?? '')
            || ($file['size'] ?? 0) <= 0 || $file['size'] > 25 * 1024 * 1024) {
            throw new HttpException(422, 'Ce fichier nécessite une installation manuelle (format, origine ou taille non pris en charge).');
        }
        return ['project_id' => $version['project_id'], 'version_id' => $version['id'], 'version' => $version['version_number'],
            'filename' => $filename, 'url' => $file['url'], 'sha512' => $file['hashes']['sha512'], 'size' => $file['size']];
    }

    public function resolve(string $project, array $loaders, string $game): array
    {
        $result = [];
        $visiting = [];
        $visit = function (array $version, int $depth = 0) use (&$visit, &$result, &$visiting, $loaders, $game) {
            if ($depth > 12 || count($visiting) >= 20) throw new HttpException(422, 'Ce projet comporte trop de dépendances pour une installation automatique.');
            $id = $version['project_id'];
            if (isset($visiting[$id])) {
                if ($visiting[$id] !== $version['id']) throw new HttpException(422, 'Les dépendances exigent des versions différentes du même projet.');
                return;
            }
            $visiting[$id] = $version['id'];
            $projectData = $this->get('project/'.rawurlencode($id));
            if (($projectData['server_side'] ?? '') === 'unsupported') throw new HttpException(422, 'Ce projet est uniquement destiné au client Minecraft.');
            $artifact = self::artifact($version, $loaders, $game);
            $artifact['title'] = $projectData['title'];
            $artifact['icon_url'] = self::icon($projectData['icon_url'] ?? null);
            foreach ($version['dependencies'] ?? [] as $dependency) {
                if (($dependency['dependency_type'] ?? '') !== 'required') continue;
                if (!empty($dependency['version_id'])) {
                    $next = $this->get('version/'.rawurlencode($dependency['version_id']));
                } elseif (!empty($dependency['project_id'])) {
                    $next = $this->latest($dependency['project_id'], $loaders, $game);
                } else {
                    throw new HttpException(422, 'Une dépendance doit être installée manuellement.');
                }
                $visit($next, $depth + 1);
            }
            $result[$id] = $artifact;
        };
        $visit($this->latest($project, $loaders, $game));
        $files = array_values($result);
        if (count(array_unique(array_column($files, 'filename'))) !== count($files)) throw new HttpException(422, 'Deux projets utilisent le même nom de fichier. Installation manuelle nécessaire.');
        if (array_sum(array_column($files, 'size')) > 100 * 1024 * 1024) throw new HttpException(422, 'Ce lot dépasse 100 Mio. Installez les projets séparément.');
        return $files;
    }
}
