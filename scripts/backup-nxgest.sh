#!/usr/bin/env bash
set -euo pipefail
umask 077

# Instalação operacional: ajustar apenas por procedimento autorizado.
PROJECT_DIR=/opt/nxgestao
BACKUP_DIR=/opt/backups
ENV_FILE=/opt/nxgestao/.env
CONTAINER=nxgest-postgres
APP=nxgestao-app-1

fail() { printf 'ERRO: %s\n' "$1" >&2; exit 1; }
[ -f "$ENV_FILE" ] || fail 'Configuração de banco ausente'

# Ler apenas as três chaves necessárias como dados; nunca executar o env.
PG_USER= PG_DB= PG_PASSWORD=
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  [[ "$line" =~ ^[[:space:]]*(#.*)?$ ]] && continue
  [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]] || fail 'Linha de configuração inválida'
  key=${BASH_REMATCH[1]}; value=${BASH_REMATCH[2]}
  case "$key" in PG_USER|PG_DB|PG_PASSWORD) ;; *) continue ;; esac
  value="${value#"${value%%[![:space:]]*}"}"; value="${value%"${value##*[![:space:]]}"}"
  quote=${value:0:1}
  if [[ "$quote" == '"' || "$quote" == "'" ]]; then
    [[ ${#value} -ge 2 && "${value: -1}" == "$quote" ]] || fail 'Aspas inválidas na configuração'
    value="${value:1:${#value}-2}"
    [[ "$value" != *"$quote"* && "$value" != *'\'* ]] || fail 'Escape não suportado na configuração'
  else
    [[ "$value" != *'#'* ]] || fail 'Comentário não suportado na configuração'
  fi
  printf -v "$key" '%s' "$value"
done < "$ENV_FILE"
[[ -n "$PG_USER" && -n "$PG_DB" && -n "$PG_PASSWORD" ]] || fail 'Chaves de banco ausentes'
export PGPASSWORD="$PG_PASSWORD"
unset PG_PASSWORD value line

# Compartilhar o mesmo descritor do deploy ou adquirir o lock como backup manual.
lock="$PROJECT_DIR/.git/nxgest-deploy.lock"
if { true >&9; } 2>/dev/null; then
  [[ "$(stat -Lc '%d:%i' /proc/$$/fd/9)" == "$(stat -Lc '%d:%i' "$lock")" ]] || fail 'Descritor de lock divergente'
else
  exec 9>"$lock"
fi
flock -n 9 || fail 'Outra operação ocupa o lock'

mkdir -p "$BACKUP_DIR"
id="$(date -u +%Y%m%dT%H%M%SZ)-$$-$RANDOM"
partial=$(mktemp -d "$BACKUP_DIR/.partial-${id}.XXXXXXXX")
final="$BACKUP_DIR/$id"
[ ! -e "$final" ] || fail 'Identificador de backup já existe'

# Os comandos selecionam somente campos não secretos da configuração de runtime.
image=$(docker inspect --format '{{.Image}}' "$APP") || fail 'Imagem atual indisponível'
[[ "$image" =~ ^sha256:[a-f0-9]{64}$ ]] || fail 'Identidade da imagem inválida'
docker image inspect "$image" >/dev/null || fail 'Imagem anterior não encontrada'
docker inspect --format '{{range .Mounts}}{{.Type}}|{{.Name}}|{{.Destination}}|{{.RW}}{{println}}{{end}}' "$APP" > "$partial/mounts.txt" || fail 'Configuração de mounts indisponível'
[ -s "$partial/mounts.txt" ] || fail 'Montagens não comprovadas'
awk -F'|' '$1 == "volume" && $2 != "" && $3 == "/data" { found=1 } END { exit !found }' "$partial/mounts.txt" || fail 'Volume de dados não identificado'
# Caminhos de origem podem conter dados sensíveis: registrar apenas digest.
docker inspect --format '{{range .Mounts}}{{.Source}}{{println}}{{end}}' "$APP" | sha256sum | awk '{print $1}' > "$partial/mount-sources.sha256" || fail 'Origens dos mounts não verificáveis'
docker inspect --format '{{.Config.Image}}|{{.Config.WorkingDir}}|{{.Config.User}}|{{.HostConfig.NetworkMode}}|{{.HostConfig.RestartPolicy.Name}}' "$APP" > "$partial/runtime-config.txt" || fail 'Configuração de runtime indisponível'
[ -s "$partial/runtime-config.txt" ] || fail 'Configuração não comprovada'
awk -F'|' 'NF >= 5 && $1 != "" { found=1 } END { exit !found }' "$partial/runtime-config.txt" || fail 'Configuração de runtime incompleta'

# stdout é dirigido a arquivos privados; Docker recebe a senha apenas por ambiente.
docker exec -e PGPASSWORD "$CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" -Fc > "$partial/database.dump" || fail 'Falha no dump'
[ -s "$partial/database.dump" ] || fail 'Dump vazio'
docker exec -i "$CONTAINER" pg_restore -l < "$partial/database.dump" >/dev/null || fail 'Dump inválido'
# Diretório vazio é legítimo; ausência, leitura negada ou erro de tar falham.
docker exec "$APP" sh -c 'test -d /data/uploads && test -r /data/uploads && test -x /data/uploads' || fail 'Anexos inacessíveis ou ausentes'
docker exec "$APP" tar -C /data -czf - uploads > "$partial/uploads.tar.gz" || fail 'Falha no arquivo de anexos'
gzip -t "$partial/uploads.tar.gz" || fail 'Arquivo de anexos inválido'
tar -tzf "$partial/uploads.tar.gz" >/dev/null || fail 'Tar de anexos inválido'

# Tag dedicada preserva a imagem mesmo após eventual limpeza de imagens sem tag.
tag="nxgest-rollback:$id"
docker image tag "$image" "$tag" || fail 'Não foi possível preservar imagem anterior'
retained=$(docker image inspect --format '{{.Id}}' "$tag") || fail 'Imagem preservada não verificável'
[ "$retained" = "$image" ] || fail 'Identidade da imagem preservada diverge'

# A marca só aparece após publicar os componentes verificados.
target_sha=${NXGEST_DEPLOY_SHA:-unknown}
[[ "$target_sha" == unknown || "$target_sha" =~ ^[a-f0-9]{40}$ ]] || fail 'SHA alvo inválido'
printf 'id=%s\nimage=%s\ntag=%s\ntarget_sha=%s\n' "$id" "$image" "$tag" "$target_sha" > "$partial/metadata.txt"
(cd "$partial" && sha256sum database.dump uploads.tar.gz mounts.txt mount-sources.sha256 runtime-config.txt metadata.txt > SHA256SUMS && sha256sum -c SHA256SUMS >/dev/null)
[ ! -e "$final" ] || fail 'Colisão de identificador de backup'
mv -T --no-clobber "$partial" "$final"
[ ! -e "$partial" ] && [ -d "$final" ] || fail 'Publicação do conjunto recusada'
printf '%s\n' "$id" > "$final/.complete-tmp"
mv -T --no-clobber "$final/.complete-tmp" "$final/COMPLETE"
[ ! -e "$final/.complete-tmp" ] && [ -f "$final/COMPLETE" ] || fail 'Marca de conclusão recusada'
printf 'Backup íntegro criado: %s\n' "$id"
