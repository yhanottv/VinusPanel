<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

final class Detection
{
    public const PROFILES = [
        'forge' => ['mods' => ['forge']],
        'neoforge' => ['mods' => ['neoforge']],
        'fabric' => ['mods' => ['fabric']],
        'quilt' => ['mods' => ['quilt']],
        'paper' => ['plugins' => ['paper', 'spigot', 'bukkit']],
        'purpur' => ['plugins' => ['purpur', 'paper', 'spigot', 'bukkit']],
        'spigot' => ['plugins' => ['spigot', 'bukkit']],
        'bukkit' => ['plugins' => ['bukkit']],
        'folia' => ['plugins' => ['folia']],
        'sponge' => ['plugins' => ['sponge']],
        'velocity' => ['plugins' => ['velocity']],
        'bungeecord' => ['plugins' => ['bungeecord']],
        'waterfall' => ['plugins' => ['waterfall', 'bungeecord']],
        'youer' => ['mods' => ['neoforge'], 'plugins' => ['paper', 'spigot', 'bukkit']],
        'mohist' => ['mods' => ['forge'], 'plugins' => ['spigot', 'bukkit']],
        'arclight-forge' => ['mods' => ['forge'], 'plugins' => ['spigot', 'bukkit']],
        'arclight-fabric' => ['mods' => ['fabric'], 'plugins' => ['spigot', 'bukkit']],
        'arclight-neoforge' => ['mods' => ['neoforge'], 'plugins' => ['spigot', 'bukkit']],
        'vanilla' => [],
    ];

    public static function detect(string $egg, array $variables, ?string $override = null): array
    {
        $profile = null;
        $identity = $egg;
        if ($override !== null && array_key_exists($override, self::PROFILES)) {
            $profile = $override;
        } else {
            // Specific loaders must precede their parent names. Never use local numeric egg IDs.
            $sources = [];
            foreach (['SOFTWARE', 'SERVER_TYPE', 'SERVER_JARFILE', 'JARFILE', 'SERVER_JAR_PATH'] as $key) {
                if (!empty($variables[$key])) $sources[] = str_replace('_', '-', basename((string) $variables[$key]));
            }
            $sources[] = $egg;
            foreach ($sources as $source) {
              foreach (['youer', 'mohist', 'arclight', 'neoforge', 'forge', 'quilt', 'fabric', 'folia', 'purpur', 'paper', 'spigot', 'bukkit', 'sponge', 'velocity', 'waterfall', 'bungeecord', 'vanilla'] as $candidate) {
                if (preg_match('/\b'.preg_quote($candidate, '/').'\b/i', $source)) {
                    $profile = $candidate;
                    $identity = $source;
                    break 2;
                }
              }
            }
        }
        if ($profile === 'arclight') {
            $loader = strtolower(trim((string) ($variables['LOADER'] ?? $variables['MOD_LOADER'] ?? '')));
            if (!in_array($loader, ['forge', 'fabric', 'neoforge'], true)) {
                $loader = preg_match('/\b(neoforge|forge|fabric)\b/i', $identity, $match) ? strtolower($match[1]) : '';
            }
            $profile = $loader ? 'arclight-'.$loader : null;
        }
        $version = null;
        foreach (['MINECRAFT_VERSION', 'MC_VERSION', 'MINECRAFT_VER', 'MC_VER'] as $key) {
            $value = trim((string) ($variables[$key] ?? ''));
            if (preg_match('/^\d{1,3}\.\d{1,2}(?:\.\d{1,2})?$/', $value)) {
                $version = $value;
                break;
            }
        }
        return ['software' => $profile, 'categories' => self::PROFILES[$profile] ?? [], 'game_version' => $version];
    }
}
