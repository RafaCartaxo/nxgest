#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/host-jq.sh"
nxgest_use_jq || { echo 'jq portátil inválido' >&2; exit 1; }

# Deploy de HOMOLOGAÇÃO (staging) — domínio nxgestao.duckdns.org.
# Roda no VPS (chamado pelo GitHub Actions via SSH, ou manualmente).
# Produção (nxgest.com.br) NÃO é tocada — stack/volume/DB próprios.

cd "$(dirname "$0")/.."

# Helpers de log — linhas claras e legíveis (rodam no VPS via SSH do GH Actions).
info() { printf '==> %s\n' "$*"; }
ok()   { printf '✓ %s\n' "$*"; }
erro() { printf '✗ %s\n' "$*" >&2; }

ENV_FILE=.env.staging
COMPOSE="--project-directory . -f infra/docker-compose.staging.yml"

# Somente o bootstrap do SHA alvo deve iniciar o deploy.
if [ "${NXGEST_DEPLOY_MODE:-}" != staging ] || [ "${NXGEST_DEPLOY_SHA:-}" != "$(git rev-parse HEAD)" ]; then
  erro "Use o bootstrap de staging documentado no runbook"; exit 1
fi

# O bootstrap detém o lock e entrega apenas o tar autenticado no runner.
flock -n 9 || { erro "Lock ausente"; exit 1; }
: "${NXGEST_IMAGE_TAR:?tar verificado obrigatório}" "${NXGEST_IMAGE_DIGEST:?digest obrigatório}"
# Enquanto o legado estiver retido, Compose pode identificá-lo pelas labels.
adoption_consumed=$(git rev-parse --git-path nxgest-staging-adoption-consumed)
[[ ! -e "$adoption_consumed" && ! -L "$adoption_consumed" ]] || { erro "Adoção retida exige encerramento revisado"; exit 1; }
source scripts/staging-env.sh
[ -f "$ENV_FILE" ] && [ ! -L "$ENV_FILE" ] || { erro "Configuração staging indisponível"; exit 1; }
load_staging_env "$ENV_FILE"
MAIL_PROVIDER=console
export MAIL_PROVIDER
fail_stage(){ erro "Dependência staging indisponível"; exit 1; }
# Dependências existentes são observadas; Compose não as modifica.
[[ "$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' staging-pg)" == 'running|healthy' ]] || fail_stage
proxy=$(docker ps -q --filter label=com.docker.compose.project=nxgestao --filter label=com.docker.compose.service=caddy) || fail_stage
[[ "$proxy" =~ ^[a-f0-9]{12,64}$ && "$(docker inspect --format '{{.State.Status}}' "$proxy")" == running ]] || fail_stage
image_id=$(bash scripts/load-verified-image.sh "$NXGEST_IMAGE_TAR" "$NXGEST_IMAGE_DIGEST" "$NXGEST_DEPLOY_SHA")
temporary_tag="nxgest-build:$NXGEST_DEPLOY_SHA"
export NXGEST_STAGING_IMAGE="$image_id"
# Não cria redes nem busca imagens; dependências devem estar disponíveis.
docker compose $COMPOSE up -d --no-deps --no-build --pull never staging-app >&2
container_id=$(docker inspect --format '{{.Id}}' staging-app)
[[ "$container_id" =~ ^[a-f0-9]{64}$ ]] || { erro "Container staging inválido"; exit 1; }
container_image=$(docker inspect --format '{{.Image}}' "$container_id")
[[ "$container_image" == "$image_id" ]] || { erro "Imagem efetiva divergente"; exit 1; }
bash scripts/container-health.sh "$container_id" "$image_id" --wait || { erro "Health interno staging indisponível"; exit 1; }
curl -fsS --max-time 5 https://nxgestao.duckdns.org/api/health | "$NXGEST_JQ" -e 'type == "object" and .status == "ok" and .db == "connected"' >/dev/null || { erro "Health público staging indisponível"; exit 1; }
# Revalidar tag e container sob o mesmo lock depois do health.
[[ "$(docker inspect --format '{{.Id}}' staging-app)" == "$container_id" && "$(docker image inspect --format '{{.Id}}' "$NXGEST_STAGING_IMAGE")" == "$image_id" && "$(docker inspect --format '{{.Image}}' staging-app)" == "$image_id" ]] || { erro "Imagem alterada durante staging"; exit 1; }
# Remove apenas a tag temporária criada por este load, após confirmar identidade.
[[ "$(docker image inspect --format '{{.Id}}' "$temporary_tag")" == "$image_id" ]] || { erro "Tag temporária divergente"; exit 1; }
docker image rm "$temporary_tag" >&2
printf '%s\n' "$image_id"
