#!/usr/bin/env bash
# Retry exclusivamente de leitura após promoção concluída; chamada pelo runner autenticado.
set -euo pipefail
fail(){ echo 'Retry pós-baseline recusado' >&2; exit 1; }
[[ $# == 9 ]] || fail
approved=$1; decision=$2; sha=$3; run=$4; attempt=$5; artifact=$6; zip=$7; tar=$8; host=$9
[[ $approved =~ ^sha256:[a-f0-9]{64}$ && $decision =~ ^[A-Za-z0-9._/-]{1,160}$ && $sha =~ ^[a-f0-9]{40}$ && $run =~ ^[0-9]{1,20}$ && $attempt == 1 && $artifact =~ ^[0-9]{1,20}$ && $zip =~ ^sha256:[a-f0-9]{64}$ && $tar =~ ^sha256:[a-f0-9]{64}$ && $host =~ ^[A-Za-z0-9._-]{1,128}$ ]] || fail
flock -n 9 || fail
[[ $(hostname -s) == "$host" ]] || fail
base=$(cd "$(dirname "$0")" && pwd -P)
source "$base/host-jq.sh"; nxgest_use_jq || fail
gitdir=$(git rev-parse --absolute-git-dir) || fail
lockfile=$gitdir/nxgest-deploy.lock
[[ -f $lockfile && ! -L $lockfile && $(stat -c %u "$lockfile") == "$(id -u)" && $(stat -Lc '%d:%i' /proc/self/fd/9) == "$(stat -Lc '%d:%i' "$lockfile")" ]] || fail
secure(){ [[ -f $1 && ! -L $1 && $(stat -c %u "$1") == "$(id -u)" && $(stat -c %a "$1") == 600 && $(stat -c %s "$1") -le 4096 ]]; }
policy=${NXGEST_OPERATION_POLICY:-$gitdir/nxgest-staging-post-baseline-policy}; state=$gitdir/nxgest-staging-selection; marker=$gitdir/nxgest-staging-sha; consumed=$gitdir/nxgest-staging-adoption-consumed; pending=$gitdir/nxgest-staging-pending
[[ ! -e $pending && ! -L $pending ]] || fail
for f in "$policy" "$state" "$marker" "$consumed"; do secure "$f" || fail; done
sum=$(sha256sum -- "$policy"); [[ sha256:${sum%% *} == "$approved" ]] || fail
state_hash=$(sha256sum -- "$state"); marker_hash=$(sha256sum -- "$marker"); consumed_hash=$(sha256sum -- "$consumed")
mapfile -t p < "$policy"; mapfile -t s < "$state"; mapfile -t m < "$marker"; mapfile -t c < "$consumed"
[[ ${#p[@]} == 22 && ${p[0]} == version=staging-post-baseline-v2 && ${p[1]} == environment=staging && ${p[2]} == "host=$host" && ${p[3]} == "decision=$decision" && ${p[4]} =~ ^operation=[a-f0-9]{32}$ && ${p[5]} =~ ^legacy_id=[a-f0-9]{64}$ && ${p[6]} =~ ^legacy_image=sha256:[a-f0-9]{64}$ && ${p[10]} == "sha=$sha" && ${p[11]} == "run=$run" && ${p[12]} == "attempt=$attempt" && ${p[13]} == "artifact=$artifact" && ${p[14]} == "zip=$zip" && ${p[15]} == "tar=$tar" && ${p[16]} =~ ^expires_epoch=[0-9]{10}$ && ${p[20]} =~ ^participants_sha256=[a-f0-9]{64}$ && ${p[21]} =~ ^network_id=[a-f0-9]{64}$ ]] || fail
[[ ${#s[@]} == 8 && ${s[0]} == environment=staging && ${s[1]} == "sha=$sha" && ${s[2]} == "run=$run" && ${s[3]} == "attempt=$attempt" && ${s[4]} == "artifact=$artifact" && ${s[5]} == "zip=$zip" && ${s[6]} == "tar=$tar" && ${s[7]} =~ ^image=sha256:[a-f0-9]{64}$ && ${#m[@]} == 1 && ${m[0]} == "$sha" && ${#c[@]} == 1 && ${c[0]} =~ ^operation=([a-f0-9]{32})$ ]] || fail
adoption_op=${BASH_REMATCH[1]}; image=${s[7]#image=}; op=${p[4]#operation=}; legacy=${p[5]#legacy_id=}; legacy_image=${p[6]#legacy_image=}
[[ $(git rev-parse HEAD) == "$sha" ]] || fail
now=$(date +%s); expiry=${p[16]#expires_epoch=}; [[ $now =~ ^[0-9]{10}$ ]] && (( 10#$expiry > 10#$now )) || fail
export DOCKER_HOST=unix:///var/run/docker.sock; unset DOCKER_CONTEXT
inspect(){ timeout 10s docker --host unix:///var/run/docker.sock inspect --format "$1" "$2" 2>/dev/null; }
retained=nxgest-legacy-$adoption_op
[[ $(inspect '{{.Id}}' "$retained") == "$legacy" && $(inspect '{{.Image}}' "$legacy") == "$legacy_image" && $(inspect '{{.State.Status}}' "$legacy") == exited ]] || fail
id=$(inspect '{{.Id}}' staging-app) || fail
[[ $id =~ ^[a-f0-9]{64}$ && $(inspect '{{.Image}}' "$id") == "$image" && $(inspect '{{index .Config.Labels "nxgest.postbaseline.operation"}}' "$id") == "$op" ]] || fail
bash "$base/staging-post-baseline-resources.sh" "$legacy" "$id" "$op" >/dev/null || fail
bash "$base/container-health.sh" "$id" "$image" --wait || fail
curl --silent --show-error --fail --max-time 5 https://nxgestao.duckdns.org/api/health | "$NXGEST_JQ" -e 'type=="object" and .status=="ok" and .db=="connected"' >/dev/null || fail
[[ $(inspect '{{.Id}}' staging-app) == "$id" && $(inspect '{{.Image}}' "$id") == "$image" && $(inspect '{{.Id}}' "$retained") == "$legacy" ]] || fail
for f in "$policy" "$state" "$marker" "$consumed"; do secure "$f" || fail; done
sum2=$(sha256sum -- "$policy"); [[ sha256:${sum2%% *} == "$approved" && ! -e $pending && ! -L $pending ]] || fail
[[ $(sha256sum -- "$state") == "$state_hash" && $(sha256sum -- "$marker") == "$marker_hash" && $(sha256sum -- "$consumed") == "$consumed_hash" ]] || fail
printf 'STAGING_RETRY verificado\nSTAGING_RECEIPT sha=%s run=%s attempt=%s artifact=%s zip=%s tar=%s image=%s\n' "$sha" "$run" "$attempt" "$artifact" "$zip" "$tar" "$image"
