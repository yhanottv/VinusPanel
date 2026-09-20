#!/usr/bin/env bash
set -Eeuo pipefail

THEME_VERSION="1.4.0"
DEFAULT_PANEL_DIR="/var/www/pterodactyl"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PANEL_DIR="$DEFAULT_PANEL_DIR"
CHECK_ONLY=0
STATE_DIR="/var/lib/vinuspanel"
BACKUP_ROOT="/var/backups/vinuspanel"
ORIGINAL_BACKUP="$STATE_DIR/original"
TRANSACTION_BACKUP=""
MAINTENANCE_ENABLED=0
INSTALL_STARTED=0

usage() {
    cat <<'USAGE'
Usage : sudo bash install.sh [--panel-dir CHEMIN] [--check]

  --panel-dir CHEMIN  Racine du panel (défaut : /var/www/pterodactyl)
  --check              Vérifie les pré-requis sans modifier le panel
  -h, --help           Affiche cette aide
USAGE
}

log() {
    printf '\033[1;38;5;208m[VinusPanel]\033[0m %s\n' "$*"
}

fail() {
    printf '\033[1;31m[VinusPanel] Erreur :\033[0m %s\n' "$*" >&2
    exit 1
}

while (($#)); do
    case "$1" in
        --panel-dir)
            (($# >= 2)) || fail "--panel-dir nécessite un chemin"
            PANEL_DIR="${2%/}"
            shift 2
            ;;
        --check)
            CHECK_ONLY=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            fail "option inconnue : $1"
            ;;
    esac
done

[[ "$PANEL_DIR" = /* ]] || fail "le chemin du panel doit être absolu"

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
    require_command node
    require_command yarn
    require_command find
    require_command install
    require_command cp

    bash "$REPO_DIR/scripts/check-package.sh"

    local node_major
    node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
    [[ "$node_major" =~ ^[0-9]+$ ]] || fail "version Node.js illisible"
    ((node_major >= 18)) || fail "Node.js 18 ou supérieur est requis"

    local detected_version=""
    if [[ -f "$PANEL_DIR/config/app.php" ]]; then
        detected_version="$(sed -nE "s/.*'version'[[:space:]]*=>[[:space:]]*'([^']+)'.*/\1/p" "$PANEL_DIR/config/app.php" | head -n 1)"
    fi
    if [[ -n "$detected_version" && "$detected_version" != "1.15.1" ]]; then
        fail "Pterodactyl $detected_version détecté ; ce paquet est validé pour 1.15.1"
    fi

    log "Pré-requis valides (PHP $(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;'), Node $(node --version), Yarn $(yarn --version))."
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
    done < "$REPO_DIR/overlay-manifest.txt"
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
    done < "$REPO_DIR/overlay-manifest.txt"
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
        printf '\n\033[1;31m[VinusPanel] Installation interrompue, restauration automatique…\033[0m\n' >&2
        restore_from "$TRANSACTION_BACKUP"
        (cd "$PANEL_DIR" && yarn build:production) >/dev/null 2>&1 || true
        (cd "$PANEL_DIR" && php artisan view:clear && php artisan cache:clear) >/dev/null 2>&1 || true
    fi
    finish_maintenance
    exit "$exit_code"
}

validate_environment

if ((CHECK_ONLY)); then
    log "Contrôle terminé : aucune modification effectuée."
    exit 0
fi

((EUID == 0)) || fail "l'installation doit être lancée avec sudo ou en root"

mkdir -p "$BACKUP_ROOT" "$STATE_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
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

log "Activation du mode maintenance…"
(cd "$PANEL_DIR" && php artisan down) >/dev/null
MAINTENANCE_ENABLED=1

log "Installation de la surcouche VinusPanel $THEME_VERSION…"
while IFS= read -r relative_path; do
    [[ -n "$relative_path" ]] || continue
    install -D -m 0644 -o www-data -g www-data \
        "$REPO_DIR/overlay/$relative_path" \
        "$PANEL_DIR/$relative_path"
done < "$REPO_DIR/overlay-manifest.txt"

cd "$PANEL_DIR"
if [[ ! -d node_modules ]]; then
    log "Installation des dépendances frontend…"
    yarn install --frozen-lockfile
fi

log "Compilation des assets de production…"
yarn build:production

log "Nettoyage des caches…"
php artisan view:clear
php artisan cache:clear
chown -R www-data:www-data storage bootstrap/cache public/assets

printf '%s\n' "$THEME_VERSION" > "$STATE_DIR/version"
printf '%s\n' "$PANEL_DIR" > "$STATE_DIR/panel-dir"
INSTALL_STARTED=0
trap - ERR INT TERM
finish_maintenance

log "VinusPanel $THEME_VERSION est installé. Sauvegarde : $TRANSACTION_BACKUP"
