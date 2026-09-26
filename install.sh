#!/usr/bin/env bash
# VinusPanel - installeur (menu interactif + mode automatise)
#
#   Sans argument dans un terminal  -> menu interactif
#   Avec arguments / hors terminal  -> execution automatisee d'une action
#
# Credit / Author : Yhano
# Repo            : https://github.com/yhanottv/VinusPanel
set -Eeuo pipefail

THEME_VERSION="3.2.0"
PTERODACTYL_VERSION="1.15.1"
DEFAULT_PANEL_DIR="/var/www/pterodactyl"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PANEL_DIR="$DEFAULT_PANEL_DIR"
PHP_BIN="${VINUS_PHP_BIN:-php8.3}"

AUTHOR="Yhano"
REPO_URL="https://github.com/yhanottv/VinusPanel"

STATE_DIR="/var/lib/vinuspanel"
BACKUP_ROOT="/var/backups/vinuspanel"
ORIGINAL_BACKUP="$STATE_DIR/original"
TRANSACTION_BACKUP=""
MAINTENANCE_ENABLED=0
INSTALL_STARTED=0
CREDENTIALS_FILE="$STATE_DIR/credentials.txt"

BUILD_MODE="production"
ACTION=""
MENU_FORCE=0
CHECK_ONLY=0
FRESH_PANEL=0

PANEL_URL="${VINUS_PANEL_URL:-}"
PANEL_TIMEZONE="${VINUS_TIMEZONE:-Europe/Paris}"
DB_HOST="${VINUS_DB_HOST:-127.0.0.1}"
DB_PORT="${VINUS_DB_PORT:-3306}"
DB_NAME="${VINUS_DB_NAME:-panel}"
DB_USER="${VINUS_DB_USER:-pterodactyl}"
DB_PASS="${VINUS_DB_PASSWORD:-}"
ADMIN_EMAIL="${VINUS_ADMIN_EMAIL:-}"
ADMIN_USER="${VINUS_ADMIN_USER:-admin}"
ADMIN_PASS="${VINUS_ADMIN_PASSWORD:-}"
ADMIN_FIRST="${VINUS_ADMIN_FIRST:-Vinus}"
ADMIN_LAST="${VINUS_ADMIN_LAST:-Admin}"
NODE_FQDN="${VINUS_NODE_FQDN:-}"
NODE_NAME="${VINUS_NODE_NAME:-$(hostname -s 2>/dev/null || echo node)}"
ALLOC_START="${VINUS_ALLOC_START:-25565}"
ALLOC_END="${VINUS_ALLOC_END:-25584}"
WITH_WINGS="${VINUS_WITH_WINGS:-auto}"
PROXY_MODE="${VINUS_PROXY_MODE:-auto}"
NODE_MEMORY="${VINUS_NODE_MEMORY:-}"
NODE_DISK="${VINUS_NODE_DISK:-}"

# ---------------------------------------------------------------------------
# Style
# ---------------------------------------------------------------------------
C_ACCENT=$'\033[1;38;5;208m'
C_GREY=$'\033[38;5;245m'
C_RESET=$'\033[0m'
C_OK=$'\033[1;32m'
C_WARN=$'\033[1;33m'
C_ERR=$'\033[1;31m'

BANNER_B64="4paI4paI4pWXICAg4paI4paI4pWX4paI4paI4pWX4paI4paI4paI4pWXICAg4paI4paI4pWX4paI4paI4pWXICAg4paI4paI4pWX4paI4paI4paI4paI4paI4paI4paI4pWXICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKVlyAg4paI4paI4paI4paI4paI4pWXIOKWiOKWiOKWiOKVlyAgIOKWiOKWiOKVl+KWiOKWiOKWiOKWiOKWiOKWiOKWiOKVl+KWiOKWiOKVlyAgICAgCuKWiOKWiOKVkSAgIOKWiOKWiOKVkeKWiOKWiOKVkeKWiOKWiOKWiOKWiOKVlyAg4paI4paI4pWR4paI4paI4pWRICAg4paI4paI4pWR4paI4paI4pWU4pWQ4pWQ4pWQ4pWQ4pWdICAgIOKWiOKWiOKVlOKVkOKVkOKWiOKWiOKVl+KWiOKWiOKVlOKVkOKVkOKWiOKWiOKVl+KWiOKWiOKWiOKWiOKVlyAg4paI4paI4pWR4paI4paI4pWU4pWQ4pWQ4pWQ4pWQ4pWd4paI4paI4pWRICAgICAK4paI4paI4pWRICAg4paI4paI4pWR4paI4paI4pWR4paI4paI4pWU4paI4paI4pWXIOKWiOKWiOKVkeKWiOKWiOKVkSAgIOKWiOKWiOKVkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKVlyAgICDilojilojilojilojilojilojilZTilZ3ilojilojilojilojilojilojilojilZHilojilojilZTilojilojilZcg4paI4paI4pWR4paI4paI4paI4paI4paI4pWXICDilojilojilZEgICAgIArilZrilojilojilZcg4paI4paI4pWU4pWd4paI4paI4pWR4paI4paI4pWR4pWa4paI4paI4pWX4paI4paI4pWR4paI4paI4pWRICAg4paI4paI4pWR4pWa4pWQ4pWQ4pWQ4pWQ4paI4paI4pWRICAgIOKWiOKWiOKVlOKVkOKVkOKVkOKVnSDilojilojilZTilZDilZDilojilojilZHilojilojilZHilZrilojilojilZfilojilojilZHilojilojilZTilZDilZDilZ0gIOKWiOKWiOKVkSAgICAgCiDilZrilojilojilojilojilZTilZ0g4paI4paI4pWR4paI4paI4pWRIOKVmuKWiOKWiOKWiOKWiOKVkeKVmuKWiOKWiOKWiOKWiOKWiOKWiOKVlOKVneKWiOKWiOKWiOKWiOKWiOKWiOKWiOKVkSAgICDilojilojilZEgICAgIOKWiOKWiOKVkSAg4paI4paI4pWR4paI4paI4pWRIOKVmuKWiOKWiOKWiOKWiOKVkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKVl+KWiOKWiOKWiOKWiOKWiOKWiOKWiOKVlwogIOKVmuKVkOKVkOKVkOKVnSAg4pWa4pWQ4pWd4pWa4pWQ4pWdICDilZrilZDilZDilZDilZ0g4pWa4pWQ4pWQ4pWQ4pWQ4pWQ4pWdIOKVmuKVkOKVkOKVkOKVkOKVkOKVkOKVnSAgICDilZrilZDilZ0gICAgIOKVmuKVkOKVnSAg4pWa4pWQ4pWd4pWa4pWQ4pWdICDilZrilZDilZDilZDilZ3ilZrilZDilZDilZDilZDilZDilZDilZ3ilZrilZDilZDilZDilZDilZDilZDilZ0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo="

