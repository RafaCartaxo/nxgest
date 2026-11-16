#!/usr/bin/env bash
# Fixture isolada: demonstra a ordem de seleção do controlador legado, sem rede.
set -euo pipefail
mkdir -m 700 /work/recurring-trust-repo /work/recurring-trust-bin
cd /work/recurring-trust-repo
git init -q
mkdir scripts
cat > scripts/staging-post-baseline-entry.sh <<'FIXTURE'
#!/usr/bin/env bash
grep -Fx "controller=${NXGEST_APPROVED_CONTROLLER:-}" .git/nxgest-recurring-staging-authority >/dev/null || exit 76
printf 'trusted controller ran\n' > /work/recurring-trusted-effect
FIXTURE
git add scripts/staging-post-baseline-entry.sh
git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm controller
controller=$(git rev-parse HEAD)
cat > scripts/staging-post-baseline-entry.sh <<'FIXTURE'
#!/usr/bin/env bash
printf 'candidate-controlled code ran before policy\n' > /work/recurring-trust-effect
exit 77
FIXTURE
git add scripts/staging-post-baseline-entry.sh
git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm fixture
sha=$(git rev-parse HEAD)
printf 'synthetic bytes\n' > /work/recurring-trust.tar
sum=$(sha256sum /work/recurring-trust.tar); digest=sha256:${sum%% *}
cat > /work/recurring-trust-bin/ssh <<'FIXTURE'
#!/usr/bin/env bash
if [[ ${!#} == nxgest-recurring-staging-v1 ]]; then
  export SSH_ORIGINAL_COMMAND=nxgest-recurring-staging-v1
  exec bash /work/scripts/recurring-staging-gateway.sh
fi
exec /bin/bash -c "${!#}"
FIXTURE
cat > /work/recurring-trust-bin/ssh-keygen <<'FIXTURE'
#!/usr/bin/env bash
printf '%s\n' '256 SHA256:9mo2a7iYwuHEHlO7SyeHFhwatAv6Hf0yY4yUDhpbPrc fixture (ED25519)'
FIXTURE
chmod 700 /work/recurring-trust-bin/*
printf 'synthetic\n' > /work/recurring-trust-key
ln -s /work/recurring-trust-repo /opt/nxgestao
set +e
PATH="/work/recurring-trust-bin:$PATH" bash /work/scripts/staging-transport.sh /work/recurring-trust.tar "$sha" "$digest" "$digest" 7 1 8 fixturehost fixtureuser /work/recurring-trust-key /work/staging-known-hosts staging-post-baseline "$digest" fixture fixturehost > /work/recurring-trust-output 2>&1
status=$?
set -e
[[ $status == 77 && -f /work/recurring-trust-effect && ! -e .git/nxgest-staging-post-baseline-policy && ! -e .git/nxgest-staging-selection ]]
# New gateway is supplied by forced-command fixture and chooses only its host
# authority controller. The candidate remains the malicious commit above.
rm -- /work/recurring-trust-effect
umask 077
touch .git/nxgest-deploy.lock
printf 'version=recurring-staging-authority-v1\nenvironment=staging\nhost=%s\ncontroller=%s\npolicy_sha256=%s\ndecision=fixture\nexpires_epoch=9999999999\n' "$(hostname -s)" "$controller" "$digest" > .git/nxgest-recurring-staging-authority
send(){ printf 'sha=%s\ntar=%s\nzip=%s\nrun=7\nattempt=1\nartifact=8\nend=selection\n' "$sha" "$digest" "$digest"; cat /work/recurring-trust.tar; }
if send | SSH_ORIGINAL_COMMAND=wrong bash /work/scripts/recurring-staging-gateway.sh >/dev/null 2>&1; then exit 1; fi
[[ ! -e /work/recurring-trusted-effect && ! -e /work/recurring-trust-effect ]]
PATH="/work/recurring-trust-bin:$PATH" bash /work/scripts/staging-transport.sh /work/recurring-trust.tar "$sha" "$digest" "$digest" 7 1 8 fixturehost fixtureuser /work/recurring-trust-key /work/staging-known-hosts staging-recurring
[[ -f /work/recurring-trusted-effect && ! -e /work/recurring-trust-effect ]]
rm -- /work/recurring-trusted-effect
if { printf 'sha=%s\ntar=%s\nzip=%s\nrun=7\nattempt=1\nartifact=8\nend=selection\n' "$sha" "$digest" "$digest"; printf altered; } | SSH_ORIGINAL_COMMAND=nxgest-recurring-staging-v1 bash /work/scripts/recurring-staging-gateway.sh >/dev/null 2>&1; then exit 1; fi
[[ ! -e /work/recurring-trusted-effect && ! -e /work/recurring-trust-effect ]]
chmod 620 .git/nxgest-recurring-staging-authority
if send | SSH_ORIGINAL_COMMAND=nxgest-recurring-staging-v1 bash /work/scripts/recurring-staging-gateway.sh >/dev/null 2>&1; then exit 1; fi
chmod 600 .git/nxgest-recurring-staging-authority
exec 8<>.git/nxgest-deploy.lock; flock -n 8
if send | SSH_ORIGINAL_COMMAND=nxgest-recurring-staging-v1 bash /work/scripts/recurring-staging-gateway.sh >/dev/null 2>&1; then exit 1; fi
flock -u 8; exec 8>&-
[[ ! -e /work/recurring-trusted-effect && ! -e /work/recurring-trust-effect ]]
sed -i 's/expires_epoch=9999999999/expires_epoch=1000000000/' .git/nxgest-recurring-staging-authority
if send | SSH_ORIGINAL_COMMAND=nxgest-recurring-staging-v1 bash /work/scripts/recurring-staging-gateway.sh >/dev/null 2>&1; then exit 1; fi
[[ ! -e /work/recurring-trusted-effect && ! -e /work/recurring-trust-effect ]]
printf 'CONTROLLER_GATEWAY_PIN_FIXTURE_OK\n'
[[ -L /opt/nxgestao && $(readlink /opt/nxgestao) == /work/recurring-trust-repo ]]
rm -- /opt/nxgestao
printf 'CONTROLLER_TRUST_GAP_REPRODUCED: candidate entry executed before host policy\n'
