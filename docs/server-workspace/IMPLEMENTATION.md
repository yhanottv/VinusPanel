# Server workspace — VinusPanel 3.2.0

Manage opens `/server/:id/overview`; the historical `/server/:id` route remains the console. Both standard Pterodactyl and Blueprint integration variants are shipped. Navigation follows software capabilities and user permissions. Unavailable game-specific modules and billing are hidden.

| Area | Implemented behavior |
| --- | --- |
| Dashboard | Local software logos, live status/resources, list/grid views; available width is used on 1920 and 3440 px displays. |
| Overview | CPU, memory, storage, network rates, uptime, address and actual server configuration. |
| Console | Wings terminal, search, severity filters, text size, local log download, command history and state-aware power controls. |
| Files | Compact browsing, breadcrumb navigation and existing Pterodactyl file actions. |
| Catalog | Modrinth, supported free SpigotMC resources and optional CurseForge; compatibility filtering, dependency previews and managed-file updates. |
| Software | 28 catalog choices, versions/builds, Java runtime plan, validated download and installation with recovery. |
| Modpacks | Modrinth manifests and optional CurseForge adapter; dependency/loader checks and recoverable installation. |
| Properties | Typed sections, MOTD preview, preserved comments/unknown keys and optimistic concurrent-edit detection. |
| Players | Known-player cache and links to operators, whitelist and ban files; not an online-player tracker. |
| Worlds | Local world metadata, ZIP import, activation and optional CurseForge world catalog. |
| BlueMap | Compatible installation, user-controlled resource downloads and authenticated, isolated map viewer. |
| Management | Existing databases, backups, allocations, schedules, users and activity with Pterodactyl permissions. |

Software detection uses administrator profiles, declared software/JAR variables, then egg names. No host-specific numeric egg IDs are shipped. Renamed or custom eggs can use private UUID mappings. A misleadingly renamed JAR cannot be identified reliably from metadata alone.

Install previews are bound to the user/server, revalidated under a lock and consumed before download. Downloads enforce provider/host, size and available integrity checks. Archive paths and expanded sizes are checked. File and runtime changes retain recovery copies. These controls do not guarantee that third-party mods are safe or mutually compatible.

Blueprint navigation, console and power hooks remain available. The map iframe uses an opaque origin and short-lived capabilities; map assets stay within the server's BlueMap web directory. The BlueMap-only policy permits its translation compiler while limiting external connections and inline code. Address blur is a display convenience, not access control.

## Validation

- TypeScript on Pterodactyl 1.15.1 with Blueprint beta-2026-06 and on standard Pterodactyl sources; production compilation.
- 117 frontend checks in 15 suites, including console filters, property preservation, MOTD, directory browsing and WebSocket state races.
- Isolated PHP checks for provider parsing, detection, downloads, software/archive plans, modpacks, worlds, BlueMap, permissions, stale previews and rollback.
- Live disposable-server checks: Paper 1.20.1, Forge 1.20.1, a Fabric 1.21.1 Modrinth pack, a free Spigot plugin, world ZIP import/activation and generated BlueMap terrain.
- All 28 software choices were checked for catalog metadata/plans; they were not all installed and boot-tested.
- Browser checks of desktop and mobile navigation, logo detection, overview, console, catalogs, installer flows and map controls. Dashboard width checked at 3440, 1920 and 390 px without page overflow.
- CurseForge live validation awaits a provider key. Clean installation on a freshly provisioned panel, physical-device and broad cross-browser testing remain outstanding.

No private deployment notes or personal server captures are included. Public screenshots use demonstration data.
