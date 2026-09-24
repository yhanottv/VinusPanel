<?php
namespace Illuminate\Support\Facades { class Cache { public static bool $available=true; public static function lock(...$args){return new class {function get(){return Cache::$available;}function release(){}};} } }
namespace Pterodactyl\Models { class Server { public int $id=1;public $status=null;public $installed_at='2026-01-01';public bool $changed=true;function wasChanged($field){return $this->changed;}public string $uuid='00000000-0000-4000-8000-000000000001'; public string $image='ghcr.io/pterodactyl/yolks:java_21'; public array $profile=['software'=>'paper','game_version'=>'1.21.1','categories'=>['plugins'=>['paper','spigot','bukkit']]];function fresh(){return $this;}function validateCurrentState(){} } }
namespace Pterodactyl\Services { class VinusSoftware {static function forServer($server){return $server->profile;} } }
namespace Pterodactyl\Repositories\Wings { class DaemonServerRepository {public string $state='offline';public array $states=[];function setServer($s){return $this;}function getDetails(){return ['state'=>$this->states?array_shift($this->states):$this->state];}} }
namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog {
    class InstallFiles {
        public array $entries=['/'=>[]]; public array $contents=[]; public array $renames=[]; public bool $corrupt=false;
        function setServer($s){return $this;}function getDirectory($path){return $this->entries[$path]??[];}
        function createDirectory($name,$path){$this->entries[rtrim($path,'/').'/'.$name]=[];}
        function upload($path,$local){$this->contents[$path]=$this->corrupt?'broken':file_get_contents($local);}
        function getContent($path,$limit){return $this->contents[$path];}
        function renameFiles($path,$pairs){$this->renames[]=$pairs;foreach($pairs as $p)$this->contents[$path.'/'.$p['to']]=$this->contents[$path.'/'.$p['from']];}
        function deleteFiles($path,$names){foreach($names as $name)unset($this->contents[$path.'/'.$name]);}
    }
}
namespace Pterodactyl\Events\Server { class Updated {function __construct(public $server){}} }
namespace Pterodactyl\Jobs { class InstallVinusPlayerCompanion {public static array $calls=[];static function dispatch($id){self::$calls[]=$id;return new self();}function delay($seconds){if($seconds<1)throw new \RuntimeException('Missing delay');return $this;}function afterCommit(){return $this;}} }
namespace {
    function storage_path($path){return sys_get_temp_dir().'/vinus-unit-no-record/'.$path;}
    function abort_unless($value,$code=500,$message=''){if(!$value)throw new \RuntimeException($message,$code);}
    require __DIR__.'/../extensions/vinuscatalog/app/PlayerCompanion.php';
    use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\{PlayerCompanion,InstallFiles};
    use Pterodactyl\Models\Server;
    use Pterodactyl\Repositories\Wings\DaemonServerRepository;
    $checks=0;function check($value){global $checks;if(!$value)throw new \RuntimeException('Failed check '.($checks+1));$checks++;}
    function reject($fn,$code){try{$fn();}catch(\RuntimeException $e){check($e->getCode()===$code);return;}throw new \RuntimeException('Expected rejection');}
    $artifacts=json_decode(file_get_contents(__DIR__.'/../extensions/vinuscatalog/app/player-artifacts/manifest.json'),true)['artifacts'];
    $server=new Server();$files=new InstallFiles();$daemon=new DaemonServerRepository();$service=new PlayerCompanion($files,$daemon);
    check(PlayerCompanion::select($server->profile,$artifacts)['loader']==='bukkit');
    check(PlayerCompanion::select(['proxy'=>true]+$server->profile,$artifacts)===null);
    check(PlayerCompanion::select(['software'=>'vanilla','categories'=>[],'game_version'=>'1.21.1'],$artifacts)===null);
    check(PlayerCompanion::select(['game_version'=>'99.9']+$server->profile,$artifacts)===null);
    check(PlayerCompanion::select(['game_version'=>null]+$server->profile,$artifacts)===null);
    check(PlayerCompanion::select(['categories'=>['plugins'=>['folia']],'game_version'=>'1.21.1'],$artifacts)===null);
    check(PlayerCompanion::select(['categories'=>['plugins'=>['bukkit'],'mods'=>['neoforge']],'game_version'=>'1.21.1'],$artifacts)['loader']==='bukkit');
    check(PlayerCompanion::select(['categories'=>['mods'=>['fabric']],'game_version'=>'1.21.1'],$artifacts)['loader']==='fabric');
    $original=$server->profile;
    $server->profile=['software'=>'fabric','game_version'=>'1.21.1','categories'=>['mods'=>['fabric']],'loader_version'=>'0.16.14'];
    check($service->availability($server)['supported']);
    $server->profile['loader_version']='0.1.0';check($service->availability($server)['reason']==='loader');
    $server->profile['loader_version']=null;check(!$service->availability($server)['supported']);
    $server->profile=$original;
    $server->image='java_17';check(!$service->availability($server)['supported']);
    $server->image='custom:latest';check(!$service->availability($server)['supported']);$server->image='java_8';check(!$service->availability($server)['supported']);$server->image='java_21';
    $daemon->state='running';reject(fn()=>$service->install($server),409);check(!$files->contents);
    $daemon->state='offline';$files->entries['/']=[['name'=>'plugins','file'=>false,'symlink'=>true]];reject(fn()=>$service->install($server),409);
    $files->entries['/']=[['name'=>'mods','file'=>false,'symlink'=>false]];$files->entries['/mods']=[['name'=>'vinus-players-old.jar','file'=>true,'symlink'=>false]];
    check($service->install($server)['status']==='existing');check(!$files->renames);
    $files->entries=['/'=>[]];$files->corrupt=true;reject(fn()=>$service->install($server),502);check(!$files->contents);check(!$files->renames);
    $files->corrupt=false;$daemon->states=['offline','running'];reject(fn()=>$service->install($server),409);check(!$files->contents);check(!$files->renames);
    check($service->install($server)['status']==='installed');check(count($files->renames)===1);check(count($files->contents)===1);
    \Illuminate\Support\Facades\Cache::$available=false;reject(fn()=>$service->install($server),409);
    foreach($artifacts as $a){check(hash_equals($a['sha256'],hash_file('sha256',__DIR__.'/../extensions/vinuscatalog/app/player-artifacts/'.$a['file'])));}
    require __DIR__.'/../overlay/app/Listeners/VinusPlayerCompanion.php';
    $listener=new \Pterodactyl\Listeners\VinusPlayerCompanion();
    $event=new \Pterodactyl\Events\Server\Updated($server);
    $server->changed=false;$listener->handle($event);check(!\Pterodactyl\Jobs\InstallVinusPlayerCompanion::$calls);
    $server->changed=true;$server->status='install_failed';$listener->handle($event);check(!\Pterodactyl\Jobs\InstallVinusPlayerCompanion::$calls);
    $server->status=null;$server->installed_at=null;$listener->handle($event);check(!\Pterodactyl\Jobs\InstallVinusPlayerCompanion::$calls);
    $server->installed_at='2026-01-01';$listener->handle($event);check(\Pterodactyl\Jobs\InstallVinusPlayerCompanion::$calls===[1]);
    echo "Player companion: $checks checks passed.\n";
}
