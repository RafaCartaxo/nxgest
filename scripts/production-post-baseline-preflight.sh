#!/usr/bin/env bash
# Leitura local sob lock; verificação de origem é responsabilidade do runner autenticado.
# Jamais autoriza efeitos: BA10/rollback operacional ainda não está disponível.
set -euo pipefail
fail(){ echo 'Preflight de produção posterior recusado' >&2; exit 1; }
[[ $# == 11 ]] || fail
approved=$1; decision=$2; sha=$3; run=$4; attempt=$5; artifact=$6; zip=$7; tar=$8; image=$9; staging=${10}; host=${11}
[[ $approved =~ ^sha256:[a-f0-9]{64}$ && $decision =~ ^[A-Za-z0-9._/-]{1,160}$ && $sha =~ ^[a-f0-9]{40}$ && $run =~ ^[0-9]{1,20}$ && $attempt == 1 && $artifact =~ ^[0-9]{1,20}$ && $zip =~ ^sha256:[a-f0-9]{64}$ && $tar =~ ^sha256:[a-f0-9]{64}$ && $image =~ ^sha256:[a-f0-9]{64}$ && $staging =~ ^[0-9]{1,20}$ && $host =~ ^[A-Za-z0-9._-]{1,128}$ ]] || fail
flock -n 9 || fail
[[ $(hostname -s) == "$host" ]] || fail
gitdir=$(git rev-parse --absolute-git-dir) || fail
lock=$gitdir/nxgest-deploy.lock
[[ -f $lock && ! -L $lock && $(stat -c %u "$lock") == "$(id -u)" && $(stat -Lc '%d:%i' /proc/self/fd/9) == "$(stat -Lc '%d:%i' "$lock")" ]] || fail
secure(){ [[ -f $1 && ! -L $1 && $(stat -c %u "$1") == "$(id -u)" && $(stat -c %a "$1") == 600 && $(stat -c %s "$1") -le 4096 ]]; }
policy=$gitdir/nxgest-production-post-policy; baseline=$gitdir/nxgest-baseline-established; state=$gitdir/nxgest-staging-selection; marker=$gitdir/nxgest-staging-sha
for n in nxgest-baseline-pending nxgest-production-pending nxgest-staging-pending; do [[ ! -e $gitdir/$n && ! -L $gitdir/$n ]] || fail; done
for f in "$policy" "$baseline" "$state" "$marker"; do secure "$f" || fail; done
sum=$(sha256sum -- "$policy"); [[ sha256:${sum%% *} == "$approved" ]] || fail
mapfile -t p < "$policy"; mapfile -t b < "$baseline"; mapfile -t s < "$state"; mapfile -t m < "$marker"
[[ ${#p[@]} == 14 && ${p[0]} == version=production-post-baseline-v1 && ${p[1]} == environment=production && ${p[2]} == "host=$host" && ${p[3]} == "decision=$decision" && ${p[4]} =~ ^previous_sha=[a-f0-9]{40}$ && ${p[5]} == "sha=$sha" && ${p[6]} == "ci_run=$run" && ${p[7]} == "attempt=$attempt" && ${p[8]} == "artifact=$artifact" && ${p[9]} == "zip=$zip" && ${p[10]} == "tar=$tar" && ${p[11]} == "image=$image" && ${p[12]} == "staging_run=$staging" && ${p[13]} =~ ^expires_epoch=[0-9]{10}$ ]] || fail
previous=${p[4]#previous_sha=}
[[ ${#b[@]} == 8 && ${b[0]} == version=first-baseline-v1 && ${b[1]} == "sha=$previous" && ${b[2]} =~ ^tar=sha256:[a-f0-9]{64}$ && ${b[3]} =~ ^zip=sha256:[a-f0-9]{64}$ && ${b[4]} =~ ^ci_run=[0-9]+$ && ${b[5]} =~ ^artifact=[0-9]+$ && ${b[6]} =~ ^staging_run=[0-9]+$ && ${b[7]} =~ ^image=sha256:[a-f0-9]{64}$ ]] || fail
[[ ${#s[@]} == 8 && ${s[0]} == environment=staging && ${s[1]} == "sha=$sha" && ${s[2]} == "run=$run" && ${s[3]} == "attempt=$attempt" && ${s[4]} == "artifact=$artifact" && ${s[5]} == "zip=$zip" && ${s[6]} == "tar=$tar" && ${s[7]} == "image=$image" && ${#m[@]} == 1 && ${m[0]} == "$sha" ]] || fail
[[ $previous != "$sha" ]] && git merge-base --is-ancestor "$previous" "$sha" || fail
now=$(date +%s); expires=${p[13]#expires_epoch=}; [[ $now =~ ^[0-9]{10}$ ]] && (( 10#$expires > 10#$now )) || fail
# Nenhum arquivo de texto, comprovante sintético ou argumento permite superar este gate.
echo 'NO-GO: BA10 e rollback operacionais verificáveis indisponíveis' >&2
exit 78
