#!/usr/bin/env bash
# Restore only into new labeled, network-isolated resources. Never replace live DB/volume.
set -euo pipefail
umask 077
base=$(cd "$(dirname "$0")" && pwd -P)
source "$base/backup-maintenance-common.sh"
nxg_backup_setup
bundle=${1:?backup directory required}
[[ -d $bundle && ! -L $bundle && $(realpath "$(dirname "$bundle")") == "$(realpath "$BACKUP_DIR")" ]]
bundle=$(realpath "$bundle")
nxg_backup_verify "$bundle"
image=$(sed -n 's/^image=//p' "$bundle/metadata.txt")
db_image=$(sed -n 's/^database_image=//p' "$bundle/metadata.txt")
[[ $image =~ ^sha256:[a-f0-9]{64}$ && $db_image =~ ^sha256:[a-f0-9]{64}$ ]]
docker image inspect "$image" "$db_image" >/dev/null
nonce=$(openssl rand -hex 10)
name=nxgest-restore-$nonce
volume=nxgest-restore-data-$nonce
pgvolume=nxgest-restore-pg-$nonce
work=$(mktemp -d "$BACKUP_DIR/.restore-$nonce.XXXXXXXX")
cleanup(){
 local rc=$?;trap - EXIT
 if docker container inspect "$name" >/dev/null 2>&1;then
  [[ $(docker inspect --format '{{index .Config.Labels "nxgest.restore"}}' "$name") == "$nonce" ]] && docker rm -f "$name" >/dev/null || rc=1
 fi
 for v in "$volume" "$pgvolume";do
  if docker volume inspect "$v" >/dev/null 2>&1;then
   [[ $(docker volume inspect --format '{{index .Labels "nxgest.restore"}}' "$v") == "$nonce" ]] && docker volume rm "$v" >/dev/null || rc=1
  fi
 done
 unset POSTGRES_PASSWORD PGPASSWORD
 if [[ $rc == 0 ]];then
  rm -f -- "$work/database-fingerprint.tsv" "$work/uploads-manifest.json";rmdir "$work" || rc=1
 fi
 if [[ $rc == 0 ]];then echo RESTORE_CLEANUP_COMPLETE;fi
 exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
POSTGRES_PASSWORD=$(openssl rand -hex 24);export POSTGRES_PASSWORD
PGPASSWORD=$POSTGRES_PASSWORD;export PGPASSWORD
PG_USER=restore_check;PG_DB=restore_check
# Docker allocates volumes with unique labels; no host ports or production network.
docker volume create --label "nxgest.restore=$nonce" "$volume" >/dev/null
docker volume create --label "nxgest.restore=$nonce" "$pgvolume" >/dev/null
docker run -d --pull never --network none --label "nxgest.restore=$nonce" --name "$name" \
 -e POSTGRES_USER=restore_check -e POSTGRES_DB=restore_check -e POSTGRES_PASSWORD \
 --mount "type=volume,src=$pgvolume,dst=/var/lib/postgresql/data,volume-nocopy" "$db_image" >/dev/null
DB=$name
ready=false
for i in {1..45};do if docker exec "$name" pg_isready -U restore_check -d restore_check >/dev/null 2>&1 && docker exec "$name" sh -c 'test "$(head -n 1 "$PGDATA/postmaster.pid")" = 1';then ready=true;break;fi;sleep 1;done
$ready
# pg_isready can briefly observe the init server; wait for a successful authenticated query.
for i in {1..20};do if nxg_backup_sql -c 'SELECT 1' >/dev/null 2>&1;then break;fi;sleep 1;done
timeout --signal=TERM --kill-after=5s 300s docker exec -i -e PGPASSWORD "$name" pg_restore --exit-on-error --no-owner --no-privileges -U restore_check -d restore_check < "$bundle/database.dump"
nxg_backup_fingerprint > "$work/database-fingerprint.tsv"
cmp "$bundle/database-fingerprint.tsv" "$work/database-fingerprint.tsv"
docker run --rm -i --pull never --network none --read-only --cap-drop ALL --cap-add CHOWN --cap-add DAC_OVERRIDE --cap-add FOWNER --security-opt no-new-privileges --user 0:0 \
 --mount "type=volume,src=$volume,dst=/data,volume-nocopy" "$image" tar -C /data -xzf - < "$bundle/uploads.tar.gz"
nxg_backup_files "$image" "$volume" "$bundle/attachments.json" > "$work/uploads-manifest.json"
cmp "$bundle/uploads-manifest.json" "$work/uploads-manifest.json"
[[ $(docker inspect --format '{{.HostConfig.NetworkMode}}' "$name") == none ]]
printf 'RESTORE_VERIFIED id=%s tables=%s attachments=%s orphan_files_preserved=%s\n' "$(basename "$bundle")" "$(wc -l < "$work/database-fingerprint.tsv")" "$("$NXGEST_JQ" -r .referenced "$work/uploads-manifest.json")" "$("$NXGEST_JQ" -r .orphans "$work/uploads-manifest.json")"
