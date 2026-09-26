# 🌐 English quick start

This documentation covers the **`main` branch**. The detailed chapters are in French; this page is a complete English walkthrough of the installation and the essentials. The repository also has an [English README](https://github.com/yhanottv/VinusPanel/blob/main/README.md) and [player documentation](https://github.com/yhanottv/VinusPanel/blob/main/docs/PLAYERS.md).

## What you get

On a **fresh Ubuntu 24.04 VPS**, one script installs everything: Pterodactyl Panel 1.15.1, MariaDB, Redis, Nginx, the queue worker and cron, Blueprint, the VinusPanel theme, the Vinus Catalog extension (Minecraft tools), Docker, Wings and a crash guard service. On a machine that already runs Pterodactyl 1.15.1, it applies (or updates) only the theme (plus the catalog if Blueprint is already there).

## Requirements

- Ubuntu **24.04 LTS**, clean image, root SSH access. Tested on 2 vCPU / 8 GB RAM / 96 GB disk; less than 4 GB of RAM is not validated (the frontend build is heavy).
- A public IP. A domain name is optional but required for HTTPS.
- Ports: `22`, `80`, `443`, `8080` (Wings API), `2022` (SFTP) and the game range (default `25565`–`25584`).
- Some hosters ship a Traefik/Docker template that occupies ports 80/443. On a machine without Nginx the installer **stops that container and disables its restart policy**. Use a plain Ubuntu image, or pass `--keep-proxy` to make the installer stop instead.

## 1. Install

```bash
apt update && apt install -y git curl
git clone --branch main --single-branch https://github.com/yhanottv/VinusPanel.git
cd VinusPanel
sudo bash install.sh --check      # read-only report
sudo bash install.sh --install    # or run without options and choose [1] in the menu
```

With a domain whose DNS `A` record already points to the VPS:

```bash
sudo bash install.sh --install --url https://panel.example.com --admin-email you@example.com
```

The run is fully automatic and took about 7 minutes on 2 vCPU / 8 GB (up to 20 on slower machines). If the panel phase fails, **re-run the same command**: the installer detects the unfinished install (`/var/lib/vinuspanel/bootstrap-incomplete`) and resumes. If the theme phase fails, the installer restores the original files automatically.

Generated passwords are printed at the end and saved in `/var/lib/vinuspanel/credentials.txt` (mode 600). Avoid `--db-password` and `--admin-password` on the command line (visible in the process list); use `VINUS_DB_PASSWORD` and `VINUS_ADMIN_PASSWORD`. Change the administrator password at first login.

Useful options: `--timezone`, `--admin-user`, `--[no-]wings`, `--[no-]blueprint`, `--catalog`, `--node-fqdn`, `--alloc-range A-B`, `--panel-dir`, `--keep-proxy`, `--update`, `--admin`, `--restart`, `--uninstall`.

## 2. Check

```bash
systemctl is-active nginx php8.3-fpm mariadb redis-server pteroq wings docker vinus-guard
cd /var/www/pterodactyl && php8.3 artisan p:info
cat /var/lib/vinuspanel/version
```

Expect eight `active` lines, Pterodactyl `1.15.1` and the theme version. Log in, open **Admin → Nodes** (green heart = Wings connected) and **Design**. An administrator on a panel without servers gets a five-step wizard to create the first one.

## 3. Blueprint and Vinus Catalog (automatic)

On a fresh VPS the installer already did this: Blueprint **`beta-2026-06`** (the only validated version), then the theme applied once with the Blueprint variants, then Vinus Catalog. The catalog step is non-fatal. Skip it with `--no-blueprint`; force Blueprint on an existing panel with `--blueprint`; retry only the catalog with:

```bash
cd ~/VinusPanel && sudo bash install.sh --catalog
cat /var/lib/vinuspanel/catalog-version            # 1.4.0
php8.3 /var/www/pterodactyl/artisan route:list | grep -c vinuscatalog   # about 40 routes
```

CurseForge needs a private key in `.env` (`VINUS_CURSEFORGE_API_KEY`); Modrinth, SpigotMC and MCJars work without one. Manual commands for troubleshooting are in chapter 3 (French).

## 4. Harden before going public

A default install is functional, **not hardened**: HTTP on the IP, Wings API in clear text on 8080, firewall off, mail set to `log`.

- **HTTPS**: install with `--url https://…`, or add Certbot to the existing Nginx vhost, set `APP_URL` in `.env`, run `php8.3 artisan config:clear`, and enable SSL on the node (Admin → Nodes → Settings, then copy its Configuration into `/etc/pterodactyl/config.yml` and restart Wings).
- **Firewall**: allow `22`, `80`, `443`, `8080`, `2022` and the game range in `ufw` **before** enabling it. Docker-published game ports bypass `ufw`.
- **SSH**: keys only (`PasswordAuthentication no`, `PermitRootLogin prohibit-password`), test in a second session first; add `fail2ban`.
- **Mail**: set `MAIL_MAILER=smtp` and the `MAIL_*` values in `.env`, then `config:clear` and `queue:restart`.
- **Backups** (off the VPS): `mariadb-dump panel`, `.env` (its application key protects encrypted data), `/etc/pterodactyl/config.yml`, `storage/app/vinuspanel`, `public/assets/vinus/custom`, `/var/lib/pterodactyl/volumes`.
- Any secret pasted in a chat, ticket or repository is compromised: rotate it.

## 5. Use

Open **Design** as a root administrator to preview branding, layout, icons, typography, charts and the login mosaic. Save publishes; Cancel restores the saved design. Eight languages are offered, with English fallback for untranslated advanced text.

Version and modpack installations leave Minecraft stopped. Start it normally; once it is running, a separate **VinusPlayers** dialog explains live inventory, health, hunger, XP, skin and presence. Later adds nothing; explicit activation gracefully stops the server, installs the companion and requests startup, never force-killing. Companion compatibility is narrower than the catalog: Forge 1.20.1/47.3.0, Fabric 1.20.1/0.16.10, Fabric 1.21.1/0.16.14 and NeoForge 1.21.1/21.1.219 (read-only), and Bukkit on 1.20.1/1.21.1 (live data and permitted actions, tested on Paper). Inventory editing is not included.

The `vinus-guard` service quarantines client-only mods that crash a server (`/var/log/vinus-guard.log`, at most 15 attempts per hour per server) and restarts it.

## 6. Maintain

```bash
cd ~/VinusPanel && sudo bash install.sh --update     # theme update (git pull --ff-only + rebuild)
sudo bash install.sh --admin                         # create / reset the administrator
sudo bash install.sh --restart                       # restart PHP-FPM, Nginx, worker, Wings
sudo bash uninstall.sh                               # restore original files, remove guard service
```

The theme is validated with Pterodactyl **1.15.1** only. After updating Pterodactyl, reinstall Blueprint (if used), then the theme, then the catalog. To start from scratch, reinstall the VPS operating system and repeat from step 1; take backups first, since this erases game servers too.

Support reports should contain versions, reproduction steps and redacted logs. Never publish credentials, private configuration or player data. No universal compatibility or fifty-player production capacity guarantee is claimed.

[Chapter index](README.md)
