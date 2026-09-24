# Minecraft player management

The **Players** page lists known players, including offline players, with a read-only inventory, equipment, Ender chest, skin, health, food and experience. It uses each server's own files; there is no shared player database.

## Requirements and capabilities

- VinusPanel and the `vinuscatalog` Blueprint extension, installed separately following [the extension instructions](../extensions/vinuscatalog/README.md). Updating only the theme does not update the extension.
- Minecraft Java saves: modern and legacy item NBT are supported. Unknown modded items retain their identifier and quantity with a fallback icon.
- Live data and controls: **VinusPlayers 1.0.1**, Java 21, Bukkit/Spigot API 1.21.1. Validated on Paper 1.21.1. Youer exposes the Bukkit API but should be tested with your plugin/mod combination. Native Fabric/Forge, Bedrock and proxies cannot load this Bukkit plugin; saved inventories can still be read for Java servers. Folia is not supported.
- Panel users need `file.read-content` to view player data and additionally `control.console` for actions. The feature grants no extra permissions to subusers.

Without the companion, the panel displays the last saved inventory and labels it accordingly. Live presence is unknown while the Minecraft process runs. A stopped server's players are shown offline. Missing values are shown as unavailable, not invented. A player may have no inventory save yet.

## Install the companion

Build from the repository using Maven and JDK 21:

```sh
mvn -f integrations/players-bukkit/pom.xml clean package
```

Alternatively, download the `VinusPlayers` artifact from a successful **Player companion** GitHub Actions run. Put `vinus-players-1.0.1.jar` into the Minecraft server's `plugins/` directory, then perform a planned server restart. Do not use hot-reload tools. The server creates `plugins/VinusPlayers/config.yml` and `.vinus/players/`.

Each action can be disabled in the companion configuration. Restart the Minecraft server after editing it. Disabled actions are also disabled in the panel. No RCON, public port, API key or plugin permission assigned to players is required.

## Item artwork

Minecraft artwork is separate from the theme's open-source code. Generate the optional item sprite sheet from Mojang's official client distribution on your own installation:

```sh
python3 scripts/fetch-player-textures.py /var/www/pterodactyl/public/assets/images/vinus/players
```

The script validates Mojang's published checksums. Keep the generated `NOTICE.txt` with the files. Without artwork, the inventory remains functional and shows identifiers and quantities. Custom/modded textures and custom ItemsAdder models are not included. The current sprite source is Minecraft Java 1.21.1; newer or modded items use the fallback icon.

Skins are fetched through the authenticated panel endpoint from Mojang's profile/texture services, cached privately, and displayed as a pixel-art front view. Offline-mode UUIDs without a supplied official texture may not resolve to a skin; a neutral silhouette is shown.

## Data and actions

The companion writes atomic snapshots every second. The selected live profile refreshes every second while visible (normally within about two seconds plus network latency). Lists and saved profiles refresh every five seconds. Returning to the tab refreshes immediately; requests never overlap within one polling session. The XP and game-mode controls follow live values unless the user is editing an unapplied draft. A heartbeat older than 15 seconds disables live actions. Snapshots are stored only inside the selected Minecraft server volume and are accessed via authenticated Wings file access. Do not publish `.vinus/`, player saves, server properties, credentials, or production screenshots in this repository.

The only accepted actions are heal, kill, feed, operator, whitelist, ban, game mode and XP level. The PHP controller validates UUIDs, values, server permissions and server state. The companion accepts commands only from the server console (including an administrator's RCON console), never from an in-game player, even an operator. Unique request IDs suppress duplicate execution. The UI reports success only after the server acknowledges the result; a timeout does not trigger a second command.

Kill, operator changes and bans require confirmation. Healing, feeding, game mode and XP require an online player. Operator, whitelist and ban flags may be changed for a known offline player while the companion is running. Whitelisting a player does not globally enable the server whitelist. Set-level resets progress within that level to zero. Inventory and Ender chest contents are **read-only**.

## Refresh cost

Minecraft player count and open panel tabs are separate costs. Each visible live profile makes approximately one HTTP request per second; a tab reads only its selected profile, not every inventory. Fifty players with one profile open do not produce fifty browser requests per second. Fifty visible profile tabs can produce roughly fifty requests per second before action requests and network delays.

The companion collects all online players once per second on the Minecraft thread, including 36 inventory slots, five equipment slots and 27 Ender chest slots per player. At fifty players that is about 3,400 slot inspections per second, plus item metadata and player state. JSON serialization and atomic file writes run on one background worker. A periodic collection is skipped while the previous periodic write is unfinished, preventing periodic snapshots from accumulating indefinitely. Main-thread collection still has a cost; this is not a fifty-player capacity guarantee.

Before relying on this at scale, compare Minecraft tick time and CPU with representative inventories, and panel/Wings response time with the expected number of simultaneous viewers. No fifty-player production load test has been performed.

## Verification commands

```sh
php scripts/test-players.php
mvn -f integrations/players-bukkit/pom.xml clean package
```

The PHP checks cover bounded NBT decoding, item parsing and command validation. Live integration checks were performed against an isolated Paper server with a disposable bot; they do not exercise a production player's inventory or permissions. See the PR validation notes for the exact tested actions.
