#!/usr/bin/env bash
set -euo pipefail
mkdir /work/preclients-policy
cd /work/preclients-policy
git init -q
git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm first --allow-empty
previous=$(git rev-parse HEAD)
git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm next --allow-empty
candidate=$(git rev-parse HEAD)
host=$(hostname -s); a=$(printf 'a%.0s' {1..64}); b=$(printf 'b%.0s' {1..64}); zip=sha256:$a; tar=sha256:$b; image=sha256:$a
umask 077
printf 'version=first-baseline-v1\nsha=%s\ntar=%s\nzip=%s\nci_run=1\nartifact=2\nstaging_run=3\nimage=%s\n' "$previous" "$tar" "$zip" "$image" > .git/nxgest-baseline-established
printf 'environment=staging\nsha=%s\nrun=7\nattempt=1\nartifact=8\nzip=%s\ntar=%s\nimage=%s\n' "$candidate" "$zip" "$tar" "$image" > .git/nxgest-staging-selection
printf '%s\n' "$candidate" > .git/nxgest-staging-sha
printf 'version=production-preclients-v1\nenvironment=production\nhost=%s\ndecision=fixture\nno_clients=yes\nprevious_sha=%s\nsha=%s\nci_run=7\nattempt=1\nartifact=8\nzip=%s\ntar=%s\nimage=%s\nstaging_run=9\nexpires_epoch=9999999999\n' "$host" "$previous" "$candidate" "$zip" "$tar" "$image" > .git/nxgest-production-preclients-policy
sum=$(sha256sum .git/nxgest-production-preclients-policy);sum=sha256:${sum%% *}
exec 9>.git/nxgest-deploy.lock
run(){ bash /work/scripts/production-preclients-policy.sh "$sum" fixture "$candidate" 7 1 8 "$zip" "$tar" "$image" 9 "$host"; }
[[ $(run) == "PRECLIENTS_POLICY_ONLY previous=$previous" ]]
# An independently opened descriptor cannot acquire the same lock concurrently.
if bash -c 'exec 8> .git/nxgest-deploy.lock; flock -n 8' 9>&-; then exit 1; fi
reject(){ if "$@" >/dev/null 2>&1; then return 1; fi; }
reject bash /work/scripts/production-preclients-policy.sh "sha256:$b" fixture "$candidate" 7 1 8 "$zip" "$tar" "$image" 9 "$host"
chmod g+w .git; reject run; chmod g-w .git
chmod g+w .git/nxgest-deploy.lock; reject run; chmod g-w .git/nxgest-deploy.lock
reject bash /work/scripts/production-preclients-policy.sh "$sum" fixture "$candidate" 7 2 8 "$zip" "$tar" "$image" 9 "$host"
reject bash /work/scripts/production-preclients-policy.sh "$sum" fixture "$candidate" 7 1 999 "$zip" "$tar" "$image" 9 "$host"
sed -i 's/expires_epoch=9999999999/expires_epoch=1000000000/' .git/nxgest-production-preclients-policy
expired=$(sha256sum .git/nxgest-production-preclients-policy); expired=sha256:${expired%% *}
reject bash /work/scripts/production-preclients-policy.sh "$expired" fixture "$candidate" 7 1 8 "$zip" "$tar" "$image" 9 "$host"
sed -i 's/expires_epoch=1000000000/expires_epoch=9999999999/' .git/nxgest-production-preclients-policy
tree=$(git rev-parse "$previous^{tree}")
orphan=$(printf 'fixture unrelated\n' | git -c user.name=fixture -c user.email=fixture@example.invalid commit-tree "$tree")
sed -i "s/^sha=$previous$/sha=$orphan/" .git/nxgest-baseline-established
sed -i "s/^previous_sha=$previous$/previous_sha=$orphan/" .git/nxgest-production-preclients-policy
other=$(sha256sum .git/nxgest-production-preclients-policy); other=sha256:${other%% *}
reject bash /work/scripts/production-preclients-policy.sh "$other" fixture "$candidate" 7 1 8 "$zip" "$tar" "$image" 9 "$host"
sed -i "s/^sha=$orphan$/sha=$previous/" .git/nxgest-baseline-established
sed -i "s/^previous_sha=$orphan$/previous_sha=$previous/" .git/nxgest-production-preclients-policy
# Exercise the actual controller with an invalid hash and the real command guards.
# A protected jq fixture supplies only the JSON predicate; no service command is reachable.
mkdir scripts
cp /work/scripts/production-preclients.sh /work/scripts/production-preclients-policy.sh scripts/
printf 'nxgest_use_jq(){ NXGEST_JQ=/bin/false; export NXGEST_JQ; }\n' > scripts/host-jq.sh
printf fixture > candidate.tar
printf fixture > .env
if NXGEST_DEPLOY_MODE=production-preclients bash scripts/production-preclients.sh "$candidate" candidate.tar "$tar" "$zip" 7 1 8 9 "$image" "sha256:$b" fixture "$host" >/dev/null 2>&1; then exit 1; fi
[[ ! -e .git/nxgest-production-pending ]]
printf pending > .git/nxgest-production-pending; reject run; rm .git/nxgest-production-pending
printf 'bad\n' > .git/nxgest-staging-sha; reject run
printf '%s\n' "$candidate" > .git/nxgest-staging-sha
sed -i 's/no_clients=yes/no_clients=no/' .git/nxgest-production-preclients-policy
sum=$(sha256sum .git/nxgest-production-preclients-policy);sum=sha256:${sum%% *}; reject run
printf '%s\n' 'PRECLIENTS_POLICY_FIXTURES_OK'
# A docker-save fixture exercises the actual loader and distinguishes tar from config ID.
sed -i 's/no_clients=no/no_clients=yes/' .git/nxgest-production-preclients-policy
mkdir -p archive/blobs/sha256
printf '%s' '{"architecture":"amd64","os":"linux"}' > config.json
config=$(sha256sum config.json); config=${config%% *}; newimage=sha256:$config
cp config.json "archive/blobs/sha256/$config"
printf '[{"Config":"blobs/sha256/%s","RepoTags":["nxgest-build:%s"],"Layers":["synthetic/layer.tar"]}]' "$config" "$candidate" > archive/manifest.json
tar -cf candidate.tar -C archive manifest.json "blobs/sha256/$config"
actual=$(sha256sum candidate.tar); realtar=sha256:${actual%% *}
sed -i "s|tar=$tar|tar=$realtar|;s|image=$image|image=$newimage|" .git/nxgest-staging-selection .git/nxgest-production-preclients-policy
sed -i "s|image=$image|image=sha256:$b|" .git/nxgest-baseline-established
image=$newimage
sum=$(sha256sum .git/nxgest-production-preclients-policy); sum=sha256:${sum%% *}
cp /work/scripts/host-jq.sh /work/scripts/load-verified-image.sh /work/scripts/retain-verified-image.sh /work/scripts/container-health.sh scripts/
/runtime/node --input-type=module -e 'import {fixtureJq} from "/work/scripts/host-jq-fixture.mjs";fixtureJq(process.cwd(),process.cwd())'
mkdir doubles
export FIXTURE_PREVIOUS=$previous FIXTURE_CANDIDATE=$candidate FIXTURE_OLD=sha256:$b FIXTURE_NEW=$image FIXTURE_DIR=$PWD FIXTURE_OLDID=$(printf 'c%.0s' {1..64}) FIXTURE_NEWID=$(printf 'd%.0s' {1..64}) FIXTURE_STAGEID=$(printf 'e%.0s' {1..64}) FIXTURE_PROXY=$(printf 'f%.0s' {1..64})
cat > doubles/docker <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$FIXTURE_DIR/calls"
if [[ $1 == version ]]; then echo "${FIXTURE_DOCKER_VERSION:-26.1.3|linux|amd64}"; exit; fi
if [[ $1 == info && $* == *DriverStatus* ]]; then echo '[["Backing Filesystem","extfs"]]'; exit; fi
if [[ $1 == info ]]; then echo overlay2; exit; fi
if [[ $1 == ps ]]; then echo "$FIXTURE_PROXY"; exit; fi
if [[ $1 == exec ]]; then [[ ${FIXTURE_FAIL_AFTER_SWITCH:-0} != 1 || ! -e $FIXTURE_DIR/switched ]]; exit; fi
if [[ $1 == inspect ]]; then
  format=$3; target=$4
  if [[ $format == *State.Status* ]]; then if [[ $target == nxgest-postgres ]]; then echo 'running|healthy'; else echo running; fi; exit; fi
  case $target in
    staging-app|"$FIXTURE_STAGEID") id=$FIXTURE_STAGEID; image=$FIXTURE_NEW;;
    nxgestao-app-1) if [[ -e $FIXTURE_DIR/switched ]]; then id=$FIXTURE_NEWID; image=$FIXTURE_NEW; else id=$FIXTURE_OLDID; image=$FIXTURE_OLD; fi;;
    "$FIXTURE_OLDID") id=$FIXTURE_OLDID; image=$FIXTURE_OLD;;
    "$FIXTURE_NEWID") id=$FIXTURE_NEWID; image=$FIXTURE_NEW;;
    *) exit 1;;
  esac
  if [[ $format == *Image* ]]; then echo "$image"; else echo "$id"; fi; exit
