#!/usr/bin/env bash
# vinus-guard : quarantaine automatique des mods client-only qui crashent un
# serveur dedie, puis relance du serveur. Installe par VinusPanel.
set -u

PANEL_DIR="/var/www/pterodactyl"
PHP_BIN="${VINUS_PHP_BIN:-php8.3}"
VOLUMES="/var/lib/pterodactyl/volumes"
STATE="/var/lib/vinus-guard"
LOG="/var/log/vinus-guard.log"
INTERVAL="${VINUS_GUARD_INTERVAL:-20}"
MAX_ATTEMPTS=15
WINDOW=3600

log() { printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >> "$LOG"; }

mkdir -p "$STATE"

attempts_allowed() {
    local dir now count ts f
    dir="$STATE/$1"
    mkdir -p "$dir"
    now="$(date +%s)"
    count=0
    for f in "$dir"/attempt-*; do
        [ -f "$f" ] || continue
        ts="$(basename "$f" | cut -d- -f2)"
        [ "$((now - ts))" -le "$WINDOW" ] || rm -f "$f"
    done
    count="$(ls "$dir"/attempt-* 2>/dev/null | wc -l)"
    [ "$count" -lt "$MAX_ATTEMPTS" ]
}

register_attempt() {
    mkdir -p "$STATE/$1"
    : > "$STATE/$1/attempt-$(date +%s)-$$"
}

mods_toml_header_id() {
    local jar="$1"
    unzip -p "$jar" META-INF/mods.toml 2>/dev/null | python3 -c "
import sys
text = sys.stdin.read()
head = text.split('[[dependencies', 1)[0]
import re
match = re.search(r'modId\s*=\s*\"([^\"]+)\"', head)
print(match.group(1) if match else '')
"
}

fabric_id() {
    local jar="$1"
    unzip -p "$jar" fabric.mod.json 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('id', ''))
except Exception:
    print('')
"
}

jar_for_modid() {
    local volume="$1" modid="$2" j
    for j in "$volume"/mods/*.jar; do
        [ -f "$j" ] || continue
        if [ "$(mods_toml_header_id "$j")" == "$modid" ]; then
            printf '%s' "$j"
            return 0
        fi
        if [ "$(fabric_id "$j")" == "$modid" ]; then
            printf '%s' "$j"
            return 0
        fi
    done
    return 1
}

faulty_modids() {
    local logfile="$1"
    {
        grep -oE '\(([a-zA-Z0-9_-]{2,64})\) has failed to load correctly' "$logfile" 2>/dev/null \
            | sed -E 's/^\(//; s/\) has failed to load correctly$//'
        grep -oE 'handler\$[a-f0-9]{1,8}\$[a-z0-9_]{2,64}\$' "$logfile" 2>/dev/null \
            | sed -E 's/handler\$[a-f0-9]{1,8}\$//; s/\$$//' \
            | grep -vE '^(forge|minecraft|fml|java)$'
    } | sort -u
}

newest_report() {
    local volume="$1" newest path
    newest="$(ls -t "$volume/logs/latest.log" "$volume"/logs/*.log.gz "$volume"/crash-reports/*.txt 2>/dev/null | head -1)"
    [ -n "$newest" ] && printf '%s' "$newest"
}

report_is_complete() {
    local path="$1" now mtime
    [ -f "$path" ] || return 1
    now="$(date +%s)"
    mtime="$(stat -c %Y "$path" 2>/dev/null || echo 0)"
    [ "$((now - mtime))" -ge 15 ]
}

quarantine_fabric_clients() {
    local volume="$1" q="$2" j env_side
    for j in "$volume"/mods/*.jar; do
        [ -f "$j" ] || continue
        env_side="$(unzip -p "$j" fabric.mod.json 2>/dev/null | python3 -c "
import sys, json
try:
    print(json.load(sys.stdin).get('environment', '*'))
except Exception:
    print('')
")"
        if [ "$env_side" = "client" ]; then
            mv -f "$j" "$q/" && log "quarantaine fabric client: $(basename "$j")"
        fi
    done
}

server_id_for_volume() {
    local uuid
    uuid="$(basename "$1")"
    "$PHP_BIN" -r "
require '$PANEL_DIR/vendor/autoload.php';
\$app = require '$PANEL_DIR/bootstrap/app.php';
\$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
\$id = \\Pterodactyl\\Models\\Server::query()->where('uuid', '$uuid')->value('id');
echo (string) (\$id ?? '');
" 2>/dev/null
}

power_start() {
    local id="$1"
    (cd "$PANEL_DIR" && "$PHP_BIN" artisan p:server:bulk-power start --servers="$id" --no-interaction --silent) \
        >> "$LOG" 2>&1 || true
}

container_running() {
    local uuid="$1"
    docker inspect -f '{{.State.Running}}' "$uuid" 2>/dev/null | grep -q true
}

run_once() {
    local volume uuid q modid jar id handled report
    command -v docker >/dev/null 2>&1 || return 0
    [ -d "$VOLUMES" ] || return 0
    for volume in "$VOLUMES"/*/; do
        [ -d "$volume" ] || continue
        case "$(basename "$volume")" in .sftp) continue ;; esac
        uuid="$(basename "$volume")"
        # Un conteneur actif signifie que le serveur demarre ou tourne : les
        # lignes "invalid dist" presentes dans son log de demarrage sont des
        # avertissements non bloquants, pas un crash a reparer.
        if container_running "$uuid"; then continue; fi
        report="$(newest_report "$volume")"
        [ -n "$report" ] || continue
        # Un log en cours d'ecriture n'est pas exploitable : il manque les
        # lignes finales qui nomment les mods fautifs.
        report_is_complete "$report" || continue
        grep -qE 'invalid dist DEDICATED_SERVER|has failed to load correctly' "$report" || continue

        uuid="$(basename "$volume")"
        q="$volume/vinus-client-mods"
        id="$(server_id_for_volume "$volume")"
        [ -n "$id" ] || { log "serveur inconnu pour $uuid"; continue; }
        if ! attempts_allowed "$uuid"; then
            log "garde-fou: trop de tentatives pour $uuid, intervention manuelle requise"
            continue
        fi

        log "crash detecte sur $uuid (serveur $id), source: $(basename "$report")"
        mkdir -p "$q"
        handled=0
        for modid in $(faulty_modids "$report"); do
            [ -n "$modid" ] || continue
            jar="$(jar_for_modid "$volume" "$modid")" || continue
            [ -n "$jar" ] || { log "mod $modid introuvable dans mods/, ignore"; continue; }
            mv -f "$jar" "$q/"
            log "quarantaine: $(basename "$jar") (mod $modid)"
            handled=1
        done

        if [ "$handled" == "0" ]; then
            quarantine_fabric_clients "$volume" "$q"
            log "aucun mod identifie par le log : quarantaine des mods fabric client"
        fi

        register_attempt "$uuid"
        log "relance du serveur $id"
        power_start "$id"
    done
}

if [ "${1:-}" == "daemon" ]; then
    log "vinus-guard demarre (intervalle ${INTERVAL}s)"
    while true; do
        run_once
        sleep "$INTERVAL"
    done
else
    run_once
fi
