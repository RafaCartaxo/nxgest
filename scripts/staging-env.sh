#!/usr/bin/env bash
# Funções confiáveis de staging: arquivo de ambiente é sempre tratado como dados.
prepare_staging_env() {
  local ENV_FILE="$1" JWT_SECRET ADMIN_DEFAULT_PASSWORD SUPER_ADMIN_DEFAULT_PASSWORD PG_PASSWORD key val
  if [ ! -f "$ENV_FILE" ]; then
    info ".env.staging não existe — criando configuração de QA"
    JWT_SECRET=$(openssl rand -hex 32)
    ADMIN_DEFAULT_PASSWORD=$(openssl rand -hex 16)
    SUPER_ADMIN_DEFAULT_PASSWORD=$(openssl rand -hex 16)
    PG_PASSWORD=$(openssl rand -hex 16)
    cat > "$ENV_FILE" <<'EOF'
DOMAIN=nxgestao.duckdns.org
CORS_ORIGIN=https://nxgestao.duckdns.org
JWT_SECRET=__GENERATED_JWT_SECRET__
ADMIN_DEFAULT_PASSWORD=__GENERATED_ADMIN_PASSWORD__
SUPER_ADMIN_EMAIL=super@nxgest.com
SUPER_ADMIN_DEFAULT_PASSWORD=__GENERATED_SUPER_PASSWORD__
PG_DB=nxgest
PG_USER=nxgest
PG_PASSWORD=__GENERATED_PG_PASSWORD__
MAIL_PROVIDER=console
RESEND_API_KEY=
MAIL_FROM_NAME="NX Gest"
MAIL_FROM_ADDRESS=no-reply@nxgest.com.br
APP_URL=https://nxgestao.duckdns.org
LOGIN_RATE_LIMIT_MAX=10
PUBLICO_RATE_LIMIT_MAX=10
USER_RATE_LIMIT_MAX=600
EOF
    sed -i \
      -e "s/__GENERATED_JWT_SECRET__/$JWT_SECRET/" \
      -e "s/__GENERATED_ADMIN_PASSWORD__/$ADMIN_DEFAULT_PASSWORD/" \
      -e "s/__GENERATED_SUPER_PASSWORD__/$SUPER_ADMIN_DEFAULT_PASSWORD/" \
      -e "s/__GENERATED_PG_PASSWORD__/$PG_PASSWORD/" \
      "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    ok ".env.staging criado"
  fi

  # 2b) Chaves PostgreSQL ausentes em .env.staging antigo (PLAN-070) — append idempotente,
  #     para staging existente que foi criado na era SQLite (sem PG_*).
  for key in PG_DB PG_USER PG_PASSWORD; do
    if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
      case "$key" in
        PG_DB) val=nxgest ;;
        PG_USER) val=nxgest ;;
        PG_PASSWORD) val=$(openssl rand -hex 16) ;;
      esac
      echo "${key}=${val}" >> "$ENV_FILE"
      info "${key} adicionado ao .env.staging"
    fi
  done
}

load_staging_env() {
  local file="$1" line key value quote
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*(#.*)?$ ]] && continue
    if [[ ! "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]]; then
      erro "Linha de configuração staging inválida"; return 1
    fi
    key="${BASH_REMATCH[1]}"; value="${BASH_REMATCH[2]}"
    case "$key" in
      DOMAIN|CORS_ORIGIN|JWT_SECRET|ADMIN_DEFAULT_PASSWORD|SUPER_ADMIN_EMAIL|SUPER_ADMIN_DEFAULT_PASSWORD|PG_DB|PG_USER|PG_PASSWORD|MAIL_PROVIDER|RESEND_API_KEY|MAIL_FROM_NAME|MAIL_FROM_ADDRESS|APP_URL|LOGIN_RATE_LIMIT_MAX|PUBLICO_RATE_LIMIT_MAX|USER_RATE_LIMIT_MAX|LEADS_RATE_LIMIT_MAX|GITHUB_TOKEN) ;;
      *) erro "Chave staging não suportada: $key"; return 1 ;;
    esac
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    quote="${value:0:1}"
    if [[ "$quote" == "\"" || "$quote" == "'" ]]; then
      if [[ ${#value} -lt 2 || "${value: -1}" != "$quote" ]]; then
        erro "Aspas inválidas em $key"; return 1
      fi
      value="${value:1:${#value}-2}"
      if [[ "$value" == *"$quote"* || "$value" == *'\'* ]]; then
        erro "Valor com escapes não suportados em $key"; return 1
      fi
    elif [[ "$value" == *'#'* ]]; then
      erro "Use aspas para # em $key"; return 1
    fi
    printf -v "$key" '%s' "$value"
    export "$key"
  done < "$file"
}
