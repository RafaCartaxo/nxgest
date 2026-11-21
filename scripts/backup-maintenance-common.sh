#!/usr/bin/env bash
# Shared primitives for maintenance backups and isolated restore checks.
set -euo pipefail
nxg_backup_fail(){ printf 'BACKUP_ERROR %s\n' "$1" >&2; return 1; }
nxg_backup_setup(){
  PROJECT_DIR=${NXGEST_PROJECT_DIR:-/opt/nxgestao}
  BACKUP_DIR=${NXGEST_BACKUP_DIR:-/opt/backups}
  APP=${NXGEST_APP_CONTAINER:-nxgestao-app-1}
  DB=${NXGEST_DB_CONTAINER:-nxgest-postgres}
  cd "$PROJECT_DIR"
  source "$(dirname "${BASH_SOURCE[0]}")/host-jq.sh"
  nxgest_use_jq || { nxg_backup_fail jq; return 1; }
  local lock=$PROJECT_DIR/.git/nxgest-deploy.lock
  if { true >&9; } 2>/dev/null; then
    [[ $(stat -Lc '%d:%i' /proc/$$/fd/9) == "$(stat -Lc '%d:%i' "$lock")" ]] || return 1
  else exec 9<>"$lock"; fi
  flock -n 9 || { nxg_backup_fail busy; return 1; }
}
nxg_backup_db_credentials(){
  PG_USER=$(docker exec "$DB" printenv POSTGRES_USER)
  PG_DB=$(docker exec "$DB" printenv POSTGRES_DB)
  PGPASSWORD=$(docker exec "$DB" printenv POSTGRES_PASSWORD)
  [[ -n $PG_USER && -n $PG_DB && -n $PGPASSWORD ]]
  export PGPASSWORD
}
nxg_backup_sql(){ docker exec -i -e PGPASSWORD -e PGOPTIONS='-c timezone=UTC -c extra_float_digits=3' "$DB" psql -XqAt -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" "$@"; }
nxg_backup_fingerprint(){
  nxg_backup_sql -F '|' <<'SQL'
SELECT format('SELECT %L, count(*)::text, md5(coalesce(string_agg(md5(to_jsonb(t)::text), '''' ORDER BY md5(to_jsonb(t)::text)),'''')) FROM %I.%I t;', tablename, schemaname, tablename)
FROM pg_tables WHERE schemaname='public' ORDER BY tablename
\gexec
SQL
}
nxg_backup_files(){
  local image=$1 volume=$2 refs=$3
  docker run --rm -i --pull never --network none --read-only --cap-drop ALL --cap-add DAC_OVERRIDE --security-opt no-new-privileges --user 0:0 \
    --mount "type=volume,src=$volume,dst=/data,readonly,volume-nocopy" "$image" node -e '
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const refs=JSON.parse(fs.readFileSync(0,"utf8"));const files=[];
function walk(dir){for(const name of fs.readdirSync(dir).sort()){const p=path.join(dir,name),s=fs.lstatSync(p);if(s.isSymbolicLink())throw Error("symlink refused");if(s.isDirectory())walk(p);else{if(!s.isFile())throw Error("nonregular file");files.push({path:path.relative("/data/uploads",p),size:s.size,sha256:crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex")})}}}
walk("/data/uploads");const known=new Map(files.map(f=>[f.path,f]));
for(const ref of refs){const p=String(ref.caminho);if(path.isAbsolute(p)||p.split(/[\\/]/).includes("..")||/[\r\n]/.test(p))throw Error("unsafe reference");const f=known.get(p);if(!f||f.size!==Number(ref.tamanho))throw Error("missing or divergent attachment")}
const referenced=new Set(refs.map(r=>r.caminho));console.log(JSON.stringify({files,referenced:refs.length,orphans:files.filter(f=>!referenced.has(f.path)).length}));' < "$refs"
}
nxg_backup_verify(){
  local bundle=$1 id expected actual name expected_id=${2:-$(basename "$1")}
  [[ -d $bundle && ! -L $bundle && -f $bundle/COMPLETE && ! -L $bundle/COMPLETE ]] || return 1
  id=$(cat "$bundle/COMPLETE")
  [[ $id =~ ^[0-9]{8}T[0-9]{6}Z-[0-9]+-[0-9]+$ && $id == "$expected_id" ]] || return 1
  [[ $(wc -l < "$bundle/SHA256SUMS") == 9 ]] || return 1
  for name in database.dump uploads.tar.gz mounts.txt mount-sources.sha256 runtime-config.txt metadata.txt database-fingerprint.tsv uploads-manifest.json attachments.json; do
    [[ -f $bundle/$name && ! -L $bundle/$name ]] || return 1
    expected=$(awk -v name="$name" '$2==name{print $1}' "$bundle/SHA256SUMS")
    [[ $expected =~ ^[a-f0-9]{64}$ ]] || return 1
    actual=$(sha256sum "$bundle/$name");[[ ${actual%% *} == "$expected" ]] || return 1
  done
  [[ $(sed -n '1p' "$bundle/metadata.txt") == "id=$id" && $(grep -c '^mode=maintenance-v1$' "$bundle/metadata.txt") == 1 ]]
  gzip -t "$bundle/uploads.tar.gz"
  # Every member originates from the validated regular-file tree, with no links.
  tar -tzf "$bundle/uploads.tar.gz" | awk 'BEGIN{bad=0} /^\//{bad=1} /(^|\/)\.\.(\/|$)/{bad=1} !/^uploads(\/|$)/{bad=1} END{exit bad}'
  tar -tvzf "$bundle/uploads.tar.gz" | awk 'substr($0,1,1)!="-" && substr($0,1,1)!="d"{exit 1}'
  [[ -s $bundle/database.dump && -s $bundle/database-fingerprint.tsv ]]
}
# Docker classic uses config digests as image IDs; containerd may expose manifest
# digests. An explicit imported ID is accepted only after checking its exported
# configuration against the source config digest, which also binds rootfs layers.
nxg_backup_restore_image(){
  local expected=$1 candidate=${2:-$1} archive=$3 actual config checksum
  [[ -n $candidate ]] || candidate=$expected
  [[ $expected =~ ^sha256:[a-f0-9]{64}$ && $candidate =~ ^sha256:[a-f0-9]{64}$ ]] || return 1
  actual=$(docker image inspect --format '{{.Id}}' "$candidate") || return 1
  [[ $actual == "$candidate" ]] || return 1
  if [[ $candidate != "$expected" ]];then
    (ulimit -f 2097152;timeout --signal=TERM --kill-after=5s 300s docker image save "$candidate" > "$archive") || return 1
    config=$(tar -xOf "$archive" manifest.json | "$NXGEST_JQ" -er 'if type=="array" and length==1 then .[0].Config else error("ambiguous image") end') || return 1
    [[ $config == "blobs/sha256/${expected#sha256:}" || $config == "${expected#sha256:}.json" ]] || return 1
    checksum=$(tar -xOf "$archive" "$config" | sha256sum) || return 1
    [[ sha256:${checksum%% *} == "$expected" ]] || return 1
    rm -- "$archive"
  fi
  printf '%s\n' "$actual"
}
# Select the newest published bundle, never a partial set or a symlink. Integrity
# is checked by the restore tool; a corrupt newest bundle must fail, not fall back.
nxg_backup_latest(){
  local directory id latest=
  for directory in "$BACKUP_DIR"/*;do
    [[ -d $directory && ! -L $directory && -f $directory/COMPLETE && ! -L $directory/COMPLETE ]] || continue
    id=${directory##*/}
    [[ $id =~ ^[0-9]{8}T[0-9]{6}Z-[0-9]+-[0-9]+$ ]] || continue
    if [[ -z $latest || $id > ${latest##*/} ]];then latest=$directory;fi
  done
  [[ -n $latest ]] || { nxg_backup_fail no-complete-bundle;return 1; }
  printf '%s\n' "$latest"
}
# Private evidence, published atomically only after a completed verification.
nxg_backup_record(){
  local kind=$1 id=$2 proof=$3 state=$BACKUP_DIR/.state temporary
  [[ $kind =~ ^(restore|offsite-[0-9]{8}T[0-9]{6}Z-[0-9]+-[0-9]+)$ && $id =~ ^[0-9]{8}T[0-9]{6}Z-[0-9]+-[0-9]+$ && $proof =~ ^[a-f0-9]{64}$ ]]
  [[ ! -L $state ]];mkdir -p "$state";chmod 700 "$state"
  temporary=$(mktemp "$state/.receipt.XXXXXXXX")
  printf '%s\t%s\t%s\n' "$(date +%s)" "$id" "$proof" > "$temporary"
  chmod 600 "$temporary";mv -T "$temporary" "$state/$kind"
}
