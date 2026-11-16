#!/usr/bin/env bash
# Called under the deployment lock with an image already bound to authenticated bytes.
set -euo pipefail
sha=${1:-}; image=${2:-}
fail(){ echo 'Retenção da imagem não comprovada' >&2; exit 1; }
[[ $# == 2 && "$sha" =~ ^[a-f0-9]{40}$ && "$image" =~ ^sha256:[a-f0-9]{64}$ ]] || fail
flock -n 9 || fail
docker_t(){ timeout 10s docker "$@"; }
tag=nxgest-build:$sha
pin=nxgest-retained:$sha
# list succeeds even for an absent tag; inspect failure alone cannot prove absence.
list=$(docker_t image ls --no-trunc --format '{{.Repository}}:{{.Tag}}|{{.ID}}') || fail
matches=$(printf '%s\n' "$list" | awk -F '|' -v ref="$pin" '$1 == ref { if (NF != 2 || $2 == "") exit 1; print $2 }') || fail
[[ -z "$matches" || "$matches" == "$image" ]] || fail
[[ "$(docker_t image inspect --format '{{.Id}}' "$tag")" == "$image" ]] || fail
[[ "$(docker_t image inspect --format '{{.Id}}' "$image")" == "$image" ]] || fail
if [[ -z "$matches" ]]; then
  docker_t image tag "$image" "$pin" >&2 || fail
fi
[[ "$(docker_t image inspect --format '{{.Id}}' "$pin")" == "$image" ]] || fail
[[ "$(docker_t image inspect --format '{{.Id}}' "$tag")" == "$image" ]] || fail
docker_t image rm "$tag" >&2 || fail
[[ "$(docker_t image inspect --format '{{.Id}}' "$pin")" == "$image" ]] || fail
