<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Pterodactyl\Models\{Server,User};
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\VinusSoftware;

class BlueMapController extends Controller
{
    public function __construct(private BlueMapInstaller $installer,private BlueMapAssets $assets) {}
    private function access(Request $request,Server $server,bool $write=false): void
    {
        foreach($write?['file.read','file.read-content','file.create','file.update','file.delete']:['file.read','file.read-content'] as $permission)
            abort_unless($request->user()->can($permission,$server),403);
    }
    public function profile(Request $request,Server $server): array
    {
        $this->access($request,$server);$target=BlueMapInstaller::target(VinusSoftware::forServer($server));
        $ready=$this->assets->ready($server);
        $core=$target?$this->assets->content($server,'/'.$target['config'].'/core.conf'):null;
        $canAuthorize=$core===BlueMapInstaller::configs(false)['core.conf'];
        return ['supported'=>(bool)$target,'ready'=>$ready,'configured'=>$core!==null,'can_authorize'=>$canAuthorize,
            'config'=>$target?$target['config']:null,'minecraft'=>VinusSoftware::forServer($server)['game_version']];
    }
    public function resources(Request $request,Server $server): array
    {
        $this->access($request,$server,true);$request->validate(['accept_resources'=>'required|accepted']);
        $lock=Cache::lock('vinuscatalog:install:'.$server->uuid,120);abort_unless($lock->get(),409,'Une installation est déjà en cours.');
        try{return $this->installer->authorizeResources($server);}finally{$lock->release();}
    }
    public function plan(Request $request,Server $server): array
    {
        $this->access($request,$server,true);$plan=$this->installer->plan($server);$token=Str::random(48);
        Cache::put('vinusbluemap:plan:'.$token,['user'=>$request->user()->id,'server'=>$server->uuid,'plan'=>$plan],600);
        return ['token'=>$token,'files'=>array_map(fn($file)=>array_intersect_key($file,array_flip(['title','version','filename','size','reuse'])),$plan['files'])];
    }
    public function install(Request $request,Server $server): array
    {
        $this->access($request,$server,true);$input=$request->validate(['token'=>'required|regex:/^[a-zA-Z0-9]{48}$/D','accept_resources'=>'required|boolean']);
        $record=Cache::get('vinusbluemap:plan:'.$input['token']);
        abort_unless($record && $record['user']===$request->user()->id && $record['server']===$server->uuid,422,'Aperçu expiré. Préparez à nouveau BlueMap.');
        $lock=Cache::lock('vinuscatalog:install:'.$server->uuid,600);abort_unless($lock->get(),409,'Une installation est déjà en cours.');
        try{
            abort_unless(Cache::pull('vinusbluemap:plan:'.$input['token'])===$record,422,'Aperçu déjà utilisé.');
            return $this->installer->install($server,$record['plan'],(bool)$input['accept_resources']);
        }finally{$lock->release();}
    }
    public function session(Request $request,Server $server): array
    {
        $this->access($request,$server);abort_unless($this->assets->ready($server),409,'Démarrez le serveur pour générer la carte BlueMap.');
        $input=$request->validate(['token'=>'nullable|regex:/^[a-zA-Z0-9]{64}$/D']);$token=$input['token']??Str::random(64);
        if(isset($input['token'])){ $existing=Cache::get('vinusbluemap:view:'.hash('sha256',$token));abort_unless($existing && $existing['user']===$request->user()->id && $existing['server']===$server->id,403); }
        Cache::put('vinusbluemap:view:'.hash('sha256',$token),['user'=>$request->user()->id,'server'=>$server->id],900);
        return ['token'=>$token,'url'=>'/api/client/extensions/vinuscatalog/map/'.$token.'/index.html','expires_in'=>900];
    }
    public function revoke(Request $request,Server $server): array
    {
        $this->access($request,$server);$input=$request->validate(['token'=>'required|regex:/^[a-zA-Z0-9]{64}$/D']);$key='vinusbluemap:view:'.hash('sha256',$input['token']);$record=Cache::get($key);
        if($record && $record['user']===$request->user()->id && $record['server']===$server->id)Cache::forget($key);
        return ['revoked'=>true];
    }
    /** This endpoint uses a short-lived, read-only map capability instead of panel cookies. */
    public function asset(Request $request,string $token,string $path)
    {
        $record=Cache::get('vinusbluemap:view:'.hash('sha256',$token));abort_unless($record,403);
        $server=Server::find($record['server']);$user=User::find($record['user']);abort_unless($server&&$user,403);
        $server->validateCurrentState();
        foreach(['file.read','file.read-content'] as $permission)abort_unless($user->can($permission,$server),403);
        $content=$this->assets->read($server,$path);
        $origin=rtrim(config('app.url'),'/');$base=$origin.'/api/client/extensions/vinuscatalog/map/'.$token.'/';
        $headers=BlueMapAssets::headers($origin,$base,$content['mime']);if($content['gzip'])$headers['Content-Encoding']='gzip';
        return response($content['body'],$content['status'],$headers);
    }
}
