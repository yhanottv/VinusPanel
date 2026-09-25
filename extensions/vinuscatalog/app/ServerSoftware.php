<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/** Version/build metadata for the complete software picker. No remote script is executed. */
final class ServerSoftware
{
    public static function profile(string $type, string $version, string $buildLabel = ''): array
    {
        $name = strtolower($type);
        $aliases = ['pufferfish' => 'paper', 'divinemc' => 'purpur', 'leaf' => 'paper', 'leaves' => 'paper', 'aspaper' => 'paper', 'pluto' => 'paper', 'canvas' => 'folia', 'velocity_ctd' => 'velocity', 'legacyfabric' => 'fabric'];
        $loader = $aliases[$name] ?? $name;
        if ($loader === 'arclight' && preg_match('/\b(neoforge|forge|fabric)\b/i', $buildLabel, $match)) $loader = 'arclight-'.strtolower($match[1]);
        // Hybrid metadata does not prove a mod loader. Keep ambiguous variants conservative.
        $categories = Detection::PROFILES[$loader] ?? (in_array($loader, ['arclight', 'magma'], true) ? ['plugins' => ['spigot','bukkit']] : []);
        $proxy = in_array($loader, ['velocity','bungeecord','waterfall','loohplimbo','nanolimbo'], true);
        return ['software' => $name, 'categories' => $categories, 'game_version' => $proxy ? null : $version, 'proxy' => $proxy];
    }

    public function get(string $path): array
    {
        return Cache::remember('vinussoftware:'.hash('sha256', $path), 300, function () use ($path) {
            $response = Http::withUserAgent('VinusPanel/3 (github.com/yhanottv/VinusPanel)')->acceptJson()
                ->timeout(25)->connectTimeout(5)->withOptions(['allow_redirects' => false])->get('https://versions.mcjars.app/api/v2/'.$path);
            abort_unless($response->successful() && $response->json('success') === true, 502, 'Le catalogue des logiciels est momentanément indisponible.');
            return $response->json();
        });
    }

    public function types(): array
    {
        $groups = $this->get('types')['types'];
        foreach ($groups as &$items) foreach ($items as $key => &$item) {
            abort_unless(preg_match('/^[A-Z][A-Z0-9_]{1,40}$/D', $key), 502);
            $item = array_intersect_key($item, array_flip(['name', 'icon', 'description', 'deprecated', 'experimental', 'builds', 'versions', 'categories', 'compatibility']));
            if (!preg_match('~^https://s3\.mcjars\.app/icons/[a-z0-9_]+\.png$~D', $item['icon'] ?? '')) $item['icon'] = null;
        }
        unset($items, $item);
        return $groups;
    }

    public function versions(string $type): array
    {
        $known = [];
        foreach ($this->types() as $group) $known += $group;
        abort_unless(isset($known[$type]), 422, 'Logiciel inconnu.');
        $versions = $this->get('builds/'.$type)['builds'];
        $result = [];
        foreach ($versions as $version => $meta) {
            if (!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9._+\-]{0,80}$/D', $version)) continue;
            $result[] = ['id' => $version, 'java' => (int) $meta['java'], 'channel' => $meta['type'], 'supported' => $meta['supported'], 'builds' => $meta['builds'], 'created' => $meta['created']];
        }
        usort($result, fn ($a, $b) => strcmp($b['created'] ?? '', $a['created'] ?? ''));
        return $result;
    }

    public function builds(string $type, string $version): array
    {
        $meta = collect($this->versions($type))->firstWhere('id', $version);
        abort_unless($meta, 422, 'Version inconnue pour ce logiciel.');
        $builds = $this->get('builds/'.$type.'/'.rawurlencode($version))['builds'];
        return array_map(fn ($build) => ['id' => $build['id'], 'name' => $build['name'], 'created' => $build['created'], 'experimental' => $build['experimental'], 'java' => $meta['java']], $builds);
    }

    public static function safePath(string $path): bool
    {
        return $path !== '' && strlen($path) < 240 && !str_starts_with($path, '/') && !preg_match('~[\\\\\x00-\x20:]|(?:^|/)\.\.?(?:/|$)~', $path);
    }

    public function forModpack(array $runtime): array
    {
        $type = $runtime['software']; $version = $runtime['minecraft'];
        $this->versions($type);
        $builds = $this->get('builds/'.$type.'/'.rawurlencode($version))['builds'];
        $matching = array_values(array_filter($builds, fn ($build) => ($build['versionId'] ?? '') === $version && ($build['type'] ?? '') === $type
            && ($runtime['loader_version'] === null || ($build['projectVersionId'] ?? '') === $runtime['loader_version'])));
        abort_unless($matching, 422, 'La version exacte du mod loader de ce pack n’est pas disponible dans le catalogue de logiciels.');
        return $this->plan($type, $version, (int) $matching[0]['id']);
    }

    public function plan(string $type, string $version, int $id): array
    {
        $meta = collect($this->versions($type))->firstWhere('id', $version);
        abort_unless($meta, 422, 'Version inconnue.');
        $build = collect($this->get('builds/'.$type.'/'.rawurlencode($version))['builds'])->firstWhere('id', $id);
        abort_unless($build && $build['type'] === $type, 422, 'Build inconnu pour cette version.');
        $steps = [];
        foreach ($build['installation'] as $batch) foreach ($batch as $step) {
            abort_unless(in_array($step['type'], ['download', 'unzip', 'remove'], true), 422, 'Méthode d’installation non reconnue.');
            if ($step['type'] === 'download') {
                $url = parse_url($step['url']);
                abort_unless(self::safePath($step['file']) && ($url['scheme'] ?? '') === 'https' && !isset($url['user']) && !isset($url['port']) && !isset($url['fragment']) && $step['size'] > 0 && $step['size'] <= 1024 * 1024 * 1024, 422, 'Fichier d’installation non valide.');
                $steps[] = $step;
            } elseif ($step['type'] === 'unzip') {
                abort_unless(self::safePath($step['file']) && ($step['location'] === '.' || self::safePath($step['location'])), 422, 'Destination d’extraction non valide.');
                $steps[] = $step;
            }
            // Upstream remove steps are deliberately not passed through. The installer
            // prepares a separate directory and preserves replaced entries for rollback.
        }
        abort_unless($steps && count($steps) <= 100 && array_sum(array_column($steps, 'size')) <= 2 * 1024 * 1024 * 1024, 422, 'Installation trop volumineuse.');
        return ['software' => $type, 'version' => $version, 'build' => $id, 'label' => $build['name'], 'loader_version' => $build['projectVersionId'] ?? null, 'java' => $meta['java'], 'steps' => $steps];
    }
}
