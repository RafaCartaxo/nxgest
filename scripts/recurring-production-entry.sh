#!/usr/bin/env bash
# Executed only by the fixed gateway/controller, not by candidate checkout code.
set -euo pipefail
umask 077
fail(){ echo 'Produção recorrente recusada; preservar estado para reparo' >&2; exit 1; }
[[ $# == 13 && ${NXGEST_RECURRING_ENV:-} == production && ${NXGEST_APPROVED_CONTROLLER:-} =~ ^[a-f0-9]{40}$ ]] || fail
phase=$1; sha=$2; file=$3; tar=$4; zip=$5; run=$6; attempt=$7; artifact=$8; stage=$9; image=${10}; cd_run=${11}; cd_attempt=${12}; receipt=${13}
[[ ( $phase == apply || $phase == finalize ) && $sha =~ ^[a-f0-9]{40}$ && $tar =~ ^sha256:[a-f0-9]{64}$ && $zip =~ ^sha256:[a-f0-9]{64}$ && $run =~ ^[0-9]{1,20}$ && $attempt == 1 && $artifact =~ ^[0-9]{1,20}$ && $stage =~ ^[0-9]{1,20}$ && $image =~ ^sha256:[a-f0-9]{64}$ && $cd_run =~ ^[0-9]{1,20}$ && $cd_attempt == 1 ]] || fail
flock -n 9 || fail
gitdir=$(git rev-parse --absolute-git-dir); [[ -z $(git status --porcelain --untracked-files=all) ]] || fail
files=(host-jq.sh recurring-host-policy.sh load-verified-image.sh retain-verified-image.sh container-health.sh production-preclients.sh production-preclients-policy.sh production-preclients-finalize.sh)
tmp=$(mktemp -d "$gitdir/nxgest-production-controller.XXXXXXXX") || fail
cleanup(){ for f in "${files[@]}" docker-compose.prod.yml; do rm -f -- "$tmp/$f"; done; rmdir -- "$tmp" 2>/dev/null || :; }
trap cleanup EXIT
for f in "${files[@]}"; do git show "$NXGEST_APPROVED_CONTROLLER:scripts/$f" > "$tmp/$f" || fail; [[ -s $tmp/$f && ! -L $tmp/$f ]] || fail; done
git show "$NXGEST_APPROVED_CONTROLLER:infra/docker-compose.prod.yml" > "$tmp/docker-compose.prod.yml" || fail
source "$tmp/recurring-host-policy.sh"; nxgest_recurring_context production || fail
active=$gitdir/nxgest-recurring-production-active
record=$(printf 'version=recurring-production-v1\ncontroller=%s\nbase=%s\nsha=%s\ntar=%s\nzip=%s\nci_run=%s\nattempt=1\nartifact=%s\nstaging_run=%s\nimage=%s\ncd_run=%s\ncd_attempt=1' "$NXGEST_APPROVED_CONTROLLER" "$NXGEST_BASE_HASH" "$sha" "$tar" "$zip" "$run" "$artifact" "$stage" "$image" "$cd_run")
if [[ $phase == apply ]]; then
  [[ $receipt == none && ! -e $active && ! -L $active && -f $file && ! -L $file ]] || fail
  actual=$(sha256sum -- "$file"); [[ sha256:${actual%% *} == "$tar" ]] || fail
  prepared=$(bash "$tmp/recurring-host-policy.sh" production "$sha" "$tar" "$zip" "$run" "$attempt" "$artifact" "$image" "$stage") || fail
  mapfile -t tx <<< "$prepared"; [[ ${#tx[@]} == 2 && ${tx[1]} =~ ^sha256:[a-f0-9]{64}$ ]] || fail
  export NXGEST_OPERATION_POLICY=${tx[0]}
  # Validate the generated transaction against stable authority and actual staging.
  bash "$tmp/production-preclients-policy.sh" "${tx[1]}" "$NXGEST_BASE_DECISION" "$sha" "$run" 1 "$artifact" "$zip" "$tar" "$image" "$stage" "$NXGEST_BASE_HOST" >/dev/null || fail
  [[ $(bash "$tmp/load-verified-image.sh" "$file" "$tar" "$sha" --preflight) == "$image" ]] || fail
  (set -C; printf '%s\noperation_policy=%s\noperation_hash=%s\n' "$record" "${tx[0]}" "${tx[1]}" > "$active") || fail
  sync -f "$active"; sync -f "$gitdir"
  git checkout --detach --no-overwrite-ignore "$sha" >/dev/null || fail
  export NXGEST_DEPLOY_MODE=production-preclients NXGEST_DEPLOY_SHA=$sha
  bash "$tmp/production-preclients.sh" "$sha" "$file" "$tar" "$zip" "$run" 1 "$artifact" "$stage" "$image" "${tx[1]}" "$NXGEST_BASE_DECISION" "$NXGEST_BASE_HOST"
else
  [[ $receipt =~ ^sha256:[a-f0-9]{64}$ && $(git rev-parse HEAD) == "$sha" ]] || fail
  nxgest_secure_file "$active" 8192 || fail
  mapfile -t lines < "$active"
  [[ ${#lines[@]} == 15 && $(printf '%s\n' "${lines[@]:0:13}") == "$record" && ${lines[13]} == operation_policy=* && ${lines[14]} =~ ^operation_hash=sha256:[a-f0-9]{64}$ ]] || fail
  export NXGEST_OPERATION_POLICY=${lines[13]#operation_policy=}
  policy=$(nxgest_operation_policy production "$gitdir/nxgest-production-preclients-policy") || fail
  actual=$(sha256sum -- "$policy"); [[ sha256:${actual%% *} == "${lines[14]#operation_hash=}" ]] || fail
  # Recheck stable authorization, then trust the protected runner's successful
  # receipt attestation/upload ordering; no JSON here authenticates GH itself.
  nxgest_recurring_context production || fail
  nxgest_secure_file .env 1048576 || fail
  envsum=$(sha256sum .env); compose_sum=$(sha256sum "$tmp/docker-compose.prod.yml")
  [[ ${envsum%% *} == "$("$NXGEST_JQ" -r '.topology.envSha256' "$NXGEST_BASE_FILE")" && ${compose_sum%% *} == "$("$NXGEST_JQ" -r '.topology.composeSha256' "$NXGEST_BASE_FILE")" ]] || fail
  NXGEST_PREVIOUS_ID=$(nxgest_inspect '{{.Id}}' nxgestao-app-1); NXGEST_PREVIOUS_IMAGE=$image
  [[ $NXGEST_PREVIOUS_ID =~ ^[a-f0-9]{64}$ && $(nxgest_inspect '{{.Image}}' "$NXGEST_PREVIOUS_ID") == "$image" ]] || fail
  nxgest_production_topology "$NXGEST_PREVIOUS_ID" || fail
  nxgest_participants >/dev/null || fail
  finalized=$(bash "$tmp/production-preclients-finalize.sh" "$sha" "$image" "$cd_run" "$receipt") || fail
  archive=$gitdir/nxgest-recurring-production-finished-$sha-$cd_run
  [[ ! -e $archive && ! -L $archive ]] || fail
  ln -- "$active" "$archive"; sync -f "$gitdir"
  [[ $(stat -c '%d:%i' "$active") == "$(stat -c '%d:%i' "$archive")" ]] || fail
  rm -- "$active"; sync -f "$gitdir"
  printf '%s\n' "$finalized"
fi
