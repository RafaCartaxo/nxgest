#!/usr/bin/env bash
set -euo pipefail

# Backup do banco PostgreSQL (NX Gest) + anexos.
# Instalar em /opt/scripts/backup-nxgest.sh (VPS) — chamado pelo deploy.sh
# (gate pré-deploy) e recomendado no cron 2x/dia.
# Requer acesso a /opt/nxgestao/.env (PG_USER/PG_DB/PG_PASSWORD).

STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=/opt/backups
CONTAINER=nxgest-postgres
APP=nxgestao-app-1
ENV_FILE=/opt/nxgestao/.env

[ -f "$ENV_FILE" ] || { echo "ERRO: $ENV_FILE não encontrado"; exit 1; }
set -a; source "$ENV_FILE"; set +a
: "${PG_USER:?PG_USER ausente em $ENV_FILE}"
: "${PG_DB:?PG_DB ausente em $ENV_FILE}"

mkdir -p "$BACKUP_DIR"
OUT="$BACKUP_DIR/pg-${STAMP}.dump"
OUT_UPLOADS="$BACKUP_DIR/uploads-${STAMP}.tar.gz"

echo "==> pg_dump -Fc ($PG_DB)"
docker exec -e PGPASSWORD="$PG_PASSWORD" "$CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" -Fc -f /tmp/backup.dump
docker cp "$CONTAINER:/tmp/backup.dump" "$OUT"
docker exec "$CONTAINER" rm -f /tmp/backup.dump
pg_restore -l "$OUT" >/dev/null || { echo "ERRO: dump inválido ($OUT)"; exit 1; }

echo "==> anexos (uploads)"
docker exec "$APP" sh -c "cd /data && tar czf /tmp/uploads.tgz uploads 2>/dev/null || tar czf /tmp/uploads.tgz --files-from /dev/null" || true
docker cp "$APP:/tmp/uploads.tgz" "$OUT_UPLOADS" || true
docker exec "$APP" rm -f /tmp/uploads.tgz || true

echo "==> retenção 14 dias"
find "$BACKUP_DIR" -name "pg-*.dump" -mtime +14 -delete
find "$BACKUP_DIR" -name "uploads-*.tar.gz" -mtime +14 -delete
ls -lh "$BACKUP_DIR" | tail -4
echo "OK: $OUT"