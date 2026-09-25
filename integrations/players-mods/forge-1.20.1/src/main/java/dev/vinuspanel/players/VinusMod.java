package dev.vinuspanel.players;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.event.server.ServerStoppingEvent;
@Mod("vinusplayers")
public final class VinusMod {
 public VinusMod(){MinecraftForge.EVENT_BUS.addListener(this::tick);MinecraftForge.EVENT_BUS.addListener(this::stop);}
 private void tick(TickEvent.ServerTickEvent event){if(event.phase==TickEvent.Phase.END)PlayerSnapshots.tick(event.getServer());}
 private void stop(ServerStoppingEvent event){PlayerSnapshots.stop();}
}