fi
if [[ $1 == image && $2 == ls ]]; then
  [[ ! -e $FIXTURE_DIR/oldpin ]] || printf '%s|%s\n' "nxgest-retained:$FIXTURE_PREVIOUS" "${FIXTURE_OLDPIN_BAD:-$FIXTURE_OLD}"
  [[ ! -e $FIXTURE_DIR/newpin ]] || printf '%s|%s\n' "nxgest-retained:$FIXTURE_CANDIDATE" "$FIXTURE_NEW"
  [[ ! -e $FIXTURE_DIR/temp-tag ]] || printf '%s|%s\n' "nxgest-build:$FIXTURE_CANDIDATE" "$FIXTURE_NEW"
  exit
fi
if [[ $1 == image && $2 == inspect ]]; then
  case ${*: -1} in
    "$FIXTURE_OLD"|"nxgest-retained:$FIXTURE_PREVIOUS") echo "$FIXTURE_OLD";;
    "$FIXTURE_NEW"|"nxgest-retained:$FIXTURE_CANDIDATE"|"nxgest-build:$FIXTURE_CANDIDATE") echo "$FIXTURE_NEW";;
    *) exit 1;;
  esac; exit
fi
if [[ $1 == image && $2 == load ]]; then
  [[ ${FIXTURE_FAIL_LOAD:-0} != 1 ]] || exit 1
  touch "$FIXTURE_DIR/temp-tag"
  if [[ ${FIXTURE_CHANGE_POLICY:-0} == 1 ]]; then printf 'changed\n' >> "$FIXTURE_DIR/.git/nxgest-production-preclients-policy"; fi
  exit
