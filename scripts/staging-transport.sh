#!/usr/bin/env bash
# Chamar somente depois de verificar atestação e política no runner confiável.
set -euo pipefail
file=${1:-}; sha=${2:-}; tar_digest=${3:-}; zip_digest=${4:-}; run=${5:-}; attempt=${6:-}; artifact=${7:-}; host=${8:-}; user=${9:-}; key=${10:-}; known=${11:-}; mode=${12:-staging}; staging_run=${13:-}; image=${14:-}; policy_hash=${15:-}; post_decision=${16:-}; post_host=${17:-}; cd_run=${18:-}; cd_attempt=${19:-}; receipt=${20:-}; runner_controller=${21:-}; runner_build_policy=${22:-}; runner_stage_policy=${23:-}
fail(){ echo 'Transporte staging recusado' >&2; exit 1; }
[[ -f "$file" && ! -L "$file" && "$sha" =~ ^[a-f0-9]{40}$ && "$tar_digest" =~ ^sha256:[a-f0-9]{64}$ && "$zip_digest" =~ ^sha256:[a-f0-9]{64}$ && "$run" =~ ^[0-9]+$ && "$attempt" == 1 && "$artifact" =~ ^[0-9]+$ && "$host" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ && "$user" =~ ^[A-Za-z_][A-Za-z0-9_-]*$ && -f "$key" && ! -L "$key" && -f "$known" && ! -L "$known" ]] || fail
case "$mode" in
 production-post-baseline|production-preclients)
  [[ "$staging_run" =~ ^[0-9]+$ && "$image" =~ ^sha256:[a-f0-9]{64}$ && "$policy_hash" =~ ^sha256:[a-f0-9]{64}$ && "$post_decision" =~ ^[A-Za-z0-9._/-]{1,160}$ && "$post_host" =~ ^[A-Za-z0-9._-]{1,128}$ ]] || fail;;
 production-preclients-finalize|production-initial)
  [[ "$staging_run" =~ ^[0-9]+$ && "$image" =~ ^sha256:[a-f0-9]{64}$ && "$policy_hash" =~ ^sha256:[a-f0-9]{64}$ ]] || fail;;
 production-recurring|production-recurring-finalize)
  [[ "$staging_run" =~ ^[0-9]{1,20}$ && "$image" =~ ^sha256:[a-f0-9]{64}$ && -z "$policy_hash$post_decision$post_host" && "$cd_run" =~ ^[0-9]{1,20}$ && "$cd_attempt" == 1 && "$runner_controller" =~ ^[a-f0-9]{40}$ && "$runner_build_policy" =~ ^sha256:[a-f0-9]{64}$ && "$runner_stage_policy" =~ ^sha256:[a-f0-9]{64}$ && ( "$mode" == production-recurring && "$receipt" == none || "$mode" == production-recurring-finalize && "$receipt" =~ ^sha256:[a-f0-9]{64}$ ) ]] || fail;;
 staging-adoption|staging-post-baseline)
  [[ "$staging_run" =~ ^sha256:[a-f0-9]{64}$ && "$image" =~ ^[A-Za-z0-9._/-]{1,160}$ && "$policy_hash" =~ ^[A-Za-z0-9._-]{1,128}$ ]] || fail;;
 staging-recurring-v2)
  [[ -z "$staging_run$image$policy_hash$post_decision$post_host$cd_run$cd_attempt$receipt" && "$runner_controller" =~ ^[a-f0-9]{40}$ && "$runner_build_policy" =~ ^sha256:[a-f0-9]{64}$ && "$runner_stage_policy" == none ]] || fail;;
 staging-recurring)
  [[ -z "$staging_run$image$policy_hash$post_decision$post_host" ]] || fail;;
 staging) ;;
 *) fail;;
