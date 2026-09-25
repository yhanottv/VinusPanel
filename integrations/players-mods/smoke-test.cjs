// Run only against a disposable loopback server. Requires mineflayer and rcon-client.
const fs=require('node:fs');
const {createBot}=require('mineflayer');
const {Rcon}=require('rcon-client');
const [root,port,rconPort,version]=process.argv.slice(2);
if(!root||!port||!rconPort||!version)throw Error('Usage: node smoke-test.cjs ROOT GAME_PORT RCON_PORT MINECRAFT_VERSION');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const name='VinusBridgeTest';
(async()=>{
 let bot,rcon,checks=0;
 const check=(value,label)=>{if(!value)throw Error(label);console.log('PASS '+label);checks++;};
 try{
  const password=fs.readFileSync(root+'/server.properties','utf8').match(/^rcon.password=(.*)$/m)[1];
  rcon=await Rcon.connect({host:'127.0.0.1',port:Number(rconPort),password});
  await rcon.send('gamerule doMobSpawning false');await rcon.send('gamerule naturalRegeneration false');await rcon.send('time set day');
  bot=createBot({host:'127.0.0.1',port:Number(port),username:name,auth:'offline',version});bot.on('error',()=>{});
  await new Promise((resolve,reject)=>{bot.once('spawn',resolve);bot.once('error',reject);setTimeout(()=>reject(Error('Player spawn timeout')),45000).unref();});
  const status=()=>JSON.parse(fs.readFileSync(root+'/.vinus/players/status.json'));
  await sleep(2500);const identity=status().players.find(p=>p.name===name);check(!!identity,'online player identity');
  const snapshot=()=>JSON.parse(fs.readFileSync(root+'/.vinus/players/'+identity.uuid+'.json'));
  check(status().actions.length===0,'read-only bridge advertises no commands');
  await rcon.send('clear '+name);await rcon.send('give '+name+' minecraft:apple 12');
  await rcon.send('item replace entity '+name+' armor.head with minecraft:diamond_helmet');
  await rcon.send('item replace entity '+name+' enderchest.0 with minecraft:emerald 3');
  await rcon.send('experience set '+name+' 23 levels');await sleep(2500);
  check(snapshot().level===23,'live experience level');
  check(snapshot().xp_total===751,'total experience');
  check(snapshot().inventory.some(i=>i.id==='minecraft:apple'&&i.count===12),'inventory count');
  check(snapshot().inventory.some(i=>i.id==='minecraft:diamond_helmet'&&i.slot===103),'helmet slot');
  check(snapshot().ender_chest.some(i=>i.id==='minecraft:emerald'&&i.count===3),'ender chest');
  await rcon.send('damage '+name+' 4');await rcon.send('effect give '+name+' minecraft:hunger 3 100 true');await sleep(4500);
  check(snapshot().health<20,'live health');check(snapshot().food<20,'live food');check(snapshot().armor>0,'armor value');
  await rcon.send('gamemode creative '+name);await sleep(2500);check(snapshot().game_mode==='creative','live game mode');
  check(Date.now()/1000-snapshot().updated_at<4,'snapshot freshness');
  bot.quit();bot=null;await sleep(2500);check(!status().players.some(p=>p.name===name),'player disconnect');
  console.log('Read-only mod bridge: '+checks+' checks passed.');
 }finally{if(bot)bot.quit();if(rcon)await rcon.end();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
