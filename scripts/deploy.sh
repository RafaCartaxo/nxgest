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

# Backup pré-deploy: snapshot do banco antes de reconstruir (cron de 12h não é
# suficiente — cada implementação ganha um ponto de restauração). Script vive em
# /opt/scripts no VPS; se ausente (ex.: rodando fora do VPS), segue sem backup.
if [ -x /opt/scripts/backup-nxgest.sh ]; then
  info "Backup pré-deploy"
  /opt/scripts/backup-nxgest.sh
  ok "Backup pré-deploy concluído"
else
  info "Script de backup não encontrado (/opt/scripts/backup-nxgest.sh) — deploy sem snapshot"
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
