#!/usr/bin/env bash
# Somente recebe tar já verificado pelo runner confiável; lock 9 herdado.
set -euo pipefail
file=${1:-}; digest=${2:-}; sha=${3:-}; mode=${4:-load}
fail() { echo 'Imagem verificada indisponível ou divergente' >&2; exit 1; }
[[ "$sha" =~ ^[a-f0-9]{40}$ && "$digest" =~ ^sha256:[a-f0-9]{64}$ && -f "$file" && ! -L "$file" && ( "$mode" == load || "$mode" == --preflight ) ]] || fail
if [[ "$mode" == --preflight && "$0" == bash ]]; then
  git cat-file -e "$sha:scripts/host-jq.sh" || fail
  source <(git show "$sha:scripts/host-jq.sh")
elif [[ -f "$(dirname "$0")/host-jq.sh" ]]; then
  source "$(dirname "$0")/host-jq.sh"
else
  fail
fi
nxgest_use_jq || { echo 'jq portátil inválido' >&2; exit 1; }
flock -n 9 || fail
actual=$(sha256sum -- "$file"); actual=${actual%% *}
[[ "sha256:$actual" == "$digest" ]] || fail
# Modelo restrito observado: Docker Engine 26.1.3 linux/amd64 e docker save
# com configuração por digest SHA-256. Outros modelos não inferem ImageID.
tag="nxgest-build:$sha"
[[ "$(docker version --format '{{.Server.Version}}|{{.Server.Os}}|{{.Server.Arch}}')" == '26.1.3|linux|amd64' ]] || fail
[[ "$(docker info --format '{{.Driver}}')" == overlay2 ]] || fail
driver_status=$(docker info --format '{{json .DriverStatus}}') || fail
printf '%s' "$driver_status" | "$NXGEST_JQ" -e 'type == "array" and length > 0 and all(.[]; type == "array" and length == 2 and all(.[]; type == "string")) and (tostring | ascii_downcase | (contains("containerd") or contains("snapshotter") | not))' >/dev/null || fail
entries=$(tar -tf "$file") || fail
details=$(tar -tvf "$file") || fail
regular_once() {
  local name=$1
  [[ "$(printf '%s\n' "$entries" | awk -v n="$name" '$0 == n {x++} END {print x+0}')" == 1 ]] || return 1
  [[ "$(printf '%s\n' "$details" | awk -v n="$name" '$NF == n && substr($1,1,1) == "-" {x++} END {print x+0}')" == 1 ]]
}
regular_once manifest.json || fail
config=$(tar -xOf "$file" manifest.json | "$NXGEST_JQ" -er --arg tag "$tag" 'select(type == "array" and length == 1 and (.[0].RepoTags == [$tag]) and (.[0].Config | type == "string") and (.[0].Layers | type == "array" and length > 0)) | .[0].Config') || fail
[[ "$config" =~ ^blobs/sha256/([a-f0-9]{64})$ ]] || fail
config_hash=${BASH_REMATCH[1]}
regular_once "$config" || fail
tar -xOf "$file" "$config" | "$NXGEST_JQ" -e 'type == "object" and .os == "linux" and .architecture == "amd64"' >/dev/null || fail
actual_config=$(tar -xOf "$file" "$config" | sha256sum) || fail
[[ "${actual_config%% *}" == "$config_hash" ]] || fail
expected="sha256:$config_hash"
# A ausência deve ser demonstrada por listagem bem-sucedida, não por erro de inspect.
references=$(docker image ls --no-trunc --format '{{.Repository}}:{{.Tag}}|{{.ID}}') || fail
present=$(printf '%s\n' "$references" | awk -F '|' -v ref="$tag" '$1 == ref { print "present" }') || fail
[[ -z "$present" ]] || fail
pin="nxgest-retained:$sha"
existing=$(printf '%s\n' "$references" | awk -F '|' -v ref="$pin" '$1 == ref { if (NF != 2 || $2 == "") exit 1; print $2 }') || fail
[[ -z "$existing" || "$existing" == "$expected" ]] || fail
if [[ -n "$existing" ]]; then
  [[ "$(docker image inspect --format '{{.Id}}' "$pin")" == "$expected" ]] || fail
fi
if [[ "$mode" == --preflight ]]; then printf '%s\n' "$expected"; exit 0; fi
# O daemon confiável carrega os bytes aprovados; nunca faz pull ou build.
docker image load --input "$file" >/dev/null || fail
id=$(docker image inspect --format '{{.Id}}' "$tag") || fail
[[ "$id" == "$expected" ]] || fail
printf '%s\n' "$id"
