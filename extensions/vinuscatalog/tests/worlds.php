<?php
require ($argv[1] ?? '/var/www/pterodactyl').'/vendor/autoload.php';
foreach(['InstallArchive','WorldMetadata','WorldArchive','CatalogSources','ArchiveCatalog'] as $class)require __DIR__.'/../app/'.$class.'.php';
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\{WorldMetadata,WorldArchive,ArchiveCatalog};
use Symfony\Component\HttpKernel\Exception\HttpException;
new Illuminate\Foundation\Application(sys_get_temp_dir());
$checks=0;$check=function($ok,$message)use(&$checks){if(!$ok)throw new RuntimeException($message);$checks++;};
$reject=function($fn)use($check){try{$fn();throw new RuntimeException('Expected rejection');}catch(HttpException $e){$check($e->getStatusCode()===422,$e->getMessage());}};
$string=fn($s)=>pack('n',strlen($s)).$s;
$nbt="\x0a\x00\x00\x0a".$string('Data')."\x03".$string('DataVersion').pack('N',3955)."\x08".$string('LevelName').$string('Vinus Test Map')."\x0a".$string('Version')."\x08".$string('Name').$string('1.21.1')."\x00\x00\x00";
$gzip=gzencode($nbt);$meta=WorldMetadata::read($gzip);
$check($meta===['data_version'=>3955,'name'=>'Vinus Test Map','minecraft'=>'1.21.1'],'NBT metadata decoded');
$reject(fn()=>WorldMetadata::read('not gzip'));$reject(fn()=>WorldMetadata::read(gzencode(substr($nbt,0,-3))));$reject(fn()=>WorldMetadata::read(gzencode("\x0a\x00\x00\x00")));
$reject(fn()=>WorldMetadata::compatible($meta,'1.20.1'));WorldMetadata::compatible($meta,'1.21.1');WorldMetadata::compatible($meta,'1.21.2');$check(true,'Same/newer server accepted');
$active=WorldArchive::activate("level-name=old\nserver-port=25566\n",'world-test1234');$check(WorldArchive::active($active)==='world-test1234'&&str_contains($active,'server-port=25566'),'Active world changed without losing settings');
$reject(fn()=>WorldArchive::activate('','../outside'));
$root=sys_get_temp_dir().'/vinus-world-fixture-'.bin2hex(random_bytes(6));mkdir($root,0700);
$zip=function(array $files)use($root){$path=$root.'/'.bin2hex(random_bytes(6)).'.zip';$z=new ZipArchive();$z->open($path,ZipArchive::CREATE);foreach($files as $name=>$content)$z->addFromString($name,$content);$z->close();return $path;};
try{
 $archive=$zip(['Map Name/level.dat'=>$gzip,'Map Name/region/r.0.0.mca'=>'fixture','Map Name/uid.dat'=>'old uuid','Map Name/session.lock'=>'old lock','readme.txt'=>'outside map']);
 $world=WorldArchive::inspect($archive);$check($world['name']==='Vinus Test Map'&&count($world['files'])===2,'Root folder normalized and lock/UUID excluded');
 WorldArchive::bundle($archive,$world,$root.'/bundle.zip');$z=new ZipArchive();$z->open($root.'/bundle.zip');$check($z->getFromName('world/level.dat')===$gzip&&$z->numFiles===2,'Prepared archive stays under world root');$z->close();
 $reject(fn()=>WorldArchive::inspect($zip(['../level.dat'=>$gzip])));$reject(fn()=>WorldArchive::inspect($zip(['one/level.dat'=>$gzip,'two/level.dat'=>$gzip])));$reject(fn()=>WorldArchive::inspect($zip(['not-a-world.txt'=>'no world'])));
 $cf=['id'=>456,'modId'=>123,'isAvailable'=>true,'fileName'=>'Map.zip','fileLength'=>100,'downloadUrl'=>'https://edge.forgecdn.net/files/123/map.zip','hashes'=>[['algo'=>1,'value'=>str_repeat('a',40)]],'gameVersions'=>['1.21.1']];
 $check(ArchiveCatalog::normalize('123',$cf,'World')['sha1']===str_repeat('a',40),'CurseForge ZIP normalized');
 foreach([['modId'=>124],['downloadUrl'=>'https://evil.example/file.zip'],['hashes'=>[]],['fileLength'=>536870913],['fileName'=>'run.exe']] as $bad)$reject(fn()=>ArchiveCatalog::normalize('123',array_replace($cf,$bad),'World'));
}finally{foreach(glob($root.'/*')as$file)unlink($file);rmdir($root);}
echo $checks." world archive and provider checks passed.\n";
