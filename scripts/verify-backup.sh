#!/usr/bin/env bash
# Verifica associação/integridade; não executa restauração de dados.
set -euo pipefail
bundle=${1:-}
[[ -d "$bundle" && ! -L "$bundle" && -f "$bundle/COMPLETE" ]] || { echo 'Conjunto incompleto' >&2; exit 1; }
id=$(cat "$bundle/COMPLETE")
[[ "$id" =~ ^[0-9]{8}T[0-9]{6}Z-[0-9]+-[0-9]+$ && "$id" = "$(basename "$bundle")" ]] || { echo 'Identificador inválido' >&2; exit 1; }
for f in database.dump uploads.tar.gz mounts.txt mount-sources.sha256 runtime-config.txt metadata.txt SHA256SUMS COMPLETE; do
  [[ -f "$bundle/$f" && ! -L "$bundle/$f" ]] || { echo 'Artefato ausente ou inválido' >&2; exit 1; }
done
[[ "$(wc -l < "$bundle/SHA256SUMS")" -eq 6 ]] || { echo 'Manifesto inválido' >&2; exit 1; }
for f in database.dump uploads.tar.gz mounts.txt mount-sources.sha256 runtime-config.txt metadata.txt; do
  expected=$(awk -v f="$f" '$2 == f { print $1 }' "$bundle/SHA256SUMS")
  [[ "$expected" =~ ^[a-f0-9]{64}$ ]] || { echo 'Hash ausente ou ambíguo' >&2; exit 1; }
  actual=$(sha256sum "$bundle/$f"); actual=${actual%% *}
  [[ "$actual" = "$expected" ]] || { echo 'Integridade divergente' >&2; exit 1; }
done
[[ "$(sed -n '1p' "$bundle/metadata.txt")" = "id=$id" ]] || { echo 'Associação divergente' >&2; exit 1; }
gzip -t "$bundle/uploads.tar.gz"
tar -tzf "$bundle/uploads.tar.gz" >/dev/null
[ -s "$bundle/database.dump" ] && [ -s "$bundle/mounts.txt" ] && [ -s "$bundle/runtime-config.txt" ] || { echo 'Artefato vazio' >&2; exit 1; }
printf '%s\n' 'Integridade do conjunto verificada; restauração real não comprovada.'
