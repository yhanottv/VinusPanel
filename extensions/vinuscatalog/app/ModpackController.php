<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;

final class ModpackController extends Controller
{
    public function __construct(private Modrinth $catalog, private ServerSoftware $software, private InstallDownload $download, private ModpackInstaller $installer) {}

    private function access(Request $request, Server $server, bool $write = false): void
    {
        foreach ($write ? ['startup.read','startup.update','settings.reinstall','file.read','file.read-content','file.create','file.update','file.delete'] : ['file.read'] as $permission) abort_unless($request->user()->can($permission, $server), 403);
    }

    public function search(Request $request, Server $server): array
    {
        $this->access($request, $server);
        $data = $request->validate(['source'=>'nullable|in:modrinth,curseforge','query' => 'nullable|string|max:120', 'offset' => 'nullable|integer|min:0|max:9984', 'sort' => 'nullable|in:relevance,downloads,updated']);
        $sources=(new CatalogSources())->available();
        if(($data['source']??'modrinth')==='curseforge') {
            $response=(new CatalogSources())->search('curseforge','modpacks',$data,'');
            return ['sources'=>$sources,'hits'=>array_map(fn($hit)=>['id'=>$hit['project_id'],'title'=>$hit['title'],'description'=>$hit['description'],'author'=>$hit['author'],'downloads'=>$hit['downloads'],'icon'=>$hit['icon_url'],'page_url'=>$hit['page_url']],$response['hits']),'total'=>min(9996,$response['total'])];
        }
        $response = $this->catalog->get('search', ['query' => $data['query'] ?? '', 'offset' => $data['offset'] ?? 0, 'limit' => 12, 'index' => $data['sort'] ?? 'downloads', 'facets' => json_encode([['project_type:modpack'],['server_side:required','server_side:optional']])]);
        return ['sources'=>$sources,'hits' => array_map(fn ($hit) => ['id' => $hit['project_id'], 'title' => $hit['title'], 'description' => $hit['description'], 'author' => $hit['author'], 'downloads' => $hit['downloads'], 'icon' => Modrinth::icon($hit['icon_url'] ?? null),'page_url'=>'https://modrinth.com/modpack/'.$hit['project_id']], $response['hits']), 'total' => min(9996,$response['total_hits'])];
    }

    public function versions(Request $request, Server $server): array
    {
        $this->access($request, $server);
        $input=$request->validate(['source'=>'nullable|in:modrinth,curseforge','project'=>'required|regex:/^[a-zA-Z0-9]{1,12}$/D']);$id=$input['project'];
        if(($input['source']??'modrinth')==='curseforge') {
            abort_unless(ctype_digit($id),422);$catalog=new CatalogSources();$project=$catalog->get('curseforge','mods/'.$id)['data'];
            abort_unless(($project['gameId']??0)===432 && ($project['classId']??0)===4471,422);
            $files=$catalog->get('curseforge','mods/'.$id.'/files',['pageSize'=>50])['data'];
            return ['versions'=>array_values(array_map(fn($v)=>['id'=>(string)$v['id'],'name'=>$v['displayName'],'version'=>$v['displayName'],'games'=>$v['gameVersions'],'channel'=>[1=>'release',2=>'beta',3=>'alpha'][$v['releaseType']]??'beta','loaders'=>[],'published'=>$v['fileDate']],array_filter($files,fn($v)=>($v['isAvailable']??false)&&!($v['isServerPack']??false)&&!empty($v['serverPackFileId']))))];
        }
        $project = $this->catalog->get('project/'.$id);
        abort_unless(($project['project_type'] ?? '') === 'modpack' && ($project['server_side'] ?? '') !== 'unsupported', 422, 'Ce projet n’est pas un modpack compatible serveur.');
        $versions = $this->catalog->get('project/'.$id.'/version');
        return ['versions' => array_values(array_map(fn ($v) => ['id' => $v['id'], 'name' => $v['name'], 'version' => $v['version_number'], 'games' => $v['game_versions'], 'channel' => $v['version_type'], 'loaders' => $v['loaders'], 'published' => $v['date_published']], array_filter($versions, fn ($v) => ($v['status'] ?? 'listed') === 'listed')))];
    }

