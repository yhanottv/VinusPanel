<?php
// Isolated integration test: memory-only Wings/HTTP/cache, no production app bootstrap or database.
require ($argv[1] ?? '/var/www/pterodactyl').'/vendor/autoload.php';
foreach (['Detection', 'Modrinth', 'CatalogController'] as $name) require __DIR__.'/../app/'.$name.'.php';

use Illuminate\Foundation\Application;
use Illuminate\Config\Repository;
use Illuminate\Support\Facades\Facade;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Egg;
use Pterodactyl\Repositories\Wings\DaemonRepository;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\{Detection, Modrinth, CatalogController};
use Psr\Http\Message\ResponseInterface;
use GuzzleHttp\Psr7\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

$app = new Application(sys_get_temp_dir());
$storage = sys_get_temp_dir().'/vinuscatalog-test-'.bin2hex(random_bytes(6));
$app->useStoragePath($storage);
$app->instance('config', new Repository(['cache' => ['default' => 'array', 'stores' => ['array' => ['driver' => 'array']]]]));
$app->register(Illuminate\Cache\CacheServiceProvider::class);
$app->instance('validator', new Illuminate\Validation\Factory(new Illuminate\Translation\Translator(new Illuminate\Translation\ArrayLoader(), 'en'), $app));
$app->singleton(Illuminate\Http\Client\Factory::class);
Facade::setFacadeApplication($app);
// Only the input validation is stubbed; HTTP endpoint validation is exercised separately in the panel.
Request::macro('validate', fn ($rules) => $this->all());
$app->instance(Pterodactyl\Services\Activity\ActivityLogService::class, new class {
    public function event($value) { return $this; }
    public function property($key, $value) { return $this; }
    public function log() {}
});
class MemoryFiles extends DaemonFileRepository {
    public array $items = []; public ?string $failName = null; public array $failNames = [];
    public function setServer(Server $server): DaemonRepository { return $this; }
    public function getContent(string $path, ?int $notLargerThan = null): string { return $this->items[$path]; }
    public function putContent(string $path, string $content): ResponseInterface { $this->items[$path] = $content; return new Response(204); }
    public function getDirectory(string $path): array {
        $prefix = rtrim($path, '/').'/'; $result = [];
        foreach ($this->items as $name => $content) if (str_starts_with($name, $prefix)) {
            $entry = explode('/', substr($name, strlen($prefix)))[0]; $result[$entry] = ['name' => $entry];
        }
        return array_values($result);
    }
    public function createDirectory(string $name, string $path): ResponseInterface { return new Response(204); }
    public function renameFiles(?string $root, array $files): ResponseInterface {
        foreach ($files as $file) {
            if (in_array($file['to'], $this->failNames, true)) throw new RuntimeException('Simulated persistent Wings failure');
            if ($file['to'] === $this->failName) { $this->failName = null; throw new RuntimeException('Simulated Wings failure'); }
            $from = '/'.$file['from']; $to = '/'.$file['to'];
            if (!isset($this->items[$from]) || isset($this->items[$to])) throw new RuntimeException('Invalid move');
            $this->items[$to] = $this->items[$from]; unset($this->items[$from]);
        }
        return new Response(204);
    }
}
class MemoryDaemon extends DaemonServerRepository {
    public string $state = 'offline';
    public function setServer(Server $server): DaemonRepository { return $this; }
    public function getDetails(): array { return ['state' => $this->state]; }
}
$server = new #[\Pterodactyl\Models\Attributes\Identifiable('serv')] class extends Server { public function validateCurrentState() {} };
$server->uuid = '00000000-0000-0000-0000-000000000001';
$server->setRelation('egg', new Egg(['name' => 'Youer', 'uuid' => 'test-egg']));
$server->setRelation('variables', collect());
$user = new class { public int $id = 123; public bool $allowed = true; public function can($permission, $server) { return $this->allowed; } };
$request = Request::create('/', 'POST', ['token' => str_repeat('a',48)]);
$request->setUserResolver(fn () => $user);
$files = new MemoryFiles($app); $daemon = new MemoryDaemon($app);
$controller = new CatalogController(new Modrinth(), $files, $daemon);
$content = 'Test artifact, not an executable JAR';
Http::fake(function ($request, $options) use ($content) { fwrite($options['sink'], $content); return Http::response('', 200); });
$artifact = fn ($id) => ['project_id' => $id, 'version_id' => 'version2', 'version' => '2.0', 'title' => $id, 'filename' => $id.'.jar', 'size' => strlen($content), 'sha512' => hash('sha512', $content), 'url' => 'https://cdn.modrinth.com/data/'.$id.'.jar', 'previous' => null, 'action' => 'install'];
$makePlan = function ($artifacts) use ($user, $server) {
    Cache::put('vinuscatalog:plan:'.str_repeat('a',48), ['user' => $user->id, 'server' => $server->uuid, 'profile' => Detection::detect('Youer', []), 'selection' => ['kind' => 'mods', 'game_version' => '1.21.1'], 'files' => $artifacts],300);
};
$count = 0;
$check = function ($ok, $message) use (&$count) { if (!$ok) throw new RuntimeException($message); $count++; };
$reject = function ($status) use ($controller, $request, $server, $check) {
    try { $controller->install($request, $server); throw new RuntimeException('Expected rejection'); }
    catch (HttpException $e) { $check($e->getStatusCode() === $status, 'Expected status '.$status.', got '.$e->getStatusCode().': '.$e->getMessage()); }
};
$makePlan([$artifact('testone1')]);
$user->allowed = false; $reject(403); $user->allowed = true;
$daemon->state = 'running'; $reject(409); $check($files->items === [], 'Running server untouched'); $daemon->state = 'offline';
$files->items['/mods/testone1.jar'] = 'unmanaged'; $reject(409); $check($files->items['/mods/testone1.jar'] === 'unmanaged', 'Existing file preserved'); $files->items = [];
$first = $controller->install($request, $server);
$check($files->items['/mods/testone1.jar'] === $content, 'Downloaded content installed');
$check(count($first['installed']) === 1, 'Installation recorded');
$reject(422); // consumed token cannot be replayed
$oversized = $artifact('hugefile'); $oversized['size'] = 101 * 1024 * 1024;
$makePlan([$oversized]); $reject(422);
$makePlan([$artifact('otherusr')]); $user->id = 999; $reject(422); $user->id = 123;
// A later move failure must roll back all preceding moves in that batch.
$makePlan([$artifact('testtwo2'), $artifact('testtri3')]);
$files->failName = 'mods/testtri3.jar'; $reject(500);
$reject(422); // Failed installations also consume their authorization.
$check(!isset($files->items['/mods/testtwo2.jar']) && !isset($files->items['/mods/testtri3.jar']), 'Failed batch rolled back');
$check($files->items['/mods/testone1.jar'] === $content, 'Earlier installation preserved');
$manifest = json_decode(file_get_contents($storage.'/app/vinuscatalog/'.$server->uuid.'.json'), true);
$check(count($manifest) === 1, 'Failed batch did not change manifest');
// An update must restore its old JAR when the new file cannot be moved.
$update = $artifact('testone1'); $update['previous'] = $manifest['mods:testone1'];
$update['action'] = 'update'; $update['filename'] = 'testone1-new.jar';
$makePlan([$update]); $files->failName = 'mods/testone1-new.jar'; $reject(500);
$check($files->items['/mods/testone1.jar'] === $content, 'Old JAR restored after failed update');
// If Wings also refuses recovery, report manual recovery rather than claiming success.
$makePlan([$update]); $files->failNames = ['mods/testone1-new.jar', 'mods/testone1.jar'];
try { $controller->install($request, $server); throw new RuntimeException('Expected recovery failure'); }
catch (HttpException $e) { $check(str_contains($e->getMessage(), 'récupérez les anciens fichiers'), 'Incomplete recovery is reported explicitly'); }
// Error responses carry a reference, not internal exception details.
require __DIR__.'/../app/CatalogErrors.php';
Illuminate\Support\Facades\Log::swap(new class { public function error($message, $context) {} });
$errors = new Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CatalogErrors();
$response = $errors->handle($request, function () { throw new RuntimeException('database password=do-not-leak'); });
$check($response->getStatusCode() === 500 && !str_contains($response->getContent(), 'do-not-leak'), 'Private exception detail is hidden');
$check(strlen($response->getData(true)['reference']) === 36, 'Diagnostic reference returned');
$response = $errors->handle($request, function () { throw new HttpException(409, 'Arrêtez le serveur avant de continuer.'); });
$check($response->getStatusCode() === 409 && str_contains($response->getContent(), 'serveur'), 'Safe actionable error preserved');
// Clean only this test's own freshly-created storage directory.
foreach (glob($storage.'/app/vinuscatalog/*') as $path) unlink($path);
rmdir($storage.'/app/vinuscatalog'); rmdir($storage.'/app'); rmdir($storage);
echo $count." isolated installation checks passed. No live server or database was used.\n";