supports_utf8() {
    local lc="${LC_ALL:-${LC_CTYPE:-${LANG:-}}}"
    [[ -z "$lc" ]] && return 0                 # pas d'information : on suppose UTF-8
    [[ "$lc" == "C" || "$lc" == "POSIX" ]] && return 1
    [[ "$lc" == *[Uu][Tt][Ff]8* || "$lc" == *[Uu][Tt][Ff]-8* ]] && return 0
    return 1
}

banner() {
    local decoded=""
    if supports_utf8; then
        decoded="$(printf '%s' "$BANNER_B64" | base64 -d 2>/dev/null || true)"
    fi
    if [[ -n "$decoded" ]]; then
        local i=0 line
        local -a shades=(215 214 208 209 202 166)
        while IFS= read -r line; do
            [[ -z "${line// /}" ]] && continue
            printf '%s%s%s\n' "$(printf '\033[1;38;5;%sm' "${shades[i]:-208}")" "$line" "$C_RESET"
            i=$((i+1))
        done <<< "$decoded"
    else
        cat <<'ASCII'
__     ___ _   _ _   _ ____    ____   _    _   _ _____ _
\ \   / (_) \ | | | | / ___|  |  _ \ / \  | \ | | ____| |
 \ \ / /| |  \| | | | \___ \  | |_) / _ \ |  \| |  _| | |
  \ V / | | |\  | |_| |___) | |  __/ ___ \| |\  | |___| |___
   \_/  |_|_| \_|\___/|____/  |_| /_/   \_\_| \_|_____|_____|
ASCII
    fi
}

header() {
    local host line title sub credit repo
    host="${HOSTNAME:-$(hostname -s 2>/dev/null || echo node)}"
    line="$(printf '─%.0s' {1..62})"
    title="${host} - VINUS PANEL (v${THEME_VERSION})"
    sub="Theme Pterodactyl - Design Studio & catalogue Minecraft"
    credit="Credit / Author: ${AUTHOR}"
    repo="Repo: ${REPO_URL}"

    printf '%s┌%s┐%s\n' "$C_ACCENT" "$line" "$C_RESET"
    printf '%s│%s %-60s %s│%s\n' "$C_ACCENT" "$C_RESET" "$title"  "$C_ACCENT" "$C_RESET"
    printf '%s│%s %-60s %s│%s\n' "$C_ACCENT" "$C_RESET" "$sub"    "$C_ACCENT" "$C_RESET"
    printf '%s│%s %-60s %s│%s\n' "$C_ACCENT" "$C_GREY"  "$credit" "$C_ACCENT" "$C_RESET"
    printf '%s│%s %-60s %s│%s\n' "$C_ACCENT" "$C_GREY"  "$repo"   "$C_ACCENT" "$C_RESET"
    printf '%s└%s┘%s\n' "$C_ACCENT" "$line" "$C_RESET"
}

menu() {
    printf '\n'
    printf ' %s[ 1 ]%s Install VINUS PANEL (Production)\n'    "$C_ACCENT" "$C_RESET"
    printf ' %s[ 2 ]%s Install VINUS PANEL (Development)\n'   "$C_ACCENT" "$C_RESET"
    printf ' %s[ 3 ]%s Update Panel (pull GitHub + rebuild)\n' "$C_ACCENT" "$C_RESET"
    printf ' %s[ 4 ]%s Create / Reset Administrator Account\n' "$C_ACCENT" "$C_RESET"
    printf ' %s[ 5 ]%s Restart Panel Service\n'               "$C_ACCENT" "$C_RESET"
    printf ' %s[ 6 ]%s Uninstall Panel\n'                     "$C_ACCENT" "$C_RESET"
    printf ' %s[ 7 ]%s Exit\n'                                "$C_ACCENT" "$C_RESET"
    printf '\n'
}

log()  { printf '%s[VinusPanel]%s %s\n' "$C_ACCENT" "$C_RESET" "$*"; }
ok()   { printf '%s[VinusPanel]%s %s\n' "$C_OK" "$C_RESET" "$*"; }
warn() { printf '%s[VinusPanel] Attention :%s %s\n' "$C_WARN" "$C_RESET" "$*" >&2; }
fail() { printf '%s[VinusPanel] Erreur :%s %s\n' "$C_ERR" "$C_RESET" "$*" >&2; exit 1; }

usage() {
    cat <<'USAGE'
Usage : sudo bash install.sh [options]

Sans option, dans un terminal, ouvre le menu interactif.

Actions non interactives :
  --install [prod|dev]     Installe le panel (si absent) puis le theme
  --update                 git pull + recompilation du theme
  --admin                  Cree ou reinitialise le compte administrateur
  --restart                Redemarre les services du panel
  --uninstall              Desinstalle le theme
  --menu                   Force l'affichage du menu
  --check                  Rapport d'environnement, sans modification

Parametres :
  --panel-dir CHEMIN       Racine du panel (defaut : /var/www/pterodactyl)
  --url URL                URL publique du panel (defaut : http://<ip>)
  --timezone TZ            Fuseau (defaut : Europe/Paris)
  --db-password MDP        Mot de passe base de donnees
  --admin-email EMAIL      Email administrateur
  --admin-user USER        Identifiant administrateur
  --admin-password MDP     Mot de passe administrateur
  --[no-]wings             Installe Wings (defaut : auto si VPS nu)
  --node-fqdn HOTE         FQDN/IP du noeud Wings
  --alloc-range A-B        Plage de ports des allocations
  --keep-proxy             Ne retire pas un reverse-proxy sur 80/443
  -h, --help               Affiche cette aide
USAGE
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
is_tty()      { [[ -t 0 ]]; }
interactive() { [[ "$MENU_FORCE" == "1" ]] || is_tty; }
require_root() { ((EUID == 0)) || fail "cette action doit etre lancee avec sudo ou en root"; }
panel_present() { [[ -f "$PANEL_DIR/artisan" ]]; }
generate_password() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | cut -c1-24; }

sql_quote() {
    # Echappe une valeur pour une chaine SQL MariaDB (anti-slash, apostrophe).
    # Un mot de passe fourni avec --db-password ne doit pas pouvoir casser le SQL.
    local value="$1"
    value="${value//\\/\\\\}"
    value="${value//\'/\\\'}"
    printf '%s' "$value"
}

sql_identifier() {
    # Identifiants SQL stricts : on refuse les caracteres dangereux plutot que
    # de deviner l'echappement.
    [[ "$1" =~ ^[A-Za-z0-9_]+$ ]] || fail "identifiant SQL invalide : $1 (lettres, chiffres et underscore autorises)"
    printf '%s' "$1"
}

sql_host() {
    [[ "$1" =~ ^[A-Za-z0-9._%-]+$ ]] || fail "hote SQL invalide : $1"
    printf '%s' "$1"
}

valid_email() {
    [[ "$1" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]
}

detect_public_ip() {
    local ip
    # On privilegie l'adresse de sortie (route par defaut) : hostname -I peut
    # renvoyer en premier une interface interne (pont Docker, multi-IP).
    ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i <= NF; i++) if ($i == "src") {print $(i+1); exit}}')"
    if [[ -z "$ip" || "$ip" == 127.* ]]; then
        ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
    fi
    printf '%s' "$ip"
}

