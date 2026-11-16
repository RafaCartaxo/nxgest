#!/usr/bin/env bash
# Requires authenticated selection from the runner; preserves pending until receipt publication.
set -euo pipefail
base=$(cd "$(dirname "$0")" && pwd -P)
if [[ -z ${NXGEST_RECURRING_ENV:-} ]]; then cd "$base/.."; fi
source "$base/host-jq.sh"
nxgest_use_jq || { echo 'jq portátil inválido' >&2; exit 1; }
fail(){ echo 'Promoção pré-clientes recusada; verificar pending antes de reparar' >&2; exit 1; }
[[ $# == 12 && ${NXGEST_DEPLOY_MODE:-} == production-preclients ]] || fail
sha=$1; tarfile=$2; tar=$3; zip=$4; run=$5; attempt=$6; artifact=$7; staging=$8; image=$9; policyhash=${10}; decision=${11}; host=${12}
[[ $sha =~ ^[a-f0-9]{40}$ && $attempt == 1 && -f $tarfile && ! -L $tarfile && -f .env && ! -L .env ]] || fail
check_policy(){ bash "$base"/production-preclients-policy.sh "$policyhash" "$decision" "$sha" "$run" "$attempt" "$artifact" "$zip" "$tar" "$image" "$staging" "$host"; }
policy_result=$(check_policy) || fail
[[ $policy_result =~ ^PRECLIENTS_POLICY_ONLY\ previous=([a-f0-9]{40})$ ]] || fail; previous=${BASH_REMATCH[1]}
gitdir=$(git rev-parse --absolute-git-dir); selection=$gitdir/nxgest-production-selection; marker=$gitdir/nxgest-production-sha; pending=$gitdir/nxgest-production-pending
if [[ -e $selection ]]; then mapfile -t current < "$selection"; else mapfile -t current < "$gitdir/nxgest-baseline-established"; fi
oldimage=${current[7]#image=}; [[ $oldimage =~ ^sha256:[a-f0-9]{64}$ ]] || fail
[[ $(docker inspect --format '{{.Image}}' nxgestao-app-1) == "$oldimage" ]] || fail
oldid=$(docker inspect --format '{{.Id}}' nxgestao-app-1); [[ $oldid =~ ^[a-f0-9]{64}$ ]] || fail
expected_prod_id=$oldid; expected_prod_image=$oldimage
stageid=$(docker inspect --format '{{.Id}}' staging-app); [[ $stageid =~ ^[a-f0-9]{64}$ && $(docker inspect --format '{{.Image}}' "$stageid") == "$image" ]] || fail
bash "$base"/container-health.sh "$stageid" "$image" --wait || fail
curl -fsS --max-time 5 https://nxgestao.duckdns.org/api/health | "$NXGEST_JQ" -e '.status=="ok" and .db=="connected"' >/dev/null || fail
[[ $(docker inspect --format '{{.Id}}' staging-app) == "$stageid" && $(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' nxgest-postgres) == 'running|healthy' ]] || fail
proxy=$(docker ps -q --filter label=com.docker.compose.project=nxgestao --filter label=com.docker.compose.service=caddy); [[ $proxy =~ ^[a-f0-9]{12,64}$ && $(docker inspect --format '{{.State.Status}}' "$proxy") == running ]] || fail
actual=$(sha256sum -- "$tarfile"); [[ sha256:${actual%% *} == "$tar" ]] || fail
[[ $(bash "$base"/load-verified-image.sh "$tarfile" "$tar" "$sha" --preflight) == "$image" ]] || fail
[[ $(check_policy) == "$policy_result" && $(docker inspect --format '{{.Id}}' nxgestao-app-1) == "$oldid" && $(docker inspect --format '{{.Image}}' "$oldid") == "$oldimage" ]] || fail
umask 077
(set -C; printf 'version=preclients-pending-v1\nsha=%s\nprevious=%s\nimage=%s\nprevious_image=%s\n' "$sha" "$previous" "$image" "$oldimage" > "$pending") || fail
[[ -f $pending && ! -L $pending && $(stat -c %u "$pending") == "$(id -u)" && $(stat -c %a "$pending") == 600 ]] || fail
pending_id=$(stat -c '%d:%i' "$pending"); sync -f "$pending"; sync -f "$gitdir"
recheck_policy(){
  local p=${NXGEST_OPERATION_POLICY:-$gitdir/nxgest-production-preclients-policy} sum expires now
  if [[ -n ${NXGEST_RECURRING_ENV:-} ]]; then source "$base/recurring-host-policy.sh"; nxgest_recurring_context production || fail; fi
  if [[ ${NXGEST_RECURRING_ENV:-} == production ]]; then
    nxgest_secure_file .env 1048576 || fail
    local envsum compose_sum
    envsum=$(sha256sum .env); compose_sum=$(sha256sum "$base/docker-compose.prod.yml")
    [[ ${envsum%% *} == "$("$NXGEST_JQ" -r '.topology.envSha256' "$NXGEST_BASE_FILE")" && ${compose_sum%% *} == "$("$NXGEST_JQ" -r '.topology.composeSha256' "$NXGEST_BASE_FILE")" ]] || fail
    NXGEST_PREVIOUS_ID=$expected_prod_id; NXGEST_PREVIOUS_IMAGE=$expected_prod_image
    nxgest_production_topology "$expected_prod_id" || fail
    nxgest_participants >/dev/null || fail
  fi
  [[ -f $p && ! -L $p && $(stat -c %u "$p") == "$(id -u)" && $(stat -c %a "$p") == 600 && $(stat -c %s "$p") -le 4096 ]] || fail
  sum=$(sha256sum -- "$p"); [[ sha256:${sum%% *} == "$policyhash" ]] || fail
  expires=$(tail -n 1 -- "$p"); [[ $expires =~ ^expires_epoch=([0-9]{10})$ ]] || fail
  now=$(date +%s); (( 10#${BASH_REMATCH[1]} > 10#$now )) || fail
}
recheck_policy
# Preserve exact previous image; unknown or divergent pin blocks before app replacement.
pin=nxgest-retained:$previous
refs=$(docker image ls --no-trunc --format '{{.Repository}}:{{.Tag}}|{{.ID}}') || fail
existing=$(printf '%s\n' "$refs" | awk -F '|' -v p="$pin" '$1==p {if(NF!=2 || $2=="")exit 1;print $2}') || fail
[[ -z $existing || $existing == "$oldimage" ]] || fail
[[ $(docker image inspect --format '{{.Id}}' "$oldimage") == "$oldimage" ]] || fail
if [[ -z $existing ]]; then docker image tag "$oldimage" "$pin" >&2 || fail; fi
[[ $(docker image inspect --format '{{.Id}}' "$pin") == "$oldimage" ]] || fail
[[ $(bash "$base"/load-verified-image.sh "$tarfile" "$tar" "$sha") == "$image" ]] || fail
bash "$base"/retain-verified-image.sh "$sha" "$image" || fail
recheck_policy
[[ $(stat -c '%d:%i' "$pending") == "$pending_id" && $(docker inspect --format '{{.Id}}' nxgestao-app-1) == "$oldid" && $(docker inspect --format '{{.Image}}' "$oldid") == "$oldimage" ]] || fail
[[ $(docker inspect --format '{{.Id}}' staging-app) == "$stageid" && $(docker inspect --format '{{.Image}}' "$stageid") == "$image" ]] || fail
compose=infra/docker-compose.prod.yml
if [[ ${NXGEST_RECURRING_ENV:-} == production ]]; then compose=$base/docker-compose.prod.yml; fi
export NXGEST_PROD_IMAGE="$image"
docker compose --project-directory . -f "$compose" up -d --no-deps --no-build --pull never app >&2 || fail
container=$(docker compose --project-directory . -f "$compose" ps -q app); [[ $container =~ ^[a-f0-9]{12,64}$ ]] || fail
id=$(docker inspect --format '{{.Id}}' "$container"); [[ $id =~ ^[a-f0-9]{64}$ && $(docker inspect --format '{{.Image}}' "$id") == "$image" ]] || fail
expected_prod_id=$id; expected_prod_image=$image
# main.ts listens only after awaited migrations and seed; target health proves this boot reached listen.
bash "$base"/container-health.sh "$id" "$image" --wait || fail
curl -fsS --max-time 5 https://nxgest.com.br/api/health | "$NXGEST_JQ" -e '.status=="ok" and .db=="connected"' >/dev/null || fail
[[ $(docker inspect --format '{{.Id}}' "$container") == "$id" && $(docker inspect --format '{{.Image}}' "$id") == "$image" && $(docker image inspect --format '{{.Id}}' "$pin") == "$oldimage" && $(stat -c '%d:%i' "$pending") == "$pending_id" ]] || fail
recheck_policy
state_tmp=$(mktemp "$gitdir/.preclients-selection.XXXXXXXX"); marker_tmp=$(mktemp "$gitdir/.preclients-marker.XXXXXXXX")
chmod 600 "$state_tmp" "$marker_tmp"
printf 'version=production-preclients-v1\nsha=%s\ntar=%s\nzip=%s\nci_run=%s\nartifact=%s\nstaging_run=%s\nimage=%s\n' "$sha" "$tar" "$zip" "$run" "$artifact" "$staging" "$image" > "$state_tmp"
printf '%s\n' "$sha" > "$marker_tmp"
sync -f "$state_tmp"; sync -f "$marker_tmp"
mv -T -- "$state_tmp" "$selection"; mv -T -- "$marker_tmp" "$marker"; sync -f "$gitdir"
printf 'PRECLIENTS_APPLIED sha=%s tar=%s image=%s container=%s\n' "$sha" "$tar" "$image" "$id"
