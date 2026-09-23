<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Support\Str;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\VinusSoftware;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Services\Servers\SuspensionService;

class BlueMapInstaller
{
    public const PROJECT = 'swbUV1cr';
    public function __construct(private InstallFiles $files, private Modrinth $catalog, private InstallDownload $downloads,
        private DaemonServerRepository $daemon, private SuspensionService $suspension, private BlueMapAssets $assets) {}

    public static function target(array $profile): ?array
    {
        if (!$profile['game_version']) return null;
        $plugins=array_values(array_intersect($profile['categories']['plugins']??[],['paper','spigot','bukkit','folia','sponge']));
        $mods=array_values(array_intersect($profile['categories']['mods']??[],['fabric','forge','neoforge','quilt']));
        if ($plugins) return ['directory'=>'plugins','loaders'=>$plugins,'config'=>in_array('sponge',$plugins,true)?'config/bluemap':'plugins/BlueMap'];
        if ($mods) return ['directory'=>'mods','loaders'=>$mods,'config'=>'config/bluemap'];
        return null;
    }

    public static function configs(bool $accept): array
    {
        // File hosting through authenticated Wings avoids opening an additional public port.
        return ['core.conf'=>"accept-download: ".($accept?'true':'false')."\nrender-thread-count: 1\nmetrics: false\n",
            'webserver.conf'=>"enabled: false\n",
            'webapp.conf'=>"enabled: true\nwebroot: \"bluemap/web\"\nuse-cookies: false\nupdate-settings-file: true\n",
            'plugin.conf'=>"live-player-markers: false\nwrite-players-interval: 10\nwrite-markers-interval: 10\n"];
    }

    public function plan(Server $server): array
    {
        $profile=VinusSoftware::forServer($server);$target=self::target($profile);
        abort_unless($target,422,'BlueMap nécessite un logiciel compatible et une version Minecraft connue.');
        $config=$this->assets->entry($server,'/'.$target['config']);
        abort_if($config,409,'Une configuration BlueMap existe déjà. Utilisez-la ou conservez-la ailleurs avant une nouvelle installation.');
        $files=$this->catalog->resolve(self::PROJECT,$target['loaders'],$profile['game_version']);
        $root=$this->files->setServer($server)->getDirectory('/');
        if(collect($root)->contains('name',$target['directory']))foreach($this->files->getDirectory('/'.$target['directory']) as $entry) {
            abort_if(preg_match('/^bluemap.*\.jar$/i',$entry['name']),409,'Un fichier BlueMap existe déjà. Configurez cette installation avant de poursuivre.');
            foreach($files as &$file) {
                if($file['project_id']!==self::PROJECT && ($entry['name']===$file['filename'] || ($file['project_id']==='P7dR8mSH' && preg_match('/^fabric-api-[\w.+-]+\.jar$/D',$entry['name'])))) {
                    abort_unless($entry['file']&&!$entry['symlink']&&$entry['size']<=26214400,422,'Dépendance existante invalide.');
                    abort_if($file['reuse']??false,409,'Plusieurs versions de la même dépendance sont présentes.');
                    $hash=hash('sha512',$this->files->getContent('/'.$target['directory'].'/'.$entry['name'],26214400));
                    $existing=$this->catalog->get('version_file/'.$hash,['algorithm'=>'sha512']);
                    abort_unless(($existing['project_id']??'')===$file['project_id'] && in_array($profile['game_version'],$existing['game_versions']??[],true) && array_intersect($target['loaders'],$existing['loaders']??[]),409,'La dépendance existante ne correspond pas au serveur.');
                    $file=array_merge($file,['filename'=>$entry['name'],'version'=>$existing['version_number'],'sha512'=>$hash,'size'=>$entry['size'],'reuse'=>true]);
                }
            }
            unset($file);
        }
        return ['profile'=>$profile,'target'=>$target,'files'=>$files,'image'=>$server->image];
    }

