<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use ZipArchive;

/** Builds a ZIP from validated files; no provider scripts are executed. */
final class ModpackBundle
{
    /** Reject a provable loader mismatch before replacing files. Unknown range forms
     * are left to Fabric's resolver; this is not a complete dependency solver. */
    public static function incompatibleMinimum($constraint, string $installed): bool
    {
        $ranges = is_array($constraint) ? $constraint : [$constraint];
        if (!$ranges) return false;
        foreach ($ranges as $range) {
            if (!is_string($range) || !preg_match('/^>=\s*(\d+\.\d+\.\d+)$/D', trim($range), $match)) return false;
            if (version_compare($installed, $match[1], '>=')) return false;
        }
        return true;
    }

    public static function checkFabric(string $jar, string $loader, string $filename): void
    {
        $zip = new ZipArchive(); abort_unless($zip->open($jar) === true, 422, 'JAR illisible dans le pack : '.$filename);
        try {
            $entry = $zip->statName('fabric.mod.json');
            if (!$entry) return;
            abort_unless($entry['size'] <= 1048576, 422, 'Métadonnées de mod trop volumineuses.');
            $meta = json_decode($zip->getFromName('fabric.mod.json'), true);
            $requires = $meta['depends']['fabricloader'] ?? null;
            if (self::incompatibleMinimum($requires, $loader)) abort(422, 'Le manifeste du pack demande Fabric '.$loader.', mais '.$filename.' exige '.(is_array($requires) ? implode(' ou ', $requires) : $requires).'. Choisissez une publication corrigée du pack.');
        } finally { $zip->close(); }
    }

    public static function packPath(string $path): bool
    {
        $root = explode('/', $path)[0];
        return InstallArchive::safePath($path) && !str_starts_with(strtolower($root), 'vinus-')
            && !in_array(strtolower($root), ['bundle.zip','server.jar','libraries','versions','cache','unix_args.txt','user_jvm_args.txt','run.sh','run.bat','eula.txt'], true);
    }

    public static function properties(string $text, int $port): string
    {
        // Remove continuations too, so an old continuation cannot restore the old binding.
        foreach (['server-port' => (string) $port, 'query.port' => (string) $port, 'server-ip' => ''] as $key => $value) {
            $lines = preg_split('/\r\n|\n|\r/', $text); $output = []; $skip = false;
            foreach ($lines as $line) {
                $matches = preg_match('/^\s*'.preg_quote($key, '/').'(?:\s*[=:]|\s+)/', $line);
                if ($skip || $matches) { $skip = (strlen($line) - strlen(rtrim($line, '\\'))) % 2 === 1; continue; }
                $output[] = $line;
            }
            $text = rtrim(implode("\n", $output))."\n\n".$key.'='.$value."\n";
        }
        return $text;
    }

    public static function add(array &$files, string $path, string $local, bool $replace = false): void
    {
        abort_unless(InstallArchive::safePath($path) && ($replace || !isset($files[$path])), 422, 'Collision de fichiers dans le modpack.');
        foreach ($files as $existing => $unused) abort_unless(!str_starts_with($existing, $path.'/') && !str_starts_with($path, $existing.'/'), 422, 'Collision entre un fichier et un dossier du modpack.');
        $files[$path] = $local;
        abort_unless(count($files) <= 30000 && array_sum(array_map('filesize', $files)) <= ModpackManifest::MAX_BYTES, 422, 'Le serveur préparé dépasse 2 Gio ou 30 000 fichiers.');
    }

    public static function extract(string $archive, array $entries, string $directory, array &$files, bool $pack): void
    {
        $zip = new ZipArchive(); abort_unless($zip->open($archive) === true, 422, 'Archive illisible.');
        try {
            foreach ($entries as $entry) {
                if ($entry['directory'] ?? false) continue;
                $path = $entry['path'];
                if ($pack) abort_unless(self::packPath($path), 422, 'Le modpack tente de remplacer un fichier réservé au lanceur ou à la récupération.');
                else abort_unless(in_array(explode('/', $path)[0], ['server.jar','libraries','versions','cache','unix_args.txt','user_jvm_args.txt','run.sh','run.bat'], true), 422, 'Archive de logiciel non reconnue.');
                $target = $directory.'/'.bin2hex(random_bytes(12)).'.part';
                $input = $zip->getStream($entry['entry'] ?? $path); $output = fopen($target, 'xb');
                abort_unless($input && $output, 422, 'Impossible de lire un fichier de l’archive.');
                try { $bytes = stream_copy_to_stream($input, $output, $entry['size'] + 1); }
                finally { fclose($input); fclose($output); }
                abort_unless($bytes === $entry['size'], 422, 'Taille extraite incorrecte.');
                self::add($files, $path, $target, $pack);
            }
        } finally { $zip->close(); }
    }

    public static function zip(array $files, string $destination): void
    {
        abort_unless(isset($files['server.jar']), 422, 'Le modpack ne possède pas de lanceur.');
        $zip = new ZipArchive(); abort_unless($zip->open($destination, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true, 500);
        foreach ($files as $path => $local) {
            abort_unless($zip->addFile($local, $path), 500);
            $zip->setCompressionName($path, ZipArchive::CM_STORE);
        }
        abort_unless($zip->close(), 500, 'Impossible de préparer l’archive du serveur.');
        InstallArchive::entries($destination);
    }
}
