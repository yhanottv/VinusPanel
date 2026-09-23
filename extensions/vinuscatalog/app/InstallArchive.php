<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use ZipArchive;

/** Validate before Wings extracts an archive, including its expanded size and file types. */
final class InstallArchive
{
    public static function safePath(string $path): bool
    {
        return $path !== '' && strlen($path) <= 512 && !str_starts_with($path, '/') && !preg_match('~[\\\\\x00-\x1f\x7f:]|(?:^|/)\.\.?(?:/|$)|//~', $path);
    }

    public static function entries(string $file, int $maximum = 2147483648): array
    {
        $zip = new ZipArchive();
        abort_unless($zip->open($file) === true, 422, 'Archive ZIP illisible.');
        try {
            abort_unless($zip->numFiles > 0 && $zip->numFiles <= 30000, 422, 'Archive trop volumineuse.');
            $entries = []; $bytes = 0; $seen = [];
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = $zip->statIndex($i);
                $path = rtrim($entry['name'], '/');
                abort_unless(self::safePath($path) && !isset($seen[$path]), 422, 'Chemin non valide ou dupliqué dans l’archive.');
                $seen[$path] = true;
                $zip->getExternalAttributesIndex($i, $system, $attributes);
                $type = ($attributes >> 16) & 0170000;
                abort_unless(in_array($type, [0, 0100000, 0040000], true) && ($entry['encryption_method'] ?? 0) === 0, 422, 'Les liens et archives chiffrées ne sont pas acceptés.');
                $bytes += $entry['size'];
                abort_unless($bytes <= $maximum && $entry['size'] <= 1073741824, 422, 'Archive décompressée trop volumineuse.');
                $entries[] = ['path' => $path, 'directory' => str_ends_with($entry['name'], '/'), 'size' => $entry['size']];
            }
            foreach ($entries as $entry) {
                $parent = dirname($entry['path']);
                while ($parent !== '.') {
                    abort_unless(!isset($seen[$parent]) || $zip->locateName($parent.'/') !== false, 422, 'Un fichier masque un dossier dans l’archive.');
                    $parent = dirname($parent);
                }
            }
            return $entries;
        } finally { $zip->close(); }
    }
}
