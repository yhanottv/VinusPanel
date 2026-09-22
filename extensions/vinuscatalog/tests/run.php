<?php

require ($argv[1] ?? '/var/www/pterodactyl').'/vendor/autoload.php';
require __DIR__.'/../app/Detection.php';
require __DIR__.'/../app/Modrinth.php';

use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\Detection;
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\Modrinth;
use Symfony\Component\HttpKernel\Exception\HttpException;

$count = 0;
$check = function ($condition, $label) use (&$count) { if (!$condition) throw new RuntimeException($label); $count++; };
foreach (['Forge Minecraft' => 'forge', 'NeoForge' => 'neoforge', 'Fabric Minecraft' => 'fabric', 'Paper' => 'paper', 'Sponge (SpongeVanilla)' => 'sponge', 'Velocity Proxy' => 'velocity', 'Bungeecord' => 'bungeecord', 'Youer' => 'youer'] as $egg => $software) {
    $check(Detection::detect($egg, [])['software'] === $software, 'Detect '.$egg);
}
$check(array_keys(Detection::detect('Forge', [])['categories']) === ['mods'], 'Forge only mods');
$check(array_keys(Detection::detect('Paper', [])['categories']) === ['plugins'], 'Paper only plugins');
$check(array_keys(Detection::detect('Youer', [])['categories']) === ['mods', 'plugins'], 'Hybrid separate categories');
$check(Detection::detect('Vanilla Minecraft', [])['categories'] === [], 'Vanilla no extensions');
$check(Detection::detect('Unknown game', [])['categories'] === [], 'Unknown fails closed');
$check(Detection::detect('Custom egg', [], 'fabric')['categories'] === ['mods' => ['fabric']], 'Portable admin override');
$check(Detection::detect('Velocity', ['VERSION' => '3.4.0'])['game_version'] === null, 'Proxy version is not Minecraft version');
$check(Detection::detect('Forge', ['MC_VERSION' => '1.21.1'])['game_version'] === '1.21.1', 'Game version');
$check(Detection::detect('Forge', ['MC_VERSION' => 'latest'])['game_version'] === null, 'Never guess latest');
$check(Detection::detect('Paper', ['SERVER_JARFILE' => 'youer.jar'])['software'] === 'youer', 'Selected Youer overrides generic Paper egg');
$check(Detection::detect('Bungeecord', ['SERVER_JARFILE' => 'velocity.jar'])['software'] === 'velocity', 'Selected Velocity overrides generic proxy egg');
$check(Detection::detect('Paper', ['SERVER_JARFILE' => 'server.jar'])['software'] === 'paper', 'Generic filename falls back to egg');
$check(Detection::detect('Paper', ['SERVER_JARFILE' => 'youer.jar'], 'fabric')['software'] === 'fabric', 'Administrative override is authoritative');
$check(Detection::detect('Arclight', [])['categories'] === [], 'Ambiguous Arclight fails closed');
$check(Detection::detect('Arclight', ['LOADER' => 'fabric'])['categories']['mods'] === ['fabric'], 'Arclight Fabric variant');
$check(Detection::detect('Paper', ['SERVER_JARFILE' => 'arclight-neoforge.jar'])['categories']['mods'] === ['neoforge'], 'Arclight NeoForge JAR variant');
$check(Detection::detect('Paper', ['MC_VERSION' => '26.1.2'])['game_version'] === '26.1.2', 'Modern Minecraft release numbering');
$fixture = ['id' => 'abcdefgh', 'project_id' => 'ijklmnop', 'version_number' => '1.0', 'loaders' => ['forge'], 'game_versions' => ['1.21.1'], 'files' => [['primary' => true, 'filename' => 'example-1.0.jar', 'url' => 'https://cdn.modrinth.com/data/ijklmnop/versions/abcdefgh/example-1.0.jar', 'size' => 123, 'hashes' => ['sha512' => str_repeat('a', 128)]]]];
$check(Modrinth::artifact($fixture, ['forge'], '1.21.1')['filename'] === 'example-1.0.jar', 'Accept compatible trusted file');
$reject = function ($fixture, $loaders = ['forge'], $game = '1.21.1') use ($check) { try { Modrinth::artifact($fixture, $loaders, $game); $check(false, 'Invalid artifact accepted'); } catch (HttpException $e) { $check($e->getStatusCode() === 422, 'Validation status'); } };
$reject($fixture, ['paper']); $reject($fixture, ['forge'], '1.20.1');
foreach (['http://cdn.modrinth.com/data/file.jar', 'https://evil.example/data/file.jar', 'https://cdn.modrinth.com.evil.example/data/file.jar', 'https://127.0.0.1/data/file.jar', 'https://user@cdn.modrinth.com/data/file.jar', 'https://cdn.modrinth.com:8080/data/file.jar', 'https://cdn.modrinth.com/data/file.jar?redirect=x'] as $url) { $bad=$fixture; $bad['files'][0]['url']=$url; $reject($bad); }
foreach (['../evil.jar', 'a/b.jar', 'a\\b.jar', '.hidden.jar', 'plugin.php'] as $filename) { $bad=$fixture; $bad['files'][0]['filename']=$filename; $reject($bad); }
$bad=$fixture; $bad['files'][0]['size']=30*1024*1024; $reject($bad);
$bad=$fixture; $bad['files'][0]['hashes']['sha512']='bad'; $reject($bad);
foreach (['https://cdn.modrinth.com/data/abcd1234/icon.png', 'https://cdn.modrinth.com/cached_images/abcdef.webp'] as $url) $check(Modrinth::icon($url) === $url, 'Trusted icon accepted');
foreach (['https://evil.example/icon.png', 'https://cdn.modrinth.com.evil.example/data/a.png', 'javascript:alert(1)', 'https://cdn.modrinth.com/data/a.svg', 'https://user@cdn.modrinth.com/data/a.png', 'https://cdn.modrinth.com/data/../a.png', 'https://cdn.modrinth.com/data/a.png?track=1', null] as $url) $check(Modrinth::icon($url) === null, 'Untrusted icon refused');
echo $count." detection and artifact checks passed.\n";
