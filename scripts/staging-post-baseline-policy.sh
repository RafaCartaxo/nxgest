#!/usr/bin/env bash
# Validação de estado local somente leitura; não autentica artifact nem altera recursos.
set -euo pipefail
fail(){ echo 'Política pós-baseline recusada' >&2; exit 1; }
[[ $# == 9 || ( $# == 10 && ${10} == --own-pending ) ]] || fail
phase=${10:-initial}
approved=$1; decision=$2; sha=$3; run=$4; attempt=$5; artifact=$6; zip=$7; tar=$8; host=$9
[[ $approved =~ ^sha256:[a-f0-9]{64}$ && $decision =~ ^[A-Za-z0-9._/-]{1,160}$ && $sha =~ ^[a-f0-9]{40}$ && $run =~ ^[0-9]{1,20}$ && $attempt == 1 && $artifact =~ ^[0-9]{1,20}$ && $zip =~ ^sha256:[a-f0-9]{64}$ && $tar =~ ^sha256:[a-f0-9]{64}$ && $host =~ ^[A-Za-z0-9._-]{1,128}$ ]] || fail
flock -n 9 || fail
[[ $(hostname -s) == "$host" ]] || fail
gitdir=$(git rev-parse --absolute-git-dir) || fail
lockfile=$gitdir/nxgest-deploy.lock
[[ -f $lockfile && ! -L $lockfile && $(stat -c %u "$lockfile") == "$(id -u)" && $(stat -Lc '%d:%i' /proc/self/fd/9) == "$(stat -Lc '%d:%i' "$lockfile")" ]] || fail
secure(){ [[ -f $1 && ! -L $1 && $(stat -c %u "$1") == "$(id -u)" && $(stat -c %a "$1") == 600 && $(stat -c %s "$1") -le 4096 ]]; }
policy=$gitdir/nxgest-staging-post-baseline-policy
if [[ -n ${NXGEST_RECURRING_ENV:-} ]]; then
  source "$(dirname "$0")/recurring-host-policy.sh"
  policy=$(nxgest_operation_policy staging "$policy") || fail
fi
selection=$gitdir/nxgest-staging-selection
marker=$gitdir/nxgest-staging-sha
consumed=$gitdir/nxgest-staging-adoption-consumed
pending=$gitdir/nxgest-staging-pending
if [[ $phase == initial ]]; then
  [[ ! -e $pending && ! -L $pending ]] || fail
else
  secure "$pending" || fail
fi
for f in "$policy" "$selection" "$marker" "$consumed"; do secure "$f" || fail; done
sum=$(sha256sum -- "$policy"); [[ sha256:${sum%% *} == "$approved" ]] || fail
mapfile -t p < "$policy"; mapfile -t s < "$selection"; mapfile -t m < "$marker"; mapfile -t c < "$consumed"
[[ ${#p[@]} == 22 && ${p[0]} == version=staging-post-baseline-v2 && ${p[1]} == environment=staging && ${p[2]} == "host=$host" && ${p[3]} == "decision=$decision" && ${p[4]} =~ ^operation=[a-f0-9]{32}$ && ${p[5]} =~ ^legacy_id=[a-f0-9]{64}$ && ${p[6]} =~ ^legacy_image=sha256:[a-f0-9]{64}$ && ${p[7]} =~ ^previous_sha=[a-f0-9]{40}$ && ${p[8]} =~ ^current_id=[a-f0-9]{64}$ && ${p[9]} =~ ^current_image=sha256:[a-f0-9]{64}$ && ${p[10]} == "sha=$sha" && ${p[11]} == "run=$run" && ${p[12]} == "attempt=$attempt" && ${p[13]} == "artifact=$artifact" && ${p[14]} == "zip=$zip" && ${p[15]} == "tar=$tar" && ${p[16]} =~ ^expires_epoch=[0-9]{10}$ && ${p[17]} =~ ^config_sha256=[a-f0-9]{64}$ && ${p[18]} =~ ^mounts_sha256=[a-f0-9]{64}$ && ${p[19]} =~ ^networks_sha256=[a-f0-9]{64}$ && ${p[20]} =~ ^participants_sha256=[a-f0-9]{64}$ && ${p[21]} =~ ^network_id=[a-f0-9]{64}$ ]] || fail
if [[ $phase == --own-pending ]]; then
  mapfile -t pending_lines < "$pending"
  [[ ${#pending_lines[@]} == 1 && ${pending_lines[0]} == "${p[4]}" ]] || fail
fi
previous=${p[7]#previous_sha=}; current_image=${p[9]#current_image=}
[[ ${#s[@]} == 8 && ${s[0]} == environment=staging && ${s[1]} == "sha=$previous" && ${s[2]} =~ ^run=[0-9]+$ && ${s[3]} == attempt=1 && ${s[4]} =~ ^artifact=[0-9]+$ && ${s[5]} =~ ^zip=sha256:[a-f0-9]{64}$ && ${s[6]} =~ ^tar=sha256:[a-f0-9]{64}$ && ${s[7]} == "image=$current_image" ]] || fail
[[ ${#m[@]} == 1 && ${m[0]} == "$previous" && ${#c[@]} == 1 && ${c[0]} =~ ^operation=[a-f0-9]{32}$ ]] || fail
[[ $(git rev-parse HEAD) == "$previous" ]] || fail
[[ $previous != "$sha" ]] && git merge-base --is-ancestor "$previous" "$sha" || fail
now=$(date +%s); expiry=${p[16]#expires_epoch=}; [[ $now =~ ^[0-9]{10}$ ]] && (( 10#$expiry > 10#$now )) || fail
# Somente identidade aprovada em política: o executor ainda deve observar daemon e health.
printf 'POST_BASELINE_POLICY_VALIDATED\n'
