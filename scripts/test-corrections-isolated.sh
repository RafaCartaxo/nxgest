#!/usr/bin/env bash
# Fixture only; never fall back to an unisolated execution.
set -euo pipefail
fail() { printf 'Runner isolado indisponível: %s\n' "$1" >&2; exit 1; }
root=$(cd "$(dirname "$0")/.." && pwd -P)
[[ $(uname -s) == Linux ]] || fail 'requer Linux'
command -v bwrap >/dev/null || fail 'instale bubblewrap (bwrap) com namespaces de usuário e rede permitidos'
command -v node >/dev/null || fail 'requer Node.js >=20'
node_path=$(readlink -f "$(command -v node)")
major=$(node -p 'Number(process.versions.node.split(".")[0])')
[[ $major =~ ^[0-9]+$ && $major -ge 20 ]] || fail 'requer Node.js >=20'
for cmd in docker curl ssh scp; do
  [[ -x "$root/scripts/guards/$cmd" && -f "/usr/bin/$cmd" ]] || fail "guarda ou destino /usr/bin/$cmd indisponível"
done
[[ -d /usr/local && -d /usr/sbin ]] || fail 'estrutura de diretórios Linux incompatível'
stage=$(mktemp -d "$root/.nxg035-fixture-XXXXXXXX") || fail 'não foi possível criar fixture'
trap 'rm -rf -- "$stage"' EXIT
mkdir -p "$stage/scripts" "$stage/.maestro/coord-qa/ct011-policies" "$stage/docs/engineering"
mkdir -p "$stage/infra" "$stage/.github/workflows"
cp "$root/infra/docker-compose.staging.yml" "$root/infra/docker-compose.prod.yml" "$root/infra/Caddyfile" "$root/infra/staging-known-hosts" "$stage/infra/"
cp "$root/.github/workflows/ci.yml" "$root/.github/workflows/cd.yml" "$root/.github/workflows/staging.yml" "$stage/.github/workflows/"
cp "$root/docs/engineering/06-PRODUCAO.md" "$root/docs/engineering/08-SETUP-NOVA-MAQUINA.md" "$stage/docs/engineering/"
printf %s sentinel-sintetica > "$stage/.maestro/QA-SENTINELA"
printf %s politica-preexistente > "$stage/.maestro/coord-qa/ct011-policies/approved.json"
for file in host-jq-fixture.mjs host-jq.check.mjs host-jq.sh corrections.check.mjs rollback-evidence-fixture.mjs pull-backup.sh verify-backup.sh baseline-synthetic.check.mjs baseline-evidence-fixture.mjs synthetic-safe-extract.mjs reconcile-fixture.mjs synthetic-rehearsal.mjs rehearsal-postgres-real.mjs rehearsal-postgres.check.mjs build-attestation.mjs build-attestation.check.mjs build-provider.mjs build-provider.check.mjs build-zip.mjs build-zip-fixture.mjs build-zip.check.mjs verify-build-artifact.mjs verify-build-artifact.check.mjs load-verified-image.sh load-verified-image.check.mjs deploy-transition.check.mjs deploy-bootstrap.sh deploy-staging.sh deploy.sh deploy-recover-legacy.sh staging-env.sh staging-transport.sh initial-baseline.sh initial-baseline.check.mjs container-health.sh container-health.check.mjs verify-staging-receipt.mjs verify-staging-receipt.check.mjs backup-recovery.check.mjs backup-nxgest.sh rollback-preflight.sh verify-rollback-return.sh; do
  cp "$root/scripts/$file" "$stage/scripts/$file"
done
# Evitar mascarar /usr/bin quando /usr/sbin é um link para ele.
sbin_mount=()
if [[ ! -L /usr/sbin ]]; then sbin_mount=(--tmpfs /usr/sbin); fi
# /usr/local e /usr/sbin (quando diretório separado) ficam vazios; /usr/bin/{docker,curl,ssh,scp} são cobertos
# mesmo para chamadas absolutas. O checkout, homes e sockets do host não são montados.
bwrap --unshare-user --unshare-net --unshare-pid --die-with-parent \
  --ro-bind /usr /usr --tmpfs /usr/local "${sbin_mount[@]}" \
  --ro-bind /lib /lib --ro-bind /lib64 /lib64 --symlink usr/bin /bin --symlink usr/sbin /sbin \
  --proc /proc --dev /dev --tmpfs /tmp --dir /runtime \
  --ro-bind "$node_path" /runtime/node \
  --ro-bind "$root/scripts/guards" /guard \
  --ro-bind "$root/scripts/guards/docker" /usr/bin/docker \
  --ro-bind "$root/scripts/guards/curl" /usr/bin/curl \
  --ro-bind "$root/scripts/guards/ssh" /usr/bin/ssh \
  --ro-bind "$root/scripts/guards/scp" /usr/bin/scp \
  --bind "$stage" /work --chdir /work --clearenv \
  --setenv PATH /guard:/usr/bin --setenv HOME /nonexistent --setenv DOCKER_HOST unix:///nao-existe \
  -- /bin/bash -c '
    for cmd in docker curl ssh scp; do
      [ "$(command -v "$cmd")" = "/guard/$cmd" ] || exit 80
      "$cmd" __probe__ >/dev/null 2>&1; [ "$?" = 97 ] || exit 81
      "/usr/bin/$cmd" __probe__ >/dev/null 2>&1; [ "$?" = 97 ] || exit 82
    done
    /runtime/node -e '\''const {spawnSync}=require("node:child_process");for(const c of ["docker","curl","ssh","scp"])if(spawnSync("/usr/bin/"+c,["__probe__"]).status!==97)process.exit(1)'\'' || exit 83
    printf "GUARDAS E SUBPROCESSOS CONFIRMADOS; rede isolada\n"
    /runtime/node --test scripts/host-jq.check.mjs scripts/corrections.check.mjs scripts/baseline-synthetic.check.mjs scripts/rehearsal-postgres.check.mjs scripts/build-attestation.check.mjs scripts/build-provider.check.mjs scripts/build-zip.check.mjs scripts/verify-build-artifact.check.mjs scripts/load-verified-image.check.mjs scripts/deploy-transition.check.mjs scripts/initial-baseline.check.mjs scripts/container-health.check.mjs scripts/verify-staging-receipt.check.mjs scripts/backup-recovery.check.mjs
    status=$?
    [ "$(cat /work/.maestro/QA-SENTINELA)" = sentinel-sintetica ] || exit 84
    [ "$(cat /work/.maestro/coord-qa/ct011-policies/approved.json)" = politica-preexistente ] || exit 85
    printf "SENTINELA E POLÍTICA PREEXISTENTE PRESERVADAS\n"
    exit "$status"
  ' || fail 'namespace, guardas ou testes falharam'
