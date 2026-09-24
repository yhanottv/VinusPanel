<?php
// Standalone tests for the bounded save decoder and command allowlist.
function abort_unless($condition,$status=500,$message=''){if(!$condition)throw new RuntimeException($message,$status);}
function abort($status=500,$message=''){throw new RuntimeException($message,$status);}
require __DIR__.'/../extensions/vinuscatalog/app/PlayerNbt.php';
// Only the pure command compiler is exercised; no requests are dispatched.
eval('namespace Pterodactyl\\Http\\Controllers; class Controller {}');
eval('namespace Pterodactyl\\Repositories\\Wings; class DaemonFileRepository {}');
require __DIR__.'/../extensions/vinuscatalog/app/PlayerFiles.php';
require __DIR__.'/../extensions/vinuscatalog/app/PlayerController.php';
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\{PlayerNbt,PlayerController};
$checks=0;
function check($condition){global $checks;if(!$condition)throw new RuntimeException('Player test failed at '.($checks+1));$checks++;}
function rejected($operation){try{$operation();}catch(RuntimeException $e){check(true);return;}throw new RuntimeException('Unsafe input accepted');}
$str=fn($value)=>pack('n',strlen($value)).$value;
$tag=fn($type,$name,$value)=>chr($type).$str($name).$value;
$raw=chr(10).$str('').$tag(5,'Health',pack('G',17.5)).$tag(3,'XpLevel',pack('N',23)).$tag(8,'Dimension',$str('minecraft:overworld')).chr(0);
$data=PlayerNbt::profile(PlayerNbt::read(gzencode($raw)));
check($data['health']===17.5);check($data['level']===23.0);check($data['dimension']==='minecraft:overworld');check($data['max_health']===null);
$legacy=PlayerNbt::items([['Slot'=>-106,'id'=>'minecraft:diamond_sword','Count'=>1,'tag'=>['Enchantments'=>[['id'=>'minecraft:sharpness','lvl'=>3]],'display'=>['Name'=>'{"text":"My sword"}']]]]);
check($legacy[0]['slot']===-106);check($legacy[0]['enchanted']===true);check($legacy[0]['name']==='My sword');
$modern=PlayerNbt::items([['Slot'=>9,'id'=>'minecraft:apple','count'=>12,'components'=>['minecraft:custom_name'=>'"Fruit"']]]);
check($modern[0]['count']===12);check($modern[0]['name']==='Fruit');
check(PlayerNbt::items([['Slot'=>0,'id'=>'<script>','count'=>1]])===[]);
rejected(fn()=>PlayerNbt::read(gzencode(substr($raw,0,-2))));
rejected(fn()=>PlayerNbt::read('not gzip'));
rejected(fn()=>PlayerNbt::read(gzencode(chr(10).$str('').$tag(9,'Inventory',chr(10).pack('N',100001)))));
$uuid='00000000-0000-4000-8000-000000000001';$request=str_repeat('a',32);
check(PlayerController::command('heal',$uuid,$request,null)==='vinusplayers heal '.$uuid.' '.$request);
check(str_ends_with(PlayerController::command('operator',$uuid,$request,false),'false'));
check(str_ends_with(PlayerController::command('experience',$uuid,$request,23),'23'));
rejected(fn()=>PlayerController::command('say',$uuid,$request,'anything'));
rejected(fn()=>PlayerController::command('operator',$uuid,$request,'false'));
rejected(fn()=>PlayerController::command('heal',$uuid."\nstop",$request,null));
rejected(fn()=>PlayerController::command('heal',$uuid,'../file',null));
rejected(fn()=>PlayerController::command('experience',$uuid,$request,-1));
rejected(fn()=>PlayerController::command('experience',$uuid,$request,10001));
rejected(fn()=>PlayerController::command('gamemode',$uuid,$request,'creative\nop other'));
$snapshot=PlayerNbt::snapshot(['health'=>INF,'food'=>100,'inventory'=>[['slot'=>0,'id'=>'minecraft:apple','count'=>-3],['slot'=>'bad','id'=>'minecraft:apple']], 'ender_chest'=>'invalid','game_mode'=>['creative']]);
check($snapshot['health']===null);check($snapshot['food']===20);check(count($snapshot['inventory'])===1);check($snapshot['inventory'][0]['count']===1);check($snapshot['ender_chest']===[]);check($snapshot['game_mode']===null);
echo "Player data and commands: $checks checks passed.\n";
