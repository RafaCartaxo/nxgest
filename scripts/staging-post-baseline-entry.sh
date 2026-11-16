#!/usr/bin/env bash
# Entrada remota somente após verificação criptográfica no runner confiável.
set -euo pipefail
umask 077
fail(){ echo 'Entrada pós-baseline recusada; preservar pending se criado' >&2; exit 1; }
[[ $# == 10 ]] || fail
sha=$1; image_file=$2; tar=$3; zip=$4; run=$5; attempt=$6; artifact=$7; policy_hash=$8; decision=$9; host=${10}
[[ $sha =~ ^[a-f0-9]{40}$ && $tar =~ ^sha256:[a-f0-9]{64}$ && $zip =~ ^sha256:[a-f0-9]{64}$ && -f $image_file && ! -L $image_file ]] || fail
flock -n 9 || fail
[[ -z $(git status --porcelain --untracked-files=all) ]] || fail
gitdir=$(git rev-parse --absolute-git-dir) || fail
[[ -d $gitdir && ! -L $gitdir && $(stat -c %u "$gitdir") == "$(id -u)" ]] || fail
controller=$sha
if [[ -n ${NXGEST_APPROVED_CONTROLLER:-} ]]; then
  authority=$gitdir/nxgest-recurring-staging-authority
  [[ $NXGEST_APPROVED_CONTROLLER =~ ^[a-f0-9]{40}$ && -f $authority && ! -L $authority && $(stat -c %u "$authority") == "$(id -u)" && $(stat -c %a "$authority") == 600 && $(stat -c %s "$authority") -le 4096 ]] || fail
  mapfile -t authority_lines < "$authority"
  [[ ( ${#authority_lines[@]} == 7 && ${authority_lines[0]} == version=recurring-staging-authority-v1 || ${#authority_lines[@]} == 8 && ${authority_lines[0]} == version=recurring-authority-v2 && ${NXGEST_RECURRING_ENV:-} == staging && ${authority_lines[7]} == "peer=${NXGEST_RECURRING_PEER:-}" ) && ${authority_lines[1]} == environment=staging && ${authority_lines[2]} == "host=$(hostname -s)" && ${authority_lines[3]} == "controller=$NXGEST_APPROVED_CONTROLLER" && ${authority_lines[6]} =~ ^expires_epoch=([0-9]{10})$ ]] || fail
  expiry=${BASH_REMATCH[1]}; now=$(date +%s); (( 10#$expiry > 10#$now )) || fail
  controller=$NXGEST_APPROVED_CONTROLLER
fi
actual=$(sha256sum -- "$image_file"); [[ sha256:${actual%% *} == "$tar" ]] || fail
# No modo recorrente os scripts vêm do controlador fixado, não do candidato.
files=(host-jq.sh load-verified-image.sh retain-verified-image.sh container-health.sh staging-post-baseline-policy.sh staging-post-baseline-resources.sh staging-post-baseline-observe.sh staging-post-baseline-capsule.sh staging-post-baseline-execute.sh staging-post-baseline-retry.sh)
[[ -z ${NXGEST_RECURRING_ENV:-} ]] || files+=(recurring-host-policy.sh)
tmp=$(mktemp -d "$gitdir/nxgest-post-controller.XXXXXXXX") || fail
cleanup(){ for name in "${files[@]}"; do rm -f -- "$tmp/$name"; done; rmdir -- "$tmp" 2>/dev/null || :; }
trap cleanup EXIT
for name in "${files[@]}"; do git show "$controller:scripts/$name" > "$tmp/$name" || fail; [[ -s $tmp/$name && ! -L $tmp/$name ]] || fail; done
if [[ ${NXGEST_RECURRING_ENV:-} == staging ]]; then
  prepared=$(bash "$tmp/recurring-host-policy.sh" staging "$sha" "$tar" "$zip" "$run" "$attempt" "$artifact") || fail
  mapfile -t transaction <<< "$prepared"
  [[ ${#transaction[@]} == 2 && ${transaction[1]} =~ ^sha256:[a-f0-9]{64}$ ]] || fail
  export NXGEST_OPERATION_POLICY=${transaction[0]}
  policy_hash=${transaction[1]}
fi
args=("$policy_hash" "$decision" "$sha" "$run" "$attempt" "$artifact" "$zip" "$tar" "$host")
marker=$gitdir/nxgest-staging-sha
if [[ -f $marker && ! -L $marker && $(cat "$marker") == "$sha" ]]; then
  bash "$tmp/staging-post-baseline-retry.sh" "${args[@]}"
  exit $?
fi
bash "$tmp/staging-post-baseline-observe.sh" "${args[@]}" >/dev/null || fail
expected=$(bash "$tmp/load-verified-image.sh" "$image_file" "$tar" "$sha" --preflight) || fail
[[ $expected =~ ^sha256:[a-f0-9]{64}$ ]] || fail
bash "$tmp/staging-post-baseline-policy.sh" "${args[@]}" >/dev/null || fail
mapfile -t p < "${NXGEST_OPERATION_POLICY:-$gitdir/nxgest-staging-post-baseline-policy}"; [[ ${#p[@]} == 22 ]] || fail
op=${p[4]#operation=}; [[ $op =~ ^[a-f0-9]{32}$ ]] || fail
pending=$gitdir/nxgest-staging-pending
load_journal=$gitdir/nxgest-post-baseline-load-$op
# A reserva e o journal pertencem apenas a esta operação; nunca sobrescrever.
( set -C; printf 'version=post-baseline-load-v1\noperation=%s\nsha=%s\ntar=%s\nexpected_image=%s\nphase=reservation-requested\n' "$op" "$sha" "$tar" "$expected" > "$load_journal" ) || fail
if [[ ${NXGEST_RECURRING_ENV:-} == staging ]]; then
  source "$tmp/recurring-host-policy.sh"; nxgest_recurring_context staging || fail
  printf 'base_policy_sha256=%s\noperation_policy_sha256=%s\n' "$NXGEST_BASE_HASH" "$policy_hash" >> "$load_journal" || fail
fi
( set -C; printf 'operation=%s\n' "$op" > "$pending" ) || fail
printf 'phase=reserved\n' >> "$load_journal" || fail
# A partir daqui, qualquer interrupção deixa pending; não repetir load cegamente.
bash "$tmp/staging-post-baseline-policy.sh" "${args[@]}" --own-pending >/dev/null || fail
printf 'phase=load-requested\n' >> "$load_journal" || fail
image=$(bash "$tmp/load-verified-image.sh" "$image_file" "$tar" "$sha") || fail
[[ $image == "$expected" ]] || fail
printf 'phase=load-confirmed\n' >> "$load_journal" || fail
bash "$tmp/staging-post-baseline-capsule.sh" "${args[@]}" "$image" --own-pending >/dev/null || fail
bash "$tmp/staging-post-baseline-execute.sh" "${args[@]}" "$image" --own-pending
