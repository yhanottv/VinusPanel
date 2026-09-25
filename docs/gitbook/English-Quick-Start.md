# 🌐 English quick start

This documentation covers the **main branch**, including features not yet included in older release archives. Detailed chapters are currently in French. The repository also has an [English README](https://github.com/yhanottv/VinusPanel/blob/main/README.md) and [player documentation](https://github.com/yhanottv/VinusPanel/blob/main/docs/PLAYERS.md).

## Install

### Install Pterodactyl first

The documented VinusPanel installer targets a classic Ubuntu installation with Pterodactyl in `/var/www/pterodactyl`. It does not run directly in the official production Docker image because that image stores the panel in `/app` and omits the Bash, Node.js and Yarn build tools needed by the theme installer.

For a classic Ubuntu 24.04 host, install the base dependencies and Pterodactyl 1.15.1 first:

```bash
apt update && apt -y upgrade
apt install -y software-properties-common curl ca-certificates gnupg2 sudo lsb-release
add-apt-repository -y ppa:ondrej/php && apt update
apt install -y php8.3 php8.3-{common,cli,gd,mysql,mbstring,bcmath,xml,fpm,curl,zip} mariadb-server nginx tar unzip git redis-server
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install --global yarn@1
mkdir -p /var/www/pterodactyl && cd /var/www/pterodactyl
curl -fL -o panel.tar.gz https://github.com/pterodactyl/panel/releases/download/v1.15.1/panel.tar.gz
tar -xzvf panel.tar.gz && rm panel.tar.gz
chmod -R 755 storage/* bootstrap/cache
composer install --no-dev --optimize-autoloader
php artisan p:environment:setup
php artisan p:environment:database
php artisan p:environment:mail
php artisan key:generate --force
php artisan migrate --seed --force
php artisan p:user:make
```

Finish the Nginx, queue, scheduler and Wings configuration with the [official Pterodactyl installation guide](https://pterodactyl.io/panel/1.0/getting_started.html), then continue with the VinusPanel commands below.

Use an existing Pterodactyl **1.15.1** panel, Node **22**, Yarn **1.x** and a working Wings connection. PHP **8.3** and Ubuntu **24.04** were validated. Blueprint **beta-2026-06** is optional for the theme but required for Vinus Catalog. Back up the panel, database, configuration and game data first.

```bash
git clone --branch main --single-branch https://github.com/yhanottv/VinusPanel.git
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

### Update Pterodactyl

Back up the VPS, database and `.env`, then run the following from `/var/www/pterodactyl`:

```bash
cd /var/www/pterodactyl
php artisan down
curl -fL https://github.com/pterodactyl/panel/releases/download/v1.15.1/panel.tar.gz | tar -xzv
chmod -R 755 storage/* bootstrap/cache
composer install --no-dev --optimize-autoloader
php artisan migrate --seed --force
php artisan view:clear
php artisan config:clear
chown -R www-data:www-data /var/www/pterodactyl/*
php artisan queue:restart
php artisan up
systemctl restart pteroq
systemctl reload nginx
```

Check the compatible Wings release in the [official Wings releases](https://github.com/pterodactyl/wings/releases) before updating it. Do not modify a running Docker container in place; rebuild the image for Docker installations.

Back up before updating, use `git pull --ff-only`, run the preflight and reinstall. Preserve local changes and update the extension separately. `sudo bash uninstall.sh` restores tracked originals, without removing Blueprint or the catalogue. Check that the backup still matches the panel version.

Support reports should contain versions, reproduction steps and redacted logs/screenshots. Never publish credentials, private configuration or player data. No universal compatibility or fifty-player production capacity guarantee is claimed.

[Chapter index](README.md)