esac
[[ "$(wc -l < "$known")" -eq 1 ]] || fail
IFS=' ' read -r known_alias known_rest < "$known" || fail
[[ $known_alias == nxgest-staging ]] || fail
key_description=$(ssh-keygen -lf "$known" -E sha256) || fail
IFS=' ' read -r key_bits fingerprint key_rest <<< "$key_description" || fail
[[ $fingerprint == 'SHA256:9mo2a7iYwuHEHlO7SyeHFhwatAv6Hf0yY4yUDhpbPrc' ]] || fail
actual=$(sha256sum -- "$file");actual=${actual%% *};[[ "sha256:$actual" == "$tar_digest" ]] || fail
if [[ "$mode" == staging-recurring-v2 || "$mode" == production-recurring || "$mode" == production-recurring-finalize ]]; then
  environment=production; phase=apply
  if [[ "$mode" == staging-recurring-v2 ]]; then environment=staging; staging_run=0; image=none; cd_run=0; cd_attempt=1; receipt=none; fi
  [[ "$mode" != production-recurring-finalize ]] || phase=finalize
  { printf 'version=recurring-selection-v1\ncontroller=%s\nenvironment=%s\nphase=%s\nsha=%s\ntar=%s\nzip=%s\nci_run=%s\nci_attempt=1\nartifact=%s\nstaging_run=%s\nimage=%s\ncd_run=%s\ncd_attempt=1\nreceipt=%s\nbuild_policy=%s\nstaging_policy=%s\nend=selection\n' "$runner_controller" "$environment" "$phase" "$sha" "$tar_digest" "$zip_digest" "$run" "$artifact" "$staging_run" "$image" "$cd_run" "$receipt" "$runner_build_policy" "$runner_stage_policy"; if [[ $phase == apply ]]; then cat -- "$file"; fi; } |
    ssh -T -o BatchMode=yes -o StrictHostKeyChecking=yes -o HostKeyAlias=nxgest-staging -o UserKnownHostsFile="$known" -o GlobalKnownHostsFile=/dev/null -o IdentitiesOnly=yes -i "$key" "$user@$host" "nxgest-recurring-$environment-v2"
  exit $?
fi
if [[ "$mode" == staging-recurring ]]; then
  { printf 'sha=%s\ntar=%s\nzip=%s\nrun=%s\nattempt=1\nartifact=%s\nend=selection\n' "$sha" "$tar_digest" "$zip_digest" "$run" "$artifact"; cat -- "$file"; } |
    ssh -T -o BatchMode=yes -o StrictHostKeyChecking=yes -o HostKeyAlias=nxgest-staging -o UserKnownHostsFile="$known" -o GlobalKnownHostsFile=/dev/null -o IdentitiesOnly=yes -i "$key" "$user@$host" nxgest-recurring-staging-v1
  exit $?
fi
if [[ "$mode" == production-preclients-finalize ]]; then
  remote_finish='set -euo pipefail
cd /opt/nxgestao
lock=$(git rev-parse --git-path nxgest-deploy.lock)
[ -f "$lock" ] && [ ! -L "$lock" ] || exit 1
exec 9<>"$lock"
flock -n 9 || exit 1
[ "$(git rev-parse HEAD)" = "$1" ] || exit 1
git show "$1:scripts/production-preclients-finalize.sh" | bash -s -- "$1" "$2" "$3" "$4"'
  printf -v command 'bash -c %q _ %q %q %q %q' "$remote_finish" "$sha" "$image" "$staging_run" "$policy_hash"
  ssh -T -o BatchMode=yes -o StrictHostKeyChecking=yes -o HostKeyAlias=nxgest-staging -o UserKnownHostsFile="$known" -o GlobalKnownHostsFile=/dev/null -o IdentitiesOnly=yes -i "$key" "$user@$host" "$command" </dev/null
  exit $?
fi
if [[ "$mode" == production-post-baseline ]]; then
  # Sem incoming, fetch, load, checkout ou mutação de serviço antes do gate BA10.
  remote_post='set -euo pipefail
