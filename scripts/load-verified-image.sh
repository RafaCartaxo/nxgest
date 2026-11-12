#!/usr/bin/env bash
# Somente recebe tar já verificado pelo runner confiável; lock 9 herdado.
set -euo pipefail
source "$(dirname "$0")/host-jq.sh"
nxgest_use_jq || { echo 'jq portátil inválido' >&2; exit 1; }
file=${1:-}; digest=${2:-}; sha=${3:-}
fail() { echo 'Imagem verificada indisponível ou divergente' >&2; exit 1; }
[[ "$sha" =~ ^[a-f0-9]{40}$ && "$digest" =~ ^sha256:[a-f0-9]{64}$ && -f "$file" && ! -L "$file" ]] || fail
flock -n 9 || fail
actual=$(sha256sum -- "$file"); actual=${actual%% *}
[[ "sha256:$actual" == "$digest" ]] || fail
# docker save deve conter uma única tag gerada pelo build confiável.
tag="nxgest-build:$sha"
tar -xOf "$file" manifest.json | "$NXGEST_JQ" -e --arg tag "$tag" 'type == "array" and length == 1 and (.[0].RepoTags == [$tag]) and (.[0].Config | type == "string") and (.[0].Layers | type == "array" and length > 0)' >/dev/null || fail
# Não reatribuir tag preexistente, mesmo que corresponda ao SHA.
if docker image inspect --format '{{.Id}}' "$tag" >/dev/null 2>&1; then fail; fi
# O daemon confiável carrega os bytes aprovados; nunca faz pull ou build.
docker image load --input "$file" >/dev/null || fail
id=$(docker image inspect --format '{{.Id}}' "$tag") || fail
[[ "$id" =~ ^sha256:[a-f0-9]{64}$ ]] || fail
printf '%s\n' "$id"
