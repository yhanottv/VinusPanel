<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Support\Str;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Services\Servers\SuspensionService;
use Pterodactyl\Services\VinusSoftware;

class WorldInstaller
{
    public function __construct(private InstallFiles $files, private ArchiveCatalog $catalog, private DaemonServerRepository $daemon, private SuspensionService $suspension) {}

    public function uploadArtifact(Server $server, string $path): array
    {
        abort_unless(str_starts_with($path,'/') && InstallArchive::safePath(substr($path,1)) && preg_match('/\.zip$/iD',$path),422,'Choisissez une archive ZIP dans les fichiers du serveur.');
        $file = collect($this->files->setServer($server)->getDirectory(dirname($path)))->firstWhere('name',basename($path));
        abort_unless($file && $file['file'] && !$file['symlink'] && $file['size'] > 0 && $file['size'] <= 536870912,422,'Archive absente ou supérieure à 512 Mio.');
        return ['source'=>'uploaded','path'=>$path,'filename'=>basename($path),'size'=>$file['size']];
    }
    public function fetch(Server $server, array $artifact, string $local): void
    {
        if ($artifact['source'] === 'curseforge') $this->catalog->download($artifact,$local);
        else $this->files->setServer($server)->download($artifact['path'],$local,$artifact['size']);
    }
    public function properties(Server $server): string { return $this->files->setServer($server)->getContent('/server.properties',1048576); }

    public function install(Server $server, array $plan): array
    {
        ignore_user_abort(true);set_time_limit(600);
        $batch='vinus-world-'.Str::lower(Str::random(16));$world='world-'.Str::lower(Str::random(16));
        $local=storage_path('app/vinussoftware/tmp/'.$batch);abort_unless(is_dir($local)||mkdir($local,0700,true),500);
        $repository=$this->files->setServer($server);$suspended=false;$promoted=false;$propertiesWritten=false;$rollbackFailed=false;$before='';
        try {
            abort_unless(in_array($this->daemon->setServer($server)->getDetails()['state']??'',['offline','stopped'],true),409,'Arrêtez le serveur avant d’activer un autre monde.');
            $this->fetch($server,$plan['artifact'],$local.'/source.zip');
            abort_unless(hash_equals($plan['sha512'],hash_file('sha512',$local.'/source.zip')),409,'L’archive a changé. Préparez une nouvelle installation.');
            $info=WorldArchive::inspect($local.'/source.zip');WorldMetadata::compatible($info['metadata'],VinusSoftware::forServer($server)['game_version']);
            abort_unless(disk_free_space($local)>2*$info['size']+134217728,422,'Espace temporaire insuffisant pour préparer ce monde.');
            WorldArchive::bundle($local.'/source.zip',$info,$local.'/bundle.zip');
            $server=$server->fresh();$server->validateCurrentState();
            WorldMetadata::compatible($info['metadata'],VinusSoftware::forServer($server)['game_version']);
            $details=$this->daemon->setServer($server)->getDetails();abort_unless(in_array($details['state']??'',['offline','stopped'],true),409,'Le serveur a été démarré pendant la préparation.');
            if($server->disk>0)abort_unless(($details['resources']['disk_bytes']??0)+$info['size']+filesize($local.'/bundle.zip')<=$server->disk*1048576,422,'Espace disque insuffisant pour installer le monde en conservant l’ancien.');
            $this->suspension->toggle($server);$suspended=true;
            $before=$this->properties($server);abort_unless(hash_equals($plan['properties_hash'],hash('sha512',$before)),409,'Les propriétés ont changé. Préparez une nouvelle installation.');
            $repository->createDirectory($batch,'/');
            $repository->putContent('/'.$batch.'/previous-server.properties',$before);
            $repository->putContent('/'.$batch.'/world.json',json_encode(['previous'=>WorldArchive::active($before),'installed'=>$world,'title'=>$info['name'],'source'=>$plan['artifact']['source'],'sha512'=>$plan['sha512']],JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT));
            $repository->upload('/'.$batch.'/bundle.zip',$local.'/bundle.zip');
            $repository->decompressFile('/'.$batch,'bundle.zip');
            $check=collect($repository->getDirectory('/'.$batch.'/world'))->firstWhere('name','level.dat');
            abort_unless($check && $check['file'] && !$check['symlink'],422,'Le monde préparé est incomplet.');
            abort_unless(!collect($repository->getDirectory('/'))->firstWhere('name',$world),409,'Le dossier de destination existe déjà.');
            $repository->renameFiles('/',[['from'=>$batch.'/world','to'=>$world]]);$promoted=true;
            // Set before the write: a failed/partial write must also be restored.
            $propertiesWritten=true;$repository->putContent('/server.properties',WorldArchive::activate($before,$world));
            $this->suspension->toggle($server,SuspensionService::ACTION_UNSUSPEND);$suspended=false;
            return ['world'=>$world,'name'=>$info['name'],'backup'=>$batch,'message'=>'Monde installé et activé. Le serveur reste arrêté ; son ancien monde est conservé.'];
        } catch(\Throwable $error) {
            if($suspended)try {
                if($propertiesWritten)$repository->putContent('/server.properties',$before);
                if($promoted)$repository->renameFiles('/',[['from'=>$world,'to'=>$batch.'/world']]);
            }catch(\Throwable $rollback){$rollbackFailed=true;report($rollback);}
            if($rollbackFailed)abort(500,'Restauration interrompue. Le serveur reste verrouillé ; restaurez server.properties depuis '.$batch.'/previous-server.properties.');
            throw $error;
        } finally {
            if($suspended&&!$rollbackFailed)$this->suspension->toggle($server->fresh(),SuspensionService::ACTION_UNSUSPEND);
            foreach(glob($local.'/*')?:[] as $file)if(is_file($file))unlink($file);
            if(is_dir($local))rmdir($local);
        }
    }
}
