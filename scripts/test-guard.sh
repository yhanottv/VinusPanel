#!/usr/bin/env bash
# Offline test for scripts/vinus-guard.sh: no Docker, panel or real server is used.
# Run: bash scripts/test-guard.sh   (needs bash, python3, unzip)
set -Euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

export VINUS_GUARD_VOLUMES="$TMP/volumes" VINUS_GUARD_STATE="$TMP/state" VINUS_GUARD_LOG="$TMP/guard.log"
export VINUS_PANEL_DIR="$TMP/panel"
mkdir -p "$VINUS_GUARD_VOLUMES" "$TMP/bin"

# Windows shells copy instead of linking: the symlink cases would be meaningless there.
mkdir "$TMP/probe" && ln -s "$TMP/probe" "$TMP/probe-link" 2>/dev/null
if [ ! -L "$TMP/probe-link" ]; then
    echo "vinus-guard: SKIPPED (this shell cannot create symbolic links; run it on Linux)."
    exit 0
fi

# The guard only runs when Docker exists; a shim is enough because container_running is replaced below.
printf '#!/bin/sh\nexit 1\n' > "$TMP/bin/docker"
chmod +x "$TMP/bin/docker"
export PATH="$TMP/bin:$PATH"

# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/vinus-guard.sh"

container_running() { return 1; }
server_id_for_volume() { printf '1'; }
power_start() { printf '%s\n' "$1" >> "$TMP/started"; }

passed=0
check() {
    local label="$1"; shift
    if "$@"; then passed=$((passed + 1)); else printf 'FAIL: %s\n' "$label" >&2; exit 1; fi
}

make_jar() { # path modid environment
    python3 - "$1" "$2" "$3" <<'PY'
import json, sys, zipfile
path, modid, env = sys.argv[1:4]
with zipfile.ZipFile(path, "w") as z:
    z.writestr("fabric.mod.json", json.dumps({"id": modid, "environment": env}))
PY
}

make_crash() { # logs dir, mod id
    mkdir -p "$1"
    printf '(%s) has failed to load correctly\n' "$2" > "$1/latest.log"
    touch -d '2 minutes ago' "$1/latest.log"
}

reset() { rm -rf "$VINUS_GUARD_VOLUMES" "$VINUS_GUARD_STATE" "$TMP/started" "$TMP/victim" "$TMP/victim-logs"; mkdir -p "$VINUS_GUARD_VOLUMES" "$VINUS_GUARD_STATE"; }
started() { [ -s "$TMP/started" ]; }

UUID_A="11111111-2222-3333-4444-555555555555"

# 1. A normal crash: the faulty client mod is quarantined and the server restarted.
reset
V="$VINUS_GUARD_VOLUMES/$UUID_A"
mkdir -p "$V/mods"
make_jar "$V/mods/badmod.jar" badmod client
make_jar "$V/mods/good.jar" good '*'
make_crash "$V/logs" badmod
run_once
check "faulty mod quarantined" test -f "$V/vinus-client-mods/badmod.jar"
check "healthy mod kept" test -f "$V/mods/good.jar"
check "server restarted" started

# 2. A symlinked mods directory must never be followed out of the volume.
reset
V="$VINUS_GUARD_VOLUMES/$UUID_A"
mkdir -p "$V" "$TMP/victim"
make_jar "$TMP/victim/host.jar" hostmod client
ln -s "$TMP/victim" "$V/mods"
make_crash "$V/logs" hostmod
run_once
check "host jar untouched through mods symlink" test -f "$TMP/victim/host.jar"

# 3. A symlinked quarantine directory must never receive files.
reset
V="$VINUS_GUARD_VOLUMES/$UUID_A"
mkdir -p "$V/mods" "$TMP/victim"
make_jar "$V/mods/badmod.jar" badmod client
ln -s "$TMP/victim" "$V/vinus-client-mods"
make_crash "$V/logs" badmod
run_once
check "nothing moved into symlinked quarantine" test -z "$(ls -A "$TMP/victim")"
check "jar stays in mods" test -f "$V/mods/badmod.jar"
check "no restart for refused volume" bash -c '! [ -s "$1" ]' _ "$TMP/started"

# 4. A symlinked logs directory is not trusted as crash evidence.
reset
V="$VINUS_GUARD_VOLUMES/$UUID_A"
mkdir -p "$V/mods" "$TMP/victim-logs"
make_jar "$V/mods/badmod.jar" badmod client
make_crash "$TMP/victim-logs" badmod
ln -s "$TMP/victim-logs" "$V/logs"
run_once
check "symlinked logs ignored" test -f "$V/mods/badmod.jar"
check "symlinked logs do not trigger restart" bash -c '! [ -s "$1" ]' _ "$TMP/started"

# 5. Directories that are not server UUIDs are skipped.
reset
V="$VINUS_GUARD_VOLUMES/not-a-server"
mkdir -p "$V/mods"
make_jar "$V/mods/badmod.jar" badmod client
make_crash "$V/logs" badmod
run_once
check "non-UUID directory skipped" test -f "$V/mods/badmod.jar"

# 6. A symlinked jar is skipped rather than moved.
reset
V="$VINUS_GUARD_VOLUMES/$UUID_A"
mkdir -p "$V/mods" "$TMP/victim"
make_jar "$TMP/victim/outside.jar" badmod client
ln -s "$TMP/victim/outside.jar" "$V/mods/badmod.jar"
make_crash "$V/logs" badmod
run_once
check "symlinked jar not moved" test -L "$V/mods/badmod.jar"

# 7. The panel directory recorded at install time is honoured.
check "panel dir override" test "$PANEL_DIR" = "$TMP/panel"

printf 'vinus-guard: %s checks passed.\n' "$passed"
