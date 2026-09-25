<?php
/** Read-only request/offer checks against an installed panel; no software installation is attempted. */
$panel=rtrim($argv[1]??'', '/');
if(!is_file($panel.'/vendor/autoload.php'))throw new RuntimeException('Pass the panel path.');
require $panel.'/vendor/autoload.php';
$app=require $panel.'/bootstrap/app.php';$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if(isset($argv[2]))foreach(['PlayerCompanion','SoftwareController','ModpackController'] as $class)require rtrim($argv[2],'/').'/'.$class.'.php';
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\{PlayerCompanion,SoftwareController,ModpackController};
use Illuminate\Http\Request;
$checks=0;function check($value){global $checks;if(!$value)throw new RuntimeException('Consent check failed: '.($checks+1));$checks++;}
$companion=app(PlayerCompanion::class);
foreach([['PAPER','1.21.1',null,'plugin',false],['FABRIC','1.21.1','0.16.14','mod',true],['FORGE','1.20.1','47.3.0','mod',true],['NEOFORGE','1.21.1','21.1.219','mod',true]] as [$software,$version,$loader,$kind,$readOnly]){
 $offer=$companion->offer(['software'=>$software,'version'=>$version,'label'=>'Test','loader_version'=>$loader],'java_21');
 check($offer['supported']&&$offer['kind']===$kind&&$offer['read_only']===$readOnly);
}
check(!$companion->offer(['software'=>'FABRIC','version'=>'1.21.1','label'=>'Test','loader_version'=>'0.1.0'],'java_21')['supported']);
check(!$companion->offer(['software'=>'PAPER','version'=>'1.21.1','label'=>'Test'],'java_17')['supported']);
$server=new Pterodactyl\Models\Server();$server->uuid='00000000-0000-4000-8000-000000000001';
$user=new class {public int $id=0;function can($permission,$server){return $permission!=='control.console';}};
foreach([SoftwareController::class,ModpackController::class] as $controller){
 foreach([null,'invalid',true,false] as $choice){
  $input=['token'=>bin2hex(random_bytes(24)),'optional'=>[],'replace'=>true];if($choice!==null)$input['install_players']=$choice;
  $request=Request::create('/api/consent-check','POST',$input);$request->setUserResolver(fn()=>$user);
  try{app($controller)->install($request,$server);throw new RuntimeException('Unexpected installation');}
  catch(Illuminate\Validation\ValidationException $e){check(($choice===null||$choice==='invalid')&&isset($e->errors()['install_players']));}
  catch(Symfony\Component\HttpKernel\Exception\HttpException $e){check($e->getStatusCode()===($choice===true?403:422));}
 }
}
echo "Player consent: $checks checks passed; no game files changed.\n";
