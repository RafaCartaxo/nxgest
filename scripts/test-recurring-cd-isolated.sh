#!/usr/bin/env bash
# Essential recurring-CD integration. No unisolated fallback.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd -P)
scenario=${REC_TEST_SCENARIO:-success}
case "$scenario" in success|source-ref|issuer|backend|stage-load|stage-create|stage-health|stage-identity|stage-journal|extra-peer|historical-pending|revoked|wrong-key|wrong-peer|transport|lock|production-swap|receipt-upload|finalize|finalize-active|controller|controller-bytes|runner-policy|attempt) ;; *) exit 79;; esac
for cmd in docker curl ssh scp gh; do [[ -x "$root/scripts/guards/$cmd" && -f /usr/bin/$cmd ]] || exit 80; done
node_path=$(readlink -f "$(command -v node)")
awk_path=$(readlink -f /usr/bin/awk)
case "$awk_path" in /usr/bin/awk|/usr/bin/gawk|/usr/bin/mawk|/usr/bin/nawk) ;; *) exit 80;; esac
[[ -f $awk_path && -x $awk_path ]] || exit 80
files=(recurring-e2e-fixture.mjs recurring-daemon-fixture.mjs recurring-runner.mjs recurring-staging-gateway.sh recurring-production-entry.sh recurring-host-policy.sh host-jq.sh host-jq-fixture.mjs load-verified-image.sh retain-verified-image.sh container-health.sh staging-transport.sh staging-post-baseline-entry.sh staging-post-baseline-policy.sh staging-post-baseline-resources.sh staging-post-baseline-observe.sh staging-post-baseline-capsule.sh staging-post-baseline-execute.sh staging-post-baseline-retry.sh production-preclients.sh production-preclients-policy.sh production-preclients-finalize.sh production-post-baseline-source.mjs verify-build-artifact.mjs verify-staging-receipt.mjs build-provider.mjs build-attestation.mjs build-zip.mjs build-zip-fixture.mjs)
mounts=();for f in "${files[@]}"; do [[ -f $root/scripts/$f && ! -L $root/scripts/$f ]] || exit 80; mounts+=(--ro-bind "$root/scripts/$f" "/source/scripts/$f"); done
bwrap --unshare-user --unshare-net --unshare-pid --die-with-parent \
 --ro-bind /usr /usr --tmpfs /usr/local --ro-bind /lib /lib --ro-bind /lib64 /lib64 \
 --symlink usr/bin /bin --proc /proc --dev /dev --tmpfs /tmp --tmpfs /work --dir /runtime --dir /opt --dir /source --dir /source/scripts \
 --ro-bind "$node_path" /runtime/node --ro-bind "$awk_path" /runtime/awk --ro-bind /usr/bin/timeout /runtime/timeout --ro-bind /usr/bin/ln /runtime/ln --ro-bind /usr/bin/ln /runtime/ln-real --ro-bind "$root/scripts/guards" /guard \
 --ro-bind "$root/scripts/guards/docker" /usr/bin/docker --ro-bind "$root/scripts/guards/curl" /usr/bin/curl \
 --ro-bind "$root/scripts/guards/ssh" /usr/bin/ssh --ro-bind "$root/scripts/guards/scp" /usr/bin/scp --ro-bind "$root/scripts/guards/gh" /usr/bin/gh \
 --ro-bind "$root/infra/docker-compose.prod.yml" /source/docker-compose.prod.yml --ro-bind "$root/infra/staging-known-hosts" /source/staging-known-hosts \
 "${mounts[@]}" --chdir /work --clearenv --setenv PATH /guard:/runtime:/usr/bin --setenv HOME /nonexistent --setenv REC_SCENARIO "$scenario" \
 -- /bin/bash -c '
  for cmd in docker curl ssh scp gh; do
    [[ "$(command -v "$cmd")" == "/guard/$cmd" ]] || exit 81
    "$cmd" __probe__ >/dev/null 2>&1; [[ $? == 97 ]] || exit 82
    "/usr/bin/$cmd" __probe__ >/dev/null 2>&1; [[ $? == 97 ]] || exit 83
  done
  /runtime/node -e '\''const {spawnSync}=require("node:child_process");for(const c of ["docker","curl","ssh","scp","gh"])if(spawnSync("/usr/bin/"+c,["__probe__"]).status!==97)process.exit(1)'\'' || exit 84
  [[ ! -e /etc && ! -e /home && ! -e /var/run/docker.sock ]] || exit 85
  echo "GUARDAS PATH/ABSOLUTOS/SUBPROCESSOS CONFIRMADAS; rede e socket isolados"
  printf guarded > /work/recurring-guard-confirmed
  /runtime/node /source/scripts/recurring-e2e-fixture.mjs setup "$REC_SCENARIO" || exit 86
  extra=()
  [[ "$REC_SCENARIO" != stage-health ]] || extra+=(--ro-bind /source/scripts/recurring-daemon-fixture.mjs /usr/bin/timeout)
  [[ "$REC_SCENARIO" != finalize && "$REC_SCENARIO" != finalize-active ]] || extra+=(--ro-bind /source/scripts/recurring-daemon-fixture.mjs /runtime/ln)
  # Only inside the already isolated namespace do command doubles replace guards.
  bwrap --unshare-user --unshare-net --unshare-pid --die-with-parent --bind / / --proc /proc --dev /dev \
    --ro-bind /source/scripts/recurring-daemon-fixture.mjs /usr/bin/docker \
    --ro-bind /source/scripts/recurring-daemon-fixture.mjs /usr/bin/curl \
    --ro-bind /source/scripts/recurring-daemon-fixture.mjs /usr/bin/ssh \
    --ro-bind /source/scripts/recurring-daemon-fixture.mjs /usr/bin/ssh-keygen \
    "${extra[@]}" \
    -- /runtime/node /source/scripts/recurring-e2e-fixture.mjs run "$REC_SCENARIO"
 '
