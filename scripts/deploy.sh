#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERRO: arquivo .env não encontrado. Copie de .env.production.example"
  exit 1
fi

# Backup pré-deploy: snapshot do banco antes de reconstruir (cron de 12h não é
# suficiente — cada implementação ganha um ponto de restauração). Script vive em
# /opt/scripts no VPS; se ausente (ex.: rodando fora do VPS), segue sem backup.
if [ -x /opt/scripts/backup-nxgestao.sh ]; then
  echo "==> Backup pré-deploy"
  /opt/scripts/backup-nxgestao.sh
else
  echo "!! Script de backup não encontrado (/opt/scripts/backup-nxgestao.sh) — deploy sem snapshot"
fi

# Gate de UI (PLAN-044): nenhum padrão legado/anti-drift pode ir pra produção
echo "==> audit:ui + audit:styles"
node scripts/audit-ui.mjs
node scripts/audit-styles.mjs

docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d
docker image prune -f