fi
if [[ $1 == image && $2 == tag ]]; then
  if [[ ${*: -1} == "nxgest-retained:$FIXTURE_PREVIOUS" ]]; then touch "$FIXTURE_DIR/oldpin"; else touch "$FIXTURE_DIR/newpin"; fi; exit
fi
if [[ $1 == image && $2 == rm ]]; then rm -- "$FIXTURE_DIR/temp-tag"; exit; fi
if [[ $1 == compose && " $* " == *' up '* ]]; then touch "$FIXTURE_DIR/switched"; [[ ${FIXTURE_FAIL_COMPOSE:-0} != 1 ]]; exit; fi
if [[ $1 == compose && " $* " == *' ps '* ]]; then echo "$FIXTURE_NEWID"; exit; fi
exit 1
MOCK
cat > doubles/curl <<'MOCK'
#!/usr/bin/env bash
printf '{"status":"ok","db":"connected"}\n'
MOCK
cat > doubles/jq <<'MOCK'
#!/usr/bin/env bash
cat >/dev/null
MOCK
cat > doubles/mv <<'MOCK'
#!/usr/bin/env bash
if [[ ${FIXTURE_FAIL_MARKER:-0} == 1 && ${*: -1} == */nxgest-production-sha ]]; then exit 1; fi
exec /usr/bin/mv "$@"
MOCK
cat > doubles/timeout <<'MOCK'
#!/usr/bin/env bash
if [[ ${FIXTURE_FAIL_AFTER_SWITCH:-0} == 1 && ${3:-} == 90s ]]; then exec /usr/bin/timeout --signal=TERM --kill-after=1s 1s "${@:4}"; fi
exec /usr/bin/timeout "$@"
MOCK
cat > doubles/ln <<'MOCK'
#!/usr/bin/env bash
if [[ ${FIXTURE_FAIL_ARCHIVE:-0} == 1 && ${*: -1} == */nxgest-production-completed-* ]]; then exit 1; fi
exec /usr/bin/ln "$@"
MOCK
chmod 700 doubles/*
# An unknown backend is rejected during preflight, before pending or load.
if PATH="$PWD/doubles:$PATH" FIXTURE_DOCKER_VERSION='29.0.0|linux|amd64' NXGEST_DEPLOY_MODE=production-preclients bash scripts/production-preclients.sh "$candidate" candidate.tar "$realtar" "$zip" 7 1 8 9 "$image" "$sum" fixture "$host" >/dev/null 2>&1; then exit 1; fi
[[ ! -e .git/nxgest-production-pending && ! -e switched ]]
! grep -Eq '^image (load|tag|rm)|^compose .* up ' calls
rm -- calls
# A conflicting previous-image pin leaves pending but blocks load and swap.
touch oldpin
if PATH="$PWD/doubles:$PATH" FIXTURE_OLDPIN_BAD="sha256:$a" NXGEST_DEPLOY_MODE=production-preclients bash scripts/production-preclients.sh "$candidate" candidate.tar "$realtar" "$zip" 7 1 8 9 "$image" "$sum" fixture "$host" >/dev/null 2>&1; then exit 1; fi
[[ -f .git/nxgest-production-pending && ! -e switched ]]
! grep -Eq '^image (load|tag|rm)|^compose .* up ' calls
rm -f -- .git/nxgest-production-pending calls oldpin
# A failed target health after replacement retains pending and does not publish a marker.
if PATH="$PWD/doubles:$PATH" FIXTURE_FAIL_AFTER_SWITCH=1 NXGEST_DEPLOY_MODE=production-preclients bash scripts/production-preclients.sh "$candidate" candidate.tar "$realtar" "$zip" 7 1 8 9 "$image" "$sum" fixture "$host" >/dev/null 2>&1; then exit 1; fi
[[ -f .git/nxgest-production-pending && -f switched && ! -e .git/nxgest-production-selection && ! -e .git/nxgest-production-sha ]]
! grep -Eq '^(stop|start|rm)( |$)' calls
# Reset only synthetic fixture files to exercise the independent successful scenario.
rm -f -- .git/nxgest-production-pending switched calls oldpin newpin temp-tag
# An alteration between load and the application swap fails before compose up.
cp .git/nxgest-production-preclients-policy policy.saved
if PATH="$PWD/doubles:$PATH" FIXTURE_CHANGE_POLICY=1 NXGEST_DEPLOY_MODE=production-preclients bash scripts/production-preclients.sh "$candidate" candidate.tar "$realtar" "$zip" 7 1 8 9 "$image" "$sum" fixture "$host" >/dev/null 2>&1; then exit 1; fi
[[ -f .git/nxgest-production-pending && ! -e switched && ! -e .git/nxgest-production-selection ]]
mv policy.saved .git/nxgest-production-preclients-policy
rm -f -- .git/nxgest-production-pending calls oldpin newpin temp-tag
# Loader failure occurs after pending but before any application swap.
if PATH="$PWD/doubles:$PATH" FIXTURE_FAIL_LOAD=1 NXGEST_DEPLOY_MODE=production-preclients bash scripts/production-preclients.sh "$candidate" candidate.tar "$realtar" "$zip" 7 1 8 9 "$image" "$sum" fixture "$host" >/dev/null 2>&1; then exit 1; fi
[[ -f .git/nxgest-production-pending && ! -e switched && ! -e .git/nxgest-production-selection ]]
! grep -Eq '^compose .* up ' calls
rm -f -- .git/nxgest-production-pending calls oldpin newpin temp-tag
# A failed compose response is ambiguous even if the target may have changed.
if PATH="$PWD/doubles:$PATH" FIXTURE_FAIL_COMPOSE=1 NXGEST_DEPLOY_MODE=production-preclients bash scripts/production-preclients.sh "$candidate" candidate.tar "$realtar" "$zip" 7 1 8 9 "$image" "$sum" fixture "$host" >/dev/null 2>&1; then exit 1; fi
[[ -f .git/nxgest-production-pending && -f switched && ! -e .git/nxgest-production-selection && ! -e .git/nxgest-production-sha ]]
! grep -Eq '^(stop|start|rm)( |$)' calls
rm -f -- .git/nxgest-production-pending switched calls oldpin newpin temp-tag
# A failure between selection and marker publication remains pending and cannot retry.
if PATH="$PWD/doubles:$PATH" FIXTURE_FAIL_MARKER=1 NXGEST_DEPLOY_MODE=production-preclients bash scripts/production-preclients.sh "$candidate" candidate.tar "$realtar" "$zip" 7 1 8 9 "$image" "$sum" fixture "$host" >/dev/null 2>&1; then exit 1; fi
[[ -f .git/nxgest-production-pending && -f .git/nxgest-production-selection && ! -e .git/nxgest-production-sha ]]
rm -f -- .git/nxgest-production-pending .git/nxgest-production-selection switched calls oldpin newpin temp-tag
PATH="$PWD/doubles:$PATH" NXGEST_DEPLOY_MODE=production-preclients bash scripts/production-preclients.sh "$candidate" candidate.tar "$realtar" "$zip" 7 1 8 9 "$image" "$sum" fixture "$host" > outcome
[[ $(cat outcome) == "PRECLIENTS_APPLIED sha=$candidate tar=$realtar image=$image container=$FIXTURE_NEWID" && -f .git/nxgest-production-pending && -f .git/nxgest-production-selection && -f .git/nxgest-production-sha ]]
# Pending prevents a second application before any Docker command.
count=$(wc -l < calls)
if PATH="$PWD/doubles:$PATH" NXGEST_DEPLOY_MODE=production-preclients bash scripts/production-preclients.sh "$candidate" candidate.tar "$realtar" "$zip" 7 1 8 9 "$image" "$sum" fixture "$host" >/dev/null 2>&1; then exit 1; fi
[[ $(wc -l < calls) == "$count" ]]
cp /work/scripts/production-preclients-finalize.sh scripts/
if PATH="$PWD/doubles:$PATH" bash scripts/production-preclients-finalize.sh "$candidate" "sha256:$b" 42 "sha256:$a" >/dev/null 2>&1; then exit 1; fi
[[ -f .git/nxgest-production-pending ]]
if PATH="$PWD/doubles:$PATH" FIXTURE_FAIL_ARCHIVE=1 bash scripts/production-preclients-finalize.sh "$candidate" "$image" 42 "sha256:$a" >/dev/null 2>&1; then exit 1; fi
[[ -f .git/nxgest-production-pending && -f .git/nxgest-production-receipt-$candidate-42 && ! -e .git/nxgest-production-completed-$candidate-42 ]]
# A partial evidence write must not be silently overwritten on retry.
if PATH="$PWD/doubles:$PATH" bash scripts/production-preclients-finalize.sh "$candidate" "$image" 42 "sha256:$a" >/dev/null 2>&1; then exit 1; fi
[[ -f .git/nxgest-production-pending ]]
rm -- .git/nxgest-production-receipt-$candidate-42
PATH="$PWD/doubles:$PATH" bash scripts/production-preclients-finalize.sh "$candidate" "$image" 42 "sha256:$a" > finalized
[[ ! -e .git/nxgest-production-pending && -f .git/nxgest-production-completed-$candidate-42 && -f .git/nxgest-production-receipt-$candidate-42 ]]
printf '%s\n' 'PRECLIENTS_CONTROLLER_FIXTURES_OK'
# Both production verifiers feed the actual runner transport, bootstrap and controller.
# Host tools, SSH and daemon below are fixture-only inside the guarded namespace.
mkdir /work/transport-repo /work/transport-state
cd /work/transport-repo
git init -q
git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm baseline --allow-empty
old_commit=$(git rev-parse HEAD)
mkdir scripts
for script in deploy-bootstrap.sh production-preclients.sh production-preclients-policy.sh production-preclients-finalize.sh host-jq.sh load-verified-image.sh retain-verified-image.sh container-health.sh; do cp "/work/scripts/$script" "scripts/$script"; done
/runtime/node --input-type=module -e 'import {fixtureJq} from "/work/scripts/host-jq-fixture.mjs";fixtureJq(process.cwd(),process.cwd())'
printf '.env\n' >> .git/info/exclude
printf 'synthetic\n' > .env
git add scripts
git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm candidate
new_commit=$(git rev-parse HEAD)
mkdir -p /work/transport-archive/blobs/sha256
printf '%s' '{"architecture":"amd64","os":"linux"}' > /work/config.fixture
config=$(sha256sum /work/config.fixture); config=${config%% *}; image_id=sha256:$config
cp /work/config.fixture "/work/transport-archive/blobs/sha256/$config"
printf '[{"Config":"blobs/sha256/%s","RepoTags":["nxgest-build:%s"],"Layers":["synthetic/layer.tar"]}]' "$config" "$new_commit" > /work/transport-archive/manifest.json
tar -cf /work/production-transport.tar -C /work/transport-archive manifest.json "blobs/sha256/$config"
/runtime/node /work/scripts/production-preclients-source-fixture.mjs "$new_commit" /work/production-transport.tar "$image_id" /work/production-source.json
verified_tar=$(jq -r .tar /work/production-source.json); verified_zip=$(jq -r .zip /work/production-source.json); verified_path=$(jq -r .imagePath /work/production-source.json)
[[ $(jq -r .fixture /work/production-source.json) == true && $(jq -r .operationalReady /work/production-source.json) == false ]]
old_image=sha256:$(printf 'b%.0s' {1..64}); host=$(hostname -s)
(umask 077
printf 'version=first-baseline-v1\nsha=%s\ntar=%s\nzip=%s\nci_run=1\nartifact=2\nstaging_run=3\nimage=%s\n' "$old_commit" "$verified_tar" "$verified_zip" "$old_image" > .git/nxgest-baseline-established
printf 'environment=staging\nsha=%s\nrun=7\nattempt=1\nartifact=8\nzip=%s\ntar=%s\nimage=%s\n' "$new_commit" "$verified_zip" "$verified_tar" "$image_id" > .git/nxgest-staging-selection
printf '%s\n' "$new_commit" > .git/nxgest-staging-sha
printf 'version=production-preclients-v1\nenvironment=production\nhost=%s\ndecision=fixture\nno_clients=yes\nprevious_sha=%s\nsha=%s\nci_run=7\nattempt=1\nartifact=8\nzip=%s\ntar=%s\nimage=%s\nstaging_run=9\nexpires_epoch=9999999999\n' "$host" "$old_commit" "$new_commit" "$verified_zip" "$verified_tar" "$image_id" > .git/nxgest-production-preclients-policy)
policy=$(sha256sum .git/nxgest-production-preclients-policy); policy=sha256:${policy%% *}
export FIXTURE_PREVIOUS=$old_commit FIXTURE_CANDIDATE=$new_commit FIXTURE_DIR=/work/transport-state FIXTURE_OLD=$old_image FIXTURE_NEW=$image_id
mkdir /work/transport-doubles
cp /work/preclients-policy/doubles/{docker,curl} /work/transport-doubles/
cat > /work/transport-doubles/ssh <<'MOCK'
#!/usr/bin/env bash
set -eu
exec /bin/bash -c "${!#}"
MOCK
cat > /work/transport-doubles/ssh-keygen <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' '256 SHA256:9mo2a7iYwuHEHlO7SyeHFhwatAv6Hf0yY4yUDhpbPrc fixture (ED25519)'
MOCK
chmod 700 /work/transport-doubles/*
printf 'synthetic key\n' > /work/transport-key
ln -s /work/transport-repo /opt/nxgestao
PATH="/work/transport-doubles:$PATH"
# No marker or Docker mutation may occur if the verified tar is changed en route.
cp "$verified_path" /work/tampered.tar
printf 'x' >> /work/tampered.tar
if bash /work/scripts/staging-transport.sh /work/tampered.tar "$new_commit" "$verified_tar" "$verified_zip" 7 1 8 fixturehost fixtureuser /work/transport-key /work/staging-known-hosts production-preclients 9 "$image_id" "$policy" fixture "$host" >/dev/null 2>&1; then exit 1; fi
[[ ! -e .git/nxgest-production-pending && ! -e /work/transport-state/calls ]]
result=$(bash /work/scripts/staging-transport.sh "$verified_path" "$new_commit" "$verified_tar" "$verified_zip" 7 1 8 fixturehost fixtureuser /work/transport-key /work/staging-known-hosts production-preclients 9 "$image_id" "$policy" fixture "$host")
[[ $result == "PRECLIENTS_APPLIED sha=$new_commit tar=$verified_tar image=$image_id container=$FIXTURE_NEWID" && -f .git/nxgest-production-pending ]]
result=$(bash /work/scripts/staging-transport.sh "$verified_path" "$new_commit" "$verified_tar" "$verified_zip" 7 1 8 fixturehost fixtureuser /work/transport-key /work/staging-known-hosts production-preclients-finalize 44 "$image_id" "sha256:$a")
[[ $result == "PRECLIENTS_FINALIZED sha=$new_commit image=$image_id" && ! -e .git/nxgest-production-pending && -f .git/nxgest-production-completed-$new_commit-44 ]]
before=$(wc -l < /work/transport-state/calls)
if bash /work/scripts/staging-transport.sh "$verified_path" "$new_commit" "$verified_tar" "$verified_zip" 7 1 8 fixturehost fixtureuser /work/transport-key /work/staging-known-hosts production-preclients 9 "$image_id" "$policy" fixture "$host" >/dev/null 2>&1; then exit 1; fi
[[ $(wc -l < /work/transport-state/calls) == "$before" && ! -e .git/nxgest-production-pending ]]
[[ -L /opt/nxgestao && $(readlink /opt/nxgestao) == /work/transport-repo ]]
rm -- /opt/nxgestao
printf 'PRECLIENTS_SOURCE_TRANSPORT_BOOTSTRAP_FIXTURE_OK\n'
