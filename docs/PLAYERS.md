# Minecraft player management

The **Players** page lists known players, including offline players, with a read-only inventory, equipment, Ender chest, skin, health, food and experience. It uses each server's own files; there is no shared player database.

## Requirements and capabilities

- VinusPanel and the `vinuscatalog` Blueprint extension, installed separately following [the extension instructions](../extensions/vinuscatalog/README.md). Updating only the theme does not update the extension.
- Minecraft Java saves: modern and legacy item NBT are supported. Unknown modded items retain their identifier and quantity with a fallback icon.
- Live data: a compatible **VinusPlayers 1.1.0** companion from the exact matrix below. Bukkit provides actions; the native mods provide read-only snapshots. Folia, Vanilla, proxies, Bedrock and other versions are not automatically supported.
- Panel users need `file.read-content` to view player data and additionally `control.console` for actions. The feature grants no extra permissions to subusers.

Without the companion, the panel displays the last saved inventory and labels it accordingly. Live presence is unknown while the Minecraft process runs. A stopped server's players are shown offline. Missing values are shown as unavailable, not invented. A player may have no inventory save yet.

## Optional installation and compatibility

The catalogue offers more Minecraft versions than the bridge supports. **Catalogue availability is not a compatibility claim.** Only the combinations listed here are enabled; unknown or newer Minecraft/loader versions remain unavailable until tested and added to the manifest.

| Companion | Minecraft | Runtime validation | Java | Capabilities |
| --- | --- | --- | --- | --- |
| Bukkit | 1.20.1, 1.21.1 | Paper; Bukkit API derivatives require their own integration check | 17 for 1.20.1, 21 for 1.21.1 | Live data and actions |
| Fabric | 1.20.1 | Loader 0.16.10 | 17+ | Read-only live data |
| Fabric | 1.21.1 | Loader 0.16.14 | 21+ | Read-only live data |
| Forge | 1.20.1 | Forge 47.3.0 | 17+ | Read-only live data |
| NeoForge | 1.21.1 | NeoForge 21.1.219 | 21+ | Read-only live data |

The extension includes small bridge JARs built from this repository and their SHA-256 manifest. It includes no Minecraft server or dependency JARs. The installer verifies the checksum locally and after upload, checks the runtime again, and promotes a temporary non-JAR file only while the server is stopped. It never restarts a server, overwrites an existing detected VinusPlayers JAR, or installs both a plugin and a mod on a hybrid. Bukkit takes precedence on hybrids; a custom hybrid/plugin combination still needs testing by its operator.

The **Versions** and **Modpacks** confirmation screens explain the companion and ask **Yes, install the bridge** or **No, continue without it** when a compatible bridge and the required permissions are available. Neither answer is preselected. Each new installation asks again. The API requires an explicit `install_players` boolean and checks console permission for acceptance. No unattended companion is added after ordinary Pterodactyl server creation/reinstallation; the old automatic-install event registration is removed and legacy queued jobs without consent do nothing. The former `players_auto_install` setting is no longer used.

Accepting installs the compatible companion after the successful software/pack installation, while the server remains stopped. The response distinguishes installed, existing, unavailable and failed bridges; a companion failure does not misreport the successful software installation as a failure. Refusing skips companion installation and does not remove any bridge already present. The **Players** category always remains available according to normal file-read permissions. Without an active bridge it explains that live presence, inventory, health and XP require VinusPlayers; available saved data remains readable.

For a newly created or existing server, open **Players → Install bridge** while stopped, then start it normally. Installation requires `file.read-content`, `file.create`, `file.update` and `control.console`; opening the page alone never installs anything. The theme and extension must both be updated. Unsupported versions can still be installed as Minecraft servers without a player bridge.

The selector requires an explicit Minecraft version and a recognized Java image such as `java_17` or `java_21`. Native mods also require a verified loader version. Catalogue installations record it automatically. Egg installations read `FABRIC_LOADER_VERSION`/`FABRIC_VERSION`/`LOADER_VERSION`, `FORGE_VERSION`, or `NEOFORGE_VERSION`. Values such as `latest`, missing variables and custom Java images are not guessed. For older catalogue records, the bridge resolves the recorded build ID against catalogue metadata without reinstalling. If that build cannot be verified, live installation stays unavailable and saved data remains accessible.

