<?php
require ($argv[1] ?? '/var/www/pterodactyl').'/vendor/autoload.php';
foreach (['InstallArchive','InstallDownload','ModpackManifest'] as $class) require __DIR__.'/../app/'.$class.'.php';
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\ModpackManifest;
use Symfony\Component\HttpKernel\Exception\HttpException;
new Illuminate\Foundation\Application(sys_get_temp_dir());
$checks = 0;
$check = function ($ok, $message) use (&$checks) { if (!$ok) throw new RuntimeException($message); $checks++; };
$reject = function ($fn) use ($check) { try { $fn(); throw new RuntimeException('Expected rejection'); } catch (HttpException $e) { $check($e->getStatusCode() === 422, 'Unsafe manifest rejected'); } };
$file = ['path' => 'mods/Example Mod.jar', 'fileSize' => 100, 'hashes' => ['sha1' => str_repeat('a',40), 'sha512' => str_repeat('b',128)], 'downloads' => ['https://cdn.modrinth.com/data/example.jar']];
$manifest = ['formatVersion' => 1, 'game' => 'minecraft', 'name' => 'Test pack', 'dependencies' => ['minecraft' => '1.21.1', 'fabric-loader' => '0.16.14'], 'files' => [$file]];
$parsed = ModpackManifest::modrinth($manifest);
$check($parsed['runtime'] === ['minecraft' => '1.21.1','software' => 'FABRIC','loader_version' => '0.16.14'], 'Exact runtime preserved');
$check($parsed['files'][0]['path'] === 'mods/Example Mod.jar', 'Spaces in valid mod filenames accepted');
$client = $file; $client['path'] = 'mods/client.jar'; $client['env'] = ['server' => 'unsupported'];
$optional = $file; $optional['path'] = 'mods/optional.jar'; $optional['env'] = ['server' => 'optional'];
$parsed = ModpackManifest::modrinth(array_replace($manifest,['files' => [$file,$client,$optional]]));
$check(count($parsed['files']) === 2 && $parsed['client_files_skipped'] === 1 && $parsed['files'][1]['optional'], 'Server/client and optional files are separate');
foreach ([['path' => '../escape.jar'],['path' => 'mods/../escape.jar'],['path' => 'C:/escape'],['hashes' => []],['fileSize' => -1],['downloads' => ['https://localhost/mod.jar']],['downloads' => ['https://unapproved.example/mod.jar']],['env' => ['server' => 'maybe']]] as $change) {
    $bad = array_replace($file,$change); $reject(fn () => ModpackManifest::modrinth(array_replace($manifest,['files' => [$bad]])));
}
$reject(fn () => ModpackManifest::modrinth(array_replace($manifest,['files' => [$file,$file]])));
$parent = $file; $parent['path'] = 'mods';
$reject(fn () => ModpackManifest::modrinth(array_replace($manifest,['files' => [$parent,$file]])));
$reject(fn () => ModpackManifest::dependencies(['minecraft' => '1.21.1','forge' => '51','fabric-loader' => '0.16']));
$reject(fn () => ModpackManifest::dependencies(['minecraft' => '1.21.1','unknown-loader' => '1']));
$curse = ['manifestType' => 'minecraftModpack','manifestVersion' => 1,'minecraft' => ['version' => '1.20.1','modLoaders' => [['id' => 'forge-47.4.23','primary' => true]]],'files' => [['projectID' => 123,'fileID' => 456,'required' => true]],'overrides' => 'overrides'];
$cf = ModpackManifest::curseforge($curse);
$check($cf['runtime']['software'] === 'FORGE' && $cf['runtime']['loader_version'] === '47.4.23', 'CurseForge exact loader preserved');
$check($cf['files'][0]['project_id'] === '123' && $cf['files'][0]['version_id'] === '456', 'CurseForge file references preserved');
$reject(fn () => ModpackManifest::curseforge(array_replace($curse,['overrides' => '../escape'])));
$reject(fn () => ModpackManifest::curseforge(array_replace($curse,['files' => [['projectID' => 123,'fileID' => -1]]])));
$archive = tempnam(sys_get_temp_dir(),'vinus-pack-test-');
$zip = new ZipArchive(); $zip->open($archive,ZipArchive::OVERWRITE);
$zip->addFromString('modrinth.index.json',json_encode($manifest));
$zip->addFromString('overrides/config/common.json','{"layer":"common"}');
$zip->addFromString('server-overrides/config/common.json','{"layer":"server"}');
$zip->addFromString('overrides/eula.txt', 'eula=true');
$zip->addFromString('client-overrides/options.txt','client only'); $zip->close();
try {
    $read = ModpackManifest::read($archive,'modrinth');
    $check(count($read['overrides']) === 1 && $read['overrides'][0]['entry'] === 'server-overrides/config/common.json', 'Server overrides win and client overrides never reach server');
} finally { unlink($archive); }
echo $checks." modpack manifest checks passed.\n";
