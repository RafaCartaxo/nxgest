#!/usr/bin/env bash
# Entry point for an independently provisioned, forced-command SSH key.
# The host operator controls this script and authority file outside the artifact.
set -euo pipefail
umask 077
fail(){ echo 'Entrada recorrente recusada' >&2; exit 1; }
# V2 arguments are hardcoded by the independently installed forced-command
# configuration, not supplied as remote command arguments by the SSH client.
if [[ $# == 2 ]]; then
  environment=$1; peer=$2
  [[ ( $environment == staging || $environment == production ) && $peer == "nxgest-$environment-runner" ]] || fail
  export PATH=/usr/bin:/bin
  cd /opt/nxgestao || fail
  gitdir=$(git rev-parse --absolute-git-dir); owner=$(id -u)
  authority=$gitdir/nxgest-recurring-$environment-authority
  [[ -d $gitdir && ! -L $gitdir && $(stat -c %u "$gitdir") == "$owner" && -f $authority && ! -L $authority && $(stat -c %u "$authority") == "$owner" && $(stat -c %a "$authority") == 600 && $(stat -c %s "$authority") -le 4096 ]] || fail
  dmode=$(stat -c %a "$gitdir"); [[ $dmode =~ ^[0-7]{3,4}$ ]] && (( (8#$dmode & 8#7022) == 0 )) || fail
  authority_hash=$(sha256sum -- "$authority")
  mapfile -t a < "$authority"
  [[ ${#a[@]} == 8 && ${a[0]} == version=recurring-authority-v2 && ${a[1]} == "environment=$environment" && ${a[2]} == "host=$(hostname -s)" && ${a[3]} =~ ^controller=[a-f0-9]{40}$ && ${a[4]} =~ ^policy_sha256=sha256:[a-f0-9]{64}$ && ${a[5]} =~ ^decision=[A-Za-z0-9._/-]{1,160}$ && ${a[6]} =~ ^expires_epoch=[0-9]{10}$ && ${a[7]} == "peer=$peer" ]] || fail
  controller=${a[3]#controller=}; policy=${a[4]#policy_sha256=}; decision=${a[5]#decision=}; host=${a[2]#host=}; expiry=${a[6]#expires_epoch=}
  now=$(date +%s); [[ $now =~ ^[0-9]{10}$ ]] && (( 10#$expiry > 10#$now )) || fail
  fields=(); for i in {1..18}; do IFS= read -r -n 256 line || fail; fields+=("$line"); done
  [[ ${fields[0]} == version=recurring-selection-v1 && ${fields[1]} == "controller=$controller" && ${fields[2]} == "environment=$environment" && ${fields[3]} =~ ^phase=(apply|finalize)$ && ${fields[4]} =~ ^sha=[a-f0-9]{40}$ && ${fields[5]} =~ ^tar=sha256:[a-f0-9]{64}$ && ${fields[6]} =~ ^zip=sha256:[a-f0-9]{64}$ && ${fields[7]} =~ ^ci_run=[0-9]{1,20}$ && ${fields[8]} == ci_attempt=1 && ${fields[9]} =~ ^artifact=[0-9]{1,20}$ && ${fields[10]} =~ ^staging_run=[0-9]{1,20}$ && ${fields[11]} =~ ^image=(none|sha256:[a-f0-9]{64})$ && ${fields[12]} =~ ^cd_run=[0-9]{1,20}$ && ${fields[13]} == cd_attempt=1 && ${fields[14]} =~ ^receipt=(none|sha256:[a-f0-9]{64})$ && ${fields[15]} =~ ^build_policy=sha256:[a-f0-9]{64}$ && ${fields[16]} =~ ^staging_policy=(none|sha256:[a-f0-9]{64})$ && ${fields[17]} == end=selection ]] || fail
  phase=${fields[3]#phase=}; sha=${fields[4]#sha=}; tar=${fields[5]#tar=}; zip=${fields[6]#zip=}; run=${fields[7]#ci_run=}; artifact=${fields[9]#artifact=}; stage=${fields[10]#staging_run=}; image=${fields[11]#image=}; cd_run=${fields[12]#cd_run=}; receipt=${fields[14]#receipt=}; runner_build_policy=${fields[15]#build_policy=}; runner_stage_policy=${fields[16]#staging_policy=}
  if [[ $environment == staging ]]; then [[ $phase == apply && $stage == 0 && $image == none && $cd_run == 0 && $receipt == none ]] || fail
  else [[ $stage != 0 && $cd_run != 0 && $image != none && ( $phase == apply && $receipt == none || $phase == finalize && $receipt != none ) ]] || fail; fi
  lock=$gitdir/nxgest-deploy.lock
  [[ -f $lock && ! -L $lock && $(stat -c %u "$lock") == "$owner" ]] || fail
  exec 9<>"$lock"; flock -n 9 || fail
  mode=$(stat -c %a "$lock"); [[ $mode =~ ^[0-7]{3,4}$ ]] && (( (8#$mode & 8#7022) == 0 )) || fail
  [[ $(stat -Lc '%d:%i' /proc/self/fd/9) == "$(stat -Lc '%d:%i' "$lock")" ]] || fail
  git cat-file -e "$controller^{commit}" || fail
  tmp=$(mktemp -d "$gitdir/nxgest-recurring-gateway.XXXXXXXX") || fail
  cleanup(){ rm -f -- "$tmp/entry.sh" "$tmp/image.tar"; rmdir -- "$tmp" 2>/dev/null || :; }
  trap cleanup EXIT
  if [[ $environment == staging ]]; then entry=staging-post-baseline-entry.sh; else entry=recurring-production-entry.sh; fi
  git show "$controller:scripts/$entry" > "$tmp/entry.sh" || fail
  [[ -s $tmp/entry.sh ]] || fail
  if [[ $phase == apply ]]; then
    timeout 180s dd bs=1048576 count=513 iflag=fullblock status=none > "$tmp/image.tar" || fail
    [[ $(stat -c %s "$tmp/image.tar") -gt 0 && $(stat -c %s "$tmp/image.tar") -le 536870912 ]] || fail
    sum=$(sha256sum -- "$tmp/image.tar"); [[ sha256:${sum%% *} == "$tar" ]] || fail
    if ! git cat-file -e "$sha^{commit}" 2>/dev/null; then git fetch --no-tags origin "$sha" >/dev/null 2>&1 || fail; fi
  else
    timeout 5s dd bs=1 count=1 status=none > "$tmp/image.tar" || fail
    [[ ! -s $tmp/image.tar ]] || fail
  fi
  [[ $(sha256sum -- "$authority") == "$authority_hash" ]] || fail
  now=$(date +%s); (( 10#$expiry > 10#$now )) || fail
  context=(env -i PATH=/usr/bin:/bin HOME=/nonexistent NXGEST_APPROVED_CONTROLLER="$controller" NXGEST_RECURRING_ENV="$environment" NXGEST_RECURRING_PEER="$peer" NXGEST_RECURRING_BASE_HASH="$policy" NXGEST_RUNNER_BUILD_POLICY_HASH="$runner_build_policy" NXGEST_RUNNER_STAGE_POLICY_HASH="$runner_stage_policy")
  if [[ $environment == staging ]]; then
    "${context[@]}" bash "$tmp/entry.sh" "$sha" "$tmp/image.tar" "$tar" "$zip" "$run" 1 "$artifact" "$policy" "$decision" "$host"
  else
    "${context[@]}" bash "$tmp/entry.sh" "$phase" "$sha" "$tmp/image.tar" "$tar" "$zip" "$run" 1 "$artifact" "$stage" "$image" "$cd_run" 1 "$receipt"
  fi
  exit $?
fi
[[ ${SSH_ORIGINAL_COMMAND:-} == nxgest-recurring-staging-v1 ]] || fail
[[ $# == 0 ]] || fail
# A forced-command account has a fixed checkout, not a client-selected path.
cd /opt/nxgestao || fail
gitdir=$(git rev-parse --absolute-git-dir) || fail
owner=$(id -u); authority=$gitdir/nxgest-recurring-staging-authority
[[ -d $gitdir && ! -L $gitdir && $(stat -c %u "$gitdir") == "$owner" && -f $authority && ! -L $authority && $(stat -c %u "$authority") == "$owner" && $(stat -c %a "$authority") == 600 && $(stat -c %s "$authority") -le 4096 ]] || fail
mode=$(stat -c %a "$gitdir"); [[ $mode =~ ^[0-7]{3,4}$ ]] && (( (8#$mode & 8#7022) == 0 )) || fail
mapfile -t p < "$authority"
[[ ${#p[@]} == 7 && ${p[0]} == version=recurring-staging-authority-v1 && ${p[1]} == environment=staging && ${p[2]} == "host=$(hostname -s)" && ${p[3]} =~ ^controller=[a-f0-9]{40}$ && ${p[4]} =~ ^policy_sha256=sha256:[a-f0-9]{64}$ && ${p[5]} =~ ^decision=[A-Za-z0-9._/-]{1,160}$ && ${p[6]} =~ ^expires_epoch=[0-9]{10}$ ]] || fail
controller=${p[3]#controller=}; policy=${p[4]#policy_sha256=}; decision=${p[5]#decision=}; host=${p[2]#host=}; expiry=${p[6]#expires_epoch=}
now=$(date +%s); [[ $now =~ ^[0-9]{10}$ ]] && (( 10#$expiry > 10#$now )) || fail
# The first seven bounded lines contain selection values, followed by tar bytes.
fields=()
for i in {1..7}; do IFS= read -r -n 256 line || fail; fields+=("$line"); done
[[ ${fields[0]} =~ ^sha=[a-f0-9]{40}$ && ${fields[1]} =~ ^tar=sha256:[a-f0-9]{64}$ && ${fields[2]} =~ ^zip=sha256:[a-f0-9]{64}$ && ${fields[3]} =~ ^run=[0-9]{1,20}$ && ${fields[4]} == attempt=1 && ${fields[5]} =~ ^artifact=[0-9]{1,20}$ && ${fields[6]} == end=selection ]] || fail
sha=${fields[0]#sha=}; tar=${fields[1]#tar=}; zip=${fields[2]#zip=}; run=${fields[3]#run=}; artifact=${fields[5]#artifact=}
lock=$gitdir/nxgest-deploy.lock
[[ -f $lock && ! -L $lock && $(stat -c %u "$lock") == "$owner" ]] || fail
exec 9<>"$lock"; flock -n 9 || fail
lockmode=$(stat -c %a "$lock"); [[ $lockmode =~ ^[0-7]{3,4}$ ]] && (( (8#$lockmode & 8#7022) == 0 )) || fail
[[ $(stat -Lc '%d:%i' /proc/self/fd/9) == "$(stat -Lc '%d:%i' "$lock")" ]] || fail
# The trusted controller is selected before any candidate script is read.
git cat-file -e "$controller^{commit}" || fail
tmp=$(mktemp -d "$gitdir/nxgest-recurring-gateway.XXXXXXXX") || fail
cleanup(){ rm -f -- "$tmp/entry.sh" "$tmp/image.tar"; rmdir -- "$tmp" 2>/dev/null || :; }
trap cleanup EXIT
git show "$controller:scripts/staging-post-baseline-entry.sh" > "$tmp/entry.sh" || fail
[[ -s $tmp/entry.sh && ! -L $tmp/entry.sh ]] || fail
(timeout 180s dd bs=1048576 count=513 iflag=fullblock status=none > "$tmp/image.tar") || fail
[[ -f $tmp/image.tar && ! -L $tmp/image.tar && $(stat -c %s "$tmp/image.tar") -gt 0 && $(stat -c %s "$tmp/image.tar") -le 536870912 ]] || fail
actual=$(sha256sum -- "$tmp/image.tar"); [[ sha256:${actual%% *} == "$tar" ]] || fail
# Candidate data may identify a commit, but never chooses the executing code.
if ! git cat-file -e "$sha^{commit}" 2>/dev/null; then git fetch --no-tags origin "$sha" >/dev/null 2>&1 || fail; fi
[[ $(sha256sum -- "$authority") == "$(printf '%s  %s' "$(printf '%s\n' "${p[@]}" | sha256sum | cut -d' ' -f1)" "$authority")" ]] || fail
now=$(date +%s); [[ $now =~ ^[0-9]{10}$ ]] && (( 10#$expiry > 10#$now )) || fail
env -i PATH=/usr/bin:/bin HOME=/nonexistent NXGEST_APPROVED_CONTROLLER="$controller" \
  bash "$tmp/entry.sh" "$sha" "$tmp/image.tar" "$tar" "$zip" "$run" 1 "$artifact" "$policy" "$decision" "$host"
