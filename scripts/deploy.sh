#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Helpers de log — linhas claras e legíveis (rodam no VPS via SSH do GH Actions).
info() { printf '==> %s\n' "$*"; }
ok()   { printf '✓ %s\n' "$*"; }
erro() { printf '✗ %s\n' "$*" >&2; }

if [ ! -f .env ]; then
  erro "Arquivo .env não encontrado. Copie de .env.production.example"
  exit 1
fi

# Rede compartilhada com o staging (homologação) — o Caddy roteia os dois domínios.
docker network create nxgestao_net 2>/dev/null || true

# Backup pré-deploy OBRIGATÓRIO: snapshot do banco antes de reconstruir (cron de
# 12h não é suficiente — cada implementação ganha um ponto de restauração).
# Sem o script de backup o deploy FALHA, exceto com escape explícito:
#   NXGEST_SKIP_BACKUP=1 bash scripts/deploy.sh
if [ -x /opt/scripts/backup-nxgest.sh ]; then
  info "Backup pré-deploy"
  /opt/scripts/backup-nxgest.sh
  ok "Backup pré-deploy concluído"
elif [ "${NXGEST_SKIP_BACKUP:-0}" = "1" ]; then
  info "⚠️ Backup pulado por NXGEST_SKIP_BACKUP=1 (escape explícito)"
else
  erro "Script de backup não encontrado (/opt/scripts/backup-nxgest.sh)"
  erro "Deploy exige snapshot pré-deploy. Para forçar, rode com NXGEST_SKIP_BACKUP=1."
  exit 1
fi

# Gate de UI (PLAN-044/045): nenhum padrão legado/anti-drift nem manifest incoerente
# pode ir pra produção. Node roda via imagem node:20-slim (host sem node no PATH).
info "Auditorias de UI + estilos + módulos (node:20-slim)"
docker run --rm -v "$(pwd)":/app -w /app node:20-slim node scripts/audit-ui.mjs
docker run --rm -v "$(pwd)":/app -w /app node:20-slim node scripts/audit-styles.mjs
docker run --rm -v "$(pwd)":/app -w /app node:20-slim node scripts/audit-modules.mjs
ok "Auditorias passaram (nenhum padrão legado)"

info "Build da imagem + subir containers (produção)"
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d
docker image prune -f
ok "Deploy de produção concluído"
