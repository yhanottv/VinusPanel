package dev.vinuspanel.players;

import com.google.gson.Gson;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import org.bukkit.*;
import org.bukkit.attribute.Attribute;
import org.bukkit.command.*;
import org.bukkit.entity.Player;
import org.bukkit.event.*;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.Damageable;
import org.bukkit.plugin.java.JavaPlugin;

public final class VinusPlayers extends JavaPlugin implements Listener {
    private static final Set<String> ACTIONS = Set.of("heal","kill","feed","operator","whitelist","ban","gamemode","experience");
    private final Gson gson = new Gson();
    private final AtomicBoolean writing = new AtomicBoolean();
    private final Set<String> completed = new LinkedHashSet<>();
    private ExecutorService writer;
    private Path root;

    @Override public void onEnable() {
        saveDefaultConfig();
        root = Path.of(".vinus", "players").toAbsolutePath();
        try { Files.createDirectories(root.resolve("results")); }
        catch (IOException e) { getLogger().severe("Cannot create player snapshot directory."); getServer().getPluginManager().disablePlugin(this); return; }
        writer = Executors.newSingleThreadExecutor(r -> { Thread t = new Thread(r, "VinusPlayers-writer"); t.setDaemon(true); return t; });
        getServer().getPluginManager().registerEvents(this,this);
        getServer().getScheduler().runTaskTimer(this,this::publish,1,20);
        getServer().getScheduler().runTaskTimerAsynchronously(this,() -> {
            try(var paths=Files.list(root.resolve("results"))) {
                paths.filter(p -> p.getFileName().toString().matches("[a-f0-9]{32}\\.json")).forEach(p -> {
                    try { if(System.currentTimeMillis()-Files.getLastModifiedTime(p).toMillis()>600000)Files.deleteIfExists(p); } catch(IOException ignored) {}
                });
            } catch(IOException ignored) {}
        },1200,1200);
    }
    private static Map<String,Object> map(Object... pairs) {
        Map<String,Object> result=new LinkedHashMap<>();for(int i=0;i<pairs.length;i+=2)result.put((String)pairs[i],pairs[i+1]);return result;
    }
    private Map<String,Object> identity(OfflinePlayer player) {
        return map("uuid",player.getUniqueId().toString(),"name",player.getName(),"online",player.isOnline(),"operator",player.isOp(),"whitelisted",player.isWhitelisted(),"banned",player.isBanned());
    }
    private Map<String,Object> item(ItemStack stack,int slot) {
        if(stack==null||stack.getType().isAir())return null;
        var meta=stack.getItemMeta();
        return map("slot",slot,"id",stack.getType().getKey().toString(),"count",stack.getAmount(),
            "name",meta!=null&&meta.hasDisplayName()?ChatColor.stripColor(meta.getDisplayName()):null,
            "enchanted",!stack.getEnchantments().isEmpty()||(meta instanceof org.bukkit.inventory.meta.EnchantmentStorageMeta enchanted&&!enchanted.getStoredEnchants().isEmpty()),
            "damage",meta instanceof Damageable damage?damage.getDamage():0);
    }
    private Map<String,Object> snapshot(Player player,boolean online) {
        var result=identity(player);result.put("online",online);result.put("protocol",1);result.put("updated_at",System.currentTimeMillis()/1000);
        var max=player.getAttribute(Attribute.GENERIC_MAX_HEALTH);var armor=player.getAttribute(Attribute.GENERIC_ARMOR);
        result.putAll(map("health",player.getHealth(),"max_health",max==null?20:max.getValue(),"food",player.getFoodLevel(),"armor",armor==null?0:armor.getValue(),
            "level",player.getLevel(),"xp_progress",player.getExp(),"xp_total",experience(player.getLevel())+Math.round(player.getExp()*player.getExpToLevel()),"game_mode",player.getGameMode().name().toLowerCase(Locale.ROOT),"dimension",player.getWorld().getKey().toString()));
        var skin=player.getPlayerProfile().getTextures().getSkin();result.put("skin",skin==null?null:skin.toString());
        List<Object> inventory=new ArrayList<>();var inv=player.getInventory();
        for(int i=0;i<36;i++){var item=item(inv.getItem(i),i);if(item!=null)inventory.add(item);}
        ItemStack[] equipment={inv.getBoots(),inv.getLeggings(),inv.getChestplate(),inv.getHelmet(),inv.getItemInOffHand()};
        for(int i=0;i<equipment.length;i++){var item=item(equipment[i],i==4?-106:100+i);if(item!=null)inventory.add(item);}
        List<Object> ender=new ArrayList<>();for(int i=0;i<27;i++){var item=item(player.getEnderChest().getItem(i),i);if(item!=null)ender.add(item);}
        result.put("inventory",inventory);result.put("ender_chest",ender);return result;
    }
    private Map<String,Object> status() {
        return map("protocol",1,"updated_at",System.currentTimeMillis()/1000,"players",Bukkit.getOnlinePlayers().stream().map(this::identity).toList(),
            "actions",ACTIONS.stream().filter(a->getConfig().getBoolean("actions."+a,true)).sorted().toList());
    }
    private void write(String file,Object data) throws IOException {
        Path target=root.resolve(file);Path temp=Files.createTempFile(target.getParent(),".vinus-",".tmp");
        try {Files.writeString(temp,gson.toJson(data),StandardCharsets.UTF_8);Files.move(temp,target,StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);}
        finally {Files.deleteIfExists(temp);}
    }
    private void publish() {
        if(!writing.compareAndSet(false,true))return;
        try {
            Map<String,Object> snapshots=new LinkedHashMap<>();for(Player p:Bukkit.getOnlinePlayers())snapshots.put(p.getUniqueId()+".json",snapshot(p,true));
            snapshots.put("status.json",status());
            writer.submit(()->{try{for(var entry:snapshots.entrySet())write(entry.getKey(),entry.getValue());}catch(IOException e){getLogger().warning("Player snapshot could not be written.");}finally{writing.set(false);}});
        } catch(RuntimeException e){writing.set(false);getLogger().warning("Player snapshot could not be collected.");}
    }
    @EventHandler public void onQuit(PlayerQuitEvent event) {
        var data=snapshot(event.getPlayer(),false);String file=event.getPlayer().getUniqueId()+".json";writer.submit(()->{try{write(file,data);}catch(IOException ignored){}});
    }
    private static long experience(int level) { return Math.round(level<=16?level*(double)level+6*level:level<=31?2.5*level*level-40.5*level+360:4.5*level*level-162.5*level+2220); }
    @Override public boolean onCommand(CommandSender sender,Command command,String label,String[] args) {
        if(!(sender instanceof ConsoleCommandSender)&&!(sender instanceof RemoteConsoleCommandSender)){sender.sendMessage("VinusPlayers is console-only.");return true;}
        if(args.length<3||args.length>4||!ACTIONS.contains(args[0])||!args[1].matches("[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}")||!args[2].matches("[a-f0-9]{32}"))return true;
        String action=args[0],request=args[2];UUID uuid=UUID.fromString(args[1]);
        if(completed.contains(request)||Files.exists(root.resolve("results/"+request+".json")))return true;
        completed.add(request);if(completed.size()>4096)completed.remove(completed.iterator().next());
        boolean success=false;String code="failed";
        try {
            if(!getConfig().getBoolean("actions."+action,true))throw new IllegalArgumentException("disabled");
            OfflinePlayer target=Bukkit.getOfflinePlayer(uuid);Player player=target.getPlayer();
            if(!target.hasPlayedBefore()&&player==null)throw new IllegalArgumentException("unknown_player");
            String value=args.length==4?args[3]:"";
            if(Set.of("operator","whitelist","ban").contains(action)) {
                if(!Set.of("true","false").contains(value))throw new IllegalArgumentException("invalid_value");boolean enable=Boolean.parseBoolean(value);
                if(action.equals("operator"))target.setOp(enable);
                else if(action.equals("whitelist"))target.setWhitelisted(enable);
                else {
                    String name=target.getName();if(name==null||!name.matches("[A-Za-z0-9_]{1,16}"))throw new IllegalArgumentException("unknown_player");
                    Bukkit.dispatchCommand(Bukkit.getConsoleSender(),(enable?"minecraft:ban ":"minecraft:pardon ")+name+(enable?" VinusPanel moderation":""));
                }
                boolean actual=action.equals("operator")?target.isOp():action.equals("whitelist")?target.isWhitelisted():target.isBanned();
                if(actual!=enable)throw new IllegalArgumentException("not_applied");
            } else {
                if(player==null||!player.isOnline())throw new IllegalArgumentException("offline");
                switch(action) {
                    case "heal" -> {if(player.isDead())throw new IllegalArgumentException("dead");player.setHealth(Objects.requireNonNull(player.getAttribute(Attribute.GENERIC_MAX_HEALTH)).getValue());player.setFireTicks(0);}
                    case "kill" -> player.setHealth(0);
                    case "feed" -> {player.setFoodLevel(20);player.setSaturation(20);}
                    case "gamemode" -> {if(!Set.of("survival","creative","adventure","spectator").contains(value))throw new IllegalArgumentException("invalid_value");player.setGameMode(GameMode.valueOf(value.toUpperCase(Locale.ROOT)));}
                    case "experience" -> {if(!value.matches("[0-9]{1,5}")||Integer.parseInt(value)>10000)throw new IllegalArgumentException("invalid_value");player.setLevel(Integer.parseInt(value));player.setExp(0);}
                    default -> throw new IllegalArgumentException("invalid_action");
                }
            }
            success=true;code="ok";
            if(player!=null){var data=snapshot(player,player.isOnline());writer.submit(()->{try{write(uuid+".json",data);}catch(IOException ignored){}});}
        } catch(IllegalArgumentException e){code=Set.of("disabled","unknown_player","invalid_value","not_applied","offline","dead").contains(e.getMessage())?e.getMessage():"failed";}
        catch(RuntimeException e){getLogger().warning("Player action could not be applied.");}
        var result=map("request_id",request,"uuid",uuid.toString(),"success",success,"code",code,"updated_at",System.currentTimeMillis()/1000);
        var state=status();writer.submit(()->{try{write("status.json",state);write("results/"+request+".json",result);}catch(IOException e){getLogger().warning("Player action acknowledgement could not be written.");}});
        return true;
    }
    @Override public void onDisable() {
        if(writer==null)return;writer.shutdown();try{writer.awaitTermination(5,TimeUnit.SECONDS);}catch(InterruptedException e){Thread.currentThread().interrupt();}
        try {Files.deleteIfExists(root.resolve("status.json"));}catch(IOException ignored){}
    }
}
