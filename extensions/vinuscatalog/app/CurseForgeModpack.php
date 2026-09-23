<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

/** Only publisher-provided server packs are eligible; client manifests cannot identify client-only mods. */
class CurseForgeModpack
{
    public function __construct(private CatalogSources $catalog, private ArchiveCatalog $archives) {}

    public function artifacts(string $project,string $version): array
    {
        abort_unless(ctype_digit($project)&&ctype_digit($version),422);
        $meta=$this->catalog->get('curseforge','mods/'.$project)['data'];
        abort_unless(($meta['gameId']??0)===432 && ($meta['classId']??0)===4471,422,'Ce projet n’est pas un modpack Minecraft.');
        $client=$this->catalog->get('curseforge','mods/'.$project.'/files/'.$version)['data'];
        abort_unless((string)($client['id']??'')===$version && !($client['isServerPack']??false) && !empty($client['serverPackFileId']),422,'L’auteur ne fournit pas de pack serveur pour cette publication.');
        $server=$this->catalog->get('curseforge','mods/'.$project.'/files/'.$client['serverPackFileId'])['data'];
        self::related($client,$server);
        return ['client'=>ArchiveCatalog::normalize($project,$client,$meta['name']),'server'=>ArchiveCatalog::normalize($project,$server,$meta['name']),'title'=>$meta['name'],'release'=>$client['displayName']];
    }
    public static function related(array $client,array $server): void
    {
        abort_unless(($client['modId']??null)===($server['modId']??null) && ($client['serverPackFileId']??null)===($server['id']??null)
            && ($server['isServerPack']??false) && (!isset($server['parentProjectFileId']) || !$server['parentProjectFileId'] || $server['parentProjectFileId']===$client['id']),422,'Le pack serveur ne correspond pas à la publication choisie.');
    }

    public static function read(string $archive,array $runtime): array
    {
        $entries=InstallArchive::entries($archive);$prefixes=[];
        foreach($entries as $entry)if(!$entry['directory']&&preg_match('~^(.*?)(?:mods)/[^/]+\.jar$~iD',$entry['path'],$match))$prefixes[$match[1]]=true;
        abort_unless(count($prefixes)===1,422,'Le pack serveur doit contenir un dossier mods unique avec ses JAR. Les packs utilisant un script de téléchargement nécessitent une installation manuelle.');
        $prefix=array_key_first($prefixes);$overrides=[];$skipped=0;
        foreach($entries as $entry) {
            if($entry['directory'] || !str_starts_with($entry['path'],$prefix))continue;
            $path=substr($entry['path'],strlen($prefix));$root=explode('/',$path)[0];
            // The exact runtime comes from the verified catalog manifest and MCJars, never a pack shell script.
            if(!ModpackBundle::packPath($path) || preg_match('/\.(?:sh|bat|cmd|exe|ps1)$/iD',$path) || (!str_contains($path,'/')&&preg_match('/\.(?:jar|zip)$/iD',$path))
                || in_array(strtolower($root),['manifest.json','modrinth.index.json','logs','crash-reports','.git'],true)){$skipped++;continue;}
            $overrides[]=['entry'=>$entry['path'],'path'=>$path,'size'=>$entry['size']];
        }
        abort_unless(count(array_filter($overrides,fn($entry)=>str_starts_with($entry['path'],'mods/')))>0,422,'Aucun mod serveur dans cette archive.');
        return ['runtime'=>$runtime,'files'=>[],'overrides'=>$overrides,'size'=>0,'client_files_skipped'=>0,'launcher_files_skipped'=>$skipped];
    }

    public function prepare(array $artifacts,string $directory): array
    {
        $this->archives->download($artifacts['client'],$directory.'/client.zip');
        $manifest=ModpackManifest::read($directory.'/client.zip','curseforge');
        $this->archives->download($artifacts['server'],$directory.'/server.zip');
        $pack=self::read($directory.'/server.zip',$manifest['runtime']);
        return ['pack'=>$pack,'sha512'=>hash_file('sha512',$directory.'/server.zip')];
    }
}
