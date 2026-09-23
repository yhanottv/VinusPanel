<?php
require ($argv[1] ?? '/var/www/pterodactyl').'/vendor/autoload.php';
require __DIR__.'/../app/ServerSoftware.php';
use Illuminate\Foundation\Application;
use Illuminate\Config\Repository;
use Illuminate\Support\Facades\{Facade, Http};
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\ServerSoftware;
use Symfony\Component\HttpKernel\Exception\HttpException;
$app = new Application(sys_get_temp_dir());
$app->instance('config', new Repository(['cache' => ['default' => 'array', 'stores' => ['array' => ['driver' => 'array']]]]));
$app->register(Illuminate\Cache\CacheServiceProvider::class);
$app->singleton(Illuminate\Http\Client\Factory::class); Facade::setFacadeApplication($app);
$software = new ServerSoftware(); $count = 0;
$check = function ($ok, $message) use (&$count) { if (!$ok) throw new RuntimeException($message); $count++; };
foreach (['server.jar','libraries/net/example.jar','cache/mojang.jar'] as $path) $check(ServerSoftware::safePath($path), 'Accept confined relative paths');
foreach (['','../server.jar','lib/../../escape.jar','/absolute','C:\\escape','a/./file','a\\b','a'.chr(0).'b'] as $path) $check(!ServerSoftware::safePath($path), 'Reject escaping paths');
$base = 'https://versions.mcjars.app/api/v2/';
Http::fake([
    $base.'types' => Http::response(['success' => true, 'types' => ['recommended' => ['PAPER' => ['name' => 'Paper', 'icon' => 'https://s3.mcjars.app/icons/paper.png']]]]),
    $base.'builds/PAPER' => Http::response(['success' => true, 'builds' => ['1.21.1' => ['java' => 21,'type' => 'RELEASE','supported' => true,'builds' => 1,'created' => '2024-08-01']]]),
    $base.'builds/PAPER/1.21.1' => Http::response(['success' => true, 'builds' => [['id' => 123, 'type' => 'PAPER', 'name' => '#133', 'created' => null, 'experimental' => false, 'installation' => [[['type' => 'download','url' => 'https://fill-data.papermc.io/v1/objects/example/server.jar','file' => 'server.jar','size' => 100]], [['type' => 'remove','location' => 'libraries']]]]]]),
]);
$plan = $software->plan('PAPER','1.21.1',123);
$check($plan['java'] === 21 && count($plan['steps']) === 1, 'Uses declared Java and preserves existing files');
$check($software->builds('PAPER','1.21.1')[0]['id'] === 123, 'Build selection matches provider');
foreach ([['BAD','1.21.1',123],['PAPER','../../evil',123],['PAPER','1.21.1',999]] as $args) {
    try { $software->plan(...$args); throw new RuntimeException('Expected rejection'); }
    catch (HttpException $e) { $check($e->getStatusCode() === 422, 'Reject mismatched software/version/build'); }
}
echo $count." software catalog checks passed.\n";
