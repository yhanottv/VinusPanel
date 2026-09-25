package dev.vinuspanel.players;

import com.google.gson.Gson;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.world.item.ItemStack;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

/** Read-only bridge. No network listener, client mod or commands are required. */
public final class PlayerSnapshots {
    private static final Gson GSON = new Gson();
    private static final AtomicBoolean WRITING = new AtomicBoolean();
    private static ExecutorService writer;
    private static long tick;
    private static final Path ROOT=Path.of(".vinus","players").toAbsolutePath();
    private static Map<String,Object> map(Object... pairs) {
        Map<String,Object> result=new LinkedHashMap<>();for(int i=0;i<pairs.length;i+=2)result.put((String)pairs[i],pairs[i+1]);return result;
    }
    private static Object item(ItemStack stack,int slot) {
        if(stack.isEmpty())return null;
        return map("slot",slot,"id",BuiltInRegistries.ITEM.getKey(stack.getItem()).toString(),"count",stack.getCount(),
            "name",stack.getHoverName().getString(),"enchanted",stack.isEnchanted(),"damage",stack.getDamageValue());
    }
    private static Map<String,Object> identity(MinecraftServer server,ServerPlayer player) {
        var profile=player.getGameProfile();var list=server.getPlayerList();
        return map("uuid",player.getUUID().toString(),"name",profile.getName(),"online",true,
            "operator",list.isOp(profile),"whitelisted",list.getWhiteList().isWhiteListed(profile),"banned",list.getBans().isBanned(profile));
    }
    private static Map<String,Object> snapshot(MinecraftServer server,ServerPlayer player) {
        var data=identity(server,player);int level=player.experienceLevel;
        long total=Math.round(level<=16?level*(double)level+6*level:level<=31?2.5*level*level-40.5*level+360:4.5*level*level-162.5*level+2220);
        data.putAll(map("protocol",1,"updated_at",System.currentTimeMillis()/1000,"health",player.getHealth(),"max_health",player.getMaxHealth(),
            "food",player.getFoodData().getFoodLevel(),"armor",player.getArmorValue(),"level",level,"xp_progress",player.experienceProgress,
            "xp_total",total+Math.round(player.experienceProgress*player.getXpNeededForNextLevel()),"game_mode",player.gameMode.getGameModeForPlayer().getName(),
            "dimension",player.level().dimension().location().toString(),"skin",null));
        List<Object> inventory=new ArrayList<>();var inv=player.getInventory();
        for(int i=0;i<36;i++){var value=item(inv.getItem(i),i);if(value!=null)inventory.add(value);}
        for(int i=0;i<4;i++){var value=item(inv.armor.get(i),100+i);if(value!=null)inventory.add(value);}
        var off=item(player.getOffhandItem(),-106);if(off!=null)inventory.add(off);
        List<Object> ender=new ArrayList<>();for(int i=0;i<27;i++){var value=item(player.getEnderChestInventory().getItem(i),i);if(value!=null)ender.add(value);}
        data.put("inventory",inventory);data.put("ender_chest",ender);return data;
    }
    public static void tick(MinecraftServer server) {
        if(++tick%20!=0||!WRITING.compareAndSet(false,true))return;
        try {
            if(writer==null){Files.createDirectories(ROOT);writer=Executors.newSingleThreadExecutor(r->{Thread t=new Thread(r,"VinusPlayers-snapshots");t.setDaemon(true);return t;});}
            Map<String,Object> files=new LinkedHashMap<>();List<Object> players=new ArrayList<>();
            for(ServerPlayer player:server.getPlayerList().getPlayers()){players.add(identity(server,player));files.put(player.getUUID()+".json",snapshot(server,player));}
            files.put("status.json",map("protocol",1,"updated_at",System.currentTimeMillis()/1000,"players",players,"actions",List.of()));
            writer.submit(()->{try{for(var entry:files.entrySet())write(entry.getKey(),entry.getValue());}catch(Exception e){System.err.println("[VinusPlayers] Could not write snapshots: "+e.getClass().getSimpleName());}finally{WRITING.set(false);}});
        } catch(Exception e){WRITING.set(false);System.err.println("[VinusPlayers] Could not collect snapshots: "+e.getClass().getSimpleName());}
    }
    private static void write(String name,Object data) throws Exception {
        Path temp=Files.createTempFile(ROOT,".vinus-",".tmp");
        try{Files.writeString(temp,GSON.toJson(data),StandardCharsets.UTF_8);Files.move(temp,ROOT.resolve(name),StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);}finally{Files.deleteIfExists(temp);}
    }
    public static void stop() {
        if(writer!=null){writer.shutdown();try{writer.awaitTermination(5,TimeUnit.SECONDS);}catch(InterruptedException e){Thread.currentThread().interrupt();}writer=null;}
        try{Files.deleteIfExists(ROOT.resolve("status.json"));}catch(Exception ignored){}tick=0;
    }
}
