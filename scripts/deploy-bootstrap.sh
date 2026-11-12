#!/usr/bin/env bash
# Executado a partir do SHA alvo por git show, após fetch e lock do checkout.
set -euo pipefail
mode=${1:-}
sha=${2:-}
[[ "$mode" == staging || "$mode" == production || "$mode" == production-initial ]] || { echo 'Modo inválido' >&2; exit 1; }
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'SHA inválido' >&2; exit 1; }
# O lock é herdado pelo descritor 9 da entrada automatizada ou manual.
flock -n 9 || { echo 'Lock do deploy ausente ou ocupado' >&2; exit 1; }
git cat-file -e "$sha^{commit}"
[ "$(git rev-parse "$sha^{commit}")" = "$sha" ] || { echo 'SHA não identifica commit exato' >&2; exit 1; }
git cat-file -e "$sha:scripts/host-jq.sh" || { echo 'Verificador jq ausente' >&2; exit 1; }
source <(git show "$sha:scripts/host-jq.sh")
type nxgest_use_jq >/dev/null 2>&1 && nxgest_use_jq || { echo 'jq portátil inválido' >&2; exit 1; }
status=$(git status --porcelain --untracked-files=all)
[ -z "$status" ] || { echo 'Checkout contém alterações; deploy interrompido' >&2; exit 1; }
marker=$(git rev-parse --git-path nxgest-staging-sha)
state=$(git rev-parse --git-path nxgest-staging-selection)
pending=$(git rev-parse --git-path nxgest-staging-pending)
[ ! -e "$pending" ] && [ ! -L "$pending" ] || { echo 'Staging pendente exige recuperação' >&2; exit 1; }
if [[ "$mode" = production || "$mode" = production-initial ]]; then
  [ -f "$marker" ] && [ ! -L "$marker" ] && [ "$(cat "$marker")" = "$sha" ] || { echo 'SHA não validado no staging; produção bloqueada' >&2; exit 1; }