    public static function artifact(array $version): array
    {
        $files = array_values(array_filter($version['files'] ?? [], fn ($f) => str_ends_with(strtolower($f['filename'] ?? ''), '.mrpack')));
        $primary = array_values(array_filter($files, fn ($f) => $f['primary'] ?? false));
        if ($primary) $files = $primary;
        abort_unless(count($files) === 1, 422, 'Impossible de choisir l’archive principale du modpack.');
        $file = $files[0];
        abort_unless(InstallDownload::host($file['url']) === 'cdn.modrinth.com' && preg_match('/^[a-f0-9]{128}$/iD', $file['hashes']['sha512'] ?? '') && $file['size'] > 0 && $file['size'] <= 134217728, 422, 'L’archive du modpack dépasse 128 Mio ou ses métadonnées sont invalides.');
        return ['url' => $file['url'], 'size' => $file['size'], 'sha512' => strtolower($file['hashes']['sha512'])];
    }

    public function plan(Request $request, Server $server): array
    {
        $this->access($request, $server, true);
        $data = $request->validate(['source'=>'nullable|in:modrinth,curseforge','project' => 'required|regex:/^[a-zA-Z0-9]{1,12}$/D','version' => 'required|regex:/^[a-zA-Z0-9]{1,12}$/D']);
        if(($data['source']??'modrinth')==='curseforge')return $this->planCurseForge($request,$server,$data);
        $project = $this->catalog->get('project/'.$data['project']);
        abort_unless(($project['project_type'] ?? '') === 'modpack' && ($project['server_side'] ?? '') !== 'unsupported', 422, 'Ce projet n’est pas un modpack compatible serveur.');
        $version = $this->catalog->get('version/'.$data['version']);
        abort_unless(($version['project_id'] ?? '') === $data['project'], 422, 'Version étrangère au projet.');
        $artifact = self::artifact($version); $temp = tempnam(sys_get_temp_dir(), 'vinus-mrpack-');
        try {
            $this->download->deadline = microtime(true) + 45;
            $this->download->fetch($artifact['url'], $temp, $artifact['size'], $artifact['sha512']);
            $pack = ModpackManifest::read($temp, 'modrinth');
            foreach ([...$pack['files'], ...$pack['overrides']] as $file) abort_unless(ModpackBundle::packPath($file['path']), 422, 'Ce pack contient des fichiers réservés au lanceur ou à la récupération.');
            $runtime = $this->software->forModpack($pack['runtime']);
            $image = SoftwareInstaller::image($server, (int) $runtime['java']);
            $token = Str::random(48);
            $plan = ['project' => $data['project'], 'version' => $data['version'], 'title' => $project['title'], 'release' => $version['version_number'], 'artifact' => $artifact, 'runtime' => $runtime];
            Cache::put('vinusmodpacks:plan:'.$token, ['user' => $request->user()->id, 'server' => $server->uuid, 'startup' => $server->startup, 'image' => $server->image, 'plan' => $plan], 900);
            return ['companion' => app(PlayerCompanion::class)->offer($runtime, $image) + ['can_install' => $request->user()->can('control.console', $server)], 'token' => $token, 'title' => $project['title'], 'release' => $version['version_number'], 'minecraft' => $pack['runtime']['minecraft'], 'software' => $pack['runtime']['software'], 'loader' => $pack['runtime']['loader_version'], 'java' => $runtime['java'], 'image' => $image, 'size' => $pack['size'] + array_sum(array_column($pack['overrides'], 'size')) + array_sum(array_column($runtime['steps'], 'size')), 'files' => count(array_filter($pack['files'], fn ($f) => !$f['optional'])), 'optional' => array_values(array_column(array_filter($pack['files'], fn ($f) => $f['optional']), 'path')), 'skipped' => $pack['client_files_skipped']];
        } finally { if ($temp && is_file($temp)) unlink($temp); $this->download->deadline = null; }
    }

