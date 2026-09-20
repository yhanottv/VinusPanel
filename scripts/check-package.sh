#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() {
    printf 'Erreur : %s\n' "$*" >&2
    exit 1
}

[[ -d overlay ]] || fail "le dossier overlay est absent"
[[ -f overlay-manifest.txt ]] || fail "overlay-manifest.txt est absent"

while IFS= read -r relative_path; do
    [[ -n "$relative_path" ]] || continue
    [[ -f "overlay/$relative_path" ]] || fail "fichier absent : overlay/$relative_path"
done < overlay-manifest.txt

actual_list="$(mktemp)"
manifest_list="$(mktemp)"
trap 'rm -f "$actual_list" "$manifest_list"' EXIT

find overlay -type f -printf '%P\n' | LC_ALL=C sort > "$actual_list"
sed '/^[[:space:]]*$/d' overlay-manifest.txt | LC_ALL=C sort > "$manifest_list"

diff -u "$manifest_list" "$actual_list" || fail "le manifeste ne correspond pas au contenu d'overlay"

if find overlay -type f \( -name '.env' -o -name '*.pem' -o -name '*.key' \) | grep -q .; then
    fail "un secret potentiel est présent dans overlay"
fi

printf 'Paquet VinusPanel valide : %s fichiers.\n' "$(wc -l < "$manifest_list")"
