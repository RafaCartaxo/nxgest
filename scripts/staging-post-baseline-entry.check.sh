#!/usr/bin/env bash
# Fixture integralmente local; dependências do candidato são dublês, não evidência de origem.
set -euo pipefail
mkdir /work/entry-repo
cd /work/entry-repo
git init -q
git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm first --allow-empty
old=$(git rev-parse HEAD)
mkdir scripts
for name in host-jq.sh retain-verified-image.sh container-health.sh staging-post-baseline-retry.sh staging-post-baseline-resources.sh; do printf '#!/bin/bash\nexit 0\n' > "scripts/$name"; done
cat > scripts/staging-post-baseline-policy.sh <<'DOUBLE'
#!/usr/bin/env bash
set -eu
p=$(git rev-parse --git-path nxgest-staging-pending)
if [[ ${10:-} == --own-pending ]]; then [[ -f $p && $(cat "$p") == "operation=$FIX_OP" ]]; else [[ ! -e $p ]]; fi
DOUBLE
cat > scripts/staging-post-baseline-observe.sh <<'DOUBLE'
#!/usr/bin/env bash
set -eu
[[ ! -e $(git rev-parse --git-path nxgest-staging-pending) ]] || exit 1
DOUBLE
cat > scripts/load-verified-image.sh <<'DOUBLE'
#!/usr/bin/env bash
set -eu
if [[ ${4:-} == --preflight ]]; then echo preflight >> /work/entry-events; else [[ -f $(git rev-parse --git-path nxgest-staging-pending) ]]; echo load >> /work/entry-events; [[ ${CD_FIXTURE_SCENARIO:-success} != load ]] || exit 1; fi
printf 'sha256:%s\n' "$FIX_IMAGE"
DOUBLE
cat > scripts/staging-post-baseline-capsule.sh <<'DOUBLE'
#!/usr/bin/env bash
set -eu
[[ ${11:-} == --own-pending && -f $(git rev-parse --git-path nxgest-staging-pending) ]]
echo capsule >> /work/entry-events
DOUBLE
cat > scripts/staging-post-baseline-execute.sh <<'DOUBLE'
#!/usr/bin/env bash
set -eu
[[ ${11:-} == --own-pending && -f $(git rev-parse --git-path nxgest-staging-pending) ]]
echo execute >> /work/entry-events
rm -- "$(git rev-parse --git-path nxgest-staging-pending)"
echo STAGING_RECEIPT-fixture
DOUBLE
cp /work/staging-post-baseline-entry.sh scripts/staging-post-baseline-entry.sh
git add scripts
git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm candidate
candidate=$(git rev-parse HEAD)
if [[ ${CD_FIXTURE_SCENARIO:-} == trusted ]]; then
 trusted=$candidate
 cat > scripts/staging-post-baseline-policy.sh <<'DOUBLE'
#!/usr/bin/env bash
printf 'candidate policy executed\n' > /work/candidate-policy-ran
exit 1
DOUBLE
 git add scripts/staging-post-baseline-policy.sh
 git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm untrusted-candidate
 candidate=$(git rev-parse HEAD)
 umask 077
 printf 'version=recurring-staging-authority-v1\nenvironment=staging\nhost=%s\ncontroller=%s\npolicy_sha256=sha256:%064d\ndecision=fixture\nexpires_epoch=9999999999\n' "$(hostname -s)" "$trusted" 0 > .git/nxgest-recurring-staging-authority
 export NXGEST_APPROVED_CONTROLLER=$trusted
fi
git checkout -q --detach "$old"
export FIX_OP=$(printf 'a%.0s' {1..32}) FIX_IMAGE=$(printf 'b%.0s' {1..64})
umask 077
for i in {0..21}; do if [[ $i == 4 ]]; then printf 'operation=%s\n' "$FIX_OP"; else echo fixture; fi; done > .git/nxgest-staging-post-baseline-policy
zip=$(/runtime/node /work/scripts/cd-materialize-fixture.mjs "$candidate")
sum=$(sha256sum /work/entry.tar); tar=sha256:${sum%% *}; policy=sha256:$(printf 'd%.0s' {1..64})
exec 9>.git/nxgest-deploy.lock
args=("$candidate" /work/entry.tar "$tar" "$zip" 7 1 8 "$policy" fixture fixturehost)
if [[ ${CD_FIXTURE_SCENARIO:-success} == load ]]; then
 if bash /work/staging-post-baseline-entry.sh "${args[@]}" > /work/load-output 2>/dev/null; then exit 1; fi
 [[ -f .git/nxgest-staging-pending && -f .git/nxgest-post-baseline-load-$FIX_OP && ! -s /work/load-output && $(cat /work/entry-events) == $'preflight\nload' ]]
 printf 'PASS entry: failed load preserves pending and journal without receipt\n'
 exit 0
fi
[[ $(bash /work/staging-post-baseline-entry.sh "${args[@]}") == STAGING_RECEIPT-fixture ]]
[[ ! -e /work/candidate-policy-ran ]]
[[ $(cat /work/entry-events) == $'preflight\nload\ncapsule\nexecute' ]]
printf 'operation=%s\n' "$FIX_OP" > .git/nxgest-staging-pending
if bash /work/staging-post-baseline-entry.sh "${args[@]}" >/dev/null 2>&1; then exit 1; fi
[[ $(cat /work/entry-events) == $'preflight\nload\ncapsule\nexecute' ]]
printf 'PASS entry: preflight before pending/load; preexisting pending refuses load\n'

# Transporte real com SSH substituído em namespace sem rede: somente fixture Git.
rm -- .git/nxgest-staging-pending
old_op=$FIX_OP; export FIX_OP=$(printf 'e%.0s' {1..32})
sed -i "s/^operation=$old_op$/operation=$FIX_OP/" .git/nxgest-staging-post-baseline-policy
mkdir /work/entry-doubles
cat > /work/entry-doubles/ssh <<'DOUBLE'
#!/usr/bin/env bash
set -eu
exec /bin/bash -c "${!#}"
DOUBLE
cat > /work/entry-doubles/ssh-keygen <<'DOUBLE'
#!/usr/bin/env bash
set -eu
printf '%s\n' '256 SHA256:9mo2a7iYwuHEHlO7SyeHFhwatAv6Hf0yY4yUDhpbPrc fixture (ED25519)'
DOUBLE
chmod 700 /work/entry-doubles/ssh /work/entry-doubles/ssh-keygen
printf 'fixture key, not a secret\n' > /work/fixture-key
ln -s /work/entry-repo /opt/nxgestao
flock -u 9
PATH="/work/entry-doubles:$PATH"
transport=$(bash /work/staging-transport.sh /work/entry.tar "$candidate" "$tar" "$zip" 7 1 8 fixturehost fixtureuser /work/fixture-key /work/staging-known-hosts staging-post-baseline "$policy" fixture fixturehost)
[[ $transport == STAGING_RECEIPT-fixture ]]
[[ $(tail -4 /work/entry-events) == $'preflight\nload\ncapsule\nexecute' ]]
[[ -L /opt/nxgestao && $(readlink /opt/nxgestao) == /work/entry-repo ]]
rm -- /opt/nxgestao
printf 'PASS transport: verified bytes enter locked controller through SSH double\n'