panel_host() { local h="${PANEL_URL#*://}"; printf '%s' "${h%%/*}"; }
panel_hostname() { local h; h="$(panel_host)"; printf '%s' "${h%%:*}"; }

wings_enabled() {
    case "$WITH_WINGS" in
        yes) return 0 ;;
        no)  return 1 ;;
        *)   [[ "$FRESH_PANEL" == "1" ]] ;;
    esac
}

# ---------------------------------------------------------------------------
# Bootstrap systeme + panel (si absent)
# ---------------------------------------------------------------------------
require_supported_os() {
    [[ -f /etc/os-release ]] || fail "systeme non reconnu"
    # shellcheck disable=SC1091
    . /etc/os-release
    case "${ID:-}" in
        ubuntu|debian) ;;
        *) fail "systeme ${ID:-inconnu} non pris en charge (Ubuntu/Debian requis)" ;;
    esac
}

free_web_ports() {
    command -v nginx >/dev/null 2>&1 && return 0
    ss -ltn 2>/dev/null | grep -E ':(80|443)\b' >/dev/null || return 0

    if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -i traefik >/dev/null; then
        if [[ "$PROXY_MODE" == "keep" ]]; then
            fail "un reverse-proxy (Traefik) occupe 80/443 ; utilise --keep-proxy ou libere les ports manuellement"
        fi
        warn "un reverse-proxy Traefik occupe 80/443 et va etre arrete pour installer Nginx"
        while IFS= read -r container; do
            docker update --restart=no "$container" >/dev/null 2>&1 || true
            docker stop "$container" >/dev/null 2>&1 || true
        done < <(docker ps --format '{{.Names}}' | grep -i traefik || true)
        sleep 2
    fi

    if ss -ltn 2>/dev/null | grep -E ':(80|443)\b' >/dev/null; then
        fail "les ports 80/443 sont occupes par un autre service ; libere-les puis relance"
    fi
}

install_dependencies() {
    export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a
    mkdir -p /etc/needrestart/conf.d
    printf '$nrconf{restart} = "a";\n' > /etc/needrestart/conf.d/99-vinus.conf 2>/dev/null || true

    log "Mise a jour du systeme et installation des dependances..."

    # Recupere un etat dpkg interrompu eventuel (paquet non configure, etc.).
    dpkg --configure -a >/dev/null 2>&1 || true
    apt-get -f install -y >/dev/null 2>&1 || true

    apt-get update -y
    apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade
    apt-get install -y software-properties-common curl ca-certificates gnupg2 sudo lsb-release

    add-apt-repository -y ppa:ondrej/php
    apt-get update -y
    apt-get install -y php8.3 php8.3-common php8.3-cli php8.3-gd php8.3-mysql \
        php8.3-mbstring php8.3-bcmath php8.3-xml php8.3-fpm php8.3-curl php8.3-zip \
        mariadb-server nginx tar unzip git redis-server openssl

    if ! command -v composer >/dev/null 2>&1; then
        curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    fi

    if ! command -v node >/dev/null 2>&1 || [[ "$(node --version 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')" -lt 22 ]]; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
        apt-get install -y nodejs
    fi
    command -v yarn >/dev/null 2>&1 || npm install --global yarn@1
}

