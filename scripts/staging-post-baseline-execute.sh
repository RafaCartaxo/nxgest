#!/usr/bin/env bash
# Somente controlador autenticado, após loader e cápsula; lock FD9 herdado.
set -euo pipefail
umask 077
fail(){ echo 'Transição pós-baseline interrompida; preservar pending para reparo' >&2; exit 1; }
[[ $# == 10 || ( $# == 11 && ${11} == --own-pending ) ]] || fail
reserved=${11:-}; args=("${@:1:9}"); observe_args=("${args[@]}"); [[ -z $reserved ]] || observe_args+=(--own-pending); sha=$3; run=$4; attempt=$5; artifact=$6; zip=$7; tar=$8; image=${10}
[[ $image =~ ^sha256:[a-f0-9]{64}$ ]] || fail
base=$(cd "$(dirname "$0")" && pwd -P)
flock -n 9 || fail
source "$base/host-jq.sh"; nxgest_use_jq || fail
bash "$base/staging-post-baseline-observe.sh" "${observe_args[@]}" >/dev/null || fail
gitdir=$(git rev-parse --absolute-git-dir) || fail
mapfile -t p < "${NXGEST_OPERATION_POLICY:-$gitdir/nxgest-staging-post-baseline-policy}"
mapfile -t c < "$gitdir/nxgest-staging-adoption-consumed"
[[ ${#p[@]} == 22 && ${#c[@]} == 1 && ${c[0]} =~ ^operation=([a-f0-9]{32})$ ]] || fail
adoption_op=${BASH_REMATCH[1]}; op=${p[4]#operation=}; legacy=${p[5]#legacy_id=}; legacy_image=${p[6]#legacy_image=}; current=${p[8]#current_id=}
work=$gitdir/nxgest-post-baseline-$op; pending=$gitdir/nxgest-staging-pending; state=$gitdir/nxgest-staging-selection; marker=$gitdir/nxgest-staging-sha
[[ -d $work && ! -L $work && $(stat -c %u "$work") == "$(id -u)" && $(stat -c %a "$work") == 700 ]] || fail
for name in current.json image.json payload.json journal; do f=$work/$name; [[ -f $f && ! -L $f && $(stat -c %u "$f") == "$(id -u)" && $(stat -c %a "$f") == 600 ]] || fail; done
mapfile -t journal_initial < "$work/journal"
[[ ${#journal_initial[@]} == 6 && ${journal_initial[0]} == version=post-baseline-v1 && ${journal_initial[1]} == "operation=$op" && ${journal_initial[2]} =~ ^payload_sha256=[a-f0-9]{64}$ && ${journal_initial[3]} == state=prepared && ${journal_initial[4]} == "current_id=$current" && ${journal_initial[5]} == "new_image=$image" ]] || fail
sum=$(sha256sum -- "$work/payload.json"); [[ "payload_sha256=${sum%% *}" == "${journal_initial[2]}" ]] || fail
"$NXGEST_JQ" -e --arg image "$image" --arg op "$op" '.Image == $image and .Labels["nxgest.postbaseline.operation"] == $op and .HostConfig.Mounts == [{Type:"volume",Source:"nxgestao_nxgestao_staging_data",Target:"/data",VolumeOptions:{NoCopy:true}}]' "$work/payload.json" >/dev/null || fail
export DOCKER_HOST=unix:///var/run/docker.sock; unset DOCKER_CONTEXT
inspect(){ timeout 10s docker --host unix:///var/run/docker.sock inspect --format "$1" "$2" 2>/dev/null; }
retained=nxgest-legacy-$adoption_op; previous=nxgest-staging-previous-$op
[[ -z $(timeout 10s docker --host unix:///var/run/docker.sock ps -aq --no-trunc --filter "name=^/$previous$") ]] || fail
(ulimit -f 1024; set -C; timeout 10s docker --host unix:///var/run/docker.sock inspect "$current" > "$work/recheck.json") 2>/dev/null || fail
expressions=('{Config: .[0].Config, HostConfig: .[0].HostConfig}' '.[0].Mounts' '.[0].NetworkSettings.Networks')
expected=("${p[17]#config_sha256=}" "${p[18]#mounts_sha256=}" "${p[19]#networks_sha256=}")
for i in 0 1 2; do
  one=$("$NXGEST_JQ" -cS "${expressions[$i]}" "$work/current.json" | sha256sum); two=$("$NXGEST_JQ" -cS "${expressions[$i]}" "$work/recheck.json" | sha256sum)
  [[ ${one%% *} == "${expected[$i]}" && ${two%% *} == "${expected[$i]}" ]] || fail
done
rm -- "$work/recheck.json"
# Preservar bytes anteriores antes de qualquer troca; nunca sobrescrever evidência.
( set -C; cat -- "$state" > "$work/selection.previous" ) || fail
( set -C; cat -- "$marker" > "$work/marker.previous" ) || fail
[[ $(stat -c %a "$work/selection.previous") == 600 && $(stat -c %a "$work/marker.previous") == 600 ]] || fail
cmp -s -- "$state" "$work/selection.previous" && cmp -s -- "$marker" "$work/marker.previous" || fail
bash "$base/staging-post-baseline-observe.sh" "${observe_args[@]}" >/dev/null || fail
if [[ -z $reserved ]]; then ( set -C; printf 'operation=%s\n' "$op" > "$pending" ) || fail; else bash "$base/staging-post-baseline-policy.sh" "${args[@]}" --own-pending >/dev/null || fail; fi
journal(){ printf 'phase=%s\n' "$1" >> "$work/journal" || fail; }
new=''
revalidate(){
  bash "$base/staging-post-baseline-policy.sh" "${args[@]}" --own-pending >/dev/null || fail
  [[ $(inspect '{{.Id}}' "$retained") == "$legacy" && $(inspect '{{.Image}}' "$legacy") == "$legacy_image" && $(inspect '{{.State.Status}}' "$legacy") == exited ]] || fail
  if [[ -n $new ]]; then bash "$base/staging-post-baseline-resources.sh" "$legacy" "$current" "$op" "$new" >/dev/null || fail
  else bash "$base/staging-post-baseline-resources.sh" "$legacy" "$current" "$op" >/dev/null || fail; fi
  bash "$base/staging-post-baseline-policy.sh" "${args[@]}" --own-pending >/dev/null || fail
}
revalidate
journal pin-requested
bash "$base/retain-verified-image.sh" "$sha" "$image" || fail
revalidate
[[ $(inspect '{{.Id}}' staging-app) == "$current" ]] || fail
(ulimit -f 1024; set -C; timeout 10s docker --host unix:///var/run/docker.sock inspect "$current" > "$work/recheck.json") 2>/dev/null || fail
for i in 0 1 2; do actual=$("$NXGEST_JQ" -cS "${expressions[$i]}" "$work/recheck.json" | sha256sum); [[ ${actual%% *} == "${expected[$i]}" ]] || fail; done
rm -- "$work/recheck.json"
revalidate
journal stop-requested
timeout 30s docker --host unix:///var/run/docker.sock stop "$current" >/dev/null 2>&1 || fail
[[ $(inspect '{{.Id}}' staging-app) == "$current" && $(inspect '{{.State.Status}}' "$current") == exited ]] || fail
revalidate
journal rename-requested
timeout 10s docker --host unix:///var/run/docker.sock rename "$current" "$previous" >/dev/null 2>&1 || fail
[[ $(inspect '{{.Id}}' "$previous") == "$current" && $(inspect '{{.Id}}' "$retained") == "$legacy" ]] || fail
revalidate
journal create-requested
(ulimit -f 32; set -C; timeout 20s curl --silent --show-error --fail --unix-socket /var/run/docker.sock -H 'Content-Type: application/json' --data-binary "@$work/payload.json" 'http://localhost/v1.41/containers/create?name=staging-app' > "$work/create-response.json") 2>/dev/null || fail
new=$("$NXGEST_JQ" -er '.Id | select(type=="string" and test("^[a-f0-9]{64}$"))' "$work/create-response.json") || fail
[[ $(inspect '{{.Id}}' staging-app) == "$new" && $(inspect '{{.Image}}' "$new") == "$image" && $(inspect '{{index .Config.Labels "nxgest.postbaseline.operation"}}' "$new") == "$op" ]] || fail
revalidate
journal start-requested
timeout 20s docker --host unix:///var/run/docker.sock start "$new" >/dev/null 2>&1 || fail
bash "$base/container-health.sh" "$new" "$image" --wait || fail
curl --silent --show-error --fail --max-time 5 https://nxgestao.duckdns.org/api/health | "$NXGEST_JQ" -e 'type=="object" and .status=="ok" and .db=="connected"' >/dev/null || fail
[[ $(inspect '{{.Id}}' staging-app) == "$new" && $(inspect '{{.Image}}' "$new") == "$image" && $(inspect '{{.Id}}' "$previous") == "$current" && $(inspect '{{.State.Status}}' "$current") == exited && $(inspect '{{.Id}}' "$retained") == "$legacy" ]] || fail
revalidate
journal checkout-requested
git checkout --detach --no-overwrite-ignore "$sha" >/dev/null || fail
[[ $(git rev-parse HEAD) == "$sha" ]] || fail
journal publication-requested
( set -C; printf 'environment=staging\nsha=%s\nrun=%s\nattempt=%s\nartifact=%s\nzip=%s\ntar=%s\nimage=%s\n' "$sha" "$run" "$attempt" "$artifact" "$zip" "$tar" "$image" > "$work/selection.tmp" ) || fail
( set -C; printf '%s\n' "$sha" > "$work/marker.tmp" ) || fail
mv -f -- "$work/selection.tmp" "$state" || fail
mv -f -- "$work/marker.tmp" "$marker" || fail
journal completed
rm -- "$pending" || fail
printf 'STAGING_RECEIPT sha=%s run=%s attempt=%s artifact=%s zip=%s tar=%s image=%s\n' "$sha" "$run" "$attempt" "$artifact" "$zip" "$tar" "$image"
