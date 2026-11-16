#!/usr/bin/env bash
set -euo pipefail
mkdir /work/preflight-repo
cd /work/preflight-repo
git init -q
git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm first --allow-empty
previous=$(git rev-parse HEAD)
mkdir scripts
cp /work/scripts/production-post-baseline-preflight.sh scripts/
git add scripts
git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm second
candidate=$(git rev-parse HEAD)
host=$(hostname -s); a=$(printf 'a%.0s' {1..64}); b=$(printf 'b%.0s' {1..64})
verified=$(/runtime/node /work/scripts/production-post-baseline-fixture-select.mjs "$candidate")
[[ $(printf '%s' "$verified" | jq -r '.fixture') == true && $(printf '%s' "$verified" | jq -r '.operationalReady') == false ]]
image=$(printf '%s' "$verified" | jq -r '.image'); tar=$(printf '%s' "$verified" | jq -r '.tar'); zip=$(printf '%s' "$verified" | jq -r '.zip'); tarfile=$(printf '%s' "$verified" | jq -r '.imagePath')
umask 077
printf 'version=first-baseline-v1\nsha=%s\ntar=%s\nzip=%s\nci_run=1\nartifact=2\nstaging_run=3\nimage=%s\n' "$previous" "$tar" "$zip" "$image" > .git/nxgest-baseline-established
printf 'environment=staging\nsha=%s\nrun=7\nattempt=1\nartifact=8\nzip=%s\ntar=%s\nimage=%s\n' "$candidate" "$zip" "$tar" "$image" > .git/nxgest-staging-selection
printf '%s\n' "$candidate" > .git/nxgest-staging-sha
printf 'version=production-post-baseline-v1\nenvironment=production\nhost=%s\ndecision=fixture\nprevious_sha=%s\nsha=%s\nci_run=7\nattempt=1\nartifact=8\nzip=%s\ntar=%s\nimage=%s\nstaging_run=9\nexpires_epoch=9999999999\n' "$host" "$previous" "$candidate" "$zip" "$tar" "$image" > .git/nxgest-production-post-policy
sum=$(sha256sum .git/nxgest-production-post-policy);sum=sha256:${sum%% *}
exec 9>.git/nxgest-deploy.lock
run(){ bash /work/scripts/production-post-baseline-preflight.sh "$sum" fixture "$candidate" 7 1 8 "$zip" "$tar" "$image" 9 "$host"; }
set +e;run >/work/preflight-out 2>/work/preflight-err;code=$?;set -e
[[ $code == 78 && ! -s /work/preflight-out && $(cat /work/preflight-err) == 'NO-GO: BA10 e rollback operacionais verificáveis indisponíveis' ]]
# Transporte real do código, SSH/ssh-keygen dublados após guardas; sem enviar tar.
mkdir /work/production-doubles
cat > /work/production-doubles/ssh <<'DOUBLE'
#!/usr/bin/env bash
set -eu
[[ ! -t 0 ]] || exit 1
printf 'called\n' >> /work/production-ssh-calls
exec /bin/bash -c "${!#}"
DOUBLE
cat > /work/production-doubles/ssh-keygen <<'DOUBLE'
#!/usr/bin/env bash
printf '%s\n' '256 SHA256:9mo2a7iYwuHEHlO7SyeHFhwatAv6Hf0yY4yUDhpbPrc fixture (ED25519)'
DOUBLE
chmod 700 /work/production-doubles/ssh /work/production-doubles/ssh-keygen
printf 'fixture public test key\n' > /work/fixture-key
ln -s /work/preflight-repo /opt/nxgestao
flock -u 9
PATH="/work/production-doubles:$PATH"
set +e
bash /work/scripts/staging-transport.sh "$tarfile" "$candidate" "$tar" "$zip" 7 1 8 fixturehost fixtureuser /work/fixture-key /work/staging-known-hosts production-post-baseline 9 "$image" "$sum" fixture "$host" > /work/transport-out 2>/work/transport-err
transport_code=$?
set -e
[[ $transport_code == 78 && ! -s /work/transport-out && ! -e .git/nxgest-staging-incoming && ! -e .git/nxgest-production-pending && $(cat .git/nxgest-staging-sha) == "$candidate" ]]
flock -n 9
rm -- /opt/nxgestao
printf 'PASS cadeia: verificadores efetivos + transporte/preflight reais com dublês; NO-GO antes de mutações\n'
# Tar divergente deve falhar antes do transporte SSH dublado.
cp "$tarfile" /work/tampered.tar
printf 'alterado' >> /work/tampered.tar
before=$(wc -l < /work/production-ssh-calls)
set +e
bash /work/scripts/staging-transport.sh /work/tampered.tar "$candidate" "$tar" "$zip" 7 1 8 fixturehost fixtureuser /work/fixture-key /work/staging-known-hosts production-post-baseline 9 "$image" "$sum" fixture "$host" >/dev/null 2>&1
bad_code=$?
set -e
[[ $bad_code == 1 && $(wc -l < /work/production-ssh-calls) == "$before" && ! -e .git/nxgest-staging-incoming ]]
# Lock concorrente falha antes do preflight, sem alteração dos marcadores.
set +e
bash /work/scripts/staging-transport.sh "$tarfile" "$candidate" "$tar" "$zip" 7 1 8 fixturehost fixtureuser /work/fixture-key /work/staging-known-hosts production-post-baseline 9 "$image" "$sum" fixture "$host" >/dev/null 2>&1
busy_code=$?
set -e
[[ $busy_code == 1 && $(cat .git/nxgest-staging-sha) == "$candidate" && ! -e .git/nxgest-staging-incoming ]]
printf 'PASS transporte: bytes divergentes e lock concorrente recusados sem efeitos\n' 

