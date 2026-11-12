#!/usr/bin/env bash
# Validação somente leitura; política fora do artefato, hash e decisão separados.
set -euo pipefail
fail(){ echo 'Política de adoção recusada' >&2; exit 1; }
[[ $# == 9 ]] || fail
approved=$1; decision=$2; sha=$3; run=$4; attempt=$5; artifact=$6; zip=$7; tar=$8; host=$9
[[ "$approved" =~ ^sha256:[a-f0-9]{64}$ && "$decision" =~ ^[A-Za-z0-9._/-]{1,160}$ && "$sha" =~ ^[a-f0-9]{40}$ && "$run" =~ ^[0-9]{1,20}$ && "$attempt" == 1 && "$artifact" =~ ^[0-9]{1,20}$ && "$zip" =~ ^sha256:[a-f0-9]{64}$ && "$tar" =~ ^sha256:[a-f0-9]{64}$ && "$host" =~ ^[A-Za-z0-9._-]{1,128}$ ]] || fail
flock -n 9 || fail
[[ "$(hostname -s)" == "$host" ]] || fail
file=$(git rev-parse --git-path nxgest-staging-adoption-policy) || fail
[[ -f "$file" && ! -L "$file" && $(stat -c %u "$file") == "$(id -u)" && $(stat -c %a "$file") == 600 && $(stat -c %s "$file") -le 4096 ]] || fail
sum=$(sha256sum -- "$file") || fail; sum=${sum%% *}; [[ "sha256:$sum" == "$approved" ]] || fail
mapfile -t a < "$file"
[[ ${#a[@]} == 17 && "${a[0]}" == version=staging-adoption-v1 && "${a[1]}" == environment=staging && "${a[2]}" == "host=$host" && "${a[3]}" == "decision=$decision" && "${a[4]}" =~ ^operation=[a-f0-9]{32}$ && "${a[5]}" =~ ^legacy_id=[a-f0-9]{64}$ && "${a[6]}" =~ ^legacy_image=sha256:[a-f0-9]{64}$ && "${a[7]}" =~ ^config_sha256=[a-f0-9]{64}$ && "${a[8]}" =~ ^mounts_sha256=[a-f0-9]{64}$ && "${a[9]}" =~ ^networks_sha256=[a-f0-9]{64}$ && "${a[10]}" == "sha=$sha" && "${a[11]}" == "run=$run" && "${a[12]}" == "attempt=$attempt" && "${a[13]}" == "artifact=$artifact" && "${a[14]}" == "zip=$zip" && "${a[15]}" == "tar=$tar" && "${a[16]}" =~ ^expires_epoch=[0-9]{10}$ ]] || fail
expires=${a[16]#expires_epoch=}
now=$(date +%s) || fail
[[ "$now" =~ ^[0-9]{10}$ ]] && (( 10#$expires > 10#$now )) || fail
# Apenas valida formato, identidade e prazo; não autoriza ou executa transição.
