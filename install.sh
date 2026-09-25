#!/usr/bin/env bash
# VinusPanel - installeur tout-en-un
#
# Deux modes automatiques :
#   * VPS nu      : installe Pterodactyl (+ Wings) puis applique le theme.
#   * panel existant : applique / met a jour le theme uniquement.
#
# Toutes les valeurs sont surchargeables par variables d'environnement VINUS_*
# ou par options de commande. Aucune saisie interactive n'est demandee.
set -Eeuo pipefail

THEME_VERSION="3.2.0"
PTERODACTYL_VERSION="1.15.1"
DEFAULT_PANEL_DIR="/var/www/pterodactyl"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PANEL_DIR="$DEFAULT_PANEL_DIR"
CHECK_ONLY=0
PHP_BIN="${VINUS_PHP_BIN:-php8.3}"

STATE_DIR="/var/lib/vinuspanel"
BACKUP_ROOT="/var/backups/vinuspanel"
ORIGINAL_BACKUP="$STATE_DIR/original"
TRANSACTION_BACKUP=""
MAINTENANCE_ENABLED=0
INSTALL_STARTED=0
CREDENTIALS_FILE="$STATE_DIR/credentials.txt"

# Parametres de deploiement.
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
WITH_WINGS="${VINUS_WITH_WINGS:-auto}"        # auto | yes | no
PROXY_MODE="${VINUS_PROXY_MODE:-auto}"        # auto | keep

