#!/usr/bin/env bash
# Read-only, bounded monitoring over a forced-command SSH key. No secrets printed.
set -euo pipefail
base=$(cd "$(dirname "$0")" && pwd -P)
source "$base/backup-maintenance-common.sh"
BACKUP_DIR=${NXGEST_BACKUP_DIR:-/opt/backups}
PROJECT_DIR=${NXGEST_PROJECT_DIR:-/opt/nxgestao}
now=$(date +%s);failed=0
problem(){ printf 'BACKUP_STATUS_ERROR %s\n' "$1";failed=1; }
bundle=$(nxg_backup_latest) || { printf 'BACKUP_STATUS_ERROR no-backup\n';exit 1; }
id=${bundle##*/}
[[ $(cat "$bundle/COMPLETE") == "$id" ]] || problem invalid-marker
created=$(date -u -d "${id:0:4}-${id:4:2}-${id:6:2} ${id:9:2}:${id:11:2}:${id:13:2} UTC" +%s) || exit 1
age=$((now-created))
(( age >= 0 && age <= 14*3600 )) || problem backup-over-14h-or-clock-skew
printf 'BACKUP_LOCAL id=%s age_seconds=%s\n' "$id" "$age"
receipt(){
 local file=$1 max=$2 epoch saved proof extra actual
 [[ -f $file && ! -L $file ]] || return 1
 IFS=$'\t' read -r epoch saved proof extra < "$file"
 [[ $epoch =~ ^[0-9]{1,12}$ && $saved =~ ^[0-9]{8}T[0-9]{6}Z-[0-9]+-[0-9]+$ && $proof =~ ^[a-f0-9]{64}$ && -z $extra ]] || return 1
 ((now-epoch>=0 && now-epoch<=max)) || return 1
 [[ -f $BACKUP_DIR/$saved/SHA256SUMS && ! -L $BACKUP_DIR/$saved ]] || return 1
 actual=$(sha256sum "$BACKUP_DIR/$saved/SHA256SUMS");[[ ${actual%% *} == "$proof" ]]
}
receipt "$BACKUP_DIR/.state/restore" $((9*86400)) || problem restore-missing-stale-or-divergent
if [[ -f $PROJECT_DIR/.git/nxgest-offsite.env ]];then
 receipt "$BACKUP_DIR/.state/offsite-$id" $((14*3600)) || problem offsite-latest-not-verified
else printf 'BACKUP_OFFSITE_NOT_CONFIGURED automatic_external_copy=false\n';fi
printf 'BACKUP_STATUS completed failed=%s\n' "$failed"
exit "$failed"
