#!/usr/bin/env bash
# Pré-verificação somente leitura. Não faz load, troca, health ou publicação.
set -euo pipefail
fail(){ echo 'Observação pós-baseline recusada' >&2; exit 1; }
[[ $# == 9 || ( $# == 10 && ${10} == --own-pending ) ]] || fail
base=$(cd "$(dirname "$0")" && pwd -P)
flock -n 9 || fail
bash "$base/staging-post-baseline-policy.sh" "$@" >/dev/null || fail
gitdir=$(git rev-parse --absolute-git-dir) || fail
mapfile -t policy < "${NXGEST_OPERATION_POLICY:-$gitdir/nxgest-staging-post-baseline-policy}"
mapfile -t consumed < "$gitdir/nxgest-staging-adoption-consumed"
[[ ${#policy[@]} == 22 && ${#consumed[@]} == 1 && ${consumed[0]} =~ ^operation=([a-f0-9]{32})$ ]] || fail
adoption_op=${BASH_REMATCH[1]}
legacy=${policy[5]#legacy_id=}; legacy_image=${policy[6]#legacy_image=}; current=${policy[8]#current_id=}; current_image=${policy[9]#current_image=}
[[ $legacy != "$current" ]] || fail
export DOCKER_HOST=unix:///var/run/docker.sock
unset DOCKER_CONTEXT
inspect(){ timeout 10s docker --host unix:///var/run/docker.sock inspect --format "$1" "$2" 2>/dev/null; }
retained=nxgest-legacy-$adoption_op
[[ $(inspect '{{.Id}}' "$retained") == "$legacy" && $(inspect '{{.Image}}' "$legacy") == "$legacy_image" && $(inspect '{{.State.Status}}' "$legacy") == exited ]] || fail
[[ $(inspect '{{.Id}}' staging-app) == "$current" && $(inspect '{{.Image}}' "$current") == "$current_image" && $(inspect '{{.State.Status}}' "$current") == running ]] || fail
adoption_label=$(inspect '{{index .Config.Labels "nxgest.adoption.operation"}}' "$current") || fail
if [[ $adoption_label != "$adoption_op" ]]; then
  # A promoção anterior produz uma label diferente. A label sozinha não é
  # autoridade: correlacionar ID, imagem e payload com journal concluído.
  post_op=$(inspect '{{index .Config.Labels "nxgest.postbaseline.operation"}}' "$current") || fail
  [[ $post_op =~ ^[a-f0-9]{32}$ ]] || fail
  work=$gitdir/nxgest-post-baseline-$post_op; journal=$work/journal; response=$work/create-response.json; payload=$work/payload.json
  [[ -d $work && ! -L $work && $(stat -c %u "$work") == "$(id -u)" && $(stat -c %a "$work") == 700 ]] || fail
  for f in "$journal" "$response" "$payload"; do [[ -f $f && ! -L $f && $(stat -c %u "$f") == "$(id -u)" && $(stat -c %a "$f") == 600 && $(stat -c %s "$f") -le 1048576 ]] || fail; done
  mapfile -t prior < "$journal"
  [[ ${#prior[@]} -ge 7 && ${prior[0]} == version=post-baseline-v1 && ${prior[1]} == "operation=$post_op" && ${prior[2]} =~ ^payload_sha256=[a-f0-9]{64}$ && ${prior[3]} == state=prepared && ${prior[5]} == "new_image=$current_image" && ${prior[-1]} == phase=completed ]] || fail
  sum=$(sha256sum -- "$payload"); [[ "payload_sha256=${sum%% *}" == "${prior[2]}" ]] || fail
  source "$base/host-jq.sh"; nxgest_use_jq || fail
  [[ $("$NXGEST_JQ" -er '.Id | select(type=="string" and test("^[a-f0-9]{64}$"))' "$response") == "$current" ]] || fail
  "$NXGEST_JQ" -e --arg image "$current_image" --arg op "$post_op" '.Image == $image and .Labels["nxgest.postbaseline.operation"] == $op' "$payload" >/dev/null || fail
fi
bash "$base/staging-post-baseline-policy.sh" "$@" >/dev/null || fail
bash "$base/staging-post-baseline-resources.sh" "$legacy" "$current" "${policy[4]#operation=}" >/dev/null || fail
[[ $(inspect '{{.Id}}' "$retained") == "$legacy" && $(inspect '{{.Id}}' staging-app) == "$current" ]] || fail
bash "$base/staging-post-baseline-policy.sh" "$@" >/dev/null || fail
printf 'POST_BASELINE_STATE_OBSERVED\n'