usage() {
    cat <<'USAGE'
Usage : sudo bash install.sh [options]

Installation du theme (et, si Pterodactyl est absent, du panel complet).

  --panel-dir CHEMIN     Racine du panel (defaut : /var/www/pterodactyl)
  --check                Verifie l'environnement sans rien modifier
  --url URL              URL publique du panel (defaut : http://<ip-publique>)
  --timezone TZ          Fuseau du panel (defaut : Europe/Paris)
  --db-password MDP      Mot de passe de la base (defaut : genere)
  --admin-email EMAIL    Email de l'administrateur (defaut : admin@<hote>)
  --admin-user USER      Identifiant administrateur (defaut : admin)
  --admin-password MDP   Mot de passe administrateur (defaut : genere)
  --[no-]wings           Installe ou non Wings (defaut : auto si VPS nu)
  --node-fqdn HOTE       FQDN/IP du noeud Wings (defaut : hote du panel)
  --alloc-range A-B      Plage de ports des allocations (defaut : 25565-25584)
  --keep-proxy           Refuse de retirer un reverse-proxy sur 80/443
  -h, --help             Affiche cette aide

Variables d'environnement equivalentes : VINUS_PANEL_URL, VINUS_DB_PASSWORD,
VINUS_ADMIN_EMAIL, VINUS_ADMIN_PASSWORD, VINUS_WITH_WINGS, VINUS_PROXY_MODE...
USAGE
}

log()  { printf '\033[1;38;5;208m[VinusPanel]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[VinusPanel] Attention :\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31m[VinusPanel] Erreur :\033[0m %s\n' "$*" >&2; exit 1; }

while (($#)); do
    case "$1" in
        --panel-dir)
            (($# >= 2)) || fail "--panel-dir necessite un chemin"
            PANEL_DIR="${2%/}"; shift 2 ;;
        --check) CHECK_ONLY=1; shift ;;
        --url) (($# >= 2)) || fail "--url necessite une valeur"; PANEL_URL="$2"; shift 2 ;;
        --timezone) (($# >= 2)) || fail "--timezone necessite une valeur"; PANEL_TIMEZONE="$2"; shift 2 ;;
        --db-password) (($# >= 2)) || fail "--db-password necessite une valeur"; DB_PASS="$2"; shift 2 ;;
        --admin-email) (($# >= 2)) || fail "--admin-email necessite une valeur"; ADMIN_EMAIL="$2"; shift 2 ;;
        --admin-user) (($# >= 2)) || fail "--admin-user necessite une valeur"; ADMIN_USER="$2"; shift 2 ;;
        --admin-password) (($# >= 2)) || fail "--admin-password necessite une valeur"; ADMIN_PASS="$2"; shift 2 ;;
        --wings) WITH_WINGS="yes"; shift ;;
        --no-wings) WITH_WINGS="no"; shift ;;
        --node-fqdn) (($# >= 2)) || fail "--node-fqdn necessite une valeur"; NODE_FQDN="$2"; shift 2 ;;
        --alloc-range)
            (($# >= 2)) || fail "--alloc-range necessite une valeur"
            ALLOC_START="${2%-*}"; ALLOC_END="${2#*-}"; shift 2 ;;
        --keep-proxy) PROXY_MODE="keep"; shift ;;
        -h|--help) usage; exit 0 ;;
        *) fail "option inconnue : $1" ;;
    esac
done

[[ "$PANEL_DIR" = /* ]] || fail "le chemin du panel doit etre absolu"

panel_present() { [[ -f "$PANEL_DIR/artisan" ]]; }

generate_password() {
    openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | cut -c1-24
}

detect_public_ip() {
    local ip
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
    [[ -n "$ip" ]] || ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')"
    printf '%s' "$ip"
}

panel_host() {
    local h="${PANEL_URL#*://}"
    printf '%s' "${h%%/*}"
}

wings_enabled() {
    case "$WITH_WINGS" in
        yes) return 0 ;;
        no) return 1 ;;
        *) [[ "${FRESH_PANEL:-0}" == "1" ]] ;;
    esac
}

# ---------------------------------------------------------------------------
# Bootstrap du systeme et du panel (uniquement si Pterodactyl est absent)
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
    ss -ltn 2>/dev/null | grep -qE ':(80|443)\b' || return 0

    if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qi traefik; then
        if [[ "$PROXY_MODE" == "keep" ]]; then
            fail "un reverse-proxy (Traefik) occupe 80/443 ; retire --keep-proxy ou libere les ports a la main"
        fi
        warn "un reverse-proxy Traefik occupe 80/443 et va etre arrete pour installer Nginx"
        while IFS= read -r container; do
            docker update --restart=no "$container" >/dev/null 2>&1 || true
            docker stop "$container" >/dev/null 2>&1 || true
        done < <(docker ps --format '{{.Names}}' | grep -i traefik)
        sleep 2
    fi

    if ss -ltn 2>/dev/null | grep -qE ':(80|443)\b'; then
        fail "les ports 80/443 sont occupes par un autre service ; libere-les puis relance"
    fi
}

install_dependencies() {
    export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a
    mkdir -p /etc/needrestart/conf.d
    printf '$nrconf{restart} = "a";\n' > /etc/needrestart/conf.d/99-vinus.conf 2>/dev/null || true

    log "Mise a jour du systeme et installation des dependances..."
    apt-get update -y
    apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade
    apt-get install -y software-properties-common curl ca-certificates gnupg2 sudo lsb-release

    add-apt-repository -y ppa:ondrej/php
    apt-get update -y
    apt-get install -y php8.3 php8.3-common php8.3-cli php8.3-gd php8.3-mysql \
        php8.3-mbstring php8.3-bcmath php8.3-xml php8.3-fpm php8.3-curl php8.3-zip \
        mariadb-server nginx tar unzip git redis-server

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
    log "Telechargement de Pterodactyl $PTERODACTYL_VERSION..."
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
    # Pterodactyl ne peut pas demarrer (EncryptionServiceProvider) sans APP_KEY,
    # ce qui empeche p:environment:setup de tourner. On pre-genere donc la cle.
    (
        cd "$PANEL_DIR"
        [[ -f .env ]] || cp .env.example .env
        if ! grep -q '^APP_KEY=base64:' .env; then
            local key="base64:$(openssl rand -base64 32)"
            if grep -q '^APP_KEY=' .env; then
                sed -i "s|^APP_KEY=.*|APP_KEY=${key}|" .env
            else
                printf 'APP_KEY=%s\n' "$key" >> .env
            fi
        fi
    )
}

generate_secrets() {
    local ip
    ip="$(detect_public_ip)"
    [[ -n "$PANEL_URL" ]] || PANEL_URL="http://${ip}"
    [[ -n "$DB_PASS" ]]   || DB_PASS="$(generate_password)"
    [[ -n "$ADMIN_PASS" ]] || ADMIN_PASS="$(generate_password)"
    [[ -n "$ADMIN_EMAIL" ]] || ADMIN_EMAIL="admin@${ip}"
    [[ -n "$NODE_FQDN" ]] || NODE_FQDN="$(panel_host)"
}

configure_database() {
    log "Creation de la base MariaDB '$DB_NAME'..."
    mariadb -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
CREATE USER IF NOT EXISTS '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'${DB_HOST}';
FLUSH PRIVILEGES;
SQL
}

setup_panel_environment() {
    log "Configuration de l'environnement du panel..."
    (
        cd "$PANEL_DIR"
        "$PHP_BIN" artisan p:environment:setup \
            --author="$ADMIN_EMAIL" \
            --url="$PANEL_URL" \
            --timezone="$PANEL_TIMEZONE" \
            --cache=redis --session=redis --queue=redis \
            --redis-host=127.0.0.1 --redis-port=6379 --redis-pass= \
            --settings-ui=1 --telemetry=0 --new-salt \
            --no-interaction

        "$PHP_BIN" artisan p:environment:database \
            --host="$DB_HOST" --port="$DB_PORT" --database="$DB_NAME" \
            --username="$DB_USER" --password="$DB_PASS" \
            --no-interaction

        "$PHP_BIN" artisan p:environment:mail \
            --driver=log --email="$ADMIN_EMAIL" --from="VinusPanel" \
            --no-interaction || true

        # p:environment:mail ecrit MAIL_DRIVER mais pas MAIL_MAILER (Laravel 12).
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

create_admin_user() {
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
            --password="$ADMIN_PASS" --admin=1 \
            --no-interaction
    )
}

configure_webserver() {
    log "Configuration de Nginx..."
    local host
    host="$(panel_host)"
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

bootstrap_panel() {
    require_supported_os
    free_web_ports
    install_dependencies
    if command -v update-alternatives >/dev/null 2>&1 && [[ -x /usr/bin/php8.3 ]]; then
        update-alternatives --set php /usr/bin/php8.3 >/dev/null 2>&1 || true
    fi
    download_panel
    ensure_app_key
    configure_database
    setup_panel_environment
    create_admin_user
    fix_permissions
    configure_webserver
    configure_services
    log "Panel Pterodactyl $PTERODACTYL_VERSION installe (${PANEL_URL})."
}

# ---------------------------------------------------------------------------
# Controle de l'environnement (--check)
# ---------------------------------------------------------------------------

system_report() {
    log "Controle de l'environnement (aucune modification)."
    [[ -f /etc/os-release ]] && ( . /etc/os-release; log "Systeme : ${PRETTY_NAME:-inconnu}" )
    log "RAM totale : $(awk '/MemTotal/{printf "%.1f Go", $2/1048576}' /proc/meminfo)"
    log "Disque / : $(df -h / | awk 'NR==2{print $4" libres sur "$2}')"

    local missing=()
    local c
    for c in php composer node yarn nginx mariadb redis-server curl tar unzip git; do
        if command -v "$c" >/dev/null 2>&1; then
            log "  ok    $c"
        else
            warn "  absent $c"
            missing+=("$c")
        fi
    done

    if panel_present; then
        local detected=""
        [[ -f "$PANEL_DIR/config/app.php" ]] && detected="$(sed -nE "s/.*'version'[[:space:]]*=>[[:space:]]*'([^']+)'.*/\1/p" "$PANEL_DIR/config/app.php" | head -n1)"
        log "Panel detecte dans $PANEL_DIR (version : ${detected:-inconnue})."
        [[ "$detected" == "$PTERODACTYL_VERSION" || -z "$detected" ]] || \
            warn "le paquet est valide pour Pterodactyl ${PTERODACTYL_VERSION}, detecte : $detected"
        bash "$REPO_DIR/scripts/check-package.sh" || fail "le paquet du theme est invalide"
    else
        log "Panel absent : une installation complete sera effectuee (mode sans --check)."
    fi
    log "Controle termine."
}

# ---------------------------------------------------------------------------
# Application du theme (code historique VinusPanel)
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

require_command() {
    command -v "$1" >/dev/null 2>&1 || fail "commande requise absente : $1"
}

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

    log "Prerequis valides (PHP $(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;'), Node $(node --version), Yarn $(yarn --version))."
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
        printf '\n\033[1;31m[VinusPanel] Installation interrompue, restauration automatique...\033[0m\n' >&2
        restore_from "$TRANSACTION_BACKUP"
        (cd "$PANEL_DIR" && composer dump-autoload --no-interaction --no-scripts) >/dev/null 2>&1 || true
        (cd "$PANEL_DIR" && yarn build:production) >/dev/null 2>&1 || true
        (cd "$PANEL_DIR" && php artisan route:clear && php artisan view:clear && php artisan cache:clear) >/dev/null 2>&1 || true
    fi
    finish_maintenance
    exit "$exit_code"
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

    log "Installation de la surcouche VinusPanel $THEME_VERSION..."
    while IFS= read -r relative_path; do
        [[ -n "$relative_path" ]] || continue
        local source_file="$REPO_DIR/overlay/$relative_path"
        if ((USE_BLUEPRINT)) && [[ -f "$REPO_DIR/blueprint-overlay/$relative_path" ]]; then
            source_file="$REPO_DIR/blueprint-overlay/$relative_path"
        fi
        install -D -m 0644 -o www-data -g www-data \
            "$source_file" \
            "$PANEL_DIR/$relative_path"
    done < "$MANIFEST"

    cd "$PANEL_DIR"
    log "Mise a jour de l'autoload PHP..."
    composer dump-autoload --no-interaction --no-scripts
    if [[ ! -d node_modules ]]; then
        log "Installation des dependances frontend..."
        yarn install --frozen-lockfile
    fi
    # La police fait partie de VinusPanel, pas des dependances Pterodactyl.
    yarn add -D @fontsource-variable/ibm-plex-sans@^5.2.8 jest-environment-jsdom@28.1.3 --ignore-scripts

    log "Compilation des assets de production..."
    yarn build:production

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

    log "VinusPanel $THEME_VERSION est installe. Sauvegarde : $TRANSACTION_BACKUP"
}

# ---------------------------------------------------------------------------
# Wings (optionnel)
# ---------------------------------------------------------------------------

install_wings() {
    log "Installation de Wings..."
    systemctl enable --now docker >/dev/null 2>&1 || true
    mkdir -p /etc/pterodactyl

    if [[ ! -x /usr/local/bin/wings ]]; then
        curl -fL -o /usr/local/bin/wings \
            "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_$( [[ "$(uname -m)" == "x86_64" ]] && echo amd64 || echo arm64 )"
        chmod u+x /usr/local/bin/wings
    fi

    local scheme="http"
    [[ "$PANEL_URL" == https://* ]] && scheme="https"

    (
        cd "$PANEL_DIR"
        local loc_id node_id
        loc_id="$("$PHP_BIN" artisan tinker --execute='echo \Pterodactyl\Models\Location::firstOrCreate(["short" => "fr1"], ["long" => "France - VinusPanel"])->id;' | tr -dc '0-9')"
        [[ -n "$loc_id" ]] || fail "impossible de creer la location Wings"

        node_id="$("$PHP_BIN" artisan tinker --execute='echo (string) optional(\Pterodactyl\Models\Node::query()->first())->id;' | tr -dc '0-9')"
        if [[ -z "$node_id" ]]; then
            "$PHP_BIN" artisan p:node:make \
                --name="$NODE_NAME" \
                --description="Noeud cree par l'installeur VinusPanel" \
                --locationId="$loc_id" \
                --fqdn="$NODE_FQDN" \
                --public=1 \
                --scheme="$scheme" \
                --proxy=0 \
                --maintenance=0 \
                --maxMemory=7000 \
                --overallocateMemory=0 \
                --maxDisk=80000 \
                --overallocateDisk=0 \
                --uploadSize=100 \
                --daemonListeningPort=8080 \
                --daemonSFTPPort=2022 \
                --daemonBase=/var/lib/pterodactyl/volumes \
                --no-interaction
            node_id="$("$PHP_BIN" artisan tinker --execute='echo (string) optional(\Pterodactyl\Models\Node::query()->first())->id;' | tr -dc '0-9')"
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
    log "Wings installe et demarre (node fqdn : ${NODE_FQDN})."
}

# ---------------------------------------------------------------------------
# Recapitulatif
# ---------------------------------------------------------------------------

print_summary() {
    printf '\n'
    log "Installation terminee."

    if ((FRESH_PANEL)); then
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
# Point d'entree
# ---------------------------------------------------------------------------

main() {
    FRESH_PANEL=0

    if ((CHECK_ONLY)); then
        system_report
        exit 0
    fi

    ((EUID == 0)) || fail "l'installation doit etre lancee avec sudo ou en root"

    generate_secrets

    if panel_present; then
        log "Panel Pterodactyl detecte dans $PANEL_DIR."
    else
        FRESH_PANEL=1
        bootstrap_panel
    fi

    validate_environment
    install_theme

    if wings_enabled; then
        install_wings
        mkdir -p "$STATE_DIR"
        printf 'yes\n' > "$STATE_DIR/wings-enabled"
    fi

    print_summary
}

main "$@"