    public static function checkJava(string $jar,string $image): void
    {
        abort_unless(preg_match('/(?:^|[:\/_-])java[_-]?(\d{1,2})(?:$|[^0-9])/i',$image,$match),422,'La version Java de cette image ne peut pas être vérifiée.');
        $java=(int)$match[1];$zip=new \ZipArchive();abort_unless($zip->open($jar)===true,422,'JAR BlueMap illisible.');
        try {
            for($i=0;$i<$zip->numFiles;$i++) {
                $name=$zip->getNameIndex($i);
                if(!str_ends_with($name,'.class')||str_starts_with($name,'META-INF/versions/'))continue;
                $head=$zip->getFromIndex($i,8);
                if(strlen($head)!==8||substr($head,0,4)!=="\xca\xfe\xba\xbe")continue;
                $required=unpack('n',substr($head,6,2))[1]-44;
                abort_unless($required<=$java,422,'Cette version BlueMap nécessite Java '.$required.' ; le serveur utilise Java '.$java.'.');
            }
        } finally {$zip->close();}
    }

    public function install(Server $server,array $plan,bool $accept): array
    {
        ignore_user_abort(true);set_time_limit(300);
        abort_unless($plan['profile']===VinusSoftware::forServer($server)&&$plan['image']===$server->image,409,'Le logiciel du serveur a changé.');
        $batch='vinus-bluemap-'.Str::lower(Str::random(16));$local=storage_path('app/vinussoftware/tmp/'.$batch);
        abort_unless(is_dir($local)||mkdir($local,0700,true),500);
        $repository=$this->files->setServer($server);$suspended=false;$moved=[];$rollbackFailed=false;
        try {
            abort_unless(in_array($this->daemon->setServer($server)->getDetails()['state']??'',['offline','stopped'],true),409,'Arrêtez le serveur pour installer BlueMap.');
            foreach($plan['files'] as $index=>$file){
                if($file['reuse']??false)continue;
                $this->downloads->fetch($file['url'],$local.'/'.$index.'.jar',$file['size'],$file['sha512']);self::checkJava($local.'/'.$index.'.jar',$server->image);
                if($file['project_id']===self::PROJECT && in_array('fabric',$plan['target']['loaders'],true)) {
                    $zip=new \ZipArchive();$zip->open($local.'/'.$index.'.jar');try{$metadata=json_decode($zip->getFromName('fabric.mod.json'),true,32,JSON_THROW_ON_ERROR);}finally{$zip->close();}
                    if(collect($plan['files'])->contains('reuse',true))abort_unless(($metadata['depends']['fabric-api-base']??null)==='*',422,'Cette version BlueMap exige une vérification manuelle de Fabric API.');
                    $loaderRoot='/libraries/net/fabricmc/fabric-loader';
                    if($this->assets->entry($server,$loaderRoot)) {
                        $loaders=array_values(array_filter($repository->getDirectory($loaderRoot),fn($entry)=>!$entry['file'] && preg_match('/^\d+\.\d+\.\d+$/D',$entry['name'])));
                        // A single installed loader is authoritative. Multiple historical versions are ambiguous.
                        if(count($loaders)===1)abort_if(ModpackBundle::incompatibleMinimum($metadata['depends']['fabricloader']??null,$loaders[0]['name']),422,'Le chargeur Fabric est trop ancien pour BlueMap.');
                    }
                }
            }
            $server=$server->fresh();$server->validateCurrentState();
            abort_unless($plan['profile']===VinusSoftware::forServer($server)&&$plan['image']===$server->image,409,'Le logiciel du serveur a changé.');
            abort_unless(in_array($this->daemon->setServer($server)->getDetails()['state']??'',['offline','stopped'],true),409,'Le serveur a été démarré pendant la préparation.');
            $this->suspension->toggle($server);$suspended=true;
            // Re-check collisions after access is locked. Never replace a user's BlueMap configuration.
            abort_if($this->assets->entry($server,'/'.$plan['target']['config']),409,'Une configuration BlueMap existe déjà.');
            $directory=$plan['target']['directory'];
            if(!$this->assets->entry($server,'/'.$directory))$repository->createDirectory($directory,'/');
            foreach($repository->getDirectory('/'.$directory) as $entry){
                abort_if(preg_match('/^bluemap.*\.jar$/i',$entry['name']),409,'BlueMap a déjà été installé.');
                foreach($plan['files'] as $file)if(!($file['reuse']??false))abort_if($entry['name']===$file['filename'],409,'Un fichier de destination existe déjà.');
            }
            foreach($plan['files'] as $file)if($file['reuse']??false) {
                $entry=$this->assets->entry($server,'/'.$directory.'/'.$file['filename']);
                abort_unless($entry && $entry['file'] && $entry['size']===$file['size'] && hash_equals($file['sha512'],hash('sha512',$repository->getContent('/'.$directory.'/'.$file['filename'],26214400))),409,'Une dépendance existante a changé.');
            }
            $repository->createDirectory($batch,'/');$repository->createDirectory('config','/'.$batch);
            foreach(self::configs($accept) as $name=>$content)$repository->putContent('/'.$batch.'/config/'.$name,$content);
            $repository->putContent('/'.$batch.'/installation.json',json_encode(['files'=>$plan['files'],'target'=>$plan['target'],'accepted_resources'=>$accept],JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));
            foreach($plan['files'] as $index=>$file)if(!($file['reuse']??false))$repository->upload('/'.$batch.'/'.$file['filename'],$local.'/'.$index.'.jar');
            $parent=dirname($plan['target']['config']);if(!$this->assets->entry($server,'/'.$parent))$repository->createDirectory($parent,'/');
            $moves=[['from'=>$batch.'/config','to'=>$plan['target']['config']]];
            foreach($plan['files'] as $file)if(!($file['reuse']??false))$moves[]=['from'=>$batch.'/'.$file['filename'],'to'=>$directory.'/'.$file['filename']];
            foreach($moves as $move){$repository->renameFiles('/',[$move]);$moved[]=$move;}
            $this->suspension->toggle($server,SuspensionService::ACTION_UNSUSPEND);$suspended=false;
            return ['message'=>$accept?'BlueMap installé. Démarrez le serveur pour lancer le premier rendu.':'BlueMap installé. L’autorisation de télécharger les ressources Minecraft reste désactivée.','backup'=>$batch];
        } catch(\Throwable $error){
            foreach(array_reverse($moved) as $move)try{$repository->renameFiles('/',[['from'=>$move['to'],'to'=>$move['from']]]);}catch(\Throwable $rollback){$rollbackFailed=true;report($rollback);}
            if($rollbackFailed)abort(500,'Installation interrompue. Le serveur reste verrouillé ; vérifiez le dossier '.$batch.'.');
            throw $error;
        } finally {
            if($suspended&&!$rollbackFailed)$this->suspension->toggle($server->fresh(),SuspensionService::ACTION_UNSUSPEND);
            foreach(glob($local.'/*')?:[] as $file)if(is_file($file))unlink($file);if(is_dir($local))rmdir($local);
        }
    }

