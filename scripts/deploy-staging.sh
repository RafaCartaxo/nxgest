#!/usr/bin/env bash
set -euo pipefail

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

# 1) Rede compartilhada com o Caddy de produção (uma vez só).
docker network create nxgestao_net 2>/dev/null || true

# A biblioteca é código versionado; o arquivo .env é lido somente como dados.
source scripts/staging-env.sh
prepare_staging_env "$ENV_FILE"
load_staging_env "$ENV_FILE"
# Staging nunca envia e-mail real, mesmo que um arquivo antigo tenha Resend.
MAIL_PROVIDER=console
export MAIL_PROVIDER

# 3) Traz o código no commit exato validado pelo CI (passado como arg).
#    Deploy do GitHub Actions: staging sobe EXATAMENTE o SHA que passou em
#    test+smoke — nunca o que a main tiver na hora (evita SHA não validado).
#    Deploy manual (sem arg): assume o repo já posicionado, só garante a main.
REF="${1:-}"
if [ -n "$REF" ]; then
  info "Posicionando o repositório no SHA validado: ${REF}"
  git fetch origin "$REF"
  git reset --hard "$REF"
else
  git pull --ff-only origin main 2>/dev/null || true
fi

# 4) Sobe a stack (build da imagem + containers). O boot cria as tabelas
#    e o seed básico (super/admin) — terminando em "Servidor rodando".
info "Build da imagem + subir containers (staging)"
docker compose $COMPOSE up -d --build

# 4b) Espera o boot terminar (a porta responde health) antes de qualquer seed.
info "Aguardando o staging-app ficar pronto..."
for i in $(seq 1 30); do
  if docker exec staging-app node -e 'fetch("http://127.0.0.1:8081/api/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))' >/dev/null 2>&1; then
    ok "staging-app pronto (health OK)"
    break
  fi
  if [ "$i" = 30 ]; then
    erro "staging-app não ficou pronto em 30 tentativas"
    docker logs staging-app --tail 30 2>&1 || true
    erro "Dica: veja o log acima (docker logs staging-app --tail 50) para investigar."
    exit 1
  fi
  sleep 2
done

# 5) Seed fake SÓ na primeira vez (banco sem clientes — o boot não cria
#    clientes, então esse critério distingue "vazio" de "já seedado").
if docker exec staging-pg psql -U "$PG_USER" -d "$PG_DB" -tAc "SELECT COUNT(*) FROM clientes" 2>/dev/null | grep -qE '^[1-9]'; then
  info "Staging já tem dados — seed ignorado"
else
  info "DB de staging vazio — aplicando seed de demonstração"
  docker exec -e DATABASE_URL="postgres://$PG_USER:$PG_PASSWORD@staging-pg:5432/$PG_DB" staging-app node scripts/seed-demo.mjs
fi

# 6) Recarrega o Caddy de produção com o Caddyfile atualizado
#    (duckdns → staging-app:8081). Sem downtime para nxgest.com.br.
CADDY=$(docker ps -qf ancestor=caddy:2-alpine | head -1)
if [ -n "$CADDY" ]; then
  info "Recarregando Caddy ($CADDY)"
  docker exec "$CADDY" caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || true
fi

# 7) Health check no domínio público (via Caddy de produção).
for i in 1 2 3 4 5; do
  if curl -fsS https://nxgestao.duckdns.org/api/health >/dev/null 2>&1; then
    ok "Staging OK: https://nxgestao.duckdns.org"
    exit 0
  fi
  sleep 5
done

erro "Health check do staging falhou após o deploy"
erro "Dica: docker logs staging-app --tail 50 para investigar."
exit 1
