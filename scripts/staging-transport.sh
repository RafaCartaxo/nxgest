#!/usr/bin/env bash
# Chamar somente depois de verificar atestação e política no runner confiável.
set -euo pipefail
file=${1:-}; sha=${2:-}; tar_digest=${3:-}; zip_digest=${4:-}; run=${5:-}; attempt=${6:-}; artifact=${7:-}; host=${8:-}; user=${9:-}; key=${10:-}; known=${11:-}; mode=${12:-staging}; staging_run=${13:-}; image=${14:-}; policy_hash=${15:-}
fail(){ echo 'Transporte staging recusado' >&2; exit 1; }
[[ -f "$file" && ! -L "$file" && "$sha" =~ ^[a-f0-9]{40}$ && "$tar_digest" =~ ^sha256:[a-f0-9]{64}$ && "$zip_digest" =~ ^sha256:[a-f0-9]{64}$ && "$run" =~ ^[0-9]+$ && "$attempt" == 1 && "$artifact" =~ ^[0-9]+$ && "$host" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ && "$user" =~ ^[A-Za-z_][A-Za-z0-9_-]*$ && -f "$key" && ! -L "$key" && -f "$known" && ! -L "$known" ]] || fail
if [[ "$mode" == production-initial ]]; then [[ "$staging_run" =~ ^[0-9]+$ && "$image" =~ ^sha256:[a-f0-9]{64}$ && "$policy_hash" =~ ^sha256:[a-f0-9]{64}$ ]] || fail; elif [[ "$mode" == staging-adoption ]]; then [[ "$staging_run" =~ ^sha256:[a-f0-9]{64}$ && "$image" =~ ^[A-Za-z0-9._/-]{1,160}$ && "$policy_hash" =~ ^[A-Za-z0-9._-]{1,128}$ ]] || fail; elif [[ "$mode" != staging ]]; then fail; fi
[[ "$(wc -l < "$known")" -eq 1 ]] || fail
[[ "$(awk '{print $1}' "$known")" == nxgest-staging ]] || fail
[[ "$(ssh-keygen -lf "$known" -E sha256 | awk '{print $2}')" == 'SHA256:9mo2a7iYwuHEHlO7SyeHFhwatAv6Hf0yY4yUDhpbPrc' ]] || fail
actual=$(sha256sum -- "$file");actual=${actual%% *};[[ "sha256:$actual" == "$tar_digest" ]] || fail
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
else
  git show "$1:scripts/deploy-bootstrap.sh" | bash -s -- production-initial "$1" "$incoming" "$2" "$3" "$4" "$6" "$8" "$9" "${10}"
fi'
printf -v command 'bash -c %q _ %q %q %q %q %q %q %q %q %q %q' "$remote" "$sha" "$tar_digest" "$zip_digest" "$run" "$attempt" "$artifact" "$mode" "$staging_run" "$image" "$policy_hash"
ssh -T -o BatchMode=yes -o StrictHostKeyChecking=yes -o HostKeyAlias=nxgest-staging -o UserKnownHostsFile="$known" -o GlobalKnownHostsFile=/dev/null -o IdentitiesOnly=yes -i "$key" "$user@$host" "$command" < "$file"
