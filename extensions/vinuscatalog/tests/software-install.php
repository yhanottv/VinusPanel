<?php
// Isolated failure/recovery tests. No production bootstrap, database, Wings or downloads.
require ($argv[1] ?? '/var/www/pterodactyl').'/vendor/autoload.php';
foreach (['Detection','ServerSoftware','InstallArchive','InstallDownload','InstallFiles','SoftwareInstaller'] as $class) require __DIR__.'/../app/'.$class.'.php';

use Illuminate\Foundation\Application;
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\{ServerSoftware, InstallArchive, InstallDownload, InstallFiles, SoftwareInstaller};
use Pterodactyl\Models\{Server, Egg};
use Pterodactyl\Repositories\Wings\{DaemonRepository, DaemonServerRepository};
use Pterodactyl\Services\Servers\{StartupModificationService, SuspensionService};
use Psr\Http\Message\ResponseInterface;
use GuzzleHttp\Psr7\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

$app = new Application(sys_get_temp_dir());
$app->instance('validator', new Illuminate\Validation\Factory(new Illuminate\Translation\Translator(new Illuminate\Translation\ArrayLoader(), 'en'), $app));
$storage = sys_get_temp_dir().'/vinus-software-test-'.bin2hex(random_bytes(6));
$app->useStoragePath($storage); mkdir($storage, 0700, true);
$checks = 0;
$check = function ($ok, $message) use (&$checks) { if (!$ok) throw new RuntimeException($message); $checks++; };
$reject = function ($fn, $code) use ($check) { try { $fn(); throw new RuntimeException('Expected rejection'); } catch (HttpException $e) { $check($e->getStatusCode() === $code, $e->getMessage()); } };
$fixture = function (array $files, ?string $link = null) use ($storage) {
    $file = $storage.'/fixture-'.bin2hex(random_bytes(4)).'.zip';
    $zip = new ZipArchive(); $zip->open($file, ZipArchive::CREATE);
    foreach ($files as $name => $content) $zip->addFromString($name, $content);
    if ($link) $zip->setExternalAttributesName($link, ZipArchive::OPSYS_UNIX, 0120777 << 16);
    $zip->close(); return $file;
};
$jar = $fixture(['META-INF/MANIFEST.MF' => 'Main-Class: example.Fixture']);
$check(count(InstallArchive::entries($jar)) === 1, 'Normal archive accepted');
foreach (['../outside','/absolute','libraries/../../outside','bad\\file','C:/outside'] as $path) $reject(fn () => InstallArchive::entries($fixture([$path => 'bad'])), 422);
$reject(fn () => InstallArchive::entries($fixture(['link' => '/outside'], 'link')), 422);
$reject(fn () => InstallArchive::entries($fixture(['large' => str_repeat('x',1000)]), 500), 422);
$reject(fn () => InstallArchive::entries($fixture(['parent' => 'file', 'parent/child' => 'bad'])), 422);
foreach (['http://example.com/x','https://127.0.0.1/x','https://user:secret@example.com/x','https://example.com:443/x','file:///tmp/x','https://example.com/x#fragment'] as $url) $reject(fn () => InstallDownload::host($url), 422);
$check(InstallDownload::host('https://cdn.modrinth.com/data/test.jar') === 'cdn.modrinth.com', 'Valid HTTPS host');
foreach (['127.0.0.1','10.0.0.1','169.254.169.254','100.64.0.1','192.0.2.1','198.18.1.1','224.0.0.1','::1'] as $address) $check(!InstallDownload::publicAddress($address), 'Non-public download addresses rejected');
$check(InstallDownload::publicAddress('1.1.1.1'), 'Public download address accepted');
$check(ServerSoftware::profile('NEOFORGE','1.21.1')['categories']['mods'] === ['neoforge'], 'NeoForge does not offer incompatible Forge artifacts');
$check(ServerSoftware::profile('VELOCITY_CTD','3.4.0')['game_version'] === null, 'Proxy release is not Minecraft version');
$check(!isset(ServerSoftware::profile('ARCLIGHT','1.21.1')['categories']['mods']), 'Ambiguous hybrid fails closed');

