<?php
// Isolated transaction tests: no live Wings or database mutation.
require ($argv[1] ?? '/var/www/pterodactyl').'/vendor/autoload.php';
foreach (['Detection','ServerSoftware','InstallArchive','InstallDownload','InstallFiles','SoftwareInstaller','ModpackManifest','ModpackBundle','ModpackInstaller','CatalogSources','ArchiveCatalog','CurseForgeModpack'] as $class) require __DIR__.'/../app/'.$class.'.php';
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\{InstallDownload, InstallFiles, ModpackBundle, ModpackInstaller, SoftwareInstaller};
use Pterodactyl\Models\{Server, Egg, Allocation};
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Services\Servers\{StartupModificationService, SuspensionService};
use GuzzleHttp\Psr7\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
$app = new Illuminate\Foundation\Application(sys_get_temp_dir());
$app->instance('validator', new Illuminate\Validation\Factory(new Illuminate\Translation\Translator(new Illuminate\Translation\ArrayLoader(), 'en'), $app));
$storage = sys_get_temp_dir().'/vinus-modpack-test-'.bin2hex(random_bytes(6)); $app->useStoragePath($storage); mkdir($storage,0700,true);
$checks = 0;
$check = function ($ok, $message) use (&$checks) { if (!$ok) throw new RuntimeException($message); $checks++; };
$reject = function ($fn, $code = 422) use ($check) { try { $fn(); throw new RuntimeException('Expected rejection'); } catch (HttpException $e) { $check($e->getStatusCode() === $code, $e->getMessage()); } };
foreach (['../escape','/outside','server.jar','libraries/malicious.jar','eula.txt','vinus-old/previous/x','Vinus-test/x','bundle.zip'] as $path) $check(!ModpackBundle::packPath($path), 'Reserved/path traversal rejected');
$check(ModpackBundle::packPath('mods/Example mod.jar'), 'Valid pack file');
$props = ModpackBundle::properties("motd=Keep me\nserver-port:1234\\\n123\nquery.port = 4321\nserver-ip=127.0.0.1\n",25577);
$check(str_contains($props,'motd=Keep me') && substr_count($props,'server-port') === 1 && str_contains($props,'server-port=25577') && str_contains($props,'query.port=25577') && !str_contains($props,'123'), 'Allocation is authoritative and continuations removed');
$zip = function (array $entries, string $name) use ($storage) { $path = $storage.'/'.$name; $z = new ZipArchive(); $z->open($path, ZipArchive::CREATE); foreach ($entries as $p => $body) $z->addFromString($p,$body); $z->close(); return $path; };
$jar = $zip(['META-INF/MANIFEST.MF' => 'Main-Class: Test'], 'runtime.jar');
$mod = $zip(['fabric.mod.json' => json_encode(['id'=>'testmod','depends'=>['fabricloader'=>'>=0.16.0']])], 'mod.jar');
$check(ModpackBundle::incompatibleMinimum('>=0.15.11','0.14.22'),'Old loader rejected');
$check(!ModpackBundle::incompatibleMinimum('>=0.15.11','0.16.14'),'New enough loader accepted');
$check(!ModpackBundle::incompatibleMinimum(['>=0.16.0','>=0.14.0'],'0.15.0'),'Alternative ranges are OR');
$check(!ModpackBundle::incompatibleMinimum(['>=0.16.0','*'],'0.15.0'),'Unknown alternative is not falsely rejected');
$reject(fn()=>ModpackBundle::checkFabric($mod,'0.14.22','mod.jar'));
$file = ['path' => 'mods/new.jar','fileSize' => filesize($mod),'hashes' => ['sha512' => hash_file('sha512',$mod),'sha1' => hash_file('sha1',$mod)],'downloads' => ['https://cdn.modrinth.com/mod.jar']];
$manifest = ['formatVersion' => 1,'game' => 'minecraft','dependencies' => ['minecraft' => '1.20.1','fabric-loader' => '0.16.14'],'files' => [$file]];
$pack = $zip(['modrinth.index.json' => json_encode($manifest),'overrides/config/test.json' => 'common','server-overrides/config/test.json' => 'server'], 'pack.mrpack');
$filesToZip = []; ModpackBundle::add($filesToZip,'config',$mod); $reject(fn () => ModpackBundle::add($filesToZip,'config/test.json',$mod));
$server = new #[\Pterodactyl\Models\Attributes\Identifiable('serv')] class extends Server { public function validateCurrentState() {} public function fresh($with = []) { return $this; } };
$server->uuid = 'modpack-test'; $server->status = null; $server->startup = 'old startup'; $server->image = 'ghcr.io/pterodactyl/yolks:java_17'; $server->disk = 0;
$server->setRelation('egg',new Egg(['docker_images' => ['Java 17' => $server->image]])); $allocation = new Allocation(); $allocation->port = 25577; $server->setRelation('allocation',$allocation);
$items = ['/server.jar' => 'old runtime','/mods/old.jar' => 'old mod','/world/level.dat' => 'old world','/server.properties' => 'old properties','/eula.txt' => 'eula=true','/vinus-earlier/previous/server.jar' => 'earlier backup'];
$original = $items; $failPromotion = false; $state = 'offline'; $badHash = false;
class PackTestDownload extends InstallDownload {
    public array $fixtures; public bool $badHash = false;
    public function fetch(string $url, string $to, int $size, ?string $hash = null): void { if ($this->badHash) abort(422,'Hash mismatch'); copy($this->fixtures[$url],$to); }
}
class PackTestFiles extends InstallFiles {
    public array $items; public bool $failPromotion = false; public string $storage;
    public function setServer(Server $server): \Pterodactyl\Repositories\Wings\DaemonRepository { return $this; }
    public function createDirectory(string $name, string $path): \Psr\Http\Message\ResponseInterface { return new Response(204); }
    public function putContent(string $path, string $body): \Psr\Http\Message\ResponseInterface { $this->items[$path]=$body; return new Response(204); }
    public function upload(string $path, string $local): void { $this->items[$path]=file_get_contents($local); }
    public function decompressFile(?string $root, string $name): \Psr\Http\Message\ResponseInterface { $temp=$this->storage.'/staged.zip';file_put_contents($temp,$this->items[$root.'/'.$name]);$z=new ZipArchive();$z->open($temp);for($i=0;$i<$z->numFiles;$i++)$this->items[$root.'/'.$z->getNameIndex($i)]=$z->getFromIndex($i);$z->close();return new Response(204); }
    public function deleteFiles(?string $root, array $names): \Psr\Http\Message\ResponseInterface { foreach($names as $name)unset($this->items[$root.'/'.$name]);return new Response(204); }
    public function getDirectory(string $root): array { $prefix=rtrim($root,'/').'/';$result=[];foreach($this->items as $path=>$body)if(str_starts_with($path,$prefix)){$rest=substr($path,strlen($prefix));$name=explode('/',$rest)[0];$result[$name]=['name'=>$name,'file'=>!str_contains($rest,'/'),'symlink'=>false];}return array_values($result); }
    public function renameFiles(?string $root, array $moves): \Psr\Http\Message\ResponseInterface { foreach($moves as $move){if($this->failPromotion && $move['to']==='server.jar'){$this->failPromotion=false;throw new RuntimeException('Simulated promotion failure');}$from='/'.$move['from'];$to='/'.$move['to'];$matched=false;foreach(array_keys($this->items) as $path)if($path===$from || str_starts_with($path,$from.'/')){$target=$to.substr($path,strlen($from));if(isset($this->items[$target]))throw new RuntimeException('Destination exists');$this->items[$target]=$this->items[$path];unset($this->items[$path]);$matched=true;}if(!$matched)throw new RuntimeException('Source missing');}return new Response(204); }
}
class PackTestDaemon extends DaemonServerRepository {
    public string $state = 'offline';
    public function setServer(Server $server): \Pterodactyl\Repositories\Wings\DaemonRepository { return $this; }
    public function getDetails(): array { return ['state'=>$this->state]; }
}
class PackTestStartup extends StartupModificationService {
    public function __construct() {}
    public function handle(Server $server,array $data): Server { $server->startup=$data['startup'];$server->image=$data['docker_image'];return $server; }
}
class PackTestSuspension extends SuspensionService {
    public function __construct() {}
    public function toggle(Server $server,string $action=self::ACTION_SUSPEND): void { $server->status=$action===self::ACTION_SUSPEND?Server::STATUS_SUSPENDED:null; }
}
$download=new PackTestDownload();$download->fixtures=['https://cdn.modrinth.com/pack.mrpack'=>$pack,'https://cdn.modrinth.com/mod.jar'=>$mod,'https://example.com/runtime.jar'=>$jar];
$files=new PackTestFiles($app);$files->items=$items;$files->storage=$storage;
$daemon=new PackTestDaemon($app);$startup=new PackTestStartup();$suspension=new PackTestSuspension();
$installer=new ModpackInstaller($download,$files,$daemon,$startup,$suspension);
$runtime=['software'=>'FABRIC','version'=>'1.20.1','java'=>17,'build'=>123,'label'=>'0.16.14','steps'=>[['type'=>'download','file'=>'server.jar','url'=>'https://example.com/runtime.jar','size'=>filesize($jar)]]];
$plan=['artifact'=>['url'=>'https://cdn.modrinth.com/pack.mrpack','size'=>filesize($pack),'sha512'=>hash_file('sha512',$pack)],'runtime'=>$runtime,'project'=>'testpack','version'=>'testvers','title'=>'Fixture pack','release'=>'1.0'];
$daemon->state='running';$reject(fn()=>$installer->install($server,$plan),409);$check($files->items===$original,'Running server unchanged');$daemon->state='offline';
$download->badHash=true;$reject(fn()=>$installer->install($server,$plan));$check($files->items===$original && $server->status===null,'Failed download changes no game files');$download->badHash=false;
$reject(fn()=>$installer->install($server,$plan,['mods/not-in-pack.jar']));
$files->failPromotion=true;try{$installer->install($server,$plan);throw new RuntimeException('Expected failure');}catch(RuntimeException $e){$check($e->getMessage()==='Simulated promotion failure','Promotion failure surfaced');}
foreach($original as $path=>$content)$check(($files->items[$path]??null)===$content,'Rollback restores '.$path);
$check($server->startup==='old startup' && $server->status===null,'Rollback restores runtime/access');
$result=$installer->install($server,$plan);$backup='/'.$result['backup'].'/previous';
$check($files->items['/mods/new.jar']===file_get_contents($mod) && !isset($files->items['/mods/old.jar']) && !isset($files->items['/world/level.dat']),'Pack replaces old mods and world');
$check($files->items[$backup.'/mods/old.jar']==='old mod' && $files->items[$backup.'/world/level.dat']==='old world','Old game data recoverable');
$check($files->items['/config/test.json']==='server','Server overrides applied');
$check($files->items['/eula.txt']==='eula=true' && $files->items['/vinus-earlier/previous/server.jar']==='earlier backup','Existing EULA and older recovery directories preserved');
$check(str_contains($files->items['/server.properties'],'server-port=25577'),'Correct allocated port installed');
$check($server->status===null && $server->startup===SoftwareInstaller::STARTUP,'Installed server stays accessible with correct startup');
$record=json_decode(file_get_contents(SoftwareInstaller::recordPath($server)),true);$check($record['profile']['software']==='fabric' && $record['modpack']['project']==='testpack','Software and modpack recorded');

