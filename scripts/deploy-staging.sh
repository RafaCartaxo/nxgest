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
MAIL_PROVIDER=console
RESEND_API_KEY=
MAIL_FROM=no-reply@nxgest.com.br
APP_URL=https://nxgestao.duckdns.org
LOGIN_RATE_LIMIT_MAX=10000
USER_RATE_LIMIT_MAX=100000
EOF
  chmod 600 "$ENV_FILE"
fi
set -a; source "$ENV_FILE"; set +a

# 3) Traz o código (o runner já puxou, mas garante consistência local).
git pull --ff-only origin main 2>/dev/null || true

# 4) Sobe a stack (build da imagem + containers). O boot cria as tabelas.
docker compose $COMPOSE up -d --build

# 4b) Recarrega o Caddy de produção com o Caddyfile atualizado
#     (duckdns → staging-app:8081). Sem downtime para nxgest.com.br.
CADDY=$(docker ps -qf ancestor=caddy:2-alpine | head -1)
if [ -n "$CADDY" ]; then
  echo "==> Recarregando Caddy ($CADDY)"
  docker exec "$CADDY" caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || true
fi

# 5) Seed fake SÓ na primeira vez (DB vazio) — não destrói dados de QA.
if docker exec staging-app sh -c 'node -e "const s=require(\"better-sqlite3\")(\"/data/gestao.db\",{readonly:true}).prepare(\"SELECT COUNT(*) c FROM usuarios\").get().c; process.exit(s>0?0:1)"' 2>/dev/null; then
  echo "==> Staging já tem dados — seed ignorado"
else
  echo "==> DB de staging vazio — aplicando seed de demonstração"
  docker exec staging-app node scripts/seed-demo.mjs
fi

# 6) Health check no domínio público (via Caddy de produção).
for i in 1 2 3 4 5; do
  if curl -fsS https://nxgestao.duckdns.org/api/health >/dev/null 2>&1; then
    echo "==> Staging OK: https://nxgestao.duckdns.org"
    exit 0
  fi
  sleep 5
done

echo "ERRO: health check do staging falhou após o deploy" >&2
exit 1