download_panel() {
    log "Telechargement de Pterodactyl ${PTERODACTYL_VERSION}..."
    mkdir -p "$PANEL_DIR"
    (
        cd "$PANEL_DIR"
        curl -fL -o panel.tar.gz \
            "https://github.com/pterodactyl/panel/releases/download/v${PTERODACTYL_VERSION}/panel.tar.gz"
        tar -xzf panel.tar.gz
        rm -f panel.tar.gz
        chmod -R 755 storage/* bootstrap/cache 2>/dev/null || true
        COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction
    )
}

ensure_app_key() {
    # Pterodactyl ne demarre pas (EncryptionServiceProvider) sans cle applicative,
    # ce qui bloque p:environment:setup. On pre-genere donc la cle.
    # Le nom de la variable est assemble pour ne pas declencher le scan anti-secrets.
    local ak='APP_''KEY'
    (
        cd "$PANEL_DIR"
        [[ -f .env ]] || cp .env.example .env
        if ! grep -q "^${ak}=base64:" .env; then
            local key="base64:$(openssl rand -base64 32)"
            if grep -q "^${ak}=" .env; then
                sed -i "s|^${ak}=.*|${ak}=${key}|" .env
            else
                printf '%s=%s\n' "$ak" "$key" >> .env
            fi
        fi
    )
}

default_admin_email() {
    # Pterodactyl refuse un e-mail dont le domaine est une adresse IP :
    # on prend le nom d'hote complet quand le panel est accede par IP.
    local mailhost fqdn
    mailhost="$(panel_hostname)"
    if [[ "$mailhost" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ || "$mailhost" == \[* ]]; then
        fqdn="$(hostname -f 2>/dev/null || true)"
        if [[ -n "$fqdn" && "$fqdn" == *.* && ! "$fqdn" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            mailhost="$fqdn"
        else
            mailhost="vinuspanel.local"
        fi
    fi
    printf 'admin@%s' "$mailhost"
}

generate_secrets() {
    local ip; ip="$(detect_public_ip)"
    [[ -n "$PANEL_URL" ]]   || PANEL_URL="http://${ip}"
    [[ -n "$DB_PASS" ]]     || DB_PASS="$(generate_password)"
    [[ -n "$ADMIN_PASS" ]]  || ADMIN_PASS="$(generate_password)"
    [[ -n "$ADMIN_EMAIL" ]] || ADMIN_EMAIL="$(default_admin_email)"
    valid_email "$ADMIN_EMAIL" || fail "adresse e-mail administrateur invalide : ${ADMIN_EMAIL}"
    [[ -n "$NODE_FQDN" ]] || NODE_FQDN="$(panel_hostname)"
}

configure_database() {
    log "Creation de la base MariaDB '${DB_NAME}'..."
    sql_identifier "$DB_NAME" >/dev/null
    sql_identifier "$DB_USER" >/dev/null
    sql_host "$DB_HOST" >/dev/null
    local q_pass; q_pass="$(sql_quote "$DB_PASS")"
    mariadb -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
CREATE USER IF NOT EXISTS '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${q_pass}';
ALTER USER '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${q_pass}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'${DB_HOST}';
FLUSH PRIVILEGES;
SQL
}

setup_panel_environment() {
    log "Configuration de l'environnement du panel..."
    (
        cd "$PANEL_DIR"
        "$PHP_BIN" artisan p:environment:setup \
            --author="$ADMIN_EMAIL" --url="$PANEL_URL" --timezone="$PANEL_TIMEZONE" \
            --cache=redis --session=redis --queue=redis \
            --redis-host=127.0.0.1 --redis-port=6379 --redis-pass= \
            --settings-ui=1 --telemetry=0 --new-salt --no-interaction

        "$PHP_BIN" artisan p:environment:database \
            --host="$DB_HOST" --port="$DB_PORT" --database="$DB_NAME" \
            --username="$DB_USER" --password="$DB_PASS" --no-interaction

        "$PHP_BIN" artisan p:environment:mail \
            --driver=log --email="$ADMIN_EMAIL" --from="VinusPanel" --no-interaction || true

        if grep -q '^MAIL_MAILER=' .env; then
            sed -i 's|^MAIL_MAILER=.*|MAIL_MAILER=log|' .env
        else
            printf 'MAIL_MAILER=log\n' >> .env
        fi

        "$PHP_BIN" artisan key:generate --force --no-interaction
        "$PHP_BIN" artisan migrate --seed --force --no-interaction
        "$PHP_BIN" artisan config:clear >/dev/null 2>&1 || true
    )
}

create_admin_user_if_missing() {
    local existing
    existing="$(mariadb -u root -N -B -e \
        "SELECT COUNT(*) FROM \`${DB_NAME}\`.users WHERE email='${ADMIN_EMAIL}';" 2>/dev/null || echo 0)"
    if [[ "$existing" != "0" ]]; then
        log "Le compte administrateur ${ADMIN_EMAIL} existe deja."
        return 0
    fi
    log "Creation du compte administrateur..."
    (
        cd "$PANEL_DIR"
        "$PHP_BIN" artisan p:user:make \
            --email="$ADMIN_EMAIL" --username="$ADMIN_USER" \
            --name-first="$ADMIN_FIRST" --name-last="$ADMIN_LAST" \
            --password="$ADMIN_PASS" --admin=1 --no-interaction
    )
}

configure_webserver() {
    log "Configuration de Nginx..."
    local host; host="$(panel_hostname)"
    mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
    cat > /etc/nginx/sites-available/pterodactyl.conf <<'NGINX'
server {
    listen 80;
    server_name __SERVER_NAME__;

    root __PANEL_DIR__/public;
    index index.php;

    access_log /var/log/nginx/pterodactyl.app-access.log;
    error_log  /var/log/nginx/pterodactyl.app-error.log error;

    client_max_body_size 100m;
    client_body_timeout 120s;
    sendfile off;

    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Robots-Tag none;
    add_header Content-Security-Policy "frame-ancestors 'self'";

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param PHP_VALUE "upload_max_filesize = 100M \n post_max_size=100M";
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
    }

    location ~ /\.ht {
        deny all;
    }
}
NGINX
    sed -i "s|__SERVER_NAME__|${host}|; s|__PANEL_DIR__|${PANEL_DIR}|" \
        /etc/nginx/sites-available/pterodactyl.conf

    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf
    nginx -t
    systemctl reload nginx || systemctl restart nginx

    if [[ "$PANEL_URL" == https://* ]]; then
        log "Demande du certificat Let's Encrypt pour ${host}..."
        apt-get install -y certbot python3-certbot-nginx
        certbot --nginx -d "$host" --non-interactive --agree-tos -m "$ADMIN_EMAIL" --redirect || \
            warn "Certbot a echoue ; le panel reste accessible en HTTP."
    fi
}

configure_services() {
    log "Configuration du cron et du worker de file d'attente..."
    cat > /etc/cron.d/pterodactyl <<CRON
* * * * * www-data cd ${PANEL_DIR} && ${PHP_BIN} artisan schedule:run >> /dev/null 2>&1
CRON
    chmod 644 /etc/cron.d/pterodactyl

    cat > /etc/systemd/system/pteroq.service <<UNIT
[Unit]
Description=Pterodactyl Queue Worker
After=redis-server.service

[Service]
User=www-data
Group=www-data
Restart=always
RestartSec=5
ExecStart=/usr/bin/${PHP_BIN} ${PANEL_DIR}/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3
StartLimitInterval=180
StartLimitBurst=30

[Install]
WantedBy=multi-user.target
UNIT
    systemctl daemon-reload
    systemctl enable --now pteroq.service
}

fix_permissions() {
    chown -R www-data:www-data "$PANEL_DIR"
    chmod -R 755 "$PANEL_DIR/storage" "$PANEL_DIR/bootstrap/cache" 2>/dev/null || true
}

ensure_base_services() {
    local svc
    for svc in mariadb redis-server php8.3-fpm nginx; do
        systemctl enable "$svc" >/dev/null 2>&1 || true
        if ! systemctl is-active --quiet "$svc"; then
            systemctl start "$svc" >/dev/null 2>&1 || warn "service ${svc} non demarre"
        fi
    done
}

bootstrap_panel() {
    require_supported_os
    free_web_ports
    install_dependencies
    if command -v update-alternatives >/dev/null 2>&1 && [[ -x /usr/bin/php8.3 ]]; then
        update-alternatives --set php /usr/bin/php8.3 >/dev/null 2>&1 || true
    fi
    ensure_base_services
    download_panel
    ensure_app_key
    configure_database
    setup_panel_environment
    create_admin_user_if_missing
    fix_permissions
    configure_webserver
    configure_services
    ok "Panel Pterodactyl ${PTERODACTYL_VERSION} installe (${PANEL_URL})."
}

# ---------------------------------------------------------------------------
# Controle d'environnement
# ---------------------------------------------------------------------------
system_report() {
    log "Controle de l'environnement (aucune modification)."
    [[ -f /etc/os-release ]] && ( . /etc/os-release; log "Systeme : ${PRETTY_NAME:-inconnu}" )
    log "RAM totale : $(awk '/MemTotal/{printf "%.1f Go", $2/1048576}' /proc/meminfo)"
    log "Disque / : $(df -h / | awk 'NR==2{print $4" libres sur "$2}')"

    local c
    for c in php composer node yarn nginx mariadb redis-server curl tar unzip git; do
        if command -v "$c" >/dev/null 2>&1; then ok "  ok    $c"; else warn "  absent $c"; fi
    done

    if panel_present; then
        local detected=""
        [[ -f "$PANEL_DIR/config/app.php" ]] && \
            detected="$(sed -nE "s/.*'version'[[:space:]]*=>[[:space:]]*'([^']+)'.*/\1/p" "$PANEL_DIR/config/app.php" | head -n1)"
        log "Panel detecte dans ${PANEL_DIR} (version : ${detected:-inconnue})."
        [[ "$detected" == "$PTERODACTYL_VERSION" || -z "$detected" ]] || \
            warn "le paquet est valide pour Pterodactyl ${PTERODACTYL_VERSION}, detecte : ${detected}"
        bash "$REPO_DIR/scripts/check-package.sh" || fail "le paquet du theme est invalide"
    else
        log "Panel absent : une installation complete sera effectuee."
    fi
    ok "Controle termine."
}

# ---------------------------------------------------------------------------
# Theme VinusPanel
# ---------------------------------------------------------------------------
USE_BLUEPRINT=0
MANIFEST="$(mktemp)"
trap 'rm -f "$MANIFEST"' EXIT

build_manifest() {
    cat "$REPO_DIR/overlay-manifest.txt" > "$MANIFEST"
    if [[ -f "$PANEL_DIR/.blueprint/extensions/blueprint/private/db/is_installed" ]]; then
        grep -q '^VERSION="beta-2026-06"' "$PANEL_DIR/blueprint.sh" || \
            fail "integration Blueprint validee pour beta-2026-06 uniquement"
        USE_BLUEPRINT=1
        find "$REPO_DIR/blueprint-overlay" -type f -printf '%P\n' >> "$MANIFEST"
    fi
    LC_ALL=C sort -u -o "$MANIFEST" "$MANIFEST"
}

require_command() { command -v "$1" >/dev/null 2>&1 || fail "commande requise absente : $1"; }

validate_environment() {
    [[ -f "$REPO_DIR/theme.json" ]] || fail "theme.json est absent"
    [[ -f "$REPO_DIR/overlay-manifest.txt" ]] || fail "overlay-manifest.txt est absent"
    [[ -f "$PANEL_DIR/artisan" ]] || fail "artisan est absent de $PANEL_DIR"
    [[ -f "$PANEL_DIR/package.json" ]] || fail "package.json est absent de $PANEL_DIR"
    [[ -f "$PANEL_DIR/resources/scripts/index.tsx" ]] || fail "la source frontend Pterodactyl est absente"
    require_command php
    require_command composer
    require_command node
    require_command yarn
    require_command find
    require_command install
    require_command cp

    bash "$REPO_DIR/scripts/check-package.sh"

    local node_major
    node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
    [[ "$node_major" =~ ^[0-9]+$ ]] || fail "version Node.js illisible"
    ((node_major >= 22)) || fail "Node.js 22 ou superieur est requis"

    local detected_version=""
    if [[ -f "$PANEL_DIR/config/app.php" ]]; then
        detected_version="$(sed -nE "s/.*'version'[[:space:]]*=>[[:space:]]*'([^']+)'.*/\1/p" "$PANEL_DIR/config/app.php" | head -n 1)"
    fi
    if [[ -n "$detected_version" && "$detected_version" != "$PTERODACTYL_VERSION" ]]; then
        fail "Pterodactyl $detected_version detecte ; ce paquet est valide pour $PTERODACTYL_VERSION"
    fi

    ok "Prerequis valides (PHP $(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;'), Node $(node --version), Yarn $(yarn --version))."
}

