#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd -P)
for cmd in docker curl ssh scp gh; do [[ -x "$root/scripts/guards/$cmd" && -f "/usr/bin/$cmd" ]] || exit 80; done
node_path=$(readlink -f "$(command -v node)")
bwrap --unshare-user --unshare-net --unshare-pid --die-with-parent \
 --ro-bind /usr /usr --tmpfs /usr/local --ro-bind /lib /lib --ro-bind /lib64 /lib64 \
 --symlink usr/bin /bin --proc /proc --dev /dev --tmpfs /tmp --dir /runtime --dir /opt --tmpfs /work --dir /work/scripts \
 --ro-bind "$node_path" /runtime/node --ro-bind "$root/scripts/guards" /guard \
 --ro-bind "$root/scripts/guards/docker" /usr/bin/docker --ro-bind "$root/scripts/guards/curl" /usr/bin/curl \
 --ro-bind "$root/scripts/guards/ssh" /usr/bin/ssh --ro-bind "$root/scripts/guards/scp" /usr/bin/scp --ro-bind "$root/scripts/guards/gh" /usr/bin/gh \
 --ro-bind "$root/infra/staging-known-hosts" /work/staging-known-hosts \
 --ro-bind "$root/.github/workflows/cd.yml" /work/cd.yml \
 --ro-bind "$root/.github/workflows/staging.yml" /work/staging.yml \
 --ro-bind "$root/scripts/production-post-baseline-workflow.check.mjs" /work/scripts/production-post-baseline-workflow.check.mjs \
 --ro-bind "$root/scripts/staging-transport.sh" /work/scripts/staging-transport.sh \
 --ro-bind "$root/scripts/staging-transport.sh" /work/staging-transport.sh \
 --ro-bind "$root/scripts/staging-post-baseline-entry.sh" /work/staging-post-baseline-entry.sh \
 --ro-bind "$root/scripts/staging-post-baseline-entry.check.sh" /work/staging-post-baseline-entry.check.sh \
 --ro-bind "$root/scripts/cd-materialize-fixture.mjs" /work/scripts/cd-materialize-fixture.mjs \
 --ro-bind "$root/scripts/production-post-baseline-fixture-select.mjs" /work/scripts/production-post-baseline-fixture-select.mjs \
 --ro-bind "$root/scripts/production-post-baseline-source.mjs" /work/scripts/production-post-baseline-source.mjs \
 --ro-bind "$root/scripts/production-post-baseline-source.check.mjs" /work/scripts/production-post-baseline-source.check.mjs \
 --ro-bind "$root/scripts/recurring-source.check.mjs" /work/scripts/recurring-source.check.mjs \
 --ro-bind "$root/scripts/recurring-controller-trust.check.sh" /work/scripts/recurring-controller-trust.check.sh \
 --ro-bind "$root/scripts/recurring-staging-gateway.sh" /work/scripts/recurring-staging-gateway.sh \
 --ro-bind "$root/scripts/production-post-baseline-preflight.sh" /work/scripts/production-post-baseline-preflight.sh \
 --ro-bind "$root/scripts/production-post-baseline-preflight.check.sh" /work/scripts/production-post-baseline-preflight.check.sh \
 --ro-bind "$root/scripts/production-preclients-policy.sh" /work/scripts/production-preclients-policy.sh \
 --ro-bind "$root/scripts/production-preclients-policy.check.sh" /work/scripts/production-preclients-policy.check.sh \
 --ro-bind "$root/scripts/production-preclients-source-fixture.mjs" /work/scripts/production-preclients-source-fixture.mjs \
 --ro-bind "$root/scripts/deploy-bootstrap.sh" /work/scripts/deploy-bootstrap.sh \
 --ro-bind "$root/scripts/production-preclients.sh" /work/scripts/production-preclients.sh \
 --ro-bind "$root/scripts/production-preclients-finalize.sh" /work/scripts/production-preclients-finalize.sh \
 --ro-bind "$root/scripts/host-jq.sh" /work/scripts/host-jq.sh \
 --ro-bind "$root/scripts/host-jq-fixture.mjs" /work/scripts/host-jq-fixture.mjs \
 --ro-bind "$root/scripts/load-verified-image.sh" /work/scripts/load-verified-image.sh \
 --ro-bind "$root/scripts/retain-verified-image.sh" /work/scripts/retain-verified-image.sh \
 --ro-bind "$root/scripts/container-health.sh" /work/scripts/container-health.sh \
 --ro-bind "$root/scripts/cd-post-baseline-fixture.mjs" /work/scripts/cd-post-baseline-fixture.mjs \
 --ro-bind "$root/scripts/verify-build-artifact.mjs" /work/scripts/verify-build-artifact.mjs \
 --ro-bind "$root/scripts/verify-staging-receipt.mjs" /work/scripts/verify-staging-receipt.mjs \
 --ro-bind "$root/scripts/build-provider.mjs" /work/scripts/build-provider.mjs \
 --ro-bind "$root/scripts/build-attestation.mjs" /work/scripts/build-attestation.mjs \
 --ro-bind "$root/scripts/build-zip.mjs" /work/scripts/build-zip.mjs \
 --chdir /work --clearenv --setenv PATH /guard:/runtime:/usr/bin --setenv HOME /nonexistent --setenv DOCKER_HOST unix:///nao-existe \
 -- /bin/bash -c '
  for cmd in docker curl ssh scp gh; do
    [ "$(command -v "$cmd")" = "/guard/$cmd" ] || exit 81
    "$cmd" __probe__ >/dev/null 2>&1; [ "$?" = 97 ] || exit 82
    "/usr/bin/$cmd" __probe__ >/dev/null 2>&1; [ "$?" = 97 ] || exit 83
  done
  /runtime/node -e '\''const {spawnSync}=require("node:child_process");for(const c of ["docker","curl","ssh","scp","gh"])if(spawnSync("/usr/bin/"+c,["__probe__"]).status!==97)process.exit(1)'\'' || exit 84
  [ ! -e /etc ] && [ ! -e /home ] && [ ! -e /var/run/docker.sock ] || exit 85
  echo "GUARDAS PATH/ABSOLUTOS/SUBPROCESSOS CONFIRMADAS; rede e socket isolados"
  /bin/bash /work/scripts/production-preclients-policy.check.sh || exit 88
  /bin/bash /work/scripts/recurring-controller-trust.check.sh || exit 89
  CD_FIXTURE_SCENARIO=trusted /bin/bash /work/staging-post-baseline-entry.check.sh || exit 90
  /bin/bash -n /work/scripts/production-post-baseline-preflight.sh || exit 86
  /bin/bash /work/scripts/production-post-baseline-preflight.check.sh || exit 87
  /runtime/node --test /work/scripts/production-post-baseline-source.check.mjs /work/scripts/production-post-baseline-workflow.check.mjs /work/scripts/recurring-source.check.mjs
 '
