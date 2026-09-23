<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use ZipArchive;

/** Pack manifests are data, never commands. Client-only files are excluded explicitly. */
final class ModpackManifest
{
    public const MAX_BYTES = 2147483648;
    private const LOADERS = ['fabric-loader' => 'FABRIC', 'forge' => 'FORGE', 'neoforge' => 'NEOFORGE', 'quilt-loader' => 'QUILT'];

    public static function dependencies(array $dependencies): array
    {
        abort_unless(isset($dependencies['minecraft']) && preg_match('/^[a-zA-Z0-9][a-zA-Z0-9._+\-]{0,80}$/D', $dependencies['minecraft']), 422, 'Version Minecraft du modpack manquante ou invalide.');
        $unknown = array_diff(array_keys($dependencies), ['minecraft', ...array_keys(self::LOADERS)]);
        abort_unless(!$unknown, 422, 'Ce modpack exige une dépendance de lancement qui n’est pas encore prise en charge.');
        $loaders = array_intersect_key($dependencies, self::LOADERS);
        abort_unless(count($loaders) <= 1, 422, 'Le modpack déclare plusieurs mod loaders.');
        $loader = array_key_first($loaders);
        if ($loader) abort_unless(is_string($loaders[$loader]) && preg_match('/^[a-zA-Z0-9][a-zA-Z0-9._+\-]{0,80}$/D', $loaders[$loader]), 422, 'Version de mod loader invalide.');
        return ['minecraft' => $dependencies['minecraft'], 'software' => $loader ? self::LOADERS[$loader] : 'VANILLA', 'loader_version' => $loader ? $loaders[$loader] : null];
    }

    public static function modrinth(array $manifest): array
    {
        abort_unless(($manifest['formatVersion'] ?? null) === 1 && ($manifest['game'] ?? null) === 'minecraft' && is_array($manifest['files'] ?? null) && count($manifest['files']) <= 2000, 422, 'Format de modpack Modrinth non pris en charge.');
        $runtime = self::dependencies($manifest['dependencies'] ?? []);
        $files = []; $bytes = 0; $skipped = 0; $seen = [];
        foreach ($manifest['files'] as $file) {
            $path = $file['path'] ?? '';
            abort_unless(is_string($path) && InstallArchive::safePath($path) && !isset($seen[$path]), 422, 'Chemin de modpack non valide ou dupliqué.');
            $seen[$path] = true;
            // A distributed eula.txt is never authorization to accept Minecraft's terms.
            if (strtolower($path) === 'eula.txt') continue;
            $side = $file['env']['server'] ?? 'required';
            abort_unless(in_array($side, ['required','optional','unsupported'], true), 422, 'Compatibilité serveur non reconnue.');
            if ($side === 'unsupported') { $skipped++; continue; }
            abort_unless(preg_match('/^[a-f0-9]{128}$/iD', $file['hashes']['sha512'] ?? '') && preg_match('/^[a-f0-9]{40}$/iD', $file['hashes']['sha1'] ?? ''), 422, 'Empreintes du modpack manquantes.');
            $size = $file['fileSize'] ?? 0;
            abort_unless(is_int($size) && $size > 0 && $size <= 1073741824 && is_array($file['downloads'] ?? null) && count($file['downloads']) > 0 && count($file['downloads']) <= 8, 422, 'Téléchargement de modpack invalide.');
            $urls = [];
            foreach ($file['downloads'] as $url) {
                abort_unless(is_string($url) && !preg_match('/[\x00-\x20\\\\]/', $url), 422, 'Adresse de fichier non valide.');
                $host = InstallDownload::host($url);
                abort_unless(in_array($host, ['cdn.modrinth.com','github.com','raw.githubusercontent.com','gitlab.com'], true), 422, 'Ce modpack contient une source de téléchargement non autorisée.');
                $urls[] = $url;
            }
            $bytes += $size;
            abort_unless($bytes <= self::MAX_BYTES, 422, 'Ce modpack dépasse la limite de 2 Gio de fichiers.');
            $files[$path] = ['path' => $path, 'size' => $size, 'sha512' => strtolower($file['hashes']['sha512']), 'sha1' => strtolower($file['hashes']['sha1']), 'urls' => $urls, 'optional' => $side === 'optional'];
        }
        // A file cannot also be the parent directory of another file.
        foreach ($files as $file) {
            $parent = dirname($file['path']);
            while ($parent !== '.') { abort_unless(!isset($files[$parent]), 422, 'Collision entre fichiers et dossiers du modpack.'); $parent = dirname($parent); }
        }
        return ['name' => (string) ($manifest['name'] ?? 'Modpack'), 'runtime' => $runtime, 'files' => array_values($files), 'client_files_skipped' => $skipped, 'size' => $bytes];
    }

