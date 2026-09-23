<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\VinusSoftware;
use Pterodactyl\Http\Controllers\Controller;

final class WorldController extends Controller
{
    public function __construct(private InstallFiles $files, private WorldInstaller $installer, private CatalogSources $catalog, private ArchiveCatalog $archives) {}
    private function access(Request $request, Server $server, bool $write=false): void
    {
        foreach($write?['file.read','file.read-content','file.create','file.update','file.delete']:['file.read'] as $permission)abort_unless($request->user()->can($permission,$server),403);
        $profile=VinusSoftware::forServer($server);
        abort_unless($profile['software'] && !in_array($profile['software'],['velocity','velocity_ctd','waterfall','bungeecord','loohplimbo','nanolimbo'],true),422,'Cet outil nécessite un serveur Minecraft Java.');
    }
    public function profile(Request $request, Server $server): array
    {
        $this->access($request,$server);$root=$this->files->setServer($server)->getDirectory('/');
        $active=null;
        if($request->user()->can('file.read-content',$server) && collect($root)->firstWhere('name','server.properties'))$active=WorldArchive::active($this->installer->properties($server));
        return ['available'=>$this->catalog->available()['curseforge'],'game_version'=>VinusSoftware::forServer($server)['game_version'],'active'=>$active,
            'archives'=>array_values(array_map(fn($f)=>['path'=>'/'.$f['name'],'name'=>$f['name'],'size'=>$f['size']],array_filter($root,fn($f)=>$f['file']&&!$f['symlink']&&preg_match('/\.zip$/iD',$f['name']))))];
    }
    public function search(Request $request, Server $server): array
    {
        $this->access($request,$server);
        $input=$request->validate(['query'=>'nullable|string|max:120','offset'=>'nullable|integer|min:0|max:10000','sort'=>'nullable|in:relevance,downloads,updated','category'=>'nullable|integer|min:1']);
        return $this->catalog->search('curseforge','worlds',$input,'');
    }
    public function categories(Request $request, Server $server): array
    {
        $this->access($request,$server);
        $items=$this->catalog->get('curseforge','categories',['gameId'=>432,'classId'=>17])['data'];
        return ['categories'=>array_values(array_map(fn($v)=>['id'=>$v['id'],'name'=>$v['name']],array_filter($items,fn($v)=>!($v['isClass']??false))))];
    }
    public function versions(Request $request, Server $server): array
    {
        $this->access($request,$server);$project=$request->validate(['project'=>'required|regex:/^[0-9]{1,12}$/D'])['project'];
        $meta=$this->catalog->get('curseforge','mods/'.$project)['data'];abort_unless(($meta['gameId']??0)===432&&($meta['classId']??0)===17,422,'Ce projet n’est pas un monde Minecraft.');
        return ['versions'=>$this->catalog->versions('curseforge',$project,'')];
    }
    public function plan(Request $request, Server $server): array
    {
        $this->access($request,$server,true);
        $input=$request->validate(['source'=>'required|in:uploaded,curseforge','path'=>'required_if:source,uploaded|string|max:512','project'=>'required_if:source,curseforge|regex:/^[0-9]{1,12}$/D','version'=>'required_if:source,curseforge|regex:/^[0-9]{1,12}$/D']);
        $artifact=$input['source']==='uploaded'?$this->installer->uploadArtifact($server,$input['path']):$this->archives->artifact($input['project'],$input['version'],17);
        $temp=tempnam(sys_get_temp_dir(),'vinus-world-plan-');
        try {
            $this->installer->fetch($server,$artifact,$temp);$world=WorldArchive::inspect($temp);
            WorldMetadata::compatible($world['metadata'],VinusSoftware::forServer($server)['game_version']);
            $properties=$this->installer->properties($server);$token=Str::random(48);
            Cache::put('vinusworlds:plan:'.$token,['user'=>$request->user()->id,'server'=>$server->uuid,'plan'=>['artifact'=>$artifact,'sha512'=>hash_file('sha512',$temp),'properties_hash'=>hash('sha512',$properties)]],900);
            return ['token'=>$token,'name'=>$world['name'],'minecraft'=>$world['metadata']['minecraft']??null,'size'=>$world['size'],'files'=>count($world['files']),'previous'=>WorldArchive::active($properties)];
        }finally{if(is_file($temp))unlink($temp);}
    }
    public function install(Request $request, Server $server): array
    {
        $this->access($request,$server,true);$input=$request->validate(['token'=>'required|regex:/^[a-zA-Z0-9]{48}$/D','activate'=>'required|accepted']);
        $lock=Cache::lock('vinuscatalog:install:'.$server->uuid,900);abort_unless($lock->get(),409,'Une installation est déjà en cours.');
        try {
            $saved=Cache::get('vinusworlds:plan:'.$input['token']);abort_unless($saved&&$saved['user']===$request->user()->id&&$saved['server']===$server->uuid,422,'L’aperçu a expiré ou a déjà été utilisé.');
            $server->validateCurrentState();Cache::forget('vinusworlds:plan:'.$input['token']);
            return $this->installer->install($server,$saved['plan']);
        }finally{$lock->release();}
    }
}
