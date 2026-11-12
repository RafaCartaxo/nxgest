#!/usr/bin/env bash
# Núcleo de adoção, chamado somente por controlador confiável sob lock FD9.
set -euo pipefail
umask 077
fail(){ echo 'Adoção interrompida; preservar pending e cápsula para reparo' >&2; exit 1; }
[[ $# == 10 ]] || fail
approved=$1; decision=$2; sha=$3; run=$4; attempt=$5; artifact=$6; zip=$7; tar=$8; host=$9; image=${10}
flock -n 9 || fail
source "$(dirname "$0")/host-jq.sh"; nxgest_use_jq || fail
bash "$(dirname "$0")/staging-adoption-policy.sh" "$approved" "$decision" "$sha" "$run" "$attempt" "$artifact" "$zip" "$tar" "$host" || fail
# Somente o controlador que autenticou e carregou os bytes deve invocar este núcleo.
gitdir=$(git rev-parse --absolute-git-dir) || fail
mapfile -t policy < "$gitdir/nxgest-staging-adoption-policy"
[[ ${#policy[@]} == 17 && "$image" =~ ^sha256:[a-f0-9]{64}$ ]] || fail
op=${policy[4]#operation=}; legacy=${policy[5]#legacy_id=}; old=${policy[6]#legacy_image=}
[[ "$op" =~ ^[a-f0-9]{32}$ && "$legacy" =~ ^[a-f0-9]{64}$ && "$old" =~ ^sha256:[a-f0-9]{64}$ ]] || fail
work=$gitdir/nxgest-adoption-$op; pending=$gitdir/nxgest-staging-pending; state=$gitdir/nxgest-staging-selection; marker=$gitdir/nxgest-staging-sha; consumed=$gitdir/nxgest-staging-adoption-consumed
[[ -d "$work" && ! -L "$work" && $(stat -c %u "$work") == "$(id -u)" && $(stat -c %a "$work") == 700 ]] || fail
for file in legacy.json payload.json journal; do [[ -f "$work/$file" && ! -L "$work/$file" && $(stat -c %u "$work/$file") == "$(id -u)" && $(stat -c %a "$work/$file") == 600 ]] || fail; done
for file in "$pending" "$state" "$marker" "$consumed"; do [[ ! -e "$file" && ! -L "$file" ]] || fail; done
[[ $(tail -n 1 "$work/journal") == "new_image=$image" ]] || fail
payload_hash=$(sha256sum -- "$work/payload.json"); payload_hash=${payload_hash%% *}
[[ "$(sed -n '3p' "$work/journal")" == "payload_sha256=$payload_hash" ]] || fail
"$NXGEST_JQ" -e --arg image "$image" --arg op "$op" '.Image == $image and .Labels["nxgest.adoption.operation"] == $op and .HostConfig.Mounts == [{Type:"volume",Source:"nxgestao_nxgestao_staging_data",Target:"/data",VolumeOptions:{NoCopy:true}}]' "$work/payload.json" >/dev/null || fail
export DOCKER_HOST=unix:///var/run/docker.sock
unset DOCKER_CONTEXT
inspect(){ timeout 10s docker --host unix:///var/run/docker.sock inspect --format "$1" "$2" 2>/dev/null; }
[[ "$(inspect '{{.Id}}' staging-app)" == "$legacy" && "$(inspect '{{.Image}}' "$legacy")" == "$old" && "$(inspect '{{.State.Status}}' "$legacy")" == running ]] || fail
[[ "$(inspect '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' staging-pg)" == 'running|healthy' ]] || fail
proxy=$(timeout 10s docker --host unix:///var/run/docker.sock ps -q --filter label=com.docker.compose.project=nxgestao --filter label=com.docker.compose.service=caddy) || fail
[[ "$proxy" =~ ^[a-f0-9]{12,64}$ && "$(inspect '{{.State.Status}}' "$proxy")" == running ]] || fail
bash "$(dirname "$0")/container-health.sh" "$legacy" "$old" --wait || fail
curl --silent --show-error --fail --max-time 5 https://nxgestao.duckdns.org/api/health | "$NXGEST_JQ" -e 'type=="object" and .status=="ok" and .db=="connected"' >/dev/null || fail
[[ "$(inspect '{{.Id}}' staging-app)" == "$legacy" ]] || fail
retained=nxgest-legacy-$op
occupied=$(timeout 10s docker --host unix:///var/run/docker.sock ps -aq --no-trunc --filter "name=^/$retained$") || fail
[[ -z "$occupied" ]] || fail
# Comparar a fotografia completa relevante imediatamente antes dos efeitos.
(set -C; ulimit -f 1024; timeout 10s docker --host unix:///var/run/docker.sock inspect "$legacy" > "$work/recheck.json") 2>/dev/null || fail
expressions=('{Config: .[0].Config, HostConfig: .[0].HostConfig}' '.[0].Mounts' '.[0].NetworkSettings.Networks')
expected=("${policy[7]#config_sha256=}" "${policy[8]#mounts_sha256=}" "${policy[9]#networks_sha256=}")
for i in 0 1 2; do
  left=$("$NXGEST_JQ" -cS "${expressions[$i]}" "$work/legacy.json" | sha256sum); right=$("$NXGEST_JQ" -cS "${expressions[$i]}" "$work/recheck.json" | sha256sum)
  [[ "${expected[$i]}" =~ ^[a-f0-9]{64}$ && "${left%% *}" == "${expected[$i]}" && "${right%% *}" == "${expected[$i]}" ]] || fail
done
rm -- "$work/recheck.json"
bash "$(dirname "$0")/staging-adoption-policy.sh" "$approved" "$decision" "$sha" "$run" "$attempt" "$artifact" "$zip" "$tar" "$host" || fail
( set -C; printf 'operation=%s\n' "$op" > "$pending" ) || fail
journal(){ printf 'phase=%s\n' "$1" >> "$work/journal" || fail; }
# Enquanto create não foi solicitado, retorno limitado ao mesmo ID e nome.
create_requested=0; stopped=0; renamed=0
recover(){
  [[ $create_requested == 0 && $stopped == 1 ]] || return 0
  if [[ $renamed == 1 ]]; then
    [[ "$(inspect '{{.Id}}' "$retained" || :)" == "$legacy" ]] || return 0
    timeout 10s docker --host unix:///var/run/docker.sock rename "$legacy" staging-app >/dev/null 2>&1 || return 0
  fi
  [[ "$(inspect '{{.Id}}' staging-app || :)" == "$legacy" && "$(inspect '{{.Image}}' "$legacy" || :)" == "$old" ]] || return 0
  timeout 10s docker --host unix:///var/run/docker.sock start "$legacy" >/dev/null 2>&1 || return 0
  bash "$(dirname "$0")/container-health.sh" "$legacy" "$old" --wait >/dev/null 2>&1 || return 0
  curl --silent --show-error --fail --max-time 5 https://nxgestao.duckdns.org/api/health | "$NXGEST_JQ" -e 'type=="object" and .status=="ok" and .db=="connected"' >/dev/null 2>&1 || return 0
  [[ "$(inspect '{{.Id}}' staging-app || :)" == "$legacy" && "$(inspect '{{.Image}}' "$legacy" || :)" == "$old" ]] || return 0
  journal legacy-restarted
}
trap recover EXIT
journal stop-requested
stopped=1
timeout 30s docker --host unix:///var/run/docker.sock stop "$legacy" >/dev/null 2>&1 || fail
[[ "$(inspect '{{.Id}}' staging-app)" == "$legacy" && "$(inspect '{{.State.Status}}' "$legacy")" == exited ]] || fail
journal rename-requested
timeout 10s docker --host unix:///var/run/docker.sock rename "$legacy" "$retained" >/dev/null 2>&1 || fail
renamed=1
[[ "$(inspect '{{.Id}}' "$retained")" == "$legacy" && "$(inspect '{{.Image}}' "$legacy")" == "$old" ]] || fail
journal create-requested
create_requested=1
# Saída da API em arquivo privado; corpo do payload nunca aparece em argv/logs.
(set -C; ulimit -f 32; timeout 20s curl --silent --show-error --fail --unix-socket /var/run/docker.sock -H 'Content-Type: application/json' --data-binary "@$work/payload.json" 'http://localhost/v1.41/containers/create?name=staging-app' > "$work/create-response.json") 2>/dev/null || fail
new=$("$NXGEST_JQ" -er '.Id | select(type=="string" and test("^[a-f0-9]{64}$"))' "$work/create-response.json") || fail
[[ "$(inspect '{{.Id}}' staging-app)" == "$new" && "$(inspect '{{.Image}}' "$new")" == "$image" && "$(inspect '{{index .Config.Labels "nxgest.adoption.operation"}}' "$new")" == "$op" ]] || fail
journal start-requested
timeout 20s docker --host unix:///var/run/docker.sock start "$new" >/dev/null 2>&1 || fail
bash "$(dirname "$0")/container-health.sh" "$new" "$image" --wait || fail
curl --silent --show-error --fail --max-time 5 https://nxgestao.duckdns.org/api/health | "$NXGEST_JQ" -e 'type=="object" and .status=="ok" and .db=="connected"' >/dev/null || fail
[[ "$(inspect '{{.Id}}' staging-app)" == "$new" && "$(inspect '{{.Image}}' "$new")" == "$image" && "$(inspect '{{.Id}}' "$retained")" == "$legacy" ]] || fail
# Remove somente a tag temporária do tar carregado por este controlador.
tag=nxgest-build:$sha
[[ "$(timeout 10s docker --host unix:///var/run/docker.sock image inspect --format '{{.Id}}' "$tag" 2>/dev/null)" == "$image" ]] || fail
journal untag-requested
timeout 10s docker --host unix:///var/run/docker.sock image rm "$tag" >/dev/null 2>&1 || fail
bash "$(dirname "$0")/staging-adoption-policy.sh" "$approved" "$decision" "$sha" "$run" "$attempt" "$artifact" "$zip" "$tar" "$host" || fail
journal publish-requested
( set -C; printf 'operation=%s\n' "$op" > "$consumed" ) || fail
( set -C; printf 'environment=staging\nsha=%s\nrun=%s\nattempt=%s\nartifact=%s\nzip=%s\ntar=%s\nimage=%s\n' "$sha" "$run" "$attempt" "$artifact" "$zip" "$tar" "$image" > "$work/selection.tmp" ) || fail
( set -C; printf '%s\n' "$sha" > "$work/marker.tmp" ) || fail
ln -- "$work/selection.tmp" "$state" || fail
ln -- "$work/marker.tmp" "$marker" || fail
rm -- "$work/selection.tmp" "$work/marker.tmp"
journal completed
rm -- "$pending"
trap - EXIT
printf 'STAGING_RECEIPT sha=%s run=%s attempt=%s artifact=%s zip=%s tar=%s image=%s\n' "$sha" "$run" "$attempt" "$artifact" "$zip" "$tar" "$image"