cd /opt/nxgestao
lock=$(git rev-parse --git-path nxgest-deploy.lock)
[ -f "$lock" ] && [ ! -L "$lock" ] || exit 1
exec 9<>"$lock"
flock -n 9 || exit 1
git cat-file -e "$1^{commit}" || exit 1
git show "$1:scripts/production-post-baseline-preflight.sh" | bash -s -- "$8" "$9" "$1" "$4" "$5" "$6" "$3" "$2" "${10}" "${11}" "${12}"'
  printf -v command 'bash -c %q _ %q %q %q %q %q %q %q %q %q %q %q %q' "$remote_post" "$sha" "$tar_digest" "$zip_digest" "$run" "$attempt" "$artifact" "$mode" "$policy_hash" "$post_decision" "$image" "$staging_run" "$post_host"
  ssh -T -o BatchMode=yes -o StrictHostKeyChecking=yes -o HostKeyAlias=nxgest-staging -o UserKnownHostsFile="$known" -o GlobalKnownHostsFile=/dev/null -o IdentitiesOnly=yes -i "$key" "$user@$host" "$command" </dev/null
  exit $?
fi
remote='set -euo pipefail
cd /opt/nxgestao
exec 9>"$(git rev-parse --git-path nxgest-deploy.lock)"
flock -n 9 || exit 1
incoming_dir=$(git rev-parse --git-path nxgest-staging-incoming)
if [ ! -e "$incoming_dir" ]; then mkdir -m 700 "$incoming_dir"; fi
[ -d "$incoming_dir" ] && [ ! -L "$incoming_dir" ] && [ "$(stat -c %u "$incoming_dir")" = "$(id -u)" ] && [ "$(stat -c %a "$incoming_dir")" = 700 ] || exit 1
incoming=$(mktemp "$incoming_dir/artifact.XXXXXXXX")
trap '\''rm -f -- "$incoming"'\'' EXIT
cat > "$incoming"
actual=$(sha256sum -- "$incoming"); actual=${actual%% *}; [ "sha256:$actual" = "$2" ] || exit 1
if ! git cat-file -e "$1^{commit}" 2>/dev/null; then git fetch --no-tags origin "$1" >/dev/null 2>&1 || { echo "fetch falhou" >&2; exit 1; }; fi
if [ "$7" = staging ]; then
  git show "$1:scripts/deploy-bootstrap.sh" | bash -s -- staging "$1" "$incoming" "$2" "$3" "$4" "$5" "$6"
elif [ "$7" = staging-adoption ]; then
  git show "$1:scripts/deploy-bootstrap.sh" | bash -s -- staging-adoption "$1" "$incoming" "$2" "$3" "$4" "$5" "$6" "$8" "$9" "${10}"
elif [ "$7" = staging-post-baseline ]; then
  git show "$1:scripts/staging-post-baseline-entry.sh" | bash -s -- "$1" "$incoming" "$2" "$3" "$4" "$5" "$6" "$8" "$9" "${10}"
elif [ "$7" = production-preclients ]; then
  git show "$1:scripts/deploy-bootstrap.sh" | bash -s -- production-preclients "$1" "$incoming" "$2" "$3" "$4" "$5" "$6" "$8" "$9" "${10}" "${11}" "${12}"
else
  git show "$1:scripts/deploy-bootstrap.sh" | bash -s -- production-initial "$1" "$incoming" "$2" "$3" "$4" "$6" "$8" "$9" "${10}"
fi'
printf -v command 'bash -c %q _ %q %q %q %q %q %q %q %q %q %q %q %q' "$remote" "$sha" "$tar_digest" "$zip_digest" "$run" "$attempt" "$artifact" "$mode" "$staging_run" "$image" "$policy_hash" "$post_decision" "$post_host"
ssh -T -o BatchMode=yes -o StrictHostKeyChecking=yes -o HostKeyAlias=nxgest-staging -o UserKnownHostsFile="$known" -o GlobalKnownHostsFile=/dev/null -o IdentitiesOnly=yes -i "$key" "$user@$host" "$command" < "$file"