    public static function curseforge(array $manifest): array
    {
        abort_unless(($manifest['manifestType'] ?? '') === 'minecraftModpack' && ($manifest['manifestVersion'] ?? null) === 1 && is_array($manifest['files'] ?? null) && count($manifest['files']) <= 2000, 422, 'Format de modpack CurseForge non pris en charge.');
        $minecraft = $manifest['minecraft'] ?? [];
        $loaders = $minecraft['modLoaders'] ?? [];
        $primary = array_values(array_filter($loaders, fn ($loader) => ($loader['primary'] ?? false) === true));
        if (!$primary && count($loaders) === 1) $primary = array_values($loaders);
        abort_unless(count($primary) <= 1 && (!$loaders || $primary), 422, 'Mod loader principal du modpack non reconnu.');
        $dependencies = ['minecraft' => $minecraft['version'] ?? ''];
        if ($primary) {
            abort_unless(preg_match('/^(forge|neoforge|fabric|quilt)-(.+)$/D', $primary[0]['id'] ?? '', $match), 422, 'Mod loader CurseForge non pris en charge.');
            $dependencies[in_array($match[1], ['fabric','quilt'], true) ? $match[1].'-loader' : $match[1]] = $match[2];
        }
        $files = [];
        foreach ($manifest['files'] as $file) {
            abort_unless(is_int($file['projectID'] ?? null) && $file['projectID'] > 0 && is_int($file['fileID'] ?? null) && $file['fileID'] > 0, 422, 'Référence de fichier CurseForge non valide.');
            abort_unless(!isset($files[$file['projectID']]), 422, 'Projet dupliqué dans le modpack.');
            $files[$file['projectID']] = ['project_id' => (string) $file['projectID'], 'version_id' => (string) $file['fileID'], 'optional' => ($file['required'] ?? true) === false];
        }
        $overrides = $manifest['overrides'] ?? 'overrides';
        abort_unless(is_string($overrides) && InstallArchive::safePath($overrides), 422, 'Dossier de configuration non valide.');
        return ['name' => (string) ($manifest['name'] ?? 'Modpack'), 'runtime' => self::dependencies($dependencies), 'files' => array_values($files), 'overrides' => $overrides];
    }

    public static function read(string $archive, string $source): array
    {
        abort_unless(in_array($source, ['modrinth','curseforge'], true), 422, 'Source de modpack inconnue.');
        $entries = InstallArchive::entries($archive);
        $name = $source === 'modrinth' ? 'modrinth.index.json' : 'manifest.json';
        $entry = collect($entries)->firstWhere('path', $name);
        abort_unless($entry && !$entry['directory'] && $entry['size'] <= 4 * 1024 * 1024, 422, 'Le manifeste du modpack est absent ou trop volumineux.');
        $zip = new ZipArchive(); $zip->open($archive);
        try {
            $data = json_decode($zip->getFromName($name), true, 64, JSON_THROW_ON_ERROR);
            abort_unless(is_array($data), 422, 'Manifeste non valide.');
            $parsed = $source === 'modrinth' ? self::modrinth($data) : self::curseforge($data);
            // Later layers replace earlier files. Client overrides are never applied.
            $overrides = [];
            foreach ($source === 'modrinth' ? ['overrides','server-overrides'] : [$parsed['overrides']] as $layer) {
                foreach ($entries as $entry) if (!$entry['directory'] && str_starts_with($entry['path'], $layer.'/')) {
                    $target = substr($entry['path'], strlen($layer) + 1);
                    if (strtolower($target) === 'eula.txt') continue;
                    abort_unless(InstallArchive::safePath($target), 422, 'Destination de configuration invalide.');
                    $overrides[$target] = ['entry' => $entry['path'], 'path' => $target, 'size' => $entry['size']];
                }
            }
            $parsed['overrides'] = array_values($overrides);
            return $parsed;
        } catch (\JsonException $error) { abort(422, 'Le manifeste du modpack n’est pas un fichier JSON valide.'); }
        finally { $zip->close(); }
    }
}
