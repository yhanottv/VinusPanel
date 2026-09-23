<?php
require ($argv[1] ?? '/var/www/pterodactyl').'/vendor/autoload.php';
require __DIR__.'/../app/CatalogSources.php';
use Illuminate\Foundation\Application;
use Illuminate\Config\Repository;
use Illuminate\Support\Facades\{Facade, Http, Cache};
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CatalogSources;
use Symfony\Component\HttpKernel\Exception\HttpException;

$app = new Application(sys_get_temp_dir());
$app->instance('config', new Repository(['cache' => ['default' => 'array', 'stores' => ['array' => ['driver' => 'array']]], 'vinuscatalog' => ['curseforge_key' => 'fixture-private-key']]));
$app->register(Illuminate\Cache\CacheServiceProvider::class);
$app->singleton(Illuminate\Http\Client\Factory::class);
Facade::setFacadeApplication($app);
$provider = new CatalogSources(); $count = 0;
$check = function ($ok, $message) use (&$count) { if (!$ok) throw new RuntimeException($message); $count++; };
$reject = function ($run, $status) use ($check) { try { $run(); throw new RuntimeException('Expected rejection'); } catch (HttpException $e) { $check($e->getStatusCode() === $status, $e->getMessage()); } };
foreach (['https://edge.forgecdn.net/files/1/a.jar','https://mediafilez.forgecdn.net/files/1/a.jar'] as $url) $check(CatalogSources::trustedUrl($url, 'curseforge'), 'Allow official CDN');
foreach (['http://edge.forgecdn.net/a.jar','https://edge.forgecdn.net.evil.test/a.jar','https://user@edge.forgecdn.net/a.jar','https://edge.forgecdn.net:123/a.jar','https://127.0.0.1/a.jar','https://edge.forgecdn.net/a.jar#fragment'] as $url) $check(!CatalogSources::trustedUrl($url, 'curseforge'), 'Reject untrusted origin');
$content = "PK\x03\x04fixture-jar";
$fixtures = [
    'https://api.spiget.org/v2/resources/123' => ['id' => 123, 'name' => 'Test plugin', 'external' => false, 'premium' => false],
    'https://api.spiget.org/v2/resources/123/versions/456' => ['resource' => 123, 'name' => '1.2'],
    'https://api.curseforge.com/v1/mods/789' => ['data' => ['id' => 789, 'gameId' => 432, 'classId' => 6, 'name' => 'Test mod']],
    'https://api.curseforge.com/v1/mods/789/files/321' => ['data' => ['modId' => 789, 'isAvailable' => true, 'gameVersions' => ['1.21.1','NeoForge'], 'fileName' => 'example.jar', 'downloadUrl' => 'https://edge.forgecdn.net/files/789/example.jar', 'displayName' => '1.0', 'hashes' => [['algo' => 1, 'value' => sha1($content)]], 'fileLength' => strlen($content), 'dependencies' => []]],
];
Http::fake(function ($request, $options) use ($fixtures, $content, $check) {
    $url = $request->url();
    if (str_contains($url, 'api.curseforge.com') || str_contains($url, 'edge.forgecdn.net')) $check($request->hasHeader('x-api-key', 'fixture-private-key'), 'CF key applied server-side');
    else $check(!$request->hasHeader('x-api-key'), 'CF key never sent to another provider');
    if (isset($fixtures[$url])) return Http::response($fixtures[$url]);
    if (str_ends_with($url, '/download') || str_contains($url, 'forgecdn.net')) { fwrite($options['sink'], $content); return Http::response('', 200); }
    throw new RuntimeException('Unexpected URL '.$url);
});
$spigot = $provider->resolve('spigot','123','456','plugins',['paper'],'1.21.1');
$check($spigot[0]['sha512'] === hash('sha512', $content) && $spigot[0]['project_id'] === 'spigot:123', 'Spigot normalized and hashed');
$curse = $provider->resolve('curseforge','789','321','mods',['neoforge'],'1.21.1');
$check($curse[0]['filename'] === 'example.jar', 'CF compatible mod resolved');
$reject(fn () => $provider->resolve('curseforge','789','321','mods',['fabric'],'1.21.1'), 422);
$reject(fn () => $provider->resolve('curseforge','789','321','mods',['neoforge'],'1.20.1'), 422);
$reject(fn () => $provider->resolve('curseforge','789','321','plugins',['paper'],'1.21.1'), 422);
$reject(fn () => $provider->resolve('spigot','123','456','mods',['forge'],'1.21.1'), 422);
Http::swap(new Illuminate\Http\Client\Factory());
Http::fake(fn () => Http::response('', 302, ['Location' => 'http://127.0.0.1/private']));
$reject(fn () => $provider->download('spigot','https://api.spiget.org/v2/resources/123/download'), 422);
$app['config']->set('vinuscatalog.curseforge_key', null);
$check(!$provider->available()['curseforge'], 'Missing key accurately reported');
$reject(fn () => $provider->get('curseforge','mods/search'), 503);
echo $count." provider checks passed; no live server files changed.\n";
