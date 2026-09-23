<?php
require ($argv[1] ?? '/var/www/pterodactyl').'/vendor/autoload.php';
foreach(['InstallArchive','InstallDownload','InstallFiles','CatalogSources','ArchiveCatalog','WorldMetadata','WorldArchive','WorldInstaller'] as $class)require __DIR__.'/../app/'.$class.'.php';
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\{InstallFiles,InstallDownload,CatalogSources,ArchiveCatalog,WorldInstaller};
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Services\Servers\SuspensionService;
use GuzzleHttp\Psr7\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
$app=new Illuminate\Foundation\Application(sys_get_temp_dir());
$app->instance('validator',new Illuminate\Validation\Factory(new Illuminate\Translation\Translator(new Illuminate\Translation\ArrayLoader(),'en'),$app));
$storage=sys_get_temp_dir().'/vinus-world-install-test-'.bin2hex(random_bytes(6));$app->useStoragePath($storage);mkdir($storage.'/app/vinussoftware',0700,true);
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
$server=new #[\Pterodactyl\Models\Attributes\Identifiable('serv')] class extends Server{public function validateCurrentState(){}public function fresh($with=[]){return $this;}};
$server->uuid='world-test';$server->startup='startup';$server->image='java21';$server->disk=0;$server->status=null;
file_put_contents($storage.'/app/vinussoftware/world-test.json',json_encode(['startup'=>'startup','image'=>'java21','profile'=>['software'=>'fabric','game_version'=>'1.21.1','categories'=>['mods'=>['fabric']]]]));
$str=fn($s)=>pack('n',strlen($s)).$s;
$level=gzencode("\x0a\x00\x00\x0a".$str('Data')."\x08".$str('LevelName').$str('Imported world')."\x0a".$str('Version')."\x08".$str('Name').$str('1.21.1')."\x00\x00\x00");
$zip=new ZipArchive();$zip->open($storage.'/map.zip',ZipArchive::CREATE);$zip->addFromString('Map/level.dat',$level);$zip->addFromString('Map/region/test.mca','map chunks');$zip->close();
$properties="level-name=old-world\nserver-port=25566\n";
$files=new WorldFailureFiles($app);$files->storage=$storage;$files->items=['/map.zip'=>file_get_contents($storage.'/map.zip'),'/server.properties'=>$properties,'/old-world/level.dat'=>'old world','/mods/mod.jar'=>'existing mod','/eula.txt'=>'eula=true'];$original=$files->items;
$daemon=new WorldTestDaemon($app);$installer=new WorldInstaller($files,new ArchiveCatalog(new CatalogSources(),new InstallDownload()),$daemon,new WorldTestSuspension());
$plan=['artifact'=>['source'=>'uploaded','path'=>'/map.zip','size'=>filesize($storage.'/map.zip')],'sha512'=>hash_file('sha512',$storage.'/map.zip'),'properties_hash'=>hash('sha512',$properties)];
$daemon->state='running';$reject(fn()=>$installer->install($server,$plan),409);$check($files->items===$original,'Running server unchanged');$daemon->state='offline';
$bad=$plan;$bad['sha512']=str_repeat('0',128);$reject(fn()=>$installer->install($server,$bad),409);$check($files->items===$original,'Changed archive rejected before mutation');
$bad=$plan;$bad['properties_hash']=str_repeat('0',128);$reject(fn()=>$installer->install($server,$bad),409);$check($files->items===$original&&$server->status===null,'Changed properties rejected and server unlocked');
$files->failWrite=true;try{$installer->install($server,$plan);throw new RuntimeException('Expected write failure');}catch(RuntimeException $e){$check($e->getMessage()==='Simulated partial write','Partial-write failure surfaced');}
foreach($original as $path=>$content)$check(($files->items[$path]??null)===$content,'Rollback preserves '.$path);
$check($server->status===null,'Rollback unlocks server');
$result=$installer->install($server,$plan);
$check($files->items['/'.$result['world'].'/level.dat']===$level,'Imported world installed');
$check($files->items['/old-world/level.dat']==='old world' && $files->items['/mods/mod.jar']==='existing mod','Old world and mods untouched');
$check(str_contains($files->items['/server.properties'],'level-name='.$result['world'])&&str_contains($files->items['/server.properties'],'server-port=25566'),'World activated without changing port');
$check($files->items['/'.$result['backup'].'/previous-server.properties']===$properties,'Previous settings recoverable');
$check($server->status===null && $server->startup==='startup' && $server->image==='java21','Runtime unchanged and server unlocked');
$iterator=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($storage,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST);foreach($iterator as $entry)$entry->isDir()?rmdir($entry->getPathname()):unlink($entry->getPathname());rmdir($storage);
echo $checks." world installation checks passed.\n";
