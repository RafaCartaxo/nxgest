#!/usr/bin/env bash
# Periodic real restore of the newest complete set, under the shared deploy lock.
set -euo pipefail
umask 077
base=$(cd "$(dirname "$0")" && pwd -P)
source "$base/backup-maintenance-common.sh"
nxg_backup_setup
bundle=$(nxg_backup_latest)
printf 'RESTORE_LATEST_SELECTED id=%s\n' "${bundle##*/}"
exec /bin/bash "$base/backup-restore-check.sh" "$bundle"
