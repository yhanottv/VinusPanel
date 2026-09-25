# English quick start

This documentation documents the **codex/live-design-studio development branch**, including features not yet included in older archives or main. Detailed chapters are currently in French. The repository also has an [English README](https://github.com/yhanottv/VinusPanel/blob/codex/live-design-studio/README.md) and [player documentation](https://github.com/yhanottv/VinusPanel/blob/codex/live-design-studio/docs/PLAYERS.md).

## Install

Use an existing Pterodactyl **1.15.1** panel, Node **22**, Yarn **1.x** and a working Wings connection. PHP **8.3** and Ubuntu **24.04** were validated. Blueprint **beta-2026-06** is optional for the theme but required for Vinus Catalog. Back up the panel, database, configuration and game data first.

```bash
git clone --branch codex/live-design-studio --single-branch https://github.com/yhanottv/VinusPanel.git
cd VinusPanel
bash install.sh --check
sudo bash install.sh
```

The default panel path is `/var/www/pterodactyl`; use `--panel-dir` otherwise. Install Blueprint first if needed. Package and install Vinus Catalog separately following chapter 3. A complete clean installation on a newly provisioned panel is not claimed as completed validation.

## Use

Open **Design** as a root administrator to preview branding, layout, icons, typography, charts and the login mosaic. Save publishes; Cancel restores the saved design. Eight language choices are offered, with English fallback for untranslated advanced text.

Version/modpack installation leaves Minecraft stopped. Start it normally. Once it is running, a separate **VinusPlayers** dialog explains live inventory, health, hunger, XP, skin and presence. Later adds nothing. Explicit activation gracefully stops the server, installs the companion and requests startup. It never force-kills. Existing JARs are preserved for compatibility review. Players remains accessible with available saved data without a bridge.

Companion compatibility is narrower than the catalogue: Forge 1.20.1/47.3.0, Fabric 1.20.1/0.16.10, Fabric 1.21.1/0.16.14 and NeoForge 1.21.1/21.1.219. These mods are read-only. Bukkit supports live data and permitted actions on Minecraft 1.20.1/1.21.1, tested on Paper. Inventory editing is not included.

## Maintain

Back up before updating, use `git pull --ff-only`, run the preflight and reinstall. Preserve local changes and update the extension separately. `sudo bash uninstall.sh` restores tracked originals, without removing Blueprint or the catalogue. Check that the backup still matches the panel version.

Support reports should contain versions, reproduction steps and redacted logs/screenshots. Never publish credentials, private configuration or player data. No universal compatibility or fifty-player production capacity guarantee is claimed.

[Chapter index](README.md)