reject(){ local code; set +e; "$@" >/dev/null 2>&1; code=$?; set -e; [[ $code == 1 ]]; }
printf 'pending\n' > .git/nxgest-production-pending
reject run
rm -- .git/nxgest-production-pending
printf 'invalid\n' > .git/nxgest-staging-sha
reject run
printf '%s\n' "$candidate" > .git/nxgest-staging-sha
( exec 9>.git/other-lock; reject run )
( exec 9>.git/nxgest-deploy.lock; reject run )
reject bash /work/scripts/production-post-baseline-preflight.sh "sha256:$a" fixture "$candidate" 7 1 8 "$zip" "$tar" "$image" 9 "$host"
reject bash /work/scripts/production-post-baseline-preflight.sh "$sum" fixture "$candidate" 7 2 8 "$zip" "$tar" "$image" 9 "$host"
reject bash /work/scripts/production-post-baseline-preflight.sh "$sum" fixture "$candidate" 7 1 8 "$zip" "$tar" "sha256:$b" 9 "$host"
sed -i 's/expires_epoch=9999999999/expires_epoch=1000000000/' .git/nxgest-production-post-policy
expired=$(sha256sum .git/nxgest-production-post-policy); expired=sha256:${expired%% *}
reject bash /work/scripts/production-post-baseline-preflight.sh "$expired" fixture "$candidate" 7 1 8 "$zip" "$tar" "$image" 9 "$host"
sed -i 's/expires_epoch=1000000000/expires_epoch=9999999999/' .git/nxgest-production-post-policy
mv .git/nxgest-production-post-policy .git/fixture-policy-original
ln -s fixture-policy-original .git/nxgest-production-post-policy
reject run
rm -- .git/nxgest-production-post-policy
mv .git/fixture-policy-original .git/nxgest-production-post-policy
# Repetição do SHA já estabelecido deve falhar mesmo com política e marker coerentes.
sed -i "s/^sha=$previous$/sha=$candidate/" .git/nxgest-baseline-established
sed -i "s/^previous_sha=$previous$/previous_sha=$candidate/" .git/nxgest-production-post-policy
replay_sum=$(sha256sum .git/nxgest-production-post-policy); replay_sum=sha256:${replay_sum%% *}
reject bash /work/scripts/production-post-baseline-preflight.sh "$replay_sum" fixture "$candidate" 7 1 8 "$zip" "$tar" "$image" 9 "$host"
printf 'PASS preflight: replay mesmo SHA recusado\n' 
printf 'PASS preflight: NO-GO, pending, marker, hash, lock e concorrência\n'
