#!/usr/bin/env bash
# Validação operacional de retorno; não executa restore ou alteração de serviço.
set -euo pipefail
bundle=${1:-}; sha=${2:-}; health_url=${3:-}; integrity_evidence=${4:-}
fail() { printf 'Retorno não verificado: %s\n' "$1" >&2; exit 1; }
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || fail 'SHA inválido'
[[ "$health_url" =~ ^https?://[A-Za-z0-9._:-]+/api/health$ ]] || fail 'URL de health inválida'
[[ -f "$integrity_evidence" && ! -L "$integrity_evidence" ]] || fail 'evidência de integridade ausente'
# Declaração operacional explícita: a comparação de dados é humana/externa.
[[ "$(cat "$integrity_evidence")" == "sha=$sha integrity=verified" ]] || fail 'integridade não confirmada'
script_dir=$(cd "$(dirname "$0")" && pwd)
bash "$script_dir/verify-backup.sh" "$bundle" >/dev/null || fail 'conjunto inválido'
response=$(curl -fsS --max-time 5 "$health_url") || fail 'health indisponível'
printf '%s' "$response" | jq -e 'type == "object" and .status == "ok" and .db == "connected"' >/dev/null || fail 'health negativo ou ambíguo'
fail 'NO-GO: SHA efetivo e integridade restaurada não possuem fonte verificável definida'
