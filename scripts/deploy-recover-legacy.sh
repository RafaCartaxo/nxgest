#!/usr/bin/env bash
# Lido de um SHA controlador confiável, após adquirir o lock e buscar o alvo.
# Restaura somente o checkout; não executa script legado nem opera serviços.
set -euo pipefail
legacy=${1:-}
[[ "$legacy" =~ ^[0-9a-f]{40}$ ]] || { echo 'SHA legado inválido' >&2; exit 1; }
flock -n 9 || { echo 'Lock do deploy ausente ou ocupado' >&2; exit 1; }
git cat-file -e "$legacy^{commit}"
[ "$(git rev-parse "$legacy^{commit}")" = "$legacy" ] || { echo 'SHA não identifica commit exato' >&2; exit 1; }
if git cat-file -e "$legacy:scripts/deploy-bootstrap.sh" 2>/dev/null; then
  echo 'O alvo possui bootstrap; use o fluxo normal' >&2; exit 1
fi
# Exigir layout antigo reconhecível; isso não prova compatibilidade operacional.
for file in docker-compose.yml docker-compose.prod.yml docker-compose.staging.yml Caddyfile; do
  git cat-file -e "$legacy:$file" || { echo 'Layout legado incompleto' >&2; exit 1; }
done
status=$(git status --porcelain --untracked-files=all)
[ -z "$status" ] || { echo 'Checkout contém alterações; recuperação interrompida' >&2; exit 1; }
# O backup instalado é responsabilidade operacional; ausência/falha aborta.
[ -x /opt/scripts/backup-nxgest.sh ] || { echo 'Backup obrigatório indisponível' >&2; exit 1; }
/opt/scripts/backup-nxgest.sh
marker=$(git rev-parse --git-path nxgest-staging-sha)
: > "$marker"
# Não sobrescreve envs nem outros arquivos ignorados em conflito.
git checkout --detach --no-overwrite-ignore "$legacy"
[ "$(git rev-parse HEAD)" = "$legacy" ] || { echo 'Checkout não corresponde ao SHA legado' >&2; exit 1; }
printf '%s\n' 'Checkout legado restaurado; nenhum serviço foi alterado.'
