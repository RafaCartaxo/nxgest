#!/usr/bin/env bash
# Valida evidências e imagem; não restaura dados nem altera serviços.
set -euo pipefail
bundle=${1:-}; evidence=${2:-}; config_proof=${3:-}; schema_proof=${4:-}
fail() { printf 'Pré-condição de rollback não satisfeita: %s\n' "$1" >&2; exit 1; }
[ -f "$evidence" ] && [ -f "$config_proof" ] && [ -f "$schema_proof" ] || fail 'evidências ausentes'
[ -s "$config_proof" ] && [ -s "$schema_proof" ] || fail 'evidência vazia'
script_dir=$(cd "$(dirname "$0")" && pwd)
bash "$script_dir/verify-backup.sh" "$bundle" >/dev/null || fail 'conjunto inválido'
declare -A fields=()
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^([a-z_0-9]+)=([A-Za-z0-9:_-]+)$ ]] || fail 'formato de evidência inválido'
  k=${BASH_REMATCH[1]}; v=${BASH_REMATCH[2]}
  case "$k" in previous_sha|target_sha|image|mounts_sha256|sources_sha256|runtime_sha256|config_sha256|schema_sha256|schema_status|strategy|loss_decision|authorization|reviewer) ;; *) fail 'chave de evidência não suportada' ;; esac
  [[ -z "${fields[$k]:-}" ]] || fail 'chave de evidência duplicada'
  fields[$k]=$v
done < "$evidence"
[[ "${fields[previous_sha]:-}" =~ ^[a-f0-9]{40}$ && "${fields[target_sha]:-}" =~ ^[a-f0-9]{40}$ ]] || fail 'SHA ausente'
if [[ -n "${NXGEST_DEPLOY_SHA:-}" && "${fields[target_sha]:-}" != "$NXGEST_DEPLOY_SHA" ]]; then fail 'SHA alvo não corresponde ao deploy'; fi
[[ "${fields[image]:-}" =~ ^sha256:[a-f0-9]{64}$ ]] || fail 'imagem ausente'
[[ "${fields[mounts_sha256]:-}" =~ ^[a-f0-9]{64}$ && "${fields[sources_sha256]:-}" =~ ^[a-f0-9]{64}$ && "${fields[runtime_sha256]:-}" =~ ^[a-f0-9]{64}$ && "${fields[config_sha256]:-}" =~ ^[a-f0-9]{64}$ && "${fields[schema_sha256]:-}" =~ ^[a-f0-9]{64}$ ]] || fail 'hash de evidência ausente'
[[ "${fields[schema_status]:-}" == compatible ]] || fail 'compatibilidade de schema não comprovada'
# A estrutura permite detectar contradições, mas não autentica o revisor nem prova compatibilidade.
mapfile -t schema_lines < "$schema_proof"
[[ ${#schema_lines[@]} -eq 3 ]] || fail 'evidência estruturada de schema inválida'
[[ "${schema_lines[0]}" == "schema_status=${fields[schema_status]}" ]] || fail 'contradição de schema'
[[ "${schema_lines[1]}" == "previous_sha=${fields[previous_sha]}" ]] || fail 'objeto revisado divergente'
[[ "${schema_lines[2]}" == "reviewer=${fields[reviewer]:-}" && -n "${fields[reviewer]:-}" ]] || fail 'revisor divergente'

[[ "${fields[strategy]:-}" == application || "${fields[strategy]:-}" == data ]] || fail 'estratégia não escolhida'
[[ "${fields[loss_decision]:-}" == acknowledged && "${fields[authorization]:-}" == approved && -n "${fields[reviewer]:-}" ]] || fail 'decisão ou autorização ausente'
[[ "$(sed -n '2p' "$bundle/metadata.txt")" == "image=${fields[image]}" ]] || fail 'imagem diverge do conjunto'
recorded_target=$(sed -n '4s/^target_sha=//p' "$bundle/metadata.txt")
[[ "$recorded_target" == unknown || "$recorded_target" == "${fields[target_sha]}" ]] || fail 'SHA do conjunto diverge'
mounts=$(sha256sum "$bundle/mounts.txt"); mounts=${mounts%% *}
sources=$(cat "$bundle/mount-sources.sha256")
runtime=$(sha256sum "$bundle/runtime-config.txt"); runtime=${runtime%% *}
config=$(sha256sum "$config_proof"); config=${config%% *}
schema=$(sha256sum "$schema_proof"); schema=${schema%% *}
[[ "$mounts" == "${fields[mounts_sha256]}" && "$sources" == "${fields[sources_sha256]}" && "$runtime" == "${fields[runtime_sha256]}" && "$config" == "${fields[config_sha256]}" && "$schema" == "${fields[schema_sha256]}" ]] || fail 'configuração, mounts ou schema divergentes'
tag=$(sed -n '3s/^tag=//p' "$bundle/metadata.txt")
[[ "$tag" =~ ^nxgest-rollback:[0-9]{8}T[0-9]{6}Z-[0-9]+-[0-9]+$ ]] || fail 'tag de imagem inválida'
image=$(docker image inspect --format '{{.Id}}' "$tag") || fail 'imagem preservada indisponível'
[[ "$image" == "${fields[image]}" ]] || fail 'imagem preservada divergente'
fail 'NO-GO: origem da imagem e compatibilidade real ainda não possuem fonte verificável definida'
