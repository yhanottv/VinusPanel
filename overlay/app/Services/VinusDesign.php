<?php

namespace Pterodactyl\Services;

use Illuminate\Support\Facades\File;

class VinusDesign
{
    public const DEFAULTS = [
        'brand_name' => 'VinusPanel',
        'accent' => '#ff9b52',
        'background' => '#0b0d12',
        'surface' => '#101319',
        'server_card' => '#101319',
        'text' => '#e2e8f0',
        'logo' => '/assets/images/vinus/eagle.png',
        'background_image' => '',
        'servers' => [],
    ];

    public static function path(): string
    {
        return storage_path('app/vinuspanel/design.json');
    }

    public static function read(): array
    {
        $path = self::path();
        if (!is_file($path)) {
            return self::DEFAULTS;
        }

        $decoded = json_decode((string) file_get_contents($path), true);
        if (!is_array($decoded)) {
            return self::DEFAULTS;
        }

        return array_replace(self::DEFAULTS, $decoded);
    }

    public static function write(array $data): void
    {
        $path = self::path();
        File::ensureDirectoryExists(dirname($path));
        $temporary = tempnam(dirname($path), 'design-');
        if ($temporary === false) {
            throw new \RuntimeException('Unable to create a temporary design file.');
        }

        try {
            $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            if (file_put_contents($temporary, $json . "\n", LOCK_EX) === false) {
                throw new \RuntimeException('Unable to write design settings.');
            }
            chmod($temporary, 0640);
            if (!rename($temporary, $path)) {
                throw new \RuntimeException('Unable to save design settings.');
            }
        } finally {
            if (is_file($temporary)) {
                unlink($temporary);
            }
        }
    }
}
