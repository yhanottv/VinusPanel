# 🦅 VinusPanel

[![Validate theme package](https://github.com/yhanottv/VinusPanel/actions/workflows/validate.yml/badge.svg)](https://github.com/yhanottv/VinusPanel/actions/workflows/validate.yml)
[![Latest release](https://img.shields.io/github/v/release/yhanottv/VinusPanel?color=ff7a1a)](https://github.com/yhanottv/VinusPanel/releases/latest)
[![License](https://img.shields.io/github/license/yhanottv/VinusPanel)](LICENSE)

A black workspace with Liquid Glass navigation for **Pterodactyl Panel 1.15.1**, designed for clarity, comfort, and a consistent experience on desktop and mobile.

VinusPanel ships only the theme overlay and its installation tools. It does **not** redistribute the complete Pterodactyl source code.

## ✨ Highlights

- Discord logo button and help announcement, sharing the invitation configured through `VINUS.discordInvite` in `resources/scripts/theme.ts` (clear it to hide the announcement);
- explicit connection diagnostics, an ASCII console signature and command history kept only in memory while the console is open;

- restrained sign-in screen and black content surfaces;
- live server overview with clear status, resource cards, and persistent grid/list layouts;
- workspace-first server interface with grouped navigation and quick power controls;
- dedicated console workspace with state-aware controls, compact telemetry and resource graphs always visible at the top of the page;
- custom file manager with a compact toolbar, readable rows, and empty states;
- dedicated profile page with a local display name and custom avatar;
- redesigned account and server activity timelines;
- visually refreshed administration area without changing its controllers or workflows;
- redesigned account and security workspace;
- consistent component styling across databases, backups, schedules, network, startup, settings, and activity;
- translucent navigation, graphite reading surfaces, and restrained orange accents;
- keyboard-operable search, skip links, and reduced-motion/transparency support;
- automatic maintenance mode, backups, and rollback on installation failure;
- safe uninstaller that restores the files from before the first installation;
- no `.env`, credentials, database content, or other panel secrets included.

## ✅ Compatibility

| Component | Supported version |
| --- | --- |
| Pterodactyl Panel | **1.15.1** |
| PHP | 8.2 or 8.3 |
| Node.js | 22 or newer (validated on 22) |
| Yarn | 1.x |
| Recommended OS | Ubuntu or Debian |

> [!IMPORTANT]
> Other Pterodactyl versions may use different React components. Run the pre-flight check and keep a complete VPS backup before attempting an unsupported version.

> [!NOTE]
> Profile appearance is stored locally in the current browser for the signed-in account. It does not alter the Pterodactyl username, authentication data, database, or permissions.

## Console signature

The centered orange eagle ASCII is written directly after the initial server status and each transition to startup. It remains in normal terminal scrollback, with no expiry or log buffering. The supplied eagle logo is sampled into detailed Unicode terminal characters, scaled proportionally to fit the console and centered as one shape. This visual signature is local to the panel and is never sent as a server command or written to server log files.

## Blueprint catalogue

Version 2.2 includes an optional native Blueprint extension with separate compatible Mods/Plugins tabs, installation previews, required dependencies and tracked updates. See [Vinus Catalog](extensions/vinuscatalog/README.md) for installation and limits. Blueprint beta-2026-06 and Pterodactyl 1.15.1 are the tested combination. Install Blueprint before applying the theme; the installer automatically selects its integration hooks.

## 🚀 Quick installation

Clone the repository on the machine hosting your Pterodactyl panel:

```bash
git clone --depth 1 https://github.com/yhanottv/VinusPanel.git
cd VinusPanel
```

Run the non-destructive pre-flight check:

```bash
bash install.sh --check
```

Install the theme:

```bash
sudo bash install.sh
```

The default panel directory is `/var/www/pterodactyl`.

### Custom panel directory

```bash
sudo bash install.sh --panel-dir /path/to/pterodactyl
```

## 🔄 Updating

```bash
cd VinusPanel
git pull --ff-only
sudo bash install.sh
```

The installer can be run multiple times. The original pre-theme files remain preserved for a future uninstall.

## 🧹 Uninstalling

From the cloned repository, run:

```bash
sudo bash uninstall.sh
```

For a custom panel location:

```bash
sudo bash uninstall.sh --panel-dir /path/to/pterodactyl
```

The uninstaller restores the original files, removes only files introduced by VinusPanel, rebuilds the frontend assets, and clears the panel caches.

## 🛡️ Backups and rollback

- original files are stored in `/var/lib/vinuspanel/original`;
- every installation creates a transaction backup in `/var/backups/vinuspanel`;
- if compilation or installation fails, the current transaction is rolled back automatically;
- the panel is returned from maintenance mode even when an error occurs.

These backups cover the files changed by the theme. They do not replace a complete system, database, and application backup.

## 🧰 What the installer does

1. validates the package manifest and required commands;
2. confirms compatibility with Pterodactyl 1.15.1;
3. backs up every file that will be changed;
4. enables Pterodactyl maintenance mode;
5. installs the 61-file VinusPanel overlay;
6. compiles production assets with Yarn;
7. clears Laravel views and application caches;
8. restores the expected web-server ownership;
9. disables maintenance mode.

## 📁 Repository layout

```text
VinusPanel/
├── overlay/                  # Theme files copied over Pterodactyl
├── scripts/check-package.sh  # Package and secret-safety validation
├── install.sh                # Backup, install, build, and rollback
├── uninstall.sh              # Restore the original panel files
├── overlay-manifest.txt      # Exact list of installed theme files
└── theme.json                # Theme metadata and compatibility
```

## 🧪 Validation

The public package is checked with GitHub Actions on every push and pull request. The production theme has also passed:

- TypeScript type checking;
- ESLint validation;
- all 46 upstream frontend tests;
- the Pterodactyl production Webpack build;
- package-manifest and accidental-secret checks.

## 🧩 Manual installation

The automated installer is strongly recommended. If you need to inspect or reproduce the process manually:

```bash
sudo cp -a overlay/. /var/www/pterodactyl/
cd /var/www/pterodactyl
sudo yarn install --frozen-lockfile
sudo yarn build:production
sudo php artisan view:clear
sudo php artisan cache:clear
```

Manual installation does not provide VinusPanel's automatic backup and rollback protections.

## 📦 Releases

The current source version is **2.3.6**. See the [latest release](https://github.com/yhanottv/VinusPanel/releases/latest) or read [CHANGELOG.md](CHANGELOG.md).

## 📄 License

VinusPanel is released under the [MIT License](LICENSE).

Pterodactyl is a third-party open-source project distributed under its own MIT license. Visit [pterodactyl/panel](https://github.com/pterodactyl/panel) for the upstream project.

## Liquid Glass design

Glass is limited to navigation surfaces, with opaque fallbacks. Resource
tables and the terminal keep stable backgrounds for long reading sessions. No
animation loop, external imagery, additional font service, or new dependency is used.
The existing orange identity and bundled IBM Plex Sans are retained.

The visual research used [BuiltByBit's Pterodactyl category](https://builtbybit.com/resources/websites/pterodactyl/themes/)
and [this server-dashboard reference on Pinterest](https://www.pinterest.com/pin/702983823073939887/)
for layout context. No third-party theme code or artwork is included.
