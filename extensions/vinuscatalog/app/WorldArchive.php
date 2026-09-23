<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use ZipArchive;

final class WorldArchive
{
    public static function inspect(string $archive): array
    {
        $entries = InstallArchive::entries($archive);
        $candidates = array_values(array_filter($entries, fn ($entry) => !$entry['directory'] && basename($entry['path']) === 'level.dat' && !str_starts_with($entry['path'], '__MACOSX/')));
        abort_unless(count($candidates) === 1, 422, 'L’archive doit contenir exactement un monde Java avec son fichier level.dat.');
        $level = $candidates[0];
        abort_unless($level['size'] > 0 && $level['size'] <= 2097152, 422, 'Fichier level.dat invalide ou trop volumineux.');
        $zip = new ZipArchive(); $zip->open($archive);
        try {
            $content = $zip->getFromName($level['path']);
            $metadata = WorldMetadata::read($content);
        } finally { $zip->close(); }
        $prefix = dirname($level['path']); $prefix = $prefix === '.' ? '' : $prefix.'/';
        $files = [];
        foreach ($entries as $entry) {
            if ($entry['directory'] || !str_starts_with($entry['path'], $prefix)) continue;
            $target = substr($entry['path'], strlen($prefix));
            if (str_starts_with($target, '__MACOSX/') || in_array(basename($target), ['.DS_Store','session.lock','uid.dat'], true)) continue;
            abort_unless(InstallArchive::safePath($target), 422, 'Chemin de monde invalide.');
            $files[] = ['entry' => $entry['path'], 'path' => $target, 'size' => $entry['size']];
        }
        return ['metadata' => $metadata, 'name' => $metadata['name'] ?? ($prefix ? basename(rtrim($prefix, '/')) : 'Monde importé'), 'files' => $files, 'size' => array_sum(array_column($files, 'size'))];
    }

    public static function active(string $properties): string
    {
        preg_match_all('/^\s*level-name\s*[=:]\s*(.*)$/m', $properties, $matches);
        return trim(end($matches[1]) ?: 'world');
    }

    public static function activate(string $properties, string $world): string
    {
        abort_unless(preg_match('/^world-[a-z0-9-]{8,60}$/D', $world), 422, 'Nom de dossier du monde non valide.');
        // Last definition wins in Java Properties. A blank line terminates any trailing continuation.
        return rtrim($properties)."\n\n# Active world selected by VinusPanel\nlevel-name=".$world."\n";
    }

    public static function bundle(string $archive, array $world, string $destination): void
    {
        $input = new ZipArchive(); $output = new ZipArchive();
        abort_unless($input->open($archive) === true && $output->open($destination, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true, 422, 'Archive illisible.');
        $temporary = [];
        try {
            foreach ($world['files'] as $file) {
                $path = tempnam(dirname($destination), 'world-'); $temporary[] = $path;
                $from = $input->getStream($file['entry']); $to = fopen($path, 'wb');
                abort_unless($from && $to, 422, 'Fichier de monde illisible.');
                try { $bytes = stream_copy_to_stream($from, $to, $file['size'] + 1); } finally { fclose($from); fclose($to); }
                abort_unless($bytes === $file['size'] && $output->addFile($path, 'world/'.$file['path']), 422, 'Fichier de monde incomplet.');
                $output->setCompressionName('world/'.$file['path'], ZipArchive::CM_STORE);
            }
            abort_unless($output->close(), 500, 'Impossible de préparer le monde.');
            InstallArchive::entries($destination);
        } finally { $input->close(); foreach ($temporary as $path) if (is_file($path)) unlink($path); }
    }
}
