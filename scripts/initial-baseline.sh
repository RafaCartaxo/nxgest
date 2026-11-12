#!/usr/bin/env bash
# Primeira baseline apenas: a política pré-aprovada e o lock são obrigatórios.
set -euo pipefail
source "$(dirname "$0")/host-jq.sh"
nxgest_use_jq || { echo 'jq portátil inválido' >&2; exit 1; }
cd "$(dirname "$0")/.."
fail(){ echo 'Bootstrap inicial recusado' >&2; exit 1; }
sha=${NXGEST_DEPLOY_SHA:-}; tarfile=${1:-}; tarhash=${2:-}; ziphash=${3:-}; run=${4:-}; artifact=${5:-}; staging=${6:-}; image=${7:-}; policyhash=${8:-}
[[ ${NXGEST_DEPLOY_MODE:-} == production-initial && "$sha" =~ ^[a-f0-9]{40}$ && "$tarhash" =~ ^sha256:[a-f0-9]{64}$ && "$ziphash" =~ ^sha256:[a-f0-9]{64}$ && "$image" =~ ^sha256:[a-f0-9]{64}$ && "$policyhash" =~ ^sha256:[a-f0-9]{64}$ && "$run" =~ ^[0-9]+$ && "$artifact" =~ ^[0-9]+$ && "$staging" =~ ^[0-9]+$ ]] || fail
flock -n 9 || fail
[ -f .env ] && [ ! -L .env ] || fail
staging_marker=$(git rev-parse --git-path nxgest-staging-sha)
[ -f "$staging_marker" ] && [ ! -L "$staging_marker" ] && [ "$(cat "$staging_marker")" = "$sha" ] || fail
policy=$(git rev-parse --git-path nxgest-first-baseline-policy); marker=$(git rev-parse --git-path nxgest-baseline-established); pending=$(git rev-parse --git-path nxgest-baseline-pending); saved=$(git rev-parse --git-path nxgest-baseline-image.tar)
[ -f "$policy" ] && [ ! -L "$policy" ] && [ "$(stat -c %u "$policy")" = "$(id -u)" ] && [[ "$(stat -c %a "$policy")" =~ ^[46]00$ ]] || fail
actual=$(sha256sum -- "$policy");actual=${actual%% *};[[ "sha256:$actual" == "$policyhash" ]] || fail
mapfile -t lines < "$policy"
[[ ${#lines[@]} -eq 9 && "${lines[0]}" == 'mode=first-baseline-v1' && "${lines[1]}" == 'environment=production' && "${lines[2]}" == "sha=$sha" && "${lines[3]}" == "tar=$tarhash" && "${lines[4]}" == "zip=$ziphash" && "${lines[5]}" == "ci_run=$run" && "${lines[6]}" == "artifact=$artifact" && "${lines[7]}" == "staging_run=$staging" && "${lines[8]}" =~ ^decision=[A-Za-z0-9._/-]+$ ]] || fail
[ ! -e "$marker" ] && [ ! -L "$marker" ] && [ ! -e "$pending" ] && [ ! -L "$pending" ] && [ ! -e "$saved" ] && [ ! -L "$saved" ] || fail
[ -f "$tarfile" ] && [ ! -L "$tarfile" ] || fail
actual=$(sha256sum -- "$tarfile");actual=${actual%% *};[[ "sha256:$actual" == "$tarhash" ]] || fail
# Staging continua na imagem/health aprovados imediatamente antes da troca.
[[ "$(docker inspect --format '{{.Image}}' staging-app)" == "$image" ]] || fail
staging_id=$(docker inspect --format '{{.Id}}' staging-app)
[[ "$staging_id" =~ ^[a-f0-9]{64}$ ]] || fail
bash scripts/container-health.sh "$staging_id" "$image" || fail
curl -fsS --max-time 5 https://nxgestao.duckdns.org/api/health | "$NXGEST_JQ" -e 'type == "object" and .status == "ok" and .db == "connected"' >/dev/null || fail
[[ "$(docker inspect --format '{{.Id}}' staging-app)" == "$staging_id" ]] || fail
# Dependências existentes são observadas; Compose não as modifica.
[[ "$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' nxgest-postgres)" == 'running|healthy' ]] || fail
proxy=$(docker ps -q --filter label=com.docker.compose.project=nxgestao --filter label=com.docker.compose.service=caddy) || fail
[[ "$proxy" =~ ^[a-f0-9]{12,64}$ && "$(docker inspect --format '{{.State.Status}}' "$proxy")" == running ]] || fail
# Marcar antes de mutar serviço: falha/interrupção bloqueia repetição automática.
(umask 077; set -C; printf 'pending sha=%s\n' "$sha" > "$pending") || fail
(umask 077; set -C; cat -- "$tarfile" > "$saved") || fail
actual=$(sha256sum -- "$saved");actual=${actual%% *};[[ "sha256:$actual" == "$tarhash" ]] || fail
loaded=$(bash scripts/load-verified-image.sh "$saved" "$tarhash" "$sha")
[[ "$loaded" == "$image" ]] || fail
export NXGEST_PROD_IMAGE="$loaded"
docker compose --project-directory . -f infra/docker-compose.prod.yml up -d --no-deps --no-build --pull never app >&2
container=$(docker compose --project-directory . -f infra/docker-compose.prod.yml ps -q app)
[[ -n "$container" && "$(docker inspect --format '{{.Image}}' "$container")" == "$loaded" ]] || fail
container_id=$(docker inspect --format '{{.Id}}' "$container")
[[ "$container_id" =~ ^[a-f0-9]{64}$ ]] || fail
bash scripts/container-health.sh "$container_id" "$loaded" --wait || fail
curl -fsS --max-time 5 https://nxgest.com.br/api/health | "$NXGEST_JQ" -e 'type == "object" and .status == "ok" and .db == "connected"' >/dev/null || fail
[[ "$(docker compose --project-directory . -f infra/docker-compose.prod.yml ps -q app)" == "$container" && "$(docker inspect --format '{{.Id}}' "$container")" == "$container_id" && "$(docker inspect --format '{{.Image}}' "$container_id")" == "$loaded" && "$(docker image inspect --format '{{.Id}}' "nxgest-build:$sha")" == "$loaded" ]] || fail
# Só remove a tag recém-criada por este load; nenhum volume ou dado é removido.
docker image rm "nxgest-build:$sha" >&2
(umask 077; set -C; printf 'version=first-baseline-v1\nsha=%s\ntar=%s\nzip=%s\nci_run=%s\nartifact=%s\nstaging_run=%s\nimage=%s\n' "$sha" "$tarhash" "$ziphash" "$run" "$artifact" "$staging" "$loaded" > "$marker") || fail
printf 'PRODUCTION_BASELINE sha=%s tar=%s image=%s\n' "$sha" "$tarhash" "$loaded"