    public function authorizeResources(Server $server): array
    {
        $target=self::target(VinusSoftware::forServer($server));abort_unless($target,422);
        $server->validateCurrentState();
        abort_unless(in_array($this->daemon->setServer($server)->getDetails()['state']??'',['offline','stopped'],true),409,'Arrêtez le serveur avant de modifier cette autorisation.');
        $path='/'.$target['config'].'/core.conf';$before=self::configs(false)['core.conf'];
        // Only modify the exact configuration we installed. Custom HOCON stays under the user's control.
        abort_unless($this->assets->content($server,$path)===$before,409,'La configuration a été personnalisée. Vérifiez accept-download dans core.conf.');
        $repository=$this->files->setServer($server);$suspended=false;$written=false;$rollbackFailed=false;
        $batch='vinus-bluemap-consent-'.Str::lower(Str::random(16));
        try {
            $this->suspension->toggle($server);$suspended=true;
            abort_unless($this->assets->content($server,$path)===$before,409,'La configuration a changé.');
            $repository->createDirectory($batch,'/');$repository->putContent('/'.$batch.'/previous-core.conf',$before);
            $written=true;$repository->putContent($path,self::configs(true)['core.conf']);
            $this->suspension->toggle($server,SuspensionService::ACTION_UNSUSPEND);$suspended=false;
            return ['message'=>'Téléchargement des ressources Minecraft autorisé. Démarrez le serveur pour générer la carte.','backup'=>$batch];
        } catch(\Throwable $error) {
            if($written)try{$repository->putContent($path,$before);}catch(\Throwable $rollback){$rollbackFailed=true;report($rollback);}
            if($rollbackFailed)abort(500,'La restauration a échoué. Le serveur reste verrouillé ; restaurez core.conf depuis '.$batch.'.');
            throw $error;
        } finally {if($suspended&&!$rollbackFailed)$this->suspension->toggle($server->fresh(),SuspensionService::ACTION_UNSUSPEND);}
    }
}