fi
if [ "$mode" = staging ]; then
  artifact=${3:-}; image_digest=${4:-}; zip_digest=${5:-}; run_id=${6:-}; attempt=${7:-}; artifact_id=${8:-}
  [[ "$image_digest" =~ ^sha256:[a-f0-9]{64}$ && "$zip_digest" =~ ^sha256:[a-f0-9]{64}$ && "$run_id" =~ ^[0-9]+$ && "$attempt" == 1 && "$artifact_id" =~ ^[0-9]+$ && -f "$artifact" && ! -L "$artifact" ]] || { echo 'Seleção staging inválida' >&2; exit 1; }
  actual=$(sha256sum -- "$artifact"); actual=${actual%% *}
  [[ "sha256:$actual" == "$image_digest" ]] || { echo 'Tar divergente' >&2; exit 1; }
  if [ -e "$state" ] || [ -L "$state" ]; then
    [ -f "$state" ] && [ ! -L "$state" ] && [ "$(stat -c %u "$state")" = "$(id -u)" ] && [[ "$(stat -c %a "$state")" =~ ^[46]00$ ]] || { echo 'Estado staging inseguro' >&2; exit 1; }
    mapfile -t previous < "$state"
    [[ ${#previous[@]} -eq 8 && "${previous[0]}" == 'environment=staging' && "${previous[1]}" =~ ^sha=([a-f0-9]{40})$ && "${previous[2]}" =~ ^run=([0-9]+)$ && "${previous[3]}" == 'attempt=1' && "${previous[4]}" =~ ^artifact=([0-9]+)$ && "${previous[5]}" =~ ^zip=sha256:([a-f0-9]{64})$ && "${previous[6]}" =~ ^tar=sha256:([a-f0-9]{64})$ && "${previous[7]}" =~ ^image=sha256:([a-f0-9]{64})$ ]] || { echo 'Estado staging inválido' >&2; exit 1; }
    prev_sha=${previous[1]#sha=}; image_id=${previous[7]#image=}
    [ -f "$marker" ] && [ ! -L "$marker" ] && [ "$(cat "$marker")" = "$prev_sha" ] && [ "$(git rev-parse HEAD)" = "$prev_sha" ] || { echo 'Estado staging inconsistente' >&2; exit 1; }
    if [ "$prev_sha" = "$sha" ]; then
      [[ "${previous[2]}" == "run=$run_id" && "${previous[3]}" == "attempt=$attempt" && "${previous[4]}" == "artifact=$artifact_id" && "${previous[5]}" == "zip=$zip_digest" && "${previous[6]}" == "tar=$image_digest" ]] || { echo 'Repetição staging divergente' >&2; exit 1; }
      [[ "$(docker inspect --format '{{.Image}}' staging-app)" == "$image_id" && "$(docker image inspect --format '{{.Id}}' "$image_id")" == "$image_id" ]] || { echo 'Imagem staging divergente' >&2; exit 1; }
      retry_container=$(docker inspect --format '{{.Id}}' staging-app)
      [[ "$retry_container" =~ ^[a-f0-9]{64}$ ]] || { echo 'Container staging inválido' >&2; exit 1; }
      bash scripts/container-health.sh "$retry_container" "$image_id" || { echo 'Health interno staging divergente' >&2; exit 1; }
      curl -fsS --max-time 5 https://nxgestao.duckdns.org/api/health | "$NXGEST_JQ" -e 'type == "object" and .status == "ok" and .db == "connected"' >/dev/null || { echo 'Health staging divergente' >&2; exit 1; }
      [[ "$(docker inspect --format '{{.Id}}' staging-app)" == "$retry_container" && "$(docker inspect --format '{{.Image}}' "$retry_container")" == "$image_id" ]] || { echo 'Container staging alterado' >&2; exit 1; }
      printf 'STAGING_RETRY verificado\nSTAGING_RECEIPT sha=%s run=%s attempt=%s artifact=%s zip=%s tar=%s image=%s\n' "$sha" "$run_id" "$attempt" "$artifact_id" "$zip_digest" "$image_digest" "$image_id"
      exit 0
    fi
    git merge-base --is-ancestor "$prev_sha" "$sha" || { echo 'Replay ou candidato não descendente' >&2; exit 1; }
  else
    [ ! -e "$marker" ] && [ ! -L "$marker" ] || { echo 'Estado staging ausente' >&2; exit 1; }
    existing=$(docker ps -aq --no-trunc --filter 'name=^/staging-app$') || { echo 'Estado do serviço indisponível' >&2; exit 1; }
    [ -z "$existing" ] || { echo 'Serviço existente sem estado controlado' >&2; exit 1; }
  fi
  (umask 077; set -C; printf 'pending=%s\n' "$sha" > "$pending") || { echo 'Não foi possível reservar staging' >&2; exit 1; }
fi
# --no-overwrite-ignore impede sobrescrever também arquivos ignorados, inclusive envs.
git checkout --detach --no-overwrite-ignore "$sha"
[ "$(git rev-parse HEAD)" = "$sha" ] || { echo 'Checkout não corresponde ao SHA' >&2; exit 1; }
export NXGEST_DEPLOY_MODE="$mode" NXGEST_DEPLOY_SHA="$sha"
if [ "$mode" = staging ]; then
  export NXGEST_IMAGE_TAR="$artifact" NXGEST_IMAGE_DIGEST="$image_digest"
  image_id=$(bash scripts/deploy-staging.sh)
  [[ "$image_id" =~ ^sha256:[a-f0-9]{64}$ ]] || { echo 'Identidade staging inválida' >&2; exit 1; }
  state_tmp=$(mktemp "${state}.tmp.XXXXXXXX"); marker_tmp=$(mktemp "${marker}.tmp.XXXXXXXX")
  chmod 600 "$state_tmp" "$marker_tmp"
  printf 'environment=staging\nsha=%s\nrun=%s\nattempt=%s\nartifact=%s\nzip=%s\ntar=%s\nimage=%s\n' "$sha" "$run_id" "$attempt" "$artifact_id" "$zip_digest" "$image_digest" "$image_id" > "$state_tmp"
  printf '%s\n' "$sha" > "$marker_tmp"
  mv -f -- "$state_tmp" "$state"
  mv -f -- "$marker_tmp" "$marker"
  rm -- "$pending"
  printf 'STAGING_RECEIPT sha=%s run=%s attempt=%s artifact=%s zip=%s tar=%s image=%s\n' "$sha" "$run_id" "$attempt" "$artifact_id" "$zip_digest" "$image_digest" "$image_id"
elif [ "$mode" = production-initial ]; then
  bash scripts/initial-baseline.sh "${3:-}" "${4:-}" "${5:-}" "${6:-}" "${7:-}" "${8:-}" "${9:-}" "${10:-}"
else
  unset NXGEST_SKIP_BACKUP
  bash scripts/deploy.sh
fi
