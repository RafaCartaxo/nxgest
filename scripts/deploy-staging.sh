#!/usr/bin/env bash
set -euo pipefail

# Deploy de HOMOLOGAÇÃO (staging) — domínio nxgestao.duckdns.org.
# Roda no VPS (chamado pelo GitHub Actions via SSH, ou manualmente).
# Produção (nxgest.com.br) NÃO é tocada — stack/volume/DB próprios.

cd "$(dirname "$0")/.."

ENV_FILE=.env.staging
COMPOSE="-f docker-compose.staging.yml"

# 1) Rede compartilhada com o Caddy de produção (uma vez só).
docker network create nxgestao_net 2>/dev/null || true

# 2) .env.staging — se não existir, cria com defaults seguros (o operador pode
#    ajustar depois). Nunca leva os segredos de produção (.env).
if [ ! -f "$ENV_FILE" ]; then
  echo "==> .env.staging não existe — criando com defaults (ajuste se necessário)"
  cat > "$ENV_FILE" <<'EOF'
DOMAIN=nxgestao.duckdns.org
CORS_ORIGIN=https://nxgestao.duckdns.org
JWT_SECRET=staging-jwt-secret
ADMIN_DEFAULT_PASSWORD=staging-admin
SUPER_ADMIN_EMAIL=super@nxgest.com
SUPER_ADMIN_DEFAULT_PASSWORD=staging-super
PG_DB=nxgest
PG_USER=nxgest
PG_PASSWORD=staging-pg-secret
MAIL_PROVIDER=resend
RESEND_API_KEY=
MAIL_FROM_NAME=NX Gest
MAIL_FROM_ADDRESS=no-reply@nxgest.com.br
APP_URL=https://nxgestao.duckdns.org
LOGIN_RATE_LIMIT_MAX=10000
USER_RATE_LIMIT_MAX=100000
EOF
  chmod 600 "$ENV_FILE"
fi

# 2b) Chaves PostgreSQL ausentes em .env.staging antigo (PLAN-070) — append idempotente,
#     para staging existente que foi criado na era SQLite (sem PG_*).
for key in PG_DB PG_USER PG_PASSWORD; do
  if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    case "$key" in
      PG_DB) val=nxgest ;;
      PG_USER) val=nxgest ;;
      PG_PASSWORD) val=staging-pg-secret ;;
    esac
    echo "${key}=${val}" >> "$ENV_FILE"
    echo "==> ${key} adicionado ao .env.staging"
  fi
done
set -a; source "$ENV_FILE"; set +a

# 3) Traz o código (o runner já puxou, mas garante consistência local).
git pull --ff-only origin main 2>/dev/null || true

# 4) Sobe a stack (build da imagem + containers). O boot cria as tabelas
#    e o seed básico (super/admin) — terminando em "Servidor rodando".
docker compose $COMPOSE up -d --build

# 4b) Espera o boot terminar (a porta responde health) antes de qualquer seed.
echo "==> Aguardando o staging-app ficar pronto..."
for i in $(seq 1 30); do
  if docker exec staging-app node -e 'fetch("http://127.0.0.1:8081/api/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))' >/dev/null 2>&1; then
    echo "==> staging-app pronto (health OK)"
    break
  fi
  if [ "$i" = 30 ]; then
    echo "ERRO: staging-app não ficou pronto em 30 tentativas" >&2
    docker logs staging-app --tail 30 2>&1 || true
    exit 1
  fi
  sleep 2
done

# 5) Seed fake SÓ na primeira vez (banco sem clientes — o boot não cria
#    clientes, então esse critério distingue "vazio" de "já seedado").
if docker exec staging-pg psql -U "$PG_USER" -d "$PG_DB" -tAc "SELECT COUNT(*) FROM clientes" 2>/dev/null | grep -qE '^[1-9]'; then
  echo "==> Staging já tem dados — seed ignorado"
else
  echo "==> DB de staging vazio — aplicando seed de demonstração"
  docker exec -e DATABASE_URL="postgres://$PG_USER:$PG_PASSWORD@staging-pg:5432/$PG_DB" staging-app node scripts/seed-demo.mjs
fi

# 6) Recarrega o Caddy de produção com o Caddyfile atualizado
#    (duckdns → staging-app:8081). Sem downtime para nxgest.com.br.
CADDY=$(docker ps -qf ancestor=caddy:2-alpine | head -1)
if [ -n "$CADDY" ]; then
  echo "==> Recarregando Caddy ($CADDY)"
  docker exec "$CADDY" caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || true
fi

# 7) Health check no domínio público (via Caddy de produção).
for i in 1 2 3 4 5; do
  if curl -fsS https://nxgestao.duckdns.org/api/health >/dev/null 2>&1; then
    echo "==> Staging OK: https://nxgestao.duckdns.org"
    exit 0
  fi
  sleep 5
done

echo "ERRO: health check do staging falhou após o deploy" >&2
exit 1
