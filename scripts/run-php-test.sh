#!/usr/bin/env bash
# Run one PHP test file: bash scripts/run-php-test.sh <test.php> [arguments...]
# Fails on a non-zero exit code and also on a printed exception, because Laravel's
# console handler prints an uncaught exception and can still exit with status 0.
set -u

out="$(php "$@" 2>&1)"
status=$?
printf '== %s\n%s\n' "$1" "$out"
if [ "$status" -ne 0 ] || printf '%s' "$out" | grep -Eiq 'fatal error|uncaught|failed|exception|stack trace'; then
    echo "::error::$1 failed"
    exit 1
fi
