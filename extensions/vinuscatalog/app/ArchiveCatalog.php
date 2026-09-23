<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

/** Large CurseForge ZIPs use the same streaming transport as software downloads. */
final class ArchiveCatalog
{
    public function __construct(private CatalogSources $catalog, private InstallDownload $download) {}
    public function artifact(string $project, string $version, int $class): array
    {
        abort_unless(ctype_digit($project) && ctype_digit($version) && in_array($class,[17,4471],true),422);
        $meta = $this->catalog->get('curseforge','mods/'.$project)['data'];
        abort_unless(($meta['gameId'] ?? 0) === 432 && ($meta['classId'] ?? 0) === $class,422,'Projet incompatible avec cette catégorie.');
        $file = $this->catalog->get('curseforge','mods/'.$project.'/files/'.$version)['data'];
        abort_unless((string)($file['id']??'')===$version,422,'Publication étrangère à la sélection.');
        return self::normalize($project,$file,$meta['name']);
    }
    public static function normalize(string $project, array $file, string $title): array
    {
        $hash = collect($file['hashes'] ?? [])->firstWhere('algo',1)['value'] ?? '';
        abort_unless((string)($file['modId'] ?? '') === $project && ($file['isAvailable'] ?? false) && preg_match('/\.zip$/iD',$file['fileName'] ?? '')
            && ($file['fileLength'] ?? 0) > 0 && $file['fileLength'] <= 536870912 && preg_match('/^[a-f0-9]{40}$/iD',$hash)
            && CatalogSources::trustedUrl($file['downloadUrl'] ?? '', 'curseforge'),422,'Archive indisponible, trop volumineuse ou téléchargement automatique non autorisé par l’auteur.');
        return ['source'=>'curseforge','project'=>$project,'version'=>(string)$file['id'],'title'=>$title,'filename'=>$file['fileName'],'url'=>$file['downloadUrl'],'size'=>$file['fileLength'],'sha1'=>strtolower($hash),'game_versions'=>$file['gameVersions'] ?? []];
    }
    public function download(array $artifact, string $destination): void
    {
        $key = config('vinuscatalog.curseforge_key'); abort_unless(is_string($key) && $key !== '',503,'CurseForge attend sa clé API.');
        $this->download->curseforgeKey = $key;
        try {
            $this->download->fetch($artifact['url'],$destination,$artifact['size']);
            abort_unless(hash_equals($artifact['sha1'],hash_file('sha1',$destination)),422,'L’intégrité CurseForge ne correspond pas.');
        } finally { $this->download->curseforgeKey = null; }
    }
}
