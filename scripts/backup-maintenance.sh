#!/usr/bin/env bash
# Short explicit maintenance window: stop the sole app writer, dump/copy, resume.
set -euo pipefail
umask 077
base=$(cd "$(dirname "$0")" && pwd -P)
source "$base/backup-maintenance-common.sh"
nxg_backup_setup
mkdir -p "$BACKUP_DIR";chmod 700 "$BACKUP_DIR"
nxg_backup_db_credentials
app_id=$(docker inspect --format '{{.Id}}' "$APP")
image=$(docker inspect --format '{{.Image}}' "$app_id")
db_id=$(docker inspect --format '{{.Id}}' "$DB")
db_image=$(docker inspect --format '{{.Image}}' "$db_id")
[[ $app_id =~ ^[a-f0-9]{64}$ && $db_id =~ ^[a-f0-9]{64}$ && $image =~ ^sha256:[a-f0-9]{64}$ && $db_image =~ ^sha256:[a-f0-9]{64}$ ]]
[[ $(docker inspect --format '{{.State.Running}}' "$app_id") == true ]]
# The DB must not publish a host port. This procedure assumes one app writer.
[[ $(docker inspect --format '{{json .HostConfig.PortBindings}}' "$db_id") == '{}' || $(docker inspect --format '{{json .HostConfig.PortBindings}}' "$db_id") == null ]]
volume=$(docker inspect --format '{{json .Mounts}}' "$app_id" | "$NXGEST_JQ" -er '[.[]|select(.Type=="volume" and .Destination=="/data" and .RW==true)]|if length==1 then .[0].Name else error("data volume") end')
[[ $volume =~ ^[A-Za-z0-9][A-Za-z0-9_.-]+$ ]]
id="$(date -u +%Y%m%dT%H%M%SZ)-$$-$RANDOM"
partial=$(mktemp -d "$BACKUP_DIR/.partial-$id.XXXXXXXX")
final=$BACKUP_DIR/$id
[[ ! -e $final && ! -L $final ]]
resume_needed=false
finish(){
  local rc=$?
  trap - EXIT
  if $resume_needed; then
    if [[ $(docker inspect --format '{{.Id}}|{{.Image}}' "$APP" 2>/dev/null) == "$app_id|$image" ]]; then
      docker start "$app_id" >/dev/null || rc=1
      bash "$base/container-health.sh" "$app_id" "$image" --wait || rc=1
    else rc=1; fi
  fi
  unset PGPASSWORD
  if [[ $rc != 0 ]]; then printf 'BACKUP_FAILED partial_preserved=true service_restart_attempted=true\n' >&2; fi
  exit "$rc"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
start=$(date +%s)
resume_needed=true
timeout --signal=TERM --kill-after=5s 45s docker stop --time 25 "$app_id" >/dev/null
[[ $(docker inspect --format '{{.State.Status}}' "$app_id") == exited ]]
[[ $(nxg_backup_sql -c "SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND backend_type='client backend'") == 0 ]]
docker inspect --format '{{range .Mounts}}{{.Type}}|{{.Name}}|{{.Destination}}|{{.RW}}{{println}}{{end}}' "$app_id" > "$partial/mounts.txt"
docker inspect --format '{{range .Mounts}}{{.Source}}{{println}}{{end}}' "$app_id" | sha256sum > "$partial/mount-sources.sha256"
docker inspect --format '{{.Config.Image}}|{{.Config.WorkingDir}}|{{.Config.User}}|{{.HostConfig.NetworkMode}}|{{.HostConfig.RestartPolicy.Name}}' "$app_id" > "$partial/runtime-config.txt"
nxg_backup_fingerprint > "$partial/database-fingerprint.tsv"
nxg_backup_sql -c "SELECT COALESCE(json_agg(json_build_object('caminho',caminho,'tamanho',tamanho) ORDER BY caminho),'[]'::json)::text FROM anexos" > "$partial/attachments.json"
timeout --signal=TERM --kill-after=5s 300s docker exec -e PGPASSWORD "$DB" pg_dump -U "$PG_USER" -d "$PG_DB" -Fc > "$partial/database.dump"
docker exec -i "$DB" pg_restore -l < "$partial/database.dump" >/dev/null
nxg_backup_files "$image" "$volume" "$partial/attachments.json" > "$partial/uploads-manifest.json"
timeout --signal=TERM --kill-after=5s 300s docker run --rm --pull never --network none --read-only --cap-drop ALL --cap-add DAC_OVERRIDE --security-opt no-new-privileges --user 0:0 \
 --mount "type=volume,src=$volume,dst=/data,readonly,volume-nocopy" "$image" tar -C /data -czf - uploads > "$partial/uploads.tar.gz"
[[ $(docker inspect --format '{{.State.Status}}' "$app_id") == exited && $(docker inspect --format '{{.Id}}' "$DB") == "$db_id" ]]
[[ $(nxg_backup_sql -c "SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND backend_type='client backend'") == 0 ]]
tag=nxgest-backup:$id
docker image tag "$image" "$tag"
[[ $(docker image inspect --format '{{.Id}}' "$tag") == "$image" ]]
docker start "$app_id" >/dev/null
bash "$base/container-health.sh" "$app_id" "$image" --wait
resume_needed=false
end=$(date +%s)
printf 'id=%s\nmode=maintenance-v1\nimage=%s\ntag=%s\ndatabase_image=%s\nsource_container=%s\nbarrier=application-stopped\nmaintenance_seconds=%s\n' "$id" "$image" "$tag" "$db_image" "$app_id" "$((end-start))" > "$partial/metadata.txt"
(cd "$partial";sha256sum database.dump uploads.tar.gz mounts.txt mount-sources.sha256 runtime-config.txt metadata.txt database-fingerprint.tsv uploads-manifest.json attachments.json > SHA256SUMS)
gzip -t "$partial/uploads.tar.gz"
printf '%s\n' "$id" > "$partial/COMPLETE"
nxg_backup_verify "$partial" "$id"
for f in "$partial"/*;do sync -f "$f";done
mv -T -- "$partial" "$final"
sync -f "$BACKUP_DIR"
nxg_backup_verify "$final"
printf 'BACKUP_COMPLETE id=%s maintenance_seconds=%s\n' "$id" "$((end-start))"