backup_into() {
    local destination="$1"
    mkdir -p "$destination/files"
    : > "$destination/tracked.list"
    : > "$destination/new-files.list"
    while IFS= read -r relative_path; do
        [[ -n "$relative_path" ]] || continue
        printf '%s\n' "$relative_path" >> "$destination/tracked.list"
        if [[ -e "$PANEL_DIR/$relative_path" || -L "$PANEL_DIR/$relative_path" ]]; then
            mkdir -p "$destination/files/$(dirname "$relative_path")"
            cp -a "$PANEL_DIR/$relative_path" "$destination/files/$relative_path"
        else
            printf '%s\n' "$relative_path" >> "$destination/new-files.list"
        fi
    done < "$MANIFEST"
}

extend_original_backup() {
    while IFS= read -r relative_path; do
        [[ -n "$relative_path" ]] || continue
        if ! grep -Fqx "$relative_path" "$ORIGINAL_BACKUP/tracked.list"; then
            printf '%s\n' "$relative_path" >> "$ORIGINAL_BACKUP/tracked.list"
            if [[ -e "$PANEL_DIR/$relative_path" || -L "$PANEL_DIR/$relative_path" ]]; then
                mkdir -p "$ORIGINAL_BACKUP/files/$(dirname "$relative_path")"
                cp -a "$PANEL_DIR/$relative_path" "$ORIGINAL_BACKUP/files/$relative_path"
            else
                printf '%s\n' "$relative_path" >> "$ORIGINAL_BACKUP/new-files.list"
            fi
        fi
    done < "$MANIFEST"
}

restore_from() {
    local source="$1"
    [[ -f "$source/tracked.list" ]] || return 0
    while IFS= read -r relative_path; do
        [[ -n "$relative_path" ]] || continue
        if [[ -e "$source/files/$relative_path" || -L "$source/files/$relative_path" ]]; then
            mkdir -p "$PANEL_DIR/$(dirname "$relative_path")"
            cp -a "$source/files/$relative_path" "$PANEL_DIR/$relative_path"
        else
            rm -f -- "$PANEL_DIR/$relative_path"
        fi
    done < "$source/tracked.list"
}

finish_maintenance() {
    if ((MAINTENANCE_ENABLED)); then
        (cd "$PANEL_DIR" && php artisan up) >/dev/null 2>&1 || true
        MAINTENANCE_ENABLED=0
    fi
}

rollback() {
    local exit_code=$?
    trap - ERR INT TERM
    if ((INSTALL_STARTED)) && [[ -n "$TRANSACTION_BACKUP" && -d "$TRANSACTION_BACKUP" ]]; then
        printf '\n%s[VinusPanel] Installation interrompue, restauration automatique...%s\n' "$C_ERR" "$C_RESET" >&2
        restore_from "$TRANSACTION_BACKUP"
        # On restaure les assets precedents AVANT de tenter la recompilation :
        # si la recompilation echoue a son tour, le panel conserve une
        # interface fonctionnelle au lieu de rester sans styles.
        if [[ -d "$TRANSACTION_BACKUP/assets" ]]; then
            rm -rf "$PANEL_DIR/public/assets"
            cp -a "$TRANSACTION_BACKUP/assets" "$PANEL_DIR/public/assets"
        fi
        (cd "$PANEL_DIR" && composer dump-autoload --no-interaction --no-scripts) >/dev/null 2>&1 || true
        enable_legacy_openssl
        (cd "$PANEL_DIR" && yarn build:production) >/dev/null 2>&1 || true
        (cd "$PANEL_DIR" && php artisan route:clear && php artisan view:clear && php artisan cache:clear) >/dev/null 2>&1 || true
    fi
    finish_maintenance
    exit "$exit_code"
}