class SoftwareTestDownload extends InstallDownload {
    public string $fixture;
    public function fetch(string $url, string $destination, int $size, ?string $sha512 = null): void { copy($this->fixture, $destination); }
}
class SoftwareTestFiles extends InstallFiles {
    public array $items = ['/server.jar' => 'old jar', '/world/level.dat' => 'world data', '/mods/existing.jar' => 'old mod'];
    public bool $failPromotion = false;
    public function setServer(Server $server): DaemonRepository { return $this; }
    public function createDirectory(string $name, string $path): ResponseInterface { return new Response(204); }
    public function putContent(string $path, string $content): ResponseInterface { $this->items[$path] = $content; return new Response(204); }
    public function upload(string $path, string $local): void { $this->items[$path] = file_get_contents($local); }
    public function getDirectory(string $path): array {
        $prefix = rtrim($path,'/').'/'; $result = [];
        foreach ($this->items as $name => $content) if (str_starts_with($name,$prefix)) {
            $rest = substr($name,strlen($prefix)); $entry = explode('/',$rest)[0];
            $result[$entry] = ['name' => $entry, 'file' => !str_contains($rest,'/'), 'symlink' => false];
        }
        return array_values($result);
    }
    public function renameFiles(?string $root, array $files): ResponseInterface {
        foreach ($files as $file) {
            if ($this->failPromotion && $file['to'] === 'server.jar') { $this->failPromotion = false; throw new RuntimeException('Simulated disk failure'); }
            $from = '/'.$file['from']; $to = '/'.$file['to'];
            if (!isset($this->items[$from]) || isset($this->items[$to])) throw new RuntimeException('Invalid move');
            $this->items[$to] = $this->items[$from]; unset($this->items[$from]);
        }
        return new Response(204);
    }
}
class SoftwareTestDaemon extends DaemonServerRepository {
    public string $state = 'offline';
    public function setServer(Server $server): DaemonRepository { return $this; }
    public function getDetails(): array { return ['state' => $this->state]; }
}
class SoftwareTestStartup extends StartupModificationService {
    public function __construct() {}
    public function handle(Server $server, array $data): Server { $server->startup = $data['startup']; $server->image = $data['docker_image']; return $server; }
}
class SoftwareTestSuspension extends SuspensionService {
    public function __construct() {}
    public function toggle(Server $server, string $action = self::ACTION_SUSPEND): void { $server->status = $action === self::ACTION_SUSPEND ? Server::STATUS_SUSPENDED : null; }
}
$server = new #[\Pterodactyl\Models\Attributes\Identifiable('serv')] class extends Server {
    public function validateCurrentState() {}
    public function fresh($with = []) { return $this; }
};
$server->uuid = 'software-test'; $server->status = null; $server->startup = 'old startup'; $server->image = 'ghcr.io/pterodactyl/yolks:java_17';
$server->setRelation('egg', new Egg(['docker_images' => ['Java 21' => 'ghcr.io/pterodactyl/yolks:java_21']]));
$files = new SoftwareTestFiles($app); $daemon = new SoftwareTestDaemon($app); $download = new SoftwareTestDownload(); $download->fixture = $jar;
$installer = new SoftwareInstaller($download,$files,$daemon,new SoftwareTestStartup(),new SoftwareTestSuspension());
$plan = ['software' => 'PAPER','version' => '1.21.1','java' => 21,'build' => 123,'label' => '#133','steps' => [['type' => 'download','file' => 'server.jar','url' => 'https://example.com/server.jar','size' => filesize($jar)]]];
$daemon->state = 'running'; $before = $files->items;
$reject(fn () => $installer->install($server,$plan),409);
$check($files->items === $before && $server->status === null, 'Running server never touched'); $daemon->state = 'offline';
$files->failPromotion = true;
try { $installer->install($server,$plan); throw new RuntimeException('Expected disk failure'); } catch (RuntimeException $e) { $check($e->getMessage() === 'Simulated disk failure','Original failure retained'); }
$check($files->items['/server.jar'] === 'old jar' && $server->startup === 'old startup' && $server->status === null, 'Failed promotion restores files, runtime and access');
$check(!is_file(SoftwareInstaller::recordPath($server)), 'Failed install has no success record');
$result = $installer->install($server,$plan);
$check($files->items['/server.jar'] === file_get_contents($jar), 'New launcher promoted');
$check($files->items['/'.$result['backup'].'/previous/server.jar'] === 'old jar', 'Previous launcher recoverable');
$check($files->items['/world/level.dat'] === 'world data' && $files->items['/mods/existing.jar'] === 'old mod', 'World and mods preserved');
$check($server->startup === SoftwareInstaller::STARTUP && $server->image === 'ghcr.io/pterodactyl/yolks:java_21' && $server->status === null, 'Correct Java, startup and access restored');
$check(json_decode(file_get_contents(SoftwareInstaller::recordPath($server)),true)['profile']['software'] === 'paper', 'Installed software recorded for dashboard and catalogs');
$reject(fn () => SoftwareInstaller::image($server,25),422);
// Remove only the newly created private fixture directory.
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($storage,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST);
foreach ($iterator as $file) $file->isDir() ? rmdir($file->getPathname()) : unlink($file->getPathname());
rmdir($storage);
echo $checks." software installation and archive checks passed.\n";
