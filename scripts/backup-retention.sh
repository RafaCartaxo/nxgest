#!/usr/bin/env bash
# Local retention only. Remote snapshot removal belongs to separate credentials.
set -euo pipefail
umask 077
base=$(cd "$(dirname "$0")" && pwd -P)
source "$base/backup-maintenance-common.sh"
nxg_backup_setup
mode=${1:---dry-run};[[ $mode == --apply || $mode == --dry-run ]]
# No deletion until the monitored latest external copy and restore are healthy.
[[ -f $PROJECT_DIR/.git/nxgest-offsite.env ]] || { printf 'RETENTION_SKIPPED offsite-not-configured\n';exit 0; }
bash "$base/backup-status.sh" >/dev/null
latest=$(nxg_backup_latest);restore=$(cut -f2 "$BACKUP_DIR/.state/restore")
now=$(date +%s);kept=0
while IFS= read -r id;do
 bundle=$BACKUP_DIR/$id
 [[ $id =~ ^[0-9]{8}T[0-9]{6}Z-[0-9]+-[0-9]+$ && -d $bundle && ! -L $bundle ]] || continue
 [[ -f $bundle/COMPLETE && ! -L $bundle/COMPLETE && $(cat "$bundle/COMPLETE") == "$id" ]] || continue
 kept=$((kept+1));(( kept>2 )) || continue
 [[ $bundle != "$latest" && $id != "$restore" ]] || continue
 created=$(date -u -d "${id:0:4}-${id:4:2}-${id:6:2} ${id:9:2}:${id:11:2}:${id:13:2} UTC" +%s)
 (( now-created>30*86400 )) || continue
 receipt=$BACKUP_DIR/.state/offsite-$id
 [[ -f $receipt && ! -L $receipt ]] || continue
 IFS=$'\t' read -r epoch saved proof extra < "$receipt"
 [[ $saved == "$id" && $proof =~ ^[a-f0-9]{64}$ && -z $extra ]] || continue
 actual=$(sha256sum "$bundle/SHA256SUMS");[[ ${actual%% *} == "$proof" ]] || continue
 nxg_backup_verify "$bundle"
 printf 'RETENTION_CANDIDATE id=%s mode=%s\n' "$id" "$mode"
 if [[ $mode == --apply ]];then rm -rf --one-file-system -- "$bundle";rm -- "$receipt";fi
done < <(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | LC_ALL=C sort -r)