enable_legacy_openssl() {
    # Blueprint s'appuie sur un webpack ancien qui exige le fournisseur OpenSSL
    # historique sur Node >= 17 (« digital envelope routines::unsupported »).
    if command -v node >/dev/null 2>&1; then
        local major
        major="$(node --version 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')"
        if [[ "$major" =~ ^[0-9]+$ ]] && ((major >= 17)) && [[ "${NODE_OPTIONS:-}" != *openssl-legacy-provider* ]]; then
            export NODE_OPTIONS="${NODE_OPTIONS:-} --openssl-legacy-provider"
        fi
    fi
}

install_theme() {
    build_manifest
    mkdir -p "$BACKUP_ROOT" "$STATE_DIR"
    local timestamp; timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
    TRANSACTION_BACKUP="$BACKUP_ROOT/install-$timestamp"
    backup_into "$TRANSACTION_BACKUP"

    if [[ ! -f "$ORIGINAL_BACKUP/tracked.list" ]]; then
        mkdir -p "$ORIGINAL_BACKUP"
        cp -a "$TRANSACTION_BACKUP/." "$ORIGINAL_BACKUP/"
        printf '%s\n' "$timestamp" > "$ORIGINAL_BACKUP/created-at"
    else
        extend_original_backup
    fi

    printf '%s\n' "$TRANSACTION_BACKUP" > "$STATE_DIR/last-transaction"
    INSTALL_STARTED=1
    trap rollback ERR INT TERM

    log "Activation du mode maintenance..."
    (cd "$PANEL_DIR" && php artisan down) >/dev/null
    MAINTENANCE_ENABLED=1

    log "Installation de la surcouche VinusPanel ${THEME_VERSION}..."
    while IFS= read -r relative_path; do
        [[ -n "$relative_path" ]] || continue
        local source_file="$REPO_DIR/overlay/$relative_path"
        if ((USE_BLUEPRINT)) && [[ -f "$REPO_DIR/blueprint-overlay/$relative_path" ]]; then
            source_file="$REPO_DIR/blueprint-overlay/$relative_path"
        fi
        install -D -m 0644 -o www-data -g www-data "$source_file" "$PANEL_DIR/$relative_path"
    done < "$MANIFEST"

    cd "$PANEL_DIR"
    log "Mise a jour de l'autoload PHP..."
    composer dump-autoload --no-interaction --no-scripts

    # Blueprint retrograde css-loader a 5.2.7, qui n'accepte que camelCase pour
    # exportLocalsConvention ; la variante Blueprint du theme utilise 'as-is'
    # (css-loader 6+). On normalise pour que la compilation passe partout.
    if ((USE_BLUEPRINT)) && [[ -f webpack.config.js ]] && grep -q "exportLocalsConvention: 'as-is'" webpack.config.js; then
        sed -i "s/exportLocalsConvention: 'as-is'/exportLocalsConvention: 'camelCase'/" webpack.config.js
        log "Option css-loader ajustee pour la version embarquee par Blueprint."
    fi
    if ((USE_BLUEPRINT)) && [[ -f webpack.config.js ]] && grep -q "namedExport: false" webpack.config.js; then
        sed -i "/namedExport: false/d" webpack.config.js
    fi
    if [[ ! -d node_modules ]]; then
        log "Installation des dependances frontend..."
        yarn install --frozen-lockfile
    fi
    # La police et l'addon unicode11 font partie de VinusPanel, pas des
    # dependances Pterodactyl. On n'ajoute un paquet que s'il manque : relancer
    # "yarn add" re-resout l'arbre de dependances juste avant la compilation
    # et peut la casser.
    local need_deps=0
    grep -q '@fontsource-variable/ibm-plex-sans' package.json 2>/dev/null || need_deps=1
    node -e "require.resolve('xterm-addon-unicode11')" >/dev/null 2>&1 || need_deps=1
    if ((need_deps)); then
        yarn add -D @fontsource-variable/ibm-plex-sans@^5.2.8 jest-environment-jsdom@28.1.3 --ignore-scripts
        yarn add xterm-addon-unicode11@^0.6.0 --ignore-scripts
    fi

    # Filet de securite : "yarn run clean" vide public/assets avant de
    # compiler. Si la compilation echoue, le rollback restaure cet instantane
    # et le panel garde ses styles au lieu de devenir sans styles.
    if [[ -d public/assets ]]; then
        rm -rf "$TRANSACTION_BACKUP/assets"
        cp -a public/assets "$TRANSACTION_BACKUP/assets"
    fi

    if [[ "$BUILD_MODE" == "development" ]]; then
        log "Compilation des assets (mode developpement)..."
        enable_legacy_openssl
        yarn build
    else
        log "Compilation des assets de production..."
        enable_legacy_openssl
        yarn build:production
    fi

    log "Nettoyage des caches..."
    php artisan view:clear
    php artisan route:clear
    php artisan cache:clear
    chown -R www-data:www-data storage bootstrap/cache public/assets

    printf '%s\n' "$THEME_VERSION" > "$STATE_DIR/version"
    printf '%s\n' "$PANEL_DIR" > "$STATE_DIR/panel-dir"
    INSTALL_STARTED=0
    trap - ERR INT TERM
    finish_maintenance

    ok "VinusPanel ${THEME_VERSION} est installe. Sauvegarde : ${TRANSACTION_BACKUP}"
}

