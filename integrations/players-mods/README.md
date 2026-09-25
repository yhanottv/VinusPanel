# Native Minecraft player snapshots

Server-only bridges built from the shared `common/` source. They publish protocol 1 snapshots to `.vinus/players/` every 20 server ticks, with one background JSON writer and backpressure. No client mod, RCON or network listener is required. Tick lag delays refreshes. Inventories and controls are read-only in these mods; `actions: []` disables panel commands.

## Build

Use JDK 17 with Forge and JDK 21 with the other build tools. Fabric 1.20.1 still targets Java 17. Install Gradle explicitly; wrappers and downloaded dependencies are not committed.

| Directory | Gradle | Build Java | Loader API |
| --- | --- | --- | --- |
| fabric-1.20.1 | 8.10.2 | 21 | Fabric Loader 0.16.10 / Loom 1.8.13 |
| fabric-1.21.1 | 8.10.2 | 21 | Fabric Loader 0.16.10 / Loom 1.8.13 |
| forge-1.20.1 | 8.10.2 | 17 | Forge 47.3.0 / ForgeGradle 6.0.54 |
| neoforge-1.21.1 | 8.14 | 21 | NeoForge 21.1.219 / ModDevGradle 2.0.147 |

Run `gradle -p integrations/players-mods/<directory> clean build --no-daemon --max-workers=1`. For NeoForge, set `CI=true` to use the binary compilation pipeline and avoid memory-intensive source decompilation. Do not share a writable Gradle cache between concurrent Docker containers with separate PID namespaces.

After building these four modules and the Bukkit companion, run `python3 scripts/bundle-player-companions.py`. It rejects empty JARs, missing loader metadata and bundled classes outside our namespace, then writes the extension's manifest and SHA-256 checksums. The source is covered by the repository license. Minecraft and loader dependencies are downloaded only into build caches and are not redistributed.

## Runtime verification

Use disposable, isolated servers with ports bound to loopback. Install `mineflayer` and `rcon-client` in a separate QA directory, copy `smoke-test.cjs` there, then run:

```sh
node smoke-test.cjs /path/to/disposable-server 25565 25575 1.21.1
```

The script reads that test server's RCON password without logging it, joins as `VinusBridgeTest`, and modifies only that bot's game state. It checks identity, XP, inventory, armor, Ender chest, food, health, game mode, snapshot freshness and disconnect handling. It is a functional integration test, not a load test. Do not run it against a production server.

See [the exact enabled runtime matrix](../../docs/PLAYERS.md). A successful compile alone does not establish compatibility; add a new version only after boot and live snapshot checks. Custom item IDs survive; custom models and textures use the panel fallback. The mod does not export item components or NBT for editing.