For manual Bukkit builds:

```sh
mvn -f integrations/players-bukkit/pom.xml clean package
```

Put `vinus-players-1.1.0.jar` into `plugins/`, replacing an older bridge only during planned maintenance. Do not use hot reload. It creates `plugins/VinusPlayers/config.yml` and `.vinus/players/`. Each Bukkit action can be disabled in that configuration; restart after editing. No RCON, public port, API key or in-game player permission is needed. Native mods belong in `mods/` and expose no commands or action toggles in this release. See [mod build instructions](../integrations/players-mods/README.md).

## Item artwork

Minecraft artwork is separate from the theme's open-source code. Generate the optional item sprite sheet from Mojang's official client distribution on your own installation:

```sh
python3 scripts/fetch-player-textures.py /var/www/pterodactyl/public/assets/images/vinus/players
```

The script validates Mojang's published checksums. Keep the generated `NOTICE.txt` with the files. Without artwork, the inventory remains functional and shows identifiers and quantities. Custom/modded textures and custom ItemsAdder models are not included. The current sprite source is Minecraft Java 1.21.1; newer or modded items use the fallback icon.

Skins are fetched through the authenticated panel endpoint from Mojang's profile/texture services, cached privately, and displayed as a pixel-art front view. Offline-mode UUIDs without a supplied official texture may not resolve to a skin; a neutral silhouette is shown.

## Data and actions

The companion writes atomic snapshots every second. The selected live profile refreshes every second while visible (normally within about two seconds plus network latency). Lists and saved profiles refresh every five seconds. Returning to the tab refreshes immediately; requests never overlap within one polling session. The XP and game-mode controls follow live values unless the user is editing an unapplied draft. A heartbeat older than 15 seconds disables live actions. Snapshots are stored only inside the selected Minecraft server volume and are accessed via authenticated Wings file access. Do not publish `.vinus/`, player saves, server properties, credentials, or production screenshots in this repository.

For the Bukkit companion, the only accepted actions are heal, kill, feed, operator, whitelist, ban, game mode and XP level. The PHP controller validates UUIDs, values, server permissions and server state. The companion accepts commands only from the server console (including an administrator's RCON console), never from an in-game player, even an operator. Unique request IDs suppress duplicate execution. The UI reports success only after the server acknowledges the result; a timeout does not trigger a second command.

Kill, operator changes and bans require confirmation. Healing, feeding, game mode and XP require an online player. Operator, whitelist and ban flags may be changed for a known offline player while the companion is running. Whitelisting a player does not globally enable the server whitelist. Set-level resets progress within that level to zero. Inventory and Ender chest contents are **read-only**.

## Refresh cost

Minecraft player count and open panel tabs are separate costs. Each visible live profile makes approximately one HTTP request per second; a tab reads only its selected profile, not every inventory. Fifty players with one profile open do not produce fifty browser requests per second. Fifty visible profile tabs can produce roughly fifty requests per second before action requests and network delays.

The companion collects all online players once per second on the Minecraft thread, including 36 inventory slots, five equipment slots and 27 Ender chest slots per player. At fifty players that is about 3,400 slot inspections per second, plus item metadata and player state. JSON serialization and atomic file writes run on one background worker. A periodic collection is skipped while the previous periodic write is unfinished, preventing periodic snapshots from accumulating indefinitely. Main-thread collection still has a cost; this is not a fifty-player capacity guarantee.

Before relying on this at scale, compare Minecraft tick time and CPU with representative inventories, and panel/Wings response time with the expected number of simultaneous viewers. No fifty-player production load test has been performed.

## Verification commands

```sh
php scripts/test-players.php
php scripts/test-player-companion.php
mvn -f integrations/players-bukkit/pom.xml clean package
```

The PHP checks cover bounded NBT decoding, item parsing and command validation. Live integration checks were performed against an isolated Paper server with a disposable bot; they do not exercise a production player's inventory or permissions. See the PR validation notes for the exact tested actions.
