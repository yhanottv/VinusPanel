#!/usr/bin/env bash
# Offline test of the fresh-install resume marker in install.sh: nothing is installed.
# Run: bash scripts/test-installer-resume.sh
set -Euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Load the functions only: drop the argument parser and dispatcher at the end of install.sh.
sed '/^while ((\$#)); do$/,$d' "$ROOT_DIR/install.sh" > "$TMP/functions.sh"
# shellcheck disable=SC1090
source "$TMP/functions.sh"

STATE_DIR="$TMP/state"
BOOTSTRAP_MARKER="$STATE_DIR/bootstrap-incomplete"
PANEL_DIR="$TMP/panel"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$PANEL_DIR"
: > "$PANEL_DIR/artisan"   # a panel that looks installed

calls=()
require_root() { :; }
generate_secrets() { :; }
validate_environment() { :; }
install_theme() { calls+=(theme); }
install_guard() { :; }
install_wings() { :; }
print_summary() { :; }
wings_enabled() { return 1; }
warn() { :; }
log() { :; }
ok() { :; }
# Steps of bootstrap_panel
require_supported_os() { :; }; free_web_ports() { :; }; install_dependencies() { :; }
ensure_base_services() { :; }; download_panel() { calls+=(download); }; ensure_app_key() { :; }
configure_database() { :; }; create_admin_user_if_missing() { :; }; fix_permissions() { :; }
configure_webserver() { :; }; configure_services() { :; }
setup_panel_environment() { calls+=(env); if [[ "${FAIL_AT:-}" == env ]]; then exit 1; fi; }

install_blueprint() { calls+=(blueprint); }
install_catalog() { calls+=(catalog); }
install_player_textures() { calls+=(textures); }
blueprint_installed() { [[ "${BP_PRESENT:-0}" == 1 ]]; }
WITH_BLUEPRINT=no   # the resume cases below are about the panel bootstrap only

passed=0
check() { local label="$1"; shift; if "$@"; then passed=$((passed + 1)); else printf 'FAIL: %s\n' "$label" >&2; exit 1; fi; }
has_call() { [[ " ${calls[*]:-} " == *" $1 "* ]]; }

# 1. An installed panel without marker: only the theme is applied.
calls=(); FRESH_PANEL=0; rm -rf "$STATE_DIR"
action_install production
check "existing panel keeps theme-only path" bash -c '! [ "$1" = 1 ]' _ "$FRESH_PANEL"
check "existing panel is not re-bootstrapped" bash -c '[[ " $1 " != *" download "* ]]' _ "${calls[*]}"
check "theme applied" has_call theme

# 2. A failed bootstrap leaves the marker behind.
calls=(); FRESH_PANEL=0; rm -rf "$STATE_DIR"
( FAIL_AT=env; set -e; bootstrap_panel ) >/dev/null 2>&1 || true
check "marker kept after a failed bootstrap" test -f "$BOOTSTRAP_MARKER"

# 3. Re-running resumes the bootstrap even though artisan already exists.
calls=(); FRESH_PANEL=0
action_install production
check "resume re-runs the bootstrap" has_call download
check "resume marks the panel as fresh" test "$FRESH_PANEL" = 1
check "marker removed after a complete bootstrap" bash -c '! [ -e "$1" ]' _ "$BOOTSTRAP_MARKER"

# 4. Once complete, the next run is a plain theme update again.
calls=(); FRESH_PANEL=0
action_install production
check "complete install is not bootstrapped again" bash -c '[[ " $1 " != *" download "* ]]' _ "${calls[*]}"

# --- Blueprint and Vinus Catalog decisions and ordering ---------------------------------
index_of() { local i; for i in "${!calls[@]}"; do [[ "${calls[$i]}" == "$1" ]] && { echo "$i"; return 0; }; done; echo -1; }
ordered() { [[ "$(index_of "$1")" -ge 0 && "$(index_of "$1")" -lt "$(index_of "$2")" ]]; }
fresh_marker() { rm -rf "$STATE_DIR"; mkdir -p "$STATE_DIR"; : > "$BOOTSTRAP_MARKER"; }

# 5. Fresh install (auto): Blueprint first, then the theme, then the catalogue.
calls=(); FRESH_PANEL=0; WITH_BLUEPRINT=auto; BP_PRESENT=0; fresh_marker
action_install production
check "fresh install installs Blueprint before the theme" ordered blueprint theme
check "fresh install installs the catalogue after the theme" ordered theme catalog

check "item textures are fetched after the theme" ordered theme textures

# 6. Existing panel without Blueprint (auto): left alone.
calls=(); FRESH_PANEL=0; BP_PRESENT=0
action_install production
check "existing panel without Blueprint: no Blueprint" bash -c '[[ " $1 " != *" blueprint "* ]]' _ "${calls[*]}"
check "existing panel without Blueprint: no catalogue" bash -c '[[ " $1 " != *" catalog "* ]]' _ "${calls[*]}"

# 7. Existing panel that already has Blueprint (auto): the catalogue follows the theme.
calls=(); FRESH_PANEL=0; BP_PRESENT=1
action_install production
check "existing Blueprint panel gets the catalogue after the theme" ordered theme catalog

# 8. --no-blueprint wins on a fresh install.
calls=(); FRESH_PANEL=0; WITH_BLUEPRINT=no; BP_PRESENT=0; fresh_marker
action_install production
check "--no-blueprint skips Blueprint" bash -c '[[ " $1 " != *" blueprint "* ]]' _ "${calls[*]}"
check "--no-blueprint skips the catalogue" bash -c '[[ " $1 " != *" catalog "* ]]' _ "${calls[*]}"

# 9. --blueprint forces it on an existing panel.
calls=(); FRESH_PANEL=0; WITH_BLUEPRINT=yes; BP_PRESENT=0
action_install production
check "--blueprint installs it on an existing panel" ordered blueprint theme

printf 'installer resume: %s checks passed.
' "$passed"
