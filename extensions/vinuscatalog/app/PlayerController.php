<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonCommandRepository;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;

final class PlayerController extends Controller
{
    public function __construct(private PlayerFiles $files,private DaemonCommandRepository $commands,private DaemonServerRepository $daemon) {}
    private function access(Request $request,Server $server,bool $write=false): void
    {
        foreach($write?['file.read-content','control.console']:['file.read-content'] as $permission)abort_unless($request->user()->can($permission,$server),403);
        $server->validateCurrentState();$this->files->setServer($server);
    }
    private function roster(Server $server,?array $bridge): array
    {
        $players=Cache::remember('vinusplayers:roster:'.$server->uuid,3,fn()=>$this->files->roster());
        if($bridge){
            foreach($players as &$player)$player['online']=false;unset($player);
            foreach($bridge['players']??[] as $player){
                if(!PlayerFiles::uuid($player['uuid']??null)||!is_string($player['name']??null))continue;
                $players[$player['uuid']]=['uuid'=>$player['uuid'],'name'=>mb_substr($player['name'],0,40),'online'=>true,
                    'operator'=>(bool)($player['operator']??false),'whitelisted'=>(bool)($player['whitelisted']??false),'banned'=>(bool)($player['banned']??false)];
            }
        }
        uasort($players,fn($a,$b)=>(int)$b['online']<=>(int)$a['online']?:strnatcasecmp($a['name'],$b['name']));return $players;
    }
    public function index(Request $request,Server $server): array
    {
        $this->access($request,$server);$input=$request->validate(['selected'=>'nullable|uuid']);
        $bridge=$this->files->bridge();$players=$this->roster($server,$bridge);$detail=null;
        if(!$bridge&&Cache::remember('vinusplayers:state:'.$server->uuid,3,fn()=>$this->daemon->setServer($server)->getDetails()['state']??'')!=='running'){
            foreach($players as &$entry)$entry['online']=false;unset($entry);
        }
        if(isset($input['selected'])){
            $uuid=strtolower($input['selected']);abort_unless(isset($players[$uuid]),404,'Joueur introuvable sur ce serveur.');
            $snapshot=$this->files->json('/.vinus/players/'.$uuid.'.json',1048576);
            if($snapshot&&($snapshot['uuid']??null)===$uuid&&($snapshot['protocol']??null)===1){
                $live=$bridge&&in_array($uuid,array_column($bridge['players']??[],'uuid'),true)&&abs(time()-(int)($snapshot['updated_at']??0))<=15;
                $detail=PlayerNbt::snapshot($snapshot);
                $detail['source']=$live?'live':'snapshot';
            }else{
                $world=$this->files->world();$bytes=$this->files->optional($world.'/playerdata/'.$uuid.'.dat',4194304);
                if($bytes!==null)$detail=PlayerNbt::profile(PlayerNbt::read($bytes))+['source'=>'save','updated_at'=>null,'skin'=>null];
            }
            $detail=array_merge($detail??(PlayerNbt::profile([])+['source'=>'unavailable','updated_at'=>null]),$players[$uuid]);
        }
        return ['players'=>array_values($players),'selected'=>$detail,'bridge'=>(bool)$bridge,'actions'=>$bridge?array_values(array_intersect($bridge['actions']??[],['heal','kill','feed','operator','whitelist','ban','gamemode','experience'])):[],
            'can_control'=>$request->user()->can('control.console',$server),'refreshed_at'=>time()];
    }
    public function companion(Request $request, Server $server): array
    {
        $this->access($request, $server);
        return app(PlayerCompanion::class)->availability($server) + ['can_install' => $request->user()->can('file.create', $server) && $request->user()->can('file.update', $server) && $request->user()->can('control.console', $server)];
    }
    public function installCompanion(Request $request, Server $server): array
    {
        $this->access($request, $server, true);
        foreach (['file.create', 'file.update'] as $permission) abort_unless($request->user()->can($permission, $server), 403);
        return app(PlayerCompanion::class)->install($server);
    }
    public function followup(Request $request, Server $server): array
    {
        abort_unless($request->user()->can('file.read-content', $server), 403);
        return ['pending' => CompanionReminder::pending($request->user()->id, $server->uuid)];
    }
    public function dismissFollowup(Request $request, Server $server): array
    {
        abort_unless($request->user()->can('file.read-content', $server), 403);
        $data = $request->validate(['token' => 'required|string|max:100']);
        CompanionReminder::dismiss($request->user()->id, $server->uuid, $data['token']);
        return ['dismissed' => true];
    }
    public static function command(string $action,string $uuid,string $request,mixed $value): string
    {
        abort_unless(PlayerFiles::uuid($uuid)&&preg_match('/^[a-f0-9]{32}$/D',$request),422,'Identifiant invalide.');
        abort_unless(in_array($action,['heal','kill','feed','operator','whitelist','ban','gamemode','experience'],true),422,'Action inconnue.');
        $argument='';
        if(in_array($action,['operator','whitelist','ban'],true)){abort_unless(is_bool($value),422,'Valeur de commande invalide.');$argument=$value?'true':'false';}
        elseif($action==='gamemode'){abort_unless(in_array($value,['survival','creative','adventure','spectator'],true),422,'Mode de jeu invalide.');$argument=$value;}
        elseif($action==='experience'){abort_unless(is_int($value)&&$value>=0&&$value<=10000,422,'Le niveau doit être compris entre 0 et 10 000.');$argument=(string)$value;}
        return trim('vinusplayers '.$action.' '.$uuid.' '.$request.' '.$argument);
    }
    public function action(Request $request,Server $server): array
    {
        $this->access($request,$server,true);
        $data=$request->validate(['uuid'=>'required|uuid','action'=>'required|string','request_id'=>'required|regex:/^[a-f0-9]{32}$/D','value'=>'present','confirmed'=>'required|boolean']);
        $data['uuid']=strtolower($data['uuid']);
        $command=self::command($data['action'],strtolower($data['uuid']),$data['request_id'],$data['value']);
        abort_unless($data['confirmed']||!in_array($data['action'],['kill','operator','ban'],true),422,'Confirmez cette action avant de continuer.');
        $key='vinusplayers:action:'.$server->uuid.':'.$data['request_id'];
        $lock=Cache::lock('vinusplayers:command:'.$server->uuid,10);abort_unless($lock->get(),409,'Une commande est déjà en cours.');
        try{
            $saved=Cache::get($key);
            if($saved){abort_unless($saved['user']===$request->user()->id&&$saved['command']===$command,409,'Identifiant de commande déjà utilisé.');return ['request_id'=>$data['request_id']];}
            $bridge=$this->files->bridge();abort_unless($bridge&&in_array($data['action'],$bridge['actions']??[],true),409,'La liaison joueurs est inactive ou cette action est désactivée.');
            $players=$this->roster($server,$bridge);abort_unless(isset($players[$data['uuid']]),404,'Joueur introuvable.');
            if(in_array($data['action'],['heal','kill','feed','gamemode','experience'],true))abort_unless($players[$data['uuid']]['online']===true,409,'Cette action nécessite un joueur connecté.');
            abort_unless(($this->daemon->setServer($server)->getDetails()['state']??'')==='running',409,'Le serveur doit être démarré.');
            Cache::put($key,['user'=>$request->user()->id,'uuid'=>$data['uuid'],'command'=>$command],600);
            $this->commands->setServer($server)->send($command);
            return ['request_id'=>$data['request_id']];
        }finally{$lock->release();}
    }
    public function result(Request $request,Server $server,string $id): array
    {
        $this->access($request,$server,true);abort_unless(preg_match('/^[a-f0-9]{32}$/D',$id),404);
        $record=Cache::get('vinusplayers:action:'.$server->uuid.':'.$id);abort_unless($record&&$record['user']===$request->user()->id,404);
        $result=$this->files->json('/.vinus/players/results/'.$id.'.json',65536);
        if(!$result)return ['status'=>'pending'];
        abort_unless(($result['request_id']??null)===$id&&($result['uuid']??null)===$record['uuid'],409,'Réponse de commande invalide.');
        Cache::forget('vinusplayers:roster:'.$server->uuid);
        return ['status'=>($result['success']??false)?'success':'error','code'=>$result['code']??'failed'];
    }
    public function skin(Request $request,Server $server,string $uuid)
    {
        $this->access($request,$server);abort_unless(PlayerFiles::uuid($uuid),404);
        $players=$this->roster($server,$this->files->bridge());abort_unless(isset($players[$uuid]),404);
        $skin=Cache::remember('vinusplayers:skin:'.$server->uuid.':'.$uuid,3600,function()use($uuid){
            $snapshot=$this->files->json('/.vinus/players/'.$uuid.'.json',1048576);$url=$snapshot['skin']??null;
            if(!is_string($url)||!preg_match('~^https?://textures\.minecraft\.net/texture/[a-f0-9]{32,64}$~D',$url)){
                $response=\Illuminate\Support\Facades\Http::timeout(5)->connectTimeout(3)->get('https://sessionserver.mojang.com/session/minecraft/profile/'.str_replace('-','',$uuid));
                if(!$response->successful())return '';
                $properties=$response->json('properties',[]);$encoded=collect($properties)->firstWhere('name','textures')['value']??'';
                if(!is_string($encoded)||strlen($encoded)>32768)return '';
                $url=json_decode(base64_decode($encoded,true)?:'',true)['textures']['SKIN']['url']??null;
            }
            if(!is_string($url)||!preg_match('~^https?://textures\.minecraft\.net/texture/[a-f0-9]{32,64}$~D',$url))return '';
            $response=\Illuminate\Support\Facades\Http::timeout(5)->connectTimeout(3)->withOptions(['allow_redirects'=>false,'progress'=>function($total,$received){abort_if(max($total,$received)>262144,422,'Texture trop volumineuse.');}])->get(preg_replace('~^http:~','https:',$url));
            if(!$response->successful())return '';
            $bytes=$response->body();$size=@getimagesizefromstring($bytes);
            if(!$size||$size[2]!==IMAGETYPE_PNG||!in_array([$size[0],$size[1]],[[64,32],[64,64]],true))return '';
            return base64_encode($bytes);
        });
        abort_unless($skin,404);return response(base64_decode($skin),200,['Content-Type'=>'image/png','Cache-Control'=>'private, max-age=3600','X-Content-Type-Options'=>'nosniff']);
    }
}
