#!/usr/bin/env bash
# Called only after receipt attestation and publication; pending remains on failure.
set -euo pipefail
base=$(cd "$(dirname "$0")" && pwd -P)
[[ "$0" != bash ]] || base=$PWD/scripts
fail(){ echo 'Finalização pré-clientes recusada; reparar pending' >&2; exit 1; }
[[ $# == 4 ]] || fail
sha=$1; image=$2; run=$3; receipt=$4
[[ $sha =~ ^[a-f0-9]{40}$ && $image =~ ^sha256:[a-f0-9]{64}$ && $run =~ ^[0-9]{1,20}$ && $receipt =~ ^sha256:[a-f0-9]{64}$ ]] || fail
flock -n 9 || fail
gitdir=$(git rev-parse --absolute-git-dir); owner=$(id -u); lock=$gitdir/nxgest-deploy.lock
[[ -f $lock && ! -L $lock && $(stat -c %u "$lock") == "$owner" && $(stat -Lc '%d:%i' /proc/self/fd/9) == "$(stat -Lc '%d:%i' "$lock")" ]] || fail
pending=$gitdir/nxgest-production-pending; selection=$gitdir/nxgest-production-selection; marker=$gitdir/nxgest-production-sha
for f in "$pending" "$selection" "$marker"; do [[ -f $f && ! -L $f && $(stat -c %u "$f") == "$owner" && $(stat -c %a "$f") == 600 && $(stat -c %s "$f") -le 4096 ]] || fail; done
mapfile -t p < "$pending"; mapfile -t s < "$selection"; mapfile -t m < "$marker"
[[ ${#p[@]} == 5 && ${p[0]} == version=preclients-pending-v1 && ${p[1]} == "sha=$sha" && ${p[2]} =~ ^previous=[a-f0-9]{40}$ && ${p[3]} == "image=$image" && ${p[4]} =~ ^previous_image=sha256:[a-f0-9]{64}$ && ${#s[@]} == 8 && ${s[0]} == version=production-preclients-v1 && ${s[1]} == "sha=$sha" && ${s[7]} == "image=$image" && ${#m[@]} == 1 && ${m[0]} == "$sha" ]] || fail
id=$(docker inspect --format '{{.Id}}' nxgestao-app-1); [[ $id =~ ^[a-f0-9]{64}$ && $(docker inspect --format '{{.Image}}' "$id") == "$image" ]] || fail
bash "$base/container-health.sh" "$id" "$image" --wait || fail
source "$base/host-jq.sh"; nxgest_use_jq || fail
curl -fsS --max-time 5 https://nxgest.com.br/api/health | "$NXGEST_JQ" -e '.status=="ok" and .db=="connected"' >/dev/null || fail
[[ $(docker inspect --format '{{.Id}}' nxgestao-app-1) == "$id" && $(docker inspect --format '{{.Image}}' "$id") == "$image" ]] || fail
pending_id=$(stat -c '%d:%i' "$pending"); archive=$gitdir/nxgest-production-completed-$sha-$run; evidence=$gitdir/nxgest-production-receipt-$sha-$run
[[ ! -e $archive && ! -L $archive && ! -e $evidence && ! -L $evidence ]] || fail
umask 077; (set -C; printf 'receipt=%s\nrun=%s\ncontainer=%s\n' "$receipt" "$run" "$id" > "$evidence") || fail
sync -f "$evidence"; ln -- "$pending" "$archive" || fail; sync -f "$gitdir"
[[ $(stat -c '%d:%i' "$pending") == "$pending_id" && $(stat -c '%d:%i' "$archive") == "$pending_id" ]] || fail
rm -- "$pending"; sync -f "$gitdir"
printf 'PRECLIENTS_FINALIZED sha=%s image=%s\n' "$sha" "$image"
