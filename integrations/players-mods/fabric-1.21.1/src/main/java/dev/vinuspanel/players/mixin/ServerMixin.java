package dev.vinuspanel.players.mixin;

import dev.vinuspanel.players.PlayerSnapshots;
import net.minecraft.server.MinecraftServer;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
@Mixin(MinecraftServer.class)
abstract class ServerMixin {
 @Inject(method="tickServer",at=@At("TAIL")) private void vinus$tick(CallbackInfo ci){PlayerSnapshots.tick((MinecraftServer)(Object)this);}
 @Inject(method="stopServer",at=@At("HEAD")) private void vinus$stop(CallbackInfo ci){PlayerSnapshots.stop();}
}
