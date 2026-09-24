<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

final class PlayerFiles extends DaemonFileRepository
{
    private array $directories=[];
    private function exists(string $path): bool
    {
        $directory='/';$parts=explode('/',trim($path,'/'));
        foreach($parts as $part){
            $key=$this->server->uuid.':'.$directory;
            $entries=$this->directories[$key]??= $this->getDirectory($directory);
            $entry=null;foreach($entries as $candidate)if(($candidate['name']??null)===$part){$entry=$candidate;break;}
            if(!$entry)return false;
            $directory=rtrim($directory,'/').'/'.$part;
        }
        return true;
    }
    public function optional(string $path,int $limit=2097152): ?string
    {
        if(str_starts_with($path,'/.vinus/')&&!$this->exists(dirname($path)))return null;
        try {
            // Read at most limit + 1 bytes even if the daemon omits Content-Length.
            $response=$this->getHttpClient()->get('/api/servers/'.$this->server->uuid.'/files/contents',['query'=>['file'=>$path],'stream'=>true,'timeout'=>8]);
            $body=$response->getBody();$result='';
            try { while(!$body->eof()&&strlen($result)<=$limit)$result.=$body->read(min(65536,$limit+1-strlen($result))); }
            finally {$body->close();}
            abort_unless(strlen($result)<=$limit,422,'Fichier de joueur trop volumineux.');return $result;
        } catch(\GuzzleHttp\Exception\RequestException $e){
            $status=$e->getResponse()?->getStatusCode();
            // Wings can return 500 when a parent directory is absent. Confirm absence; never hide a real daemon failure.
            if($status===404||($status===500&&!$this->exists($path)))return null;
            throw new DaemonConnectionException($e);
        }
        catch(\GuzzleHttp\Exception\TransferException $e){throw new DaemonConnectionException($e);}
    }
    public function json(string $path,int $limit=2097152): ?array
    {
        $bytes=$this->optional($path,$limit);if($bytes===null)return null;
        $data=json_decode($bytes,true,64);abort_unless(is_array($data),422,'Données de joueur illisibles.');return $data;
    }
    public function world(): string
    {
        $properties=$this->optional('/server.properties',65536)??'';
        preg_match('/^level-name=(.*)$/m',$properties,$matches);$world=trim($matches[1]??'world');
        abort_unless(preg_match('/^[\pL\pN _.-]{1,100}$/uD',$world)&&!in_array($world,['.','..']),422,'Nom du monde non pris en charge.');
        return '/'.$world;
    }
    public static function uuid(mixed $value): bool { return is_string($value)&&preg_match('/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/D',$value); }
    public function roster(): array
    {
        $players=[];
        foreach(['usercache.json','ops.json','whitelist.json','banned-players.json'] as $file){
            foreach($this->json('/'.$file)??[] as $entry){
                if(!self::uuid($entry['uuid']??null)||!is_string($entry['name']??null))continue;
                $uuid=$entry['uuid'];$players[$uuid]??=['uuid'=>$uuid,'name'=>mb_substr($entry['name'],0,40),'operator'=>false,'whitelisted'=>false,'banned'=>false,'online'=>null];
                if($file!=='usercache.json')$players[$uuid][['ops.json'=>'operator','whitelist.json'=>'whitelisted','banned-players.json'=>'banned'][$file]]=true;
            }
        }
        try {
            $response=$this->getHttpClient()->get('/api/servers/'.$this->server->uuid.'/files/list-directory',['query'=>['directory'=>$this->world().'/playerdata'],'timeout'=>8]);
            foreach(json_decode($response->getBody()->__toString(),true)??[] as $entry){
                $uuid=substr($entry['name']??'',0,-4);
                if(($entry['file']??false)&&!($entry['symlink']??false)&&str_ends_with($entry['name']??'','.dat')&&self::uuid($uuid))
                    $players[$uuid]??=['uuid'=>$uuid,'name'=>substr($uuid,0,8).'…','operator'=>false,'whitelisted'=>false,'banned'=>false,'online'=>null];
            }
        } catch(\GuzzleHttp\Exception\ClientException $e){if($e->getResponse()->getStatusCode()!==404)throw new DaemonConnectionException($e);}
        catch(\GuzzleHttp\Exception\TransferException $e){throw new DaemonConnectionException($e);}
        return $players;
    }
    public function bridge(): ?array
    {
        $data=$this->json('/.vinus/players/status.json');
        if(!$data||!is_array($data['players']??null)||!is_array($data['actions']??null)||($data['protocol']??null)!==1||!is_numeric($data['updated_at']??null)||abs(time()-(int)$data['updated_at'])>15)return null;
        return $data;
    }
}
