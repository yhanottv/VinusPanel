package dev.vinuspanel.players;
import net.neoforged.fml.common.Mod;
import net.neoforged.neoforge.common.NeoForge;
import net.neoforged.neoforge.event.tick.ServerTickEvent;
import net.neoforged.neoforge.event.server.ServerStoppingEvent;
@Mod("vinusplayers")
public final class VinusMod {
 public VinusMod(){NeoForge.EVENT_BUS.addListener(this::tick);NeoForge.EVENT_BUS.addListener(this::stop);}
 private void tick(ServerTickEvent.Post event){PlayerSnapshots.tick(event.getServer());}
 private void stop(ServerStoppingEvent event){PlayerSnapshots.stop();}
}