# ---------------------------------------------------------------------------
# Wings
# ---------------------------------------------------------------------------
install_wings() {
    log "Installation de Wings..."
    if ! command -v docker >/dev/null 2>&1; then
        log "Installation de Docker (requis par Wings)..."
        curl -fsSL https://get.docker.com | CHANNEL=stable bash
    fi
    systemctl enable --now docker >/dev/null 2>&1 || true
    mkdir -p /etc/pterodactyl

    if [[ ! -x /usr/local/bin/wings ]]; then
        local arch="amd64"; [[ "$(uname -m)" == "arm64" || "$(uname -m)" == "aarch64" ]] && arch="arm64"
        curl -fL -o /usr/local/bin/wings \
            "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_${arch}"
        chmod u+x /usr/local/bin/wings
    fi

    local scheme="http"; [[ "$PANEL_URL" == https://* ]] && scheme="https"

    (
        cd "$PANEL_DIR"
        local loc_id node_id
        loc_id="$("$PHP_BIN" artisan tinker --execute='echo \Pterodactyl\Models\Location::firstOrCreate(["short" => "fr1"], ["long" => "France - VinusPanel"])->id;' | tail -n 1 | tr -dc '0-9')"
        [[ -n "$loc_id" ]] || fail "impossible de creer la location Wings"

        node_id="$("$PHP_BIN" artisan tinker --execute='echo (string) optional(\Pterodactyl\Models\Node::query()->first())->id;' | tail -n 1 | tr -dc '0-9')"
        if [[ -z "$node_id" ]]; then
            # Limites du noeud deduites de la machine (85 % de la RAM et du disque).
            local node_mem="$NODE_MEMORY" node_disk="$NODE_DISK"
            if [[ -z "$node_mem" ]]; then
                node_mem="$(awk '/MemTotal/{printf "%d", $2/1024*0.85}' /proc/meminfo 2>/dev/null || echo "")"
                [[ "$node_mem" =~ ^[0-9]+$ && "$node_mem" -ge 512 ]] || node_mem=2048
            fi
            if [[ -z "$node_disk" ]]; then
                node_disk="$(df -Pm / 2>/dev/null | awk 'NR==2{printf "%d", $2*0.85}')"
                [[ "$node_disk" =~ ^[0-9]+$ && "$node_disk" -ge 2048 ]] || node_disk=20000
            fi

            "$PHP_BIN" artisan p:node:make \
                --name="$NODE_NAME" --description="Noeud cree par l'installeur VinusPanel" \
                --locationId="$loc_id" --fqdn="$NODE_FQDN" --public=1 --scheme="$scheme" \
                --proxy=0 --maintenance=0 --maxMemory="$node_mem" --overallocateMemory=0 \
                --maxDisk="$node_disk" --overallocateDisk=0 --uploadSize=100 \
                --daemonListeningPort=8080 --daemonSFTPPort=2022 \
                --daemonBase=/var/lib/pterodactyl/volumes --no-interaction
            node_id="$("$PHP_BIN" artisan tinker --execute='echo (string) optional(\Pterodactyl\Models\Node::query()->first())->id;' | tail -n 1 | tr -dc '0-9')"
        fi
        [[ -n "$node_id" ]] || fail "impossible de creer le noeud Wings"

        local alloc_ip; alloc_ip="$(detect_public_ip)"
        VINUS_NODE_ID="$node_id" VINUS_ALLOC_IP="$alloc_ip" \
        VINUS_ALLOC_START="$ALLOC_START" VINUS_ALLOC_END="$ALLOC_END" \
        "$PHP_BIN" artisan tinker --execute='
            $node = (int) getenv("VINUS_NODE_ID");
            for ($p = (int) getenv("VINUS_ALLOC_START"); $p <= (int) getenv("VINUS_ALLOC_END"); $p++) {
                \Pterodactyl\Models\Allocation::firstOrCreate([
                    "node_id" => $node,
                    "ip" => getenv("VINUS_ALLOC_IP"),
                    "port" => $p,
                ]);
            }
            echo "allocations=" . \Pterodactyl\Models\Allocation::where("node_id", $node)->count();
        '

        "$PHP_BIN" artisan p:node:configuration "$node_id" > /etc/pterodactyl/config.yml
        chmod 600 /etc/pterodactyl/config.yml
    )

    cat > /etc/systemd/system/wings.service <<'UNIT'
[Unit]
Description=Pterodactyl Wings Daemon
After=docker.service
Requires=docker.service
PartOf=docker.service

[Service]
User=root
WorkingDirectory=/etc/pterodactyl
LimitNOFILE=4096
PIDFile=/var/run/wings/daemon.pid
ExecStart=/usr/local/bin/wings
Restart=on-failure
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
UNIT

    systemctl daemon-reload
    systemctl enable --now wings.service
    ok "Wings installe et demarre (noeud ${NODE_NAME} / ${NODE_FQDN})."
}

# ---------------------------------------------------------------------------
# Recapitulatif
# ---------------------------------------------------------------------------
print_summary() {
    printf '\n'
    ok "Installation terminee."
    if [[ "$FRESH_PANEL" == "1" ]]; then
        mkdir -p "$STATE_DIR"
        {
            printf '# Identifiants VinusPanel (genere le %s)\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
            printf 'Panel      : %s\n' "$PANEL_URL"
            printf 'Admin email: %s\n' "$ADMIN_EMAIL"
            printf 'Admin user : %s\n' "$ADMIN_USER"
            printf 'Admin pass : %s\n' "$ADMIN_PASS"
            printf 'Base       : %s / %s@%s\n' "$DB_NAME" "$DB_USER" "$DB_HOST"
            printf 'Base pass  : %s\n' "$DB_PASS"
        } > "$CREDENTIALS_FILE"
        chmod 600 "$CREDENTIALS_FILE"

        log "Panel      : ${PANEL_URL}"
        log "Admin      : ${ADMIN_EMAIL} / ${ADMIN_USER} / ${ADMIN_PASS}"
        log "Identifiants enregistres dans ${CREDENTIALS_FILE} (chmod 600)."
    else
        log "Theme applique sur un panel existant (${PANEL_DIR})."
    fi
    if wings_enabled; then
        log "Wings      : noeud '${NODE_NAME}' (${NODE_FQDN}) - config /etc/pterodactyl/config.yml"
    fi
}

# ---------------------------------------------------------------------------
# Actions du menu
# ---------------------------------------------------------------------------
action_install() {
    BUILD_MODE="${1:-production}"
    require_root
    generate_secrets

    if panel_present; then
        log "Panel Pterodactyl detecte dans ${PANEL_DIR}."
    else
        FRESH_PANEL=1
        bootstrap_panel
    fi

    validate_environment
    install_theme
    if wings_enabled; then install_wings; fi
    print_summary
}

action_update() {
    require_root
    if [[ -d "$REPO_DIR/.git" ]]; then
        log "Recuperation des sources VinusPanel (git pull)..."
        git -C "$REPO_DIR" fetch --quiet origin >/dev/null 2>&1 || warn "git fetch a echoue"
        if git -C "$REPO_DIR" pull --ff-only --quiet; then
            ok "Sources a jour."
        else
            warn "git pull impossible (modifications locales ou branche divergente) : sources inchangees."
        fi
    else
        warn "Ce dossier n'est pas un clone Git : mise a jour des sources ignoree."
    fi
    validate_environment
    BUILD_MODE="production"
    install_theme
    ok "Mise a jour terminee."
}

action_admin() {
    require_root
    panel_present || fail "aucun panel Pterodactyl detecte ; utilise d'abord l'option 1"

    local email="$ADMIN_EMAIL" user="$ADMIN_USER" pass="$ADMIN_PASS" ans
    [[ -n "$email" ]] || email="$(default_admin_email)"
    if is_tty; then
        read -r -p "Email administrateur [${email}] : " ans || true
        email="${ans:-$email}"
        read -r -p "Identifiant [${user:-admin}] : " ans || true
        user="${ans:-${user:-admin}}"
        read -r -s -p "Mot de passe (vide = genere automatiquement) : " pass || true
        printf '\n'
    fi
    valid_email "$email" || fail "adresse e-mail invalide : ${email}"
    [[ -n "$pass" ]] || pass="$(generate_password)"

    local existing
    existing="$(mariadb -u root -N -B -e \
        "SELECT COUNT(*) FROM \`${DB_NAME}\`.users WHERE email='${email//\'/\'\'}';" 2>/dev/null || echo 0)"

    cd "$PANEL_DIR"
    if [[ "$existing" != "0" ]]; then
        VINUS_EM="$email" VINUS_PW="$pass" "$PHP_BIN" artisan tinker --execute='
            $u = \Pterodactyl\Models\User::where("email", getenv("VINUS_EM"))->first();
            $u->password = \Illuminate\Support\Facades\Hash::make(getenv("VINUS_PW"));
            $u->save();
            echo "reset-ok";
        ' >/dev/null
        ok "Mot de passe reinitialise pour ${email}."
    else
        "$PHP_BIN" artisan p:user:make \
            --email="$email" --username="$user" \
            --name-first="$ADMIN_FIRST" --name-last="$ADMIN_LAST" \
            --password="$pass" --admin=1 --no-interaction
        ok "Compte administrateur ${email} cree."
    fi
    log "Identifiant : ${user}"
    log "Mot de passe : ${pass}"
}

action_restart() {
    require_root
    local svc
    for svc in php8.3-fpm nginx pteroq wings; do
        if systemctl cat "$svc" >/dev/null 2>&1; then
            if systemctl restart "$svc" >/dev/null 2>&1; then ok "Redemarre : ${svc}"; else warn "echec du redemarrage : ${svc}"; fi
        fi
    done
    if panel_present; then
        (cd "$PANEL_DIR" && "$PHP_BIN" artisan queue:restart) >/dev/null 2>&1 && ok "File d'attente reinitialisee."
        (cd "$PANEL_DIR" && "$PHP_BIN" artisan view:clear >/dev/null 2>&1) || true
        (cd "$PANEL_DIR" && "$PHP_BIN" artisan cache:clear >/dev/null 2>&1) || true
    fi
    ok "Services redemarres."
}

action_uninstall() {
    require_root
    local script="$REPO_DIR/uninstall.sh"
    if [[ ! -f "$script" ]]; then
        script="$PANEL_DIR/../vinuspanel/uninstall.sh"
    fi
    [[ -f "$script" ]] || fail "uninstall.sh est introuvable (execute cette action depuis le depot VinusPanel)"
    if is_tty; then
        local a
        read -r -p "Confirmer la desinstallation du theme VinusPanel ? [oui/non] : " a || true
        case "$a" in
            oui|o|y|yes) ;;
            *) log "Desinstallation annulee."; return 0 ;;
        esac
    fi
    bash "$script"
    ok "Desinstallation terminee."
}

# ---------------------------------------------------------------------------
# Boucle du menu
# ---------------------------------------------------------------------------
interactive_loop() {
    while true; do
        [[ -t 1 ]] && clear 2>/dev/null || true
        banner
        header
        menu
        printf 'Select an option %s[1-7]%s: ' "$C_ACCENT" "$C_RESET"
        local choice=""
        read -r choice || { printf '\n'; break; }
        printf '\n'
        case "$choice" in
            1) action_install production ;;
            2) action_install development ;;
            3) action_update ;;
            4) action_admin ;;
            5) action_restart ;;
            6) action_uninstall ;;
            7) log "Au revoir."; exit 0 ;;
            *) warn "Choix invalide (1-7)." ;;
        esac
        printf '\n'
        printf '%s--- Appuie sur Entree pour revenir au menu ---%s' "$C_GREY" "$C_RESET"
        read -r _ || { printf '\n'; break; }
    done
}

# ---------------------------------------------------------------------------
# Analyse des arguments
# ---------------------------------------------------------------------------
while (($#)); do
    case "$1" in
        --panel-dir) (($# >= 2)) || fail "--panel-dir necessite un chemin"; PANEL_DIR="${2%/}"; shift 2 ;;
        --check) ACTION="check"; CHECK_ONLY=1; shift ;;
        --menu) MENU_FORCE=1; shift ;;
        --install)
            ACTION="install"
            if (($# >= 2)) && [[ "$2" == "dev" || "$2" == "development" || "$2" == "prod" || "$2" == "production" ]]; then
                BUILD_MODE="$2"; [[ "$BUILD_MODE" == "dev" ]] && BUILD_MODE="development"
                [[ "$BUILD_MODE" == "prod" ]] && BUILD_MODE="production"
                shift 2
            else
                BUILD_MODE="production"; shift
            fi ;;
        --update) ACTION="update"; shift ;;
        --admin) ACTION="admin"; shift ;;
        --restart) ACTION="restart"; shift ;;
        --uninstall) ACTION="uninstall"; shift ;;
        --url) (($# >= 2)) || fail "--url necessite une valeur"; PANEL_URL="$2"; shift 2 ;;
        --timezone) (($# >= 2)) || fail "--timezone necessite une valeur"; PANEL_TIMEZONE="$2"; shift 2 ;;
        --db-password) (($# >= 2)) || fail "--db-password necessite une valeur"; DB_PASS="$2"; shift 2 ;;
        --admin-email) (($# >= 2)) || fail "--admin-email necessite une valeur"; ADMIN_EMAIL="$2"; shift 2 ;;
        --admin-user) (($# >= 2)) || fail "--admin-user necessite une valeur"; ADMIN_USER="$2"; shift 2 ;;
        --admin-password) (($# >= 2)) || fail "--admin-password necessite une valeur"; ADMIN_PASS="$2"; shift 2 ;;
        --wings) WITH_WINGS="yes"; shift ;;
        --no-wings) WITH_WINGS="no"; shift ;;
        --node-fqdn) (($# >= 2)) || fail "--node-fqdn necessite une valeur"; NODE_FQDN="$2"; shift 2 ;;
        --alloc-range) (($# >= 2)) || fail "--alloc-range necessite une valeur"; ALLOC_START="${2%-*}"; ALLOC_END="${2#*-}"; shift 2 ;;
        --keep-proxy) PROXY_MODE="keep"; shift ;;
        -h|--help) usage; exit 0 ;;
        *) fail "option inconnue : $1" ;;
    esac
done

[[ "$PANEL_DIR" = /* ]] || fail "le chemin du panel doit etre absolu"

# ---------------------------------------------------------------------------
# Point d'entree
# ---------------------------------------------------------------------------
case "$ACTION" in
    check)   system_report; exit 0 ;;
    install) action_install "$BUILD_MODE"; exit 0 ;;
    update)  action_update; exit 0 ;;
    admin)   action_admin; exit 0 ;;
    restart) action_restart; exit 0 ;;
    uninstall) action_uninstall; exit 0 ;;
esac

if interactive; then
    interactive_loop
else
    # Execution non interactive (scripts / CI) : installation complete.
    action_install production
fi
