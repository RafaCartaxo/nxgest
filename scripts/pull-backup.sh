#!/usr/bin/env bash
# Copia um conjunto identificado; não comprova autenticidade de origem nem restore.
set -euo pipefail
umask 077
id=${1:-}; destination=${2:-}; host=${3:-}; key=${4:-}
fail() { printf 'Cópia não verificada: %s\n' "$1" >&2; exit 1; }
[[ "$id" =~ ^[0-9]{8}T[0-9]{6}Z-[0-9]+-[0-9]+$ ]] || fail 'ID inválido'
[[ -n "$destination" && "$host" =~ ^[A-Za-z0-9_][A-Za-z0-9_.@-]*$ && -n "$key" && -f "$key" ]] || fail 'argumentos ausentes ou inválidos'
[[ -d "$destination" && ! -L "$destination" ]] || fail 'destino indisponível'
[[ ! -e "$destination/$id" && ! -L "$destination/$id" ]] || fail 'conjunto já existe'
stage=$(mktemp -d "$destination/.nxgest-copy-XXXXXXXX") || fail 'falha ao criar staging'
trap 'rm -rf -- "$stage"' EXIT
ssh -i "$key" -o BatchMode=yes -o ConnectTimeout=5 "$host" true >/dev/null || fail 'origem indisponível'
scp -r -i "$key" -o BatchMode=yes -- "$host:/opt/backups/$id" "$stage/" >/dev/null || fail 'transferência falhou'
[[ -d "$stage/$id" && ! -L "$stage/$id" ]] || fail 'conjunto ausente'
bash "$(dirname "$0")/verify-backup.sh" "$stage/$id" >/dev/null || fail 'conjunto inválido'
mv -T --no-clobber "$stage/$id" "$destination/$id" || fail 'publicação falhou'
[[ ! -e "$stage/$id" && -d "$destination/$id" ]] || fail 'colisão na publicação'
printf 'Cópia íntegra verificada: %s\n' "$id"
