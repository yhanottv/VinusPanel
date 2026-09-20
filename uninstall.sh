#!/usr/bin/env bash
set -Eeuo pipefail

DEFAULT_PANEL_DIR="/var/www/pterodactyl"
PANEL_DIR="$DEFAULT_PANEL_DIR"
STATE_DIR="/var/lib/vinuspanel"
ORIGINAL_BACKUP="$STATE_DIR/original"
MAINTENANCE_ENABLED=0

usage() {
    cat <<'USAGE'
Usage : sudo bash uninstall.sh [--panel-dir CHEMIN]

  --panel-dir CHEMIN  Racine du panel (défaut : chemin mémorisé ou /var/www/pterodactyl)
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

if [[ -f "$STATE_DIR/panel-dir" ]]; then
    PANEL_DIR="$(<"$STATE_DIR/panel-dir")"
fi

while (($#)); do
    case "$1" in
        --panel-dir)
            (($# >= 2)) || fail "--panel-dir nécessite un chemin"
            PANEL_DIR="${2%/}"
            shift 2
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

((EUID == 0)) || fail "la désinstallation doit être lancée avec sudo ou en root"
[[ "$PANEL_DIR" = /* ]] || fail "le chemin du panel doit être absolu"
[[ -f "$PANEL_DIR/artisan" ]] || fail "artisan est absent de $PANEL_DIR"
[[ -f "$ORIGINAL_BACKUP/tracked.list" ]] || fail "aucune sauvegarde d'origine VinusPanel trouvée"
command -v php >/dev/null 2>&1 || fail "PHP est absent"
command -v yarn >/dev/null 2>&1 || fail "Yarn est absent"

finish_maintenance() {
    if ((MAINTENANCE_ENABLED)); then
        (cd "$PANEL_DIR" && php artisan up) >/dev/null 2>&1 || true
        MAINTENANCE_ENABLED=0
    fi
}
trap finish_maintenance EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

log "Activation du mode maintenance…"
(cd "$PANEL_DIR" && php artisan down) >/dev/null
MAINTENANCE_ENABLED=1

log "Restauration des fichiers d'origine…"
while IFS= read -r relative_path; do
    [[ -n "$relative_path" ]] || continue
    if [[ -e "$ORIGINAL_BACKUP/files/$relative_path" || -L "$ORIGINAL_BACKUP/files/$relative_path" ]]; then
        mkdir -p "$PANEL_DIR/$(dirname "$relative_path")"
        cp -a "$ORIGINAL_BACKUP/files/$relative_path" "$PANEL_DIR/$relative_path"
    else
        rm -f -- "$PANEL_DIR/$relative_path"
    fi
done < "$ORIGINAL_BACKUP/tracked.list"

cd "$PANEL_DIR"
log "Recompilation des assets d'origine…"
yarn build:production
php artisan view:clear
php artisan cache:clear
chown -R www-data:www-data storage bootstrap/cache public/assets

archive_dir="/var/backups/vinuspanel/uninstalled-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$(dirname "$archive_dir")"
mv "$STATE_DIR" "$archive_dir"

finish_maintenance
trap - EXIT INT TERM
log "VinusPanel est désinstallé. État archivé dans $archive_dir"
