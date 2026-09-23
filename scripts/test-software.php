<?php

require ($argv[1] ?? __DIR__.'/../overlay').'/app/Services/VinusSoftware.php';
use Pterodactyl\Services\VinusSoftware;

$cases = [
    ['Minecraft Forge', [], null, 'forge'],
    ['Minecraft', ['SERVER_JARFILE' => 'fabric-server-launch.jar'], null, 'fabric'],
    ['Minecraft Spigot', [], null, 'spigot'],
    ['Forge', ['SOFTWARE' => 'neoforge'], null, 'neoforge'],
    ['Minecraft', ['SERVER_JARFILE' => 'youer-1.21.1.jar'], null, 'youer'],
    ['Minecraft', ['SOFTWARE' => 'velocity'], null, 'velocity'],
    ['Minecraft', [], 'fabric', 'fabric'],
    ['Custom game', ['PASSWORD' => 'forge'], null, null],
    ['Unsupported', [], null, null],
];
foreach ($cases as [$egg, $vars, $override, $expected]) {
    $actual = VinusSoftware::detect($egg, $vars, $override)['software'];
    if ($actual !== $expected) throw new RuntimeException('Unexpected software for '.$egg);
}
if (VinusSoftware::detect('Fabric', ['MC_VERSION' => '1.21.1'])['game_version'] !== '1.21.1') throw new RuntimeException('Missing version');
echo "Software detection: 10 checks passed.\n";