// Exercise the same replacement transaction with a published CurseForge server ZIP.
$app->instance('config',new Illuminate\Config\Repository(['vinuscatalog'=>['curseforge_key'=>'fixture-key-not-a-secret']]));
$cfRuntime=['minecraft'=>'1.20.1','software'=>'FABRIC','loader_version'=>'0.16.14'];
$cfPack=$zip(['Server Pack/mods/new.jar'=>file_get_contents($mod),'Server Pack/config/server.json'=>'server config','Server Pack/run.sh'=>'never execute','Server Pack/eula.txt'=>'eula=true','Server Pack/server.jar'=>'untrusted launcher','Server Pack/libraries/old.jar'=>'old lib'],'serverpack.zip');
$parsed=\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CurseForgeModpack::read($cfPack,$cfRuntime);
$check(array_column($parsed['overrides'],'path')===['mods/new.jar','config/server.json'],'Server pack wrapper normalized; launcher and EULA excluded');
$reject(fn()=>\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CurseForgeModpack::read($zip(['manifest.json'=>'{}','setup.sh'=>'download all mods'],'script-only.zip'),$cfRuntime));
$reject(fn()=>\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CurseForgeModpack::read($zip(['A/mods/a.jar'=>'a','B/mods/b.jar'=>'b'],'multiple-roots.zip'),$cfRuntime));
$reject(fn()=>\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CurseForgeModpack::read($zip(['../mods/escape.jar'=>'bad'],'traversal.zip'),$cfRuntime));
\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CurseForgeModpack::related(['id'=>11,'modId'=>123,'serverPackFileId'=>22],['id'=>22,'modId'=>123,'isServerPack'=>true,'parentProjectFileId'=>11]);$check(true,'Published server pack relation accepted');
$reject(fn()=>\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CurseForgeModpack::related(['id'=>11,'modId'=>123,'serverPackFileId'=>22],['id'=>22,'modId'=>124,'isServerPack'=>true]));
$reject(fn()=>\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CurseForgeModpack::related(['id'=>11,'modId'=>123,'serverPackFileId'=>22],['id'=>22,'modId'=>123,'isServerPack'=>true,'parentProjectFileId'=>12]));
$cfPlan=array_merge($plan,['source'=>'curseforge','pack_runtime'=>$cfRuntime,'artifact'=>['source'=>'curseforge','url'=>'https://edge.forgecdn.net/files/123/pack.zip','size'=>filesize($cfPack),'sha1'=>hash_file('sha1',$cfPack),'sha512'=>hash_file('sha512',$cfPack)]]);
$download->fixtures['https://edge.forgecdn.net/files/123/pack.zip']=$cfPack;$files->items=$original;$server->startup='old startup';
$bad=$cfPlan;$bad['artifact']['sha1']=str_repeat('0',40);$reject(fn()=>$installer->install($server,$bad));$check($files->items===$original,'CurseForge integrity failure preserves active files');
$cfResult=$installer->install($server,$cfPlan);
$check($files->items['/mods/new.jar']===file_get_contents($mod)&&$files->items['/config/server.json']==='server config','CurseForge server files installed');
$check($files->items['/server.jar']===file_get_contents($jar)&&!isset($files->items['/run.sh'])&&!isset($files->items['/libraries/old.jar']),'Trusted exact runtime used; provider launcher ignored');
$record=json_decode(file_get_contents(SoftwareInstaller::recordPath($server)),true);$check($record['modpack']['source']==='curseforge','Actual source recorded');
$check($files->items['/'.$cfResult['backup'].'/previous/world/level.dat']==='old world'&&$files->items['/eula.txt']==='eula=true','CurseForge replacement retains old world and existing EULA');

$iterator=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($storage,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST);foreach($iterator as $entry)$entry->isDir()?rmdir($entry->getPathname()):unlink($entry->getPathname());rmdir($storage);
echo $checks." modpack installation checks passed.\n";
