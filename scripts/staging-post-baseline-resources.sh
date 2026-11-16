#!/usr/bin/env bash
# Classifica somente containers com labels Compose da app staging; leitura sob lock.
set -euo pipefail
fail(){ echo 'Recursos staging não classificados' >&2; exit 1; }
[[ ( $# == 3 || $# == 4 ) && $1 =~ ^[a-f0-9]{64}$ && $2 =~ ^[a-f0-9]{64}$ && $3 =~ ^[a-f0-9]{32}$ && $1 != "$2" ]] || fail
legacy=$1; current=$2; operation=$3
flock -n 9 || fail
gitdir=$(git rev-parse --absolute-git-dir) || fail
lock=$gitdir/nxgest-deploy.lock
[[ -f $lock && ! -L $lock && $(stat -c %u "$lock") == "$(id -u)" && $(stat -Lc '%d:%i' /proc/self/fd/9) == "$(stat -Lc '%d:%i' "$lock")" ]] || fail
export DOCKER_HOST=unix:///var/run/docker.sock; unset DOCKER_CONTEXT
inspect(){ timeout 10s docker --host unix:///var/run/docker.sock inspect --format "$1" "$2" 2>/dev/null; }
list=$(timeout 10s docker --host unix:///var/run/docker.sock ps -aq --no-trunc --filter label=com.docker.compose.project=nxgestao --filter label=com.docker.compose.service=staging-app) || fail
[[ ${#list} -le 4300 ]] || fail
mapfile -t ids <<< "$list"
[[ ${#ids[@]} -ge 2 && ${#ids[@]} -le 64 ]] || fail
declare -A known=() seen=()
known[$legacy]=legacy; known[$current]=current
if [[ $# == 4 ]]; then [[ $4 =~ ^[a-f0-9]{64}$ && -z ${known[$4]+present} ]] || fail; known[$4]=transient; fi
shopt -s nullglob
for dir in "$gitdir"/nxgest-post-baseline-*; do
  [[ -d $dir && ! -L $dir ]] || continue
  op=${dir##*/nxgest-post-baseline-}
  [[ $op =~ ^[a-f0-9]{32}$ ]] || continue
  journal=$dir/journal
  [[ $(stat -c %u "$dir") == "$(id -u)" && $(stat -c %a "$dir") == 700 ]] || fail
  if [[ $op == "$operation" && ! -e $journal && ! -L $journal ]]; then continue; fi
  [[ $(stat -c %u "$dir") == "$(id -u)" && $(stat -c %a "$dir") == 700 && -f $journal && ! -L $journal && $(stat -c %u "$journal") == "$(id -u)" && $(stat -c %a "$journal") == 600 && $(stat -c %s "$journal") -le 16384 ]] || fail
  mapfile -t lines < "$journal"
  if [[ $op == "$operation" && ${lines[-1]:-} != phase=completed ]]; then continue; fi
  [[ ${#lines[@]} -ge 7 && ${lines[0]} == version=post-baseline-v1 && ${lines[1]} == "operation=$op" && ${lines[4]} =~ ^current_id=([a-f0-9]{64})$ && ${lines[-1]} == phase=completed ]] || fail
  id=${BASH_REMATCH[1]}
  [[ -z ${known[$id]+present} ]] || fail
  [[ $(inspect '{{.Id}}' "nxgest-staging-previous-$op") == "$id" && $(inspect '{{.State.Status}}' "$id") == exited ]] || fail
  known[$id]=previous
done
for id in "${ids[@]}"; do
  [[ $id =~ ^[a-f0-9]{64}$ && -n ${known[$id]+present} && -z ${seen[$id]+present} ]] || fail
  seen[$id]=1
done
[[ ${#seen[@]} == ${#known[@]} && -n ${seen[$legacy]+present} && -n ${seen[$current]+present} ]] || fail
# Também detectar containers sem as labels esperadas que tenham montado o volume.
volume_list=$(timeout 10s docker --host unix:///var/run/docker.sock ps -aq --no-trunc --filter volume=nxgestao_nxgestao_staging_data) || fail
[[ ${#volume_list} -le 4300 ]] || fail
mapfile -t volume_ids <<< "$volume_list"
[[ ${#volume_ids[@]} == ${#known[@]} ]] || fail
declare -A volume_seen=()
for id in "${volume_ids[@]}"; do
  [[ $id =~ ^[a-f0-9]{64}$ && -n ${known[$id]+present} && -z ${volume_seen[$id]+present} ]] || fail
  volume_seen[$id]=1
done
[[ ${#volume_seen[@]} == ${#known[@]} ]] || fail
# A política externa fixa os participantes não pertencentes à transição.
policy=$gitdir/nxgest-staging-post-baseline-policy
if [[ -n ${NXGEST_RECURRING_ENV:-} ]]; then
  source "$(dirname "$0")/recurring-host-policy.sh"
  policy=$(nxgest_operation_policy staging "$policy") || fail
fi
[[ -f $policy && ! -L $policy && $(stat -c %u "$policy") == "$(id -u)" && $(stat -c %a "$policy") == 600 && $(stat -c %s "$policy") -le 4096 ]] || fail
mapfile -t p < "$policy"
[[ ${#p[@]} == 22 && ${p[20]} =~ ^participants_sha256=([a-f0-9]{64})$ && ${p[21]} =~ ^network_id=[a-f0-9]{64}$ ]] || fail
expected=${p[20]#participants_sha256=}; network_id=${p[21]#network_id=}
[[ $(timeout 10s docker --host unix:///var/run/docker.sock network inspect --format '{{.Id}}' nxgestao_net 2>/dev/null) == "$network_id" ]] || fail
project_list=$(timeout 10s docker --host unix:///var/run/docker.sock ps -aq --no-trunc --filter label=com.docker.compose.project=nxgestao) || fail
network_list=$(timeout 10s docker --host unix:///var/run/docker.sock ps -aq --no-trunc --filter network=nxgestao_net) || fail
[[ ${#project_list} -le 4300 && ${#network_list} -le 4300 ]] || fail
declare -A peer_seen=()
records=()
for scope in project network; do
  if [[ $scope == project ]]; then data=$project_list; else data=$network_list; fi
  [[ -n $data ]] || fail
  mapfile -t peers <<< "$data"
  [[ ${#peers[@]} -le 64 ]] || fail
  for id in "${peers[@]}"; do
    [[ $id =~ ^[a-f0-9]{64}$ && -z ${peer_seen[$scope:$id]+present} ]] || fail
    peer_seen[$scope:$id]=1
    [[ -z ${known[$id]+present} ]] || continue
    image=$(inspect '{{.Image}}' "$id") || fail
    status=$(inspect '{{.State.Status}}' "$id") || fail
    [[ $image =~ ^sha256:[a-f0-9]{64}$ && $status =~ ^(running|exited|created|paused|restarting|dead)$ ]] || fail
    records+=("$scope|$id|$image|$status")
  done
done
[[ ${#records[@]} -gt 0 ]] || fail
actual=$(printf '%s\n' "${records[@]}" | LC_ALL=C sort | sha256sum) || fail
[[ ${actual%% *} == "$expected" ]] || fail
printf 'POST_BASELINE_RESOURCES_CLASSIFIED\n'