    private function planCurseForge(Request $request,Server $server,array $input): array
    {
        set_time_limit(240);$this->download->deadline=microtime(true)+180;
        $catalog=new CurseForgeModpack(new CatalogSources(),new ArchiveCatalog(new CatalogSources(),$this->download));
        $directory=storage_path('app/vinussoftware/tmp/cf-plan-'.Str::random(20));abort_unless(mkdir($directory,0700,true),500);
        try {
            $artifacts=$catalog->artifacts($input['project'],$input['version']);$prepared=$catalog->prepare($artifacts,$directory);$pack=$prepared['pack'];
            $runtime=$this->software->forModpack($pack['runtime']);$image=SoftwareInstaller::image($server,(int)$runtime['java']);
            $token=Str::random(48);$artifact=array_merge($artifacts['server'],['sha512'=>$prepared['sha512']]);
            $plan=['source'=>'curseforge','project'=>$input['project'],'version'=>$input['version'],'title'=>$artifacts['title'],'release'=>$artifacts['release'],'artifact'=>$artifact,'runtime'=>$runtime,'pack_runtime'=>$pack['runtime']];
            Cache::put('vinusmodpacks:plan:'.$token,['user'=>$request->user()->id,'server'=>$server->uuid,'startup'=>$server->startup,'image'=>$server->image,'plan'=>$plan],900);
            return ['companion'=>app(PlayerCompanion::class)->offer($runtime,$image)+['can_install'=>$request->user()->can('control.console',$server)],'token'=>$token,'title'=>$artifacts['title'],'release'=>$artifacts['release'],'minecraft'=>$pack['runtime']['minecraft'],'software'=>$pack['runtime']['software'],'loader'=>$pack['runtime']['loader_version'],'java'=>$runtime['java'],'image'=>$image,'size'=>array_sum(array_column($pack['overrides'],'size'))+array_sum(array_column($runtime['steps'],'size')),'files'=>count($pack['overrides']),'optional'=>[],'skipped'=>0,'launcher_files_skipped'=>$pack['launcher_files_skipped']];
        } finally {foreach(glob($directory.'/*')?:[] as $file)if(is_file($file))unlink($file);rmdir($directory);$this->download->deadline=null;}
    }

    public function install(Request $request, Server $server): array
    {
        $this->access($request, $server, true);
        $data = $request->validate(['token' => 'required|regex:/^[a-zA-Z0-9]{48}$/D','optional' => 'present|array|max:2000','optional.*' => 'string|max:512','replace' => 'required|accepted', 'install_players' => 'required|boolean']);
        $accepted = $request->boolean('install_players');
        if ($accepted) abort_unless($request->user()->can('control.console', $server), 403);
        $lock = Cache::lock('vinuscatalog:install:'.$server->uuid, 900);
        abort_unless($lock->get(), 409, 'Une installation est déjà en cours.');
        try {
            $saved = Cache::get('vinusmodpacks:plan:'.$data['token']);
            abort_unless($saved && $saved['user'] === $request->user()->id && $saved['server'] === $server->uuid, 422, 'L’aperçu a expiré ou a déjà été utilisé.');
            abort_unless($server->startup === $saved['startup'] && $server->image === $saved['image'], 409, 'Le démarrage du serveur a changé.');
            $server->validateCurrentState(); Cache::forget('vinusmodpacks:plan:'.$data['token']);
            $result = $this->installer->install($server, $saved['plan'], $data['optional']);
            if (!$accepted) $result['companion_followup'] = CompanionReminder::queue($request->user()->id, $server->uuid);
        } finally { $lock->release(); }
        $result['companion'] = app(PlayerCompanion::class)->automatic($server->fresh(), $accepted);
        return $result;
    }
}
