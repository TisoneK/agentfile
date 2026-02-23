#!/usr/bin/env bash
set -euo pipefail

# ── scripts/cli/register.sh ───────────────────────────────────────────────────
# CLI-mode promotion script.
# Identical in logic to scripts/ide/register.sh but called from the CLI runner.
# Delegates to the IDE register script — single source of truth.
#
# Usage:
#   bash scripts/cli/register.sh <artifact-run-dir>
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IDE_REGISTER="$SCRIPT_DIR/../ide/register.sh"

[[ -f "$IDE_REGISTER" ]] || { echo "ERROR: Cannot find scripts/ide/register.sh"; exit 1; }

exec bash "$IDE_REGISTER" "$@"
