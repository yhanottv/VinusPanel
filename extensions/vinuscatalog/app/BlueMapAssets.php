<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

/** The viewer can only read public map assets, never arbitrary server files. */
class BlueMapAssets
{
    public const ROOT = '/bluemap/web';
    public function __construct(private DaemonFileRepository $files) {}

    public static function mime(string $path): string
    {
        abort_unless(strlen($path) <= 400 && InstallArchive::safePath($path) && !preg_match('~%|(?:^|/)[.]~', $path), 404);
        $types = ['html'=>'text/html; charset=utf-8','js'=>'text/javascript; charset=utf-8','css'=>'text/css; charset=utf-8',
            'json'=>'application/json','png'=>'image/png','jpg'=>'image/jpeg','jpeg'=>'image/jpeg','webp'=>'image/webp','svg'=>'image/svg+xml',
            'ico'=>'image/x-icon','woff'=>'font/woff','woff2'=>'font/woff2','ttf'=>'font/ttf','prbm'=>'application/octet-stream','gz'=>'application/gzip','wasm'=>'application/wasm'];
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if ($extension==='conf' && preg_match('~^lang/[a-zA-Z0-9_-]+\.conf$~D',$path)) return 'text/plain; charset=utf-8';
        abort_unless(isset($types[$extension]), 404);
        return $types[$extension];
    }

    public function entry(Server $server, string $path): ?array
    {
        abort_unless(str_starts_with($path, '/') && InstallArchive::safePath(substr($path,1)), 404);
        $repository=$this->files->setServer($server); $parent='/'; $parts=explode('/',substr($path,1));
        foreach ($parts as $index=>$part) {
            $entry=collect($repository->getDirectory($parent))->firstWhere('name',$part);
            if (!$entry) return null;
            abort_if($entry['symlink'] ?? false, 422, 'Un lien symbolique ne peut pas servir de carte.');
            if ($index<count($parts)-1) abort_if($entry['file'],422,'Le chemin de la carte est invalide.');
            $parent=rtrim($parent,'/').'/'.$part;
        }
        return $entry;
    }

    public function read(Server $server, string $path): array
    {
        $mime=self::mime($path);$gzip=false;$absolute=self::ROOT.'/'.$path;
        $entry=$this->entry($server,$absolute);
        if (!$entry && in_array(pathinfo($path,PATHINFO_EXTENSION),['json','prbm'],true)) {
            $absolute.='.gz';$entry=$this->entry($server,$absolute);$gzip=(bool)$entry;
        }
        if (!$entry) return ['status'=>str_contains($path,'/tiles/')?204:404,'body'=>'','mime'=>$mime,'gzip'=>false];
        abort_unless($entry['file'] && $entry['size']<=16777216,422,'Ressource de carte trop volumineuse.');
        $body=$this->files->setServer($server)->getContent($absolute,16777216);
        if ($path==='index.html') $body=preg_replace('/<head\b[^>]*>/i','$0<script>'.self::bootstrap().'</script>',$body,1);
        return ['status'=>200,'body'=>$body,'mime'=>$mime,'gzip'=>$gzip];
    }

    public function ready(Server $server): bool
    {
        if (!$this->entry($server,self::ROOT.'/index.html') || !$this->entry($server,self::ROOT.'/settings.json')) return false;
        $settings=json_decode($this->files->setServer($server)->getContent(self::ROOT.'/settings.json',1048576),true);
        if (!is_array($settings) || !is_array($settings['maps']??null) || !$settings['maps']) return false;
        foreach ($settings['maps'] as $map) {
            if (!is_string($map) || !preg_match('/^[a-zA-Z0-9_-]{1,160}$/D',$map)) continue;
            if ($this->entry($server,self::ROOT.'/maps/'.$map.'/settings.json') &&
                ($this->entry($server,self::ROOT.'/maps/'.$map.'/textures.json') || $this->entry($server,self::ROOT.'/maps/'.$map.'/textures.json.gz'))) return true;
        }
        return false;
    }

    public function content(Server $server,string $path): ?string
    {
        $entry=$this->entry($server,$path);
        if(!$entry || !$entry['file'])return null;
        return $this->files->setServer($server)->getContent($path,1048576);
    }

    public static function bootstrap(): string
    {
        // BlueMap marker toggles use localStorage even with use-cookies=false.
        // Keep that state in memory inside the opaque frame, never in panel storage.
        return <<<'JS'
(()=>{for(const name of ['localStorage','sessionStorage']){try{void window[name].length;}catch{const data=new Map();Object.defineProperty(window,name,{value:{get length(){return data.size},key:i=>Array.from(data.keys())[i]??null,getItem:k=>data.get(String(k))??null,setItem:(k,v)=>data.set(String(k),String(v)),removeItem:k=>data.delete(String(k)),clear:()=>data.clear()}});}}window.addEventListener('error',event=>{if(!event.message)return;const show=()=>{let box=document.getElementById('vinus-viewer-error');if(!box){box=document.createElement('div');box.id='vinus-viewer-error';box.setAttribute('role','alert');box.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;padding:16px;border-radius:8px;background:#241b20;color:#f2bdc7;font:14px/1.6 sans-serif;z-index:99999';document.body.appendChild(box);}box.textContent='BlueMap: '+event.message.slice(0,250);};document.body?show():window.addEventListener('DOMContentLoaded',show,{once:true});});})();
JS;
    }

    public static function headers(string $origin,string $base,string $mime): array
    {
        $bootstrap=base64_encode(hash('sha256',self::bootstrap(),true));
        // CSP sandbox is also enforced on direct navigation: map scripts never gain panel origin access.
        // BlueMap's bundled vue-i18n compiles translations with new Function.
        // Allow that only in this opaque, map-only sandbox; the panel CSP is untouched.
        return ['Content-Type'=>$mime,'Access-Control-Allow-Origin'=>'*','Cache-Control'=>'private, no-store',
            'Referrer-Policy'=>'no-referrer','X-Content-Type-Options'=>'nosniff','X-Frame-Options'=>'SAMEORIGIN',
            'Content-Security-Policy'=>"sandbox allow-scripts allow-pointer-lock; default-src 'none'; script-src $base 'sha256-$bootstrap' 'unsafe-eval'; style-src $base 'unsafe-inline'; img-src $base data: blob:; font-src $base data:; connect-src $base; worker-src blob:; manifest-src data:; base-uri 'none'; form-action 'none'; frame-ancestors $origin;"];
    }
}
