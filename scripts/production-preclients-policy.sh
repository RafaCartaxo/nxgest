#!/usr/bin/env bash
# Valida somente política e estado local; não autoriza por si só uma troca.
set -euo pipefail
fail(){ echo 'Política pré-clientes recusada' >&2; exit 1; }
[[ $# == 11 ]] || fail
approved=$1; decision=$2; sha=$3; run=$4; attempt=$5; artifact=$6; zip=$7; tar=$8; image=$9; staging=${10}; host=${11}
[[ $approved =~ ^sha256:[a-f0-9]{64}$ && $decision =~ ^[A-Za-z0-9._/-]{1,160}$ && $sha =~ ^[a-f0-9]{40}$ && $run =~ ^[0-9]{1,20}$ && $attempt == 1 && $artifact =~ ^[0-9]{1,20}$ && $zip =~ ^sha256:[a-f0-9]{64}$ && $tar =~ ^sha256:[a-f0-9]{64}$ && $image =~ ^sha256:[a-f0-9]{64}$ && $staging =~ ^[0-9]{1,20}$ && $host =~ ^[A-Za-z0-9._-]{1,128}$ ]] || fail
flock -n 9 || fail
[[ $(hostname -s) == "$host" ]] || fail
gitdir=$(git rev-parse --absolute-git-dir) || fail
owner=$(id -u); lock=$gitdir/nxgest-deploy.lock
[[ -d $gitdir && ! -L $gitdir && $(stat -c %u "$gitdir") == "$owner" && -f $lock && ! -L $lock && $(stat -c %u "$lock") == "$owner" && $(stat -Lc '%d:%i' /proc/self/fd/9) == "$(stat -Lc '%d:%i' "$lock")" ]] || fail
for path in "$gitdir" "$lock"; do
  mode=$(stat -c %a "$path") || fail
  [[ $mode =~ ^[0-7]{3,4}$ ]] && (( (8#$mode & 8#7022) == 0 )) || fail
done
secure(){ [[ -f $1 && ! -L $1 && $(stat -c %u "$1") == "$owner" && $(stat -c %a "$1") == 600 && $(stat -c %s "$1") -le 4096 ]]; }
policy=$gitdir/nxgest-production-preclients-policy; baseline=$gitdir/nxgest-baseline-established; selection=$gitdir/nxgest-production-selection; marker=$gitdir/nxgest-production-sha; staging_state=$gitdir/nxgest-staging-selection; staging_marker=$gitdir/nxgest-staging-sha
if [[ -n ${NXGEST_RECURRING_ENV:-} ]]; then
  source "$(dirname "$0")/recurring-host-policy.sh"
  policy=$(nxgest_operation_policy production "$policy") || fail
fi
for n in nxgest-baseline-pending nxgest-production-pending nxgest-staging-pending; do [[ ! -e $gitdir/$n && ! -L $gitdir/$n ]] || fail; done
for f in "$policy" "$baseline" "$staging_state" "$staging_marker"; do secure "$f" || fail; done
sum=$(sha256sum -- "$policy"); [[ sha256:${sum%% *} == "$approved" ]] || fail
mapfile -t p < "$policy"; mapfile -t b < "$baseline"; mapfile -t s < "$staging_state"; mapfile -t m < "$staging_marker"
[[ ${#p[@]} == 15 && ${p[0]} == version=production-preclients-v1 && ${p[1]} == environment=production && ${p[2]} == "host=$host" && ${p[3]} == "decision=$decision" && ${p[4]} == no_clients=yes && ${p[5]} =~ ^previous_sha=[a-f0-9]{40}$ && ${p[6]} == "sha=$sha" && ${p[7]} == "ci_run=$run" && ${p[8]} == "attempt=$attempt" && ${p[9]} == "artifact=$artifact" && ${p[10]} == "zip=$zip" && ${p[11]} == "tar=$tar" && ${p[12]} == "image=$image" && ${p[13]} == "staging_run=$staging" && ${p[14]} =~ ^expires_epoch=[0-9]{10}$ ]] || fail
previous=${p[5]#previous_sha=}
[[ ${#b[@]} == 8 && ${b[0]} == version=first-baseline-v1 && ${b[1]} =~ ^sha=[a-f0-9]{40}$ && ${b[2]} =~ ^tar=sha256:[a-f0-9]{64}$ && ${b[3]} =~ ^zip=sha256:[a-f0-9]{64}$ && ${b[4]} =~ ^ci_run=[0-9]+$ && ${b[5]} =~ ^artifact=[0-9]+$ && ${b[6]} =~ ^staging_run=[0-9]+$ && ${b[7]} =~ ^image=sha256:[a-f0-9]{64}$ ]] || fail
if [[ -e $selection || -L $selection || -e $marker || -L $marker ]]; then
  secure "$selection" && secure "$marker" || fail
  mapfile -t current < "$selection"; mapfile -t prod_marker < "$marker"
  [[ ${#current[@]} == 8 && ${current[0]} == version=production-preclients-v1 && ${current[1]} == "sha=$previous" && ${current[2]} =~ ^tar=sha256:[a-f0-9]{64}$ && ${current[3]} =~ ^zip=sha256:[a-f0-9]{64}$ && ${current[4]} =~ ^ci_run=[0-9]+$ && ${current[5]} =~ ^artifact=[0-9]+$ && ${current[6]} =~ ^staging_run=[0-9]+$ && ${current[7]} =~ ^image=sha256:[a-f0-9]{64}$ && ${#prod_marker[@]} == 1 && ${prod_marker[0]} == "$previous" ]] || fail
else
  [[ ${b[1]} == "sha=$previous" ]] || fail
fi
[[ ${#s[@]} == 8 && ${s[0]} == environment=staging && ${s[1]} == "sha=$sha" && ${s[2]} == "run=$run" && ${s[3]} == "attempt=$attempt" && ${s[4]} == "artifact=$artifact" && ${s[5]} == "zip=$zip" && ${s[6]} == "tar=$tar" && ${s[7]} == "image=$image" && ${#m[@]} == 1 && ${m[0]} == "$sha" ]] || fail
[[ $previous != "$sha" ]] && git merge-base --is-ancestor "$previous" "$sha" || fail
now=$(date +%s); expires=${p[14]#expires_epoch=}; [[ $now =~ ^[0-9]{10}$ ]] && (( 10#$expires > 10#$now )) || fail
printf 'PRECLIENTS_POLICY_ONLY previous=%s\n' "$previous"
