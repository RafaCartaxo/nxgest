#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Helpers de log — linhas claras e legíveis (rodam no VPS via SSH do GH Actions).
info() { printf '==> %s\n' "$*"; }
ok()   { printf '✓ %s\n' "$*"; }
erro() { printf '✗ %s\n' "$*" >&2; }

# Somente o bootstrap do SHA alvo deve iniciar o deploy.
if [ "${NXGEST_DEPLOY_MODE:-}" != production ] || [ "${NXGEST_DEPLOY_SHA:-}" != "$(git rev-parse HEAD)" ]; then
  erro "Use o bootstrap de produção documentado no runbook"; exit 1
fi

if [ ! -f .env ]; then
  erro "Arquivo .env não encontrado. Consulte .env.example e docs/engineering/06-PRODUCAO.md"
  exit 1
fi

# Backup pré-deploy OBRIGATÓRIO: snapshot do banco antes de reconstruir (cron de
# 12h não é suficiente — cada implementação ganha um ponto de restauração).
# Não há bypass automatizado: ausência ou falha do backup bloqueia deploy.
if [ -x /opt/scripts/backup-nxgest.sh ]; then
  # Evita aceitar sucesso do backup legado que tolerava falhas de anexos.
  cmp -s /opt/scripts/backup-nxgest.sh scripts/backup-nxgest.sh || { erro "Backup instalado difere da versão validada"; exit 1; }
  info "Backup pré-deploy"
  backup_result=$(/opt/scripts/backup-nxgest.sh)
  if [[ ! "$backup_result" =~ ^Backup\ íntegro\ criado:\ ([0-9]{8}T[0-9]{6}Z-[0-9]+-[0-9]+)$ ]]; then
    erro "Resultado de backup inválido"; exit 1
  fi
  backup_id=${BASH_REMATCH[1]}
  bundle="/opt/backups/$backup_id"
  evidence="$(git rev-parse --git-path nxgest-rollback-evidence)"
  config_proof="$(git rev-parse --git-path nxgest-config-evidence)"
  schema_proof="$(git rev-parse --git-path nxgest-schema-evidence)"
  bash scripts/rollback-preflight.sh "$bundle" "$evidence" "$config_proof" "$schema_proof" >/dev/null || { erro "Pré-condições de rollback não comprovadas"; exit 1; }
  ok "Backup e pré-condições verificados"
else
  erro "Script de backup obrigatório não encontrado (/opt/scripts/backup-nxgest.sh)"
  exit 1
fi

# Rede compartilhada com o staging (homologação) — o Caddy roteia os dois domínios.
docker network create nxgestao_net 2>/dev/null || true

# Gate de UI (PLAN-044/045): nenhum padrão legado/anti-drift nem manifest incoerente
# pode ir pra produção. Node roda via imagem node:20-slim (host sem node no PATH).
info "Auditorias de UI + estilos + módulos (node:20-slim)"
docker run --rm -v "$(pwd)":/app -w /app node:20-slim node scripts/audit-ui.mjs
docker run --rm -v "$(pwd)":/app -w /app node:20-slim node scripts/audit-styles.mjs
docker run --rm -v "$(pwd)":/app -w /app node:20-slim node scripts/audit-modules.mjs
ok "Auditorias passaram (nenhum padrão legado)"

info "Build da imagem + subir containers (produção)"
docker compose --project-directory . -f infra/docker-compose.prod.yml build app
docker compose --project-directory . -f infra/docker-compose.prod.yml up -d
ok "Deploy de produção concluído"
