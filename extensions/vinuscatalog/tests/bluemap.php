<?php
require ($argv[1] ?? '/var/www/pterodactyl').'/vendor/autoload.php';
foreach(['InstallArchive','InstallDownload','InstallFiles','CatalogSources','ArchiveCatalog','WorldMetadata','WorldArchive','WorldInstaller','Modrinth','ModpackBundle','BlueMapAssets','BlueMapInstaller'] as $class)require __DIR__.'/../app/'.$class.'.php';
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\{InstallFiles,InstallDownload,CatalogSources,ArchiveCatalog,WorldInstaller};
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Services\Servers\SuspensionService;
use GuzzleHttp\Psr7\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
$app=new Illuminate\Foundation\Application(sys_get_temp_dir());
$app->instance('validator',new Illuminate\Validation\Factory(new Illuminate\Translation\Translator(new Illuminate\Translation\ArrayLoader(),'en'),$app));
$storage=sys_get_temp_dir().'/vinus-bluemap-test-'.bin2hex(random_bytes(6));$app->useStoragePath($storage);mkdir($storage.'/app/vinussoftware',0700,true);
$checks=0;$check=function($ok,$message)use(&$checks){if(!$ok)throw new RuntimeException($message);$checks++;};
$reject=function($fn,$code=422)use($check){try{$fn();throw new RuntimeException('Expected rejection');}catch(HttpException $e){$check($e->getStatusCode()===$code,$e->getMessage());}};
class WorldTestFiles extends InstallFiles {
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
class WorldTestDaemon extends DaemonServerRepository {
    public string $state = 'offline';
    public function setServer(Server $server): \Pterodactyl\Repositories\Wings\DaemonRepository { return $this; }
    public function getDetails(): array { return ['state'=>$this->state]; }
}
class WorldTestSuspension extends SuspensionService {
    public function __construct() {}
    public function toggle(Server $server,string $action=self::ACTION_SUSPEND): void { $server->status=$action===self::ACTION_SUSPEND?Server::STATUS_SUSPENDED:null; }
}

class WorldFailureFiles extends WorldTestFiles {
    public bool $failWrite=false;
    public function getContent(string $path,?int $notLargerThan=null): string { return $this->items[$path]; }
    public function download(string $path,string $local,int $size): void { file_put_contents($local,$this->items[$path]); }
    public function putContent(string $path,string $body): \Psr\Http\Message\ResponseInterface {
        if($path==='/server.properties' && $this->failWrite){$this->failWrite=false;$this->items[$path]='partial write';throw new RuntimeException('Simulated partial write');}
        return parent::putContent($path,$body);
    }
}
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\{BlueMapAssets,BlueMapInstaller,Modrinth};
class BlueMapTestFiles extends WorldFailureFiles {
    public bool $failJar=false; public bool $failCore=false;
    public function putContent(string $path,string $body): \Psr\Http\Message\ResponseInterface { if($this->failCore && $path==='/config/bluemap/core.conf'){$this->failCore=false;$this->items[$path]='partial';throw new RuntimeException('Simulated consent write failure');}return parent::putContent($path,$body); }
    public function getDirectory(string $root): array { $items=parent::getDirectory($root);foreach($items as &$entry)$entry['size']=strlen($this->items[rtrim($root,'/').'/'.$entry['name']]??'');return $items; }
    public function renameFiles(?string $root,array $moves): \Psr\Http\Message\ResponseInterface { foreach($moves as $move)if($this->failJar && str_ends_with($move['to'],'bluemap.jar')){$this->failJar=false;throw new RuntimeException('Simulated promotion failure');}return parent::renameFiles($root,$moves); }
}
class BlueMapTestDownload extends InstallDownload {
    public string $jar;
    public function fetch(string $url,string $destination,int $size,?string $sha512=null): void {copy($this->jar,$destination);}
}
$server=new #[\Pterodactyl\Models\Attributes\Identifiable('serv')] class extends Server{public function validateCurrentState(){}public function fresh($with=[]){return $this;}};
$server->uuid='bluemap-test';$server->startup='startup';$server->image='ghcr.io/pterodactyl/yolks:java_21';$server->disk=0;$server->status=null;
$profile=['software'=>'fabric','game_version'=>'1.21.1','categories'=>['mods'=>['fabric']]];
file_put_contents($storage.'/app/vinussoftware/bluemap-test.json',json_encode(['startup'=>'startup','image'=>$server->image,'profile'=>$profile]));
$files=new BlueMapTestFiles($app);$files->storage=$storage;$files->items=['/server.properties'=>'level-name=world','/world/level.dat'=>'world','/mods/other.jar'=>'existing'];$original=$files->items;
$zip=new ZipArchive();$zip->open($storage.'/bluemap.jar',ZipArchive::CREATE);$zip->addFromString('fabric.mod.json',json_encode(['depends'=>['fabricloader'=>'>=0.15.11','fabric-api-base'=>'*']]));$zip->addFromString('Main.class',hex2bin('cafebabe00000041'));$zip->close();
$download=new BlueMapTestDownload();$download->jar=$storage.'/bluemap.jar';$daemon=new WorldTestDaemon($app);$assets=new BlueMapAssets($files);
$installer=new BlueMapInstaller($files,new Modrinth(),$download,$daemon,new WorldTestSuspension(),$assets);
$plan=['profile'=>$profile,'image'=>$server->image,'target'=>BlueMapInstaller::target($profile),'files'=>[['project_id'=>BlueMapInstaller::PROJECT,'filename'=>'bluemap.jar','url'=>'https://cdn.modrinth.com/test','size'=>filesize($download->jar),'sha512'=>hash_file('sha512',$download->jar)]]];
$check(BlueMapInstaller::target(['game_version'=>'1.21.1','categories'=>[]])===null,'Vanilla unsupported');
$check(BlueMapInstaller::target(['game_version'=>'1.21.1','categories'=>['plugins'=>['velocity']]])===null,'Proxy unsupported');
$check(BlueMapInstaller::target(['game_version'=>'1.21.1','categories'=>['plugins'=>['paper']]])['config']==='plugins/BlueMap','Paper config location');
$check(str_contains(BlueMapInstaller::configs(false)['core.conf'],'accept-download: false'),'No implicit license acceptance');
$check(str_contains(BlueMapInstaller::configs(true)['webserver.conf'],'enabled: false'),'No public listener');
$reject(fn()=>BlueMapInstaller::checkJava($download->jar,'image:java_17'));
$reject(fn()=>BlueMapInstaller::checkJava($download->jar,'image:latest'));
$daemon->state='running';$reject(fn()=>$installer->install($server,$plan,false),409);$check($files->items===$original,'Running server unchanged');$daemon->state='offline';
$files->failJar=true;try{$installer->install($server,$plan,false);throw new RuntimeException('Expected failure');}catch(RuntimeException $e){$check($e->getMessage()==='Simulated promotion failure','Promotion error surfaced');}
foreach($original as $path=>$body)$check(($files->items[$path]??null)===$body,'Existing files preserved');
$check(!isset($files->items['/config/bluemap/core.conf'])&&$server->status===null,'Configuration rollback and access restored');
$result=$installer->install($server,$plan,false);
$check(isset($files->items['/mods/bluemap.jar']),'BlueMap installed');
$check(str_contains($files->items['/config/bluemap/core.conf'],'accept-download: false'),'Consent persisted false');
$check($files->items['/world/level.dat']==='world'&&$files->items['/mods/other.jar']==='existing','World and existing mod preserved');
$check($server->status===null,'Successful install unlocks access');
$reject(fn()=>$installer->install($server,$plan,false),409);
foreach(['../server.properties','maps/../../server.properties','/index.html','maps/./x.json','.env','maps/.hidden.json','index.php','maps/x%2f..%2f.json'] as $path)$reject(fn()=>BlueMapAssets::mime($path),404);
$check(BlueMapAssets::mime('maps/world/tiles/0/x-1/z2.prbm')==='application/octet-stream','Tile path supported');
$headers=BlueMapAssets::headers('https://panel.example','https://panel.example/map/token/','text/html');
$check(str_contains($headers['Content-Security-Policy'],'sandbox allow-scripts')&&!str_contains($headers['Content-Security-Policy'],'allow-same-origin'),'Opaque sandbox on direct navigation');
$check($headers['Access-Control-Allow-Origin']==='*'&&!isset($headers['Access-Control-Allow-Credentials']),'Map assets do not authorize credentials');
$check(str_contains($headers['Content-Security-Policy'],'connect-src https://panel.example/map/token/;'),'Connections limited to map capability');
$scriptPolicy=explode(';',explode('script-src ',$headers['Content-Security-Policy'])[1])[0];
$check(str_contains($scriptPolicy,"'unsafe-eval'")&&!str_contains($scriptPolicy,"'unsafe-inline'")&&!str_contains($scriptPolicy,'*'),'BlueMap translation compilation allowed without arbitrary inline scripts or script hosts');
$files->items['/bluemap/web/index.html']='<html>map</html>';
$files->items['/bluemap/web/maps/world/textures.json.gz']=gzencode('{}');
$asset=$assets->read($server,'maps/world/textures.json');$check($asset['gzip']&&gzdecode($asset['body'])==='{}','Compressed texture fallback');
$check($assets->read($server,'maps/world/tiles/0/x1/z1.prbm')['status']===204,'Missing tile is empty');
// Player positions and heads written by BlueMap when live-player-markers is on.
$files->items['/bluemap/web/maps/world/live/players.json.gz']=gzencode('{"players":[]}');
$live=$assets->read($server,'maps/world/live/players.json');$check($live['status']===200&&$live['gzip']&&gzdecode($live['body'])==='{"players":[]}','Compressed live players file is served');
$check(BlueMapAssets::mime('maps/world/live/players.json')==='application/json','Live players path supported');
$headPath='maps/world/assets/playerheads/00000000-0000-4000-8000-000000000001.png';
$files->items['/bluemap/web/'.$headPath]="\x89PNG\r\n\x1a\n";
$head=$assets->read($server,$headPath);$check($head['status']===200&&$head['mime']==='image/png'&&!$head['gzip'],'Player head image is served');
// Without live-player-markers BlueMap lists no players and downloads no skins: no heads on the map.
$plugin=BlueMapInstaller::configs(false)['plugin.conf'];
$check(preg_match('/^live-player-markers: true$/m',$plugin)===1,'Players are tracked so heads and positions exist');
$check(preg_match('/^write-players-interval: [1-9][0-9]*$/m',$plugin)===1,'Players are written to the map files read by the viewer');
$check($assets->read($server,'missing.js')['status']===404,'Missing script is not an empty tile');

$check(BlueMapAssets::mime('lang/fr.conf')==='text/plain; charset=utf-8','BlueMap language files supported');
$reject(fn()=>BlueMapAssets::mime('config/core.conf'),404);
$check(!$assets->ready($server),'Index alone does not imply a ready map');
$files->items['/bluemap/web/settings.json']='{"maps":[]}';$check(!$assets->ready($server),'Empty generated maps show preparing state');
$files->items['/bluemap/web/settings.json']='{"maps":["world"]}';$check(!$assets->ready($server),'Missing map metadata is not ready');
$files->items['/bluemap/web/maps/world/settings.json']='{}';$check($assets->ready($server),'Map metadata and compressed textures are ready');
$files->items['/bluemap/web/index.html']='<html><head><title>Map</title></head><body></body></html>';
$check(str_contains($assets->read($server,'index.html')['body'],'<script>'.BlueMapAssets::bootstrap().'</script>'),'Sandbox compatibility bootstrap inserted');
$check(str_contains($headers['Content-Security-Policy'],"'sha256-".base64_encode(hash('sha256',BlueMapAssets::bootstrap(),true))."'"),'Only exact bootstrap hash allowed');
$before=$files->items['/config/bluemap/core.conf'];$daemon->state='running';$reject(fn()=>$installer->authorizeResources($server),409);$check($files->items['/config/bluemap/core.conf']===$before,'Running consent attempt changes no config');$daemon->state='offline';
$files->failCore=true;try{$installer->authorizeResources($server);throw new RuntimeException('Expected consent failure');}catch(RuntimeException $e){$check($e->getMessage()==='Simulated consent write failure','Consent write failure surfaced');}
$check($files->items['/config/bluemap/core.conf']===$before&&$server->status===null,'Consent partial-write rollback restores configuration and access');
$authorization=$installer->authorizeResources($server);
$check($files->items['/config/bluemap/core.conf']===BlueMapInstaller::configs(true)['core.conf'],'Explicit consent activates resources in isolated fixture');
$check($files->items['/'.$authorization['backup'].'/previous-core.conf']===$before,'Previous consent config is recoverable');
$files->items['/config/bluemap/core.conf']='custom configuration';$reject(fn()=>$installer->authorizeResources($server),409);
$check($files->items['/config/bluemap/core.conf']==='custom configuration','Custom HOCON not overwritten');
require ($argv[2]??($argv[1]??'/var/www/pterodactyl')).'/app/Http/Middleware/VinusMapCors.php';
foreach(['/api/client/servers/test/files','/api/client/extensions/vinuscatalog/servers/test/bluemap/session','/api/client/extensions/vinuscatalog/map/short/index.html','/admin','/auth/login'] as $path)$check(!\Pterodactyl\Http\Middleware\VinusMapCors::isMapAsset(Illuminate\Http\Request::create($path)),'Panel CORS unchanged for '.$path);
$assetPath='/api/client/extensions/vinuscatalog/map/'.str_repeat('a',64).'/assets/main.js';
$check(\Pterodactyl\Http\Middleware\VinusMapCors::isMapAsset(Illuminate\Http\Request::create($assetPath)),'Capability GET has isolated CORS');
$check(!\Pterodactyl\Http\Middleware\VinusMapCors::isMapAsset(Illuminate\Http\Request::create($assetPath,'POST')),'Capability policy does not allow mutation methods');

$iterator=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($storage,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST);foreach($iterator as $entry)$entry->isDir()?rmdir($entry->getPathname()):unlink($entry->getPathname());rmdir($storage);
echo $checks." BlueMap installation and asset checks passed.\n";
