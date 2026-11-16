#!/usr/bin/env bash
# Shared by the pinned recurring controller. Base policy is operator-owned;
# generated operation files are journals, never independent authorization.
set -euo pipefail
nxgest_secure_file(){
  [[ -f $1 && ! -L $1 && $(stat -c %u "$1") == "$(id -u)" && $(stat -c %a "$1") == 600 && $(stat -c %s "$1") -le ${2:-16384} ]]
}
nxgest_recurring_context(){
  local env=$1 authority mode sum now
  [[ $env == staging || $env == production ]] || return 1
  [[ ${NXGEST_RECURRING_ENV:-} == "$env" && ${NXGEST_APPROVED_CONTROLLER:-} =~ ^[a-f0-9]{40}$ && ${NXGEST_RECURRING_PEER:-} == "nxgest-$env-runner" ]] || return 1
  NXGEST_GITDIR=$(git rev-parse --absolute-git-dir) || return 1
  [[ -d $NXGEST_GITDIR && ! -L $NXGEST_GITDIR && $(stat -c %u "$NXGEST_GITDIR") == "$(id -u)" ]] || return 1
  mode=$(stat -c %a "$NXGEST_GITDIR"); [[ $mode =~ ^[0-7]{3,4}$ ]] && (( (8#$mode & 8#7022) == 0 )) || return 1
  flock -n 9 || return 1
  [[ -f $NXGEST_GITDIR/nxgest-deploy.lock && ! -L $NXGEST_GITDIR/nxgest-deploy.lock && $(stat -Lc '%d:%i' /proc/self/fd/9) == "$(stat -Lc '%d:%i' "$NXGEST_GITDIR/nxgest-deploy.lock")" ]] || return 1
  authority=$NXGEST_GITDIR/nxgest-recurring-$env-authority
  nxgest_secure_file "$authority" 4096 || return 1
  local -a a; mapfile -t a < "$authority"
  [[ ${#a[@]} == 8 && ${a[0]} == version=recurring-authority-v2 && ${a[1]} == "environment=$env" && ${a[2]} == "host=$(hostname -s)" && ${a[3]} == "controller=$NXGEST_APPROVED_CONTROLLER" && ${a[4]} =~ ^policy_sha256=sha256:[a-f0-9]{64}$ && ${a[5]} =~ ^decision=[A-Za-z0-9._/-]{1,160}$ && ${a[6]} =~ ^expires_epoch=[0-9]{10}$ && ${a[7]} == "peer=$NXGEST_RECURRING_PEER" ]] || return 1
  now=$(date +%s); [[ $now =~ ^[0-9]{10}$ ]] && (( 10#${a[6]#expires_epoch=} > 10#$now )) || return 1
  NXGEST_BASE_FILE=$NXGEST_GITDIR/nxgest-$env-recurring-policy.json
  [[ ${NXGEST_RECURRING_BASE_HASH:-} == "${a[4]#policy_sha256=}" ]] || return 1
  nxgest_secure_file "$NXGEST_BASE_FILE" 32768 || return 1
  sum=$(sha256sum -- "$NXGEST_BASE_FILE"); [[ sha256:${sum%% *} == "${a[4]#policy_sha256=}" ]] || return 1
  local base; base=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
  source "$base/host-jq.sh"; nxgest_use_jq || return 1
  "$NXGEST_JQ" -e --arg env "$env" --arg host "${a[2]#host=}" --arg controller "$NXGEST_APPROVED_CONTROLLER" --arg decision "${a[5]#decision=}" --argjson now "$now" '
    type=="object" and (keys|sort)==(["version","environment","mode","noClients","repo","repoId","host","controllerSha","decision","expiresEpoch","runnerPolicies","productionBaseline","peers","topology"]|sort) and
    .version=="nxgest-host-recurring-v1" and .environment==$env and .mode=="preclients" and .noClients==true and .repo=="RafaCartaxo/nxgest" and .repoId==1304448439 and .host==$host and .controllerSha==$controller and .decision==$decision and
    (.expiresEpoch|type)=="number" and .expiresEpoch> $now and .expiresEpoch<10000000000 and .expiresEpoch==(.expiresEpoch|floor) and
    (.productionBaseline|keys|sort)==["id","image","sha"] and (.productionBaseline.sha|test("^[a-f0-9]{40}$")) and (.productionBaseline.id|test("^[a-f0-9]{64}$")) and (.productionBaseline.image|test("^sha256:[a-f0-9]{64}$")) and
    (.peers|type)=="array" and (.peers|length)>0 and (.peers|length)<=16 and ([.peers[].id]|unique|length)==(.peers|length) and all(.peers[]; (keys|sort)==["id","image","service"] and (.id|test("^[a-f0-9]{64}$")) and (.image|test("^sha256:[a-f0-9]{64}$")) and (.service|test("^[a-zA-Z0-9_-]{1,64}$")) and .service!="app" and .service!="staging-app") and
    (.runnerPolicies|keys|sort)==["build","staging"] and (.runnerPolicies.build|test("^sha256:[a-f0-9]{64}$")) and (if $env=="staging" then .runnerPolicies.staging==null else (.runnerPolicies.staging|type)=="string" and (.runnerPolicies.staging|test("^sha256:[a-f0-9]{64}$")) end) and (.topology|type)=="object"
  ' "$NXGEST_BASE_FILE" >/dev/null || return 1
  [[ ${NXGEST_RUNNER_BUILD_POLICY_HASH:-} == "$("$NXGEST_JQ" -r '.runnerPolicies.build' "$NXGEST_BASE_FILE")" ]] || return 1
  if [[ $env == staging ]]; then [[ ${NXGEST_RUNNER_STAGE_POLICY_HASH:-} == none ]] || return 1
  else [[ ${NXGEST_RUNNER_STAGE_POLICY_HASH:-} == "$("$NXGEST_JQ" -r '.runnerPolicies.staging' "$NXGEST_BASE_FILE")" ]] || return 1; fi
  NXGEST_BASE_DECISION=${a[5]#decision=}; NXGEST_BASE_HASH=${a[4]#policy_sha256=}; NXGEST_BASE_HOST=${a[2]#host=}
  NXGEST_BASE_EXPIRY=$("$NXGEST_JQ" -r '.expiresEpoch' "$NXGEST_BASE_FILE")
  (( 10#$NXGEST_BASE_EXPIRY <= 10#${a[6]#expires_epoch=} )) || return 1
}
nxgest_operation_policy(){
  local env=$1 legacy=$2 path=${NXGEST_OPERATION_POLICY:-}
  if [[ -z ${NXGEST_RECURRING_ENV:-} ]]; then [[ -z $path ]] || return 1; printf '%s\n' "$legacy"; return; fi
  nxgest_recurring_context "$env" || return 1
  [[ $path == "$NXGEST_GITDIR"/nxgest-recurring-"$env"-*.policy ]] || return 1
  local suffix=${path##*/nxgest-recurring-$env-}; [[ $suffix =~ ^[a-f0-9]{32}\.policy$ ]] || return 1
  nxgest_secure_file "$path" 4096 || return 1
  printf '%s\n' "$path"
}
nxgest_inspect(){ timeout 10s docker --host unix:///var/run/docker.sock inspect --format "$1" "$2" 2>/dev/null; }
nxgest_current_production(){
  local baseline=$NXGEST_GITDIR/nxgest-baseline-established selection=$NXGEST_GITDIR/nxgest-production-selection marker=$NXGEST_GITDIR/nxgest-production-sha
  local -a b s m p e archives
  nxgest_secure_file "$baseline" 4096 || return 1; mapfile -t b < "$baseline"
  [[ ${#b[@]} == 8 && ${b[0]} == version=first-baseline-v1 && ${b[1]} =~ ^sha=[a-f0-9]{40}$ && ${b[7]} =~ ^image=sha256:[a-f0-9]{64}$ ]] || return 1
  if [[ -e $selection || -L $selection || -e $marker || -L $marker ]]; then
    nxgest_secure_file "$selection" 4096 && nxgest_secure_file "$marker" 4096 || return 1
    mapfile -t s < "$selection"; mapfile -t m < "$marker"
    [[ ${#s[@]} == 8 && ${s[0]} == version=production-preclients-v1 && ${s[1]} =~ ^sha=[a-f0-9]{40}$ && ${s[7]} =~ ^image=sha256:[a-f0-9]{64}$ && ${#m[@]} == 1 && ${m[0]} == "${s[1]#sha=}" ]] || return 1
    NXGEST_PREVIOUS_SHA=${s[1]#sha=}; NXGEST_PREVIOUS_IMAGE=${s[7]#image=}
    shopt -s nullglob; archives=("$NXGEST_GITDIR"/nxgest-production-completed-"$NXGEST_PREVIOUS_SHA"-*)
    [[ ${#archives[@]} == 1 ]] || return 1
    nxgest_secure_file "${archives[0]}" 4096 || return 1; mapfile -t p < "${archives[0]}"
    [[ ${#p[@]} == 5 && ${p[0]} == version=preclients-pending-v1 && ${p[1]} == "sha=$NXGEST_PREVIOUS_SHA" && ${p[3]} == "image=$NXGEST_PREVIOUS_IMAGE" ]] || return 1
    local run=${archives[0]##*-}; [[ $run =~ ^[0-9]{1,20}$ ]] || return 1
    nxgest_secure_file "$NXGEST_GITDIR/nxgest-production-receipt-$NXGEST_PREVIOUS_SHA-$run" 4096 || return 1
    mapfile -t e < "$NXGEST_GITDIR/nxgest-production-receipt-$NXGEST_PREVIOUS_SHA-$run"
    [[ ${#e[@]} == 3 && ${e[0]} =~ ^receipt=sha256:[a-f0-9]{64}$ && ${e[1]} == "run=$run" && ${e[2]} =~ ^container=[a-f0-9]{64}$ ]] || return 1
    NXGEST_PREVIOUS_ID=${e[2]#container=}
  else
    NXGEST_PREVIOUS_SHA=${b[1]#sha=}; NXGEST_PREVIOUS_IMAGE=${b[7]#image=}
    "$NXGEST_JQ" -e --arg sha "$NXGEST_PREVIOUS_SHA" --arg image "$NXGEST_PREVIOUS_IMAGE" '.productionBaseline.sha==$sha and .productionBaseline.image==$image' "$NXGEST_BASE_FILE" >/dev/null || return 1
    NXGEST_PREVIOUS_ID=$("$NXGEST_JQ" -r '.productionBaseline.id' "$NXGEST_BASE_FILE")
  fi
  [[ $(nxgest_inspect '{{.Id}}' nxgestao-app-1) == "$NXGEST_PREVIOUS_ID" && $(nxgest_inspect '{{.Image}}' "$NXGEST_PREVIOUS_ID") == "$NXGEST_PREVIOUS_IMAGE" && $(nxgest_inspect '{{.State.Status}}' "$NXGEST_PREVIOUS_ID") == running ]] || return 1
}
nxgest_stage_config_hash(){
  "$NXGEST_JQ" -cS '{Config:(.[0].Config|del(.Image,.Cmd,.Entrypoint,.WorkingDir,.User,.Hostname)|.Labels|=del(."nxgest.postbaseline.operation",."nxgest.adoption.operation")),HostConfig:(.[0].HostConfig|.Mounts=[{Type:"volume",Source:"nxgestao_nxgestao_staging_data",Target:"/data",VolumeOptions:{NoCopy:true}}]|.Binds=null)}' "$1" | sha256sum
}
nxgest_stage_network_hash(){
  "$NXGEST_JQ" -cS '.[0].NetworkSettings.Networks|with_entries(.value|={NetworkID,Aliases,IPAMConfig:(.IPAMConfig//null),Links:(.Links//null),DriverOpts:(.DriverOpts//null)})' "$1" | sha256sum
}
nxgest_production_config_hash(){
  "$NXGEST_JQ" -cS '{Config:(.[0].Config|del(.Image,.Cmd,.Entrypoint,.WorkingDir,.User,.Hostname)|.Labels|=del(."com.docker.compose.config-hash",."com.docker.compose.image")),HostConfig:.[0].HostConfig}' "$1" | sha256sum
}
nxgest_production_topology(){
  local expected=$1 tmp config mounts networks
  "$NXGEST_JQ" -e '(.topology|keys|sort)==(["composeSha256","envSha256","configSha256","mountsSha256","networksSha256"]|sort) and all(.topology[];test("^[a-f0-9]{64}$"))' "$NXGEST_BASE_FILE" >/dev/null || return 1
  tmp=$(mktemp "$NXGEST_GITDIR/.nxgest-production-observe.XXXXXXXX") || return 1
  (ulimit -f 1024; timeout 10s docker --host unix:///var/run/docker.sock inspect "$expected" > "$tmp") || return 1
  nxgest_secure_file "$tmp" 1048576 || return 1
  "$NXGEST_JQ" -e --arg id "$expected" 'length==1 and .[0].Id==$id and .[0].Name=="/nxgestao-app-1" and .[0].State.Running==true' "$tmp" >/dev/null || return 1
  config=$(nxgest_production_config_hash "$tmp"); mounts=$("$NXGEST_JQ" -cS '.[0].Mounts' "$tmp" | sha256sum); networks=$(nxgest_stage_network_hash "$tmp")
  [[ ${config%% *} == "$("$NXGEST_JQ" -r '.topology.configSha256' "$NXGEST_BASE_FILE")" && ${mounts%% *} == "$("$NXGEST_JQ" -r '.topology.mountsSha256' "$NXGEST_BASE_FILE")" && ${networks%% *} == "$("$NXGEST_JQ" -r '.topology.networksSha256' "$NXGEST_BASE_FILE")" ]] || return 1
  rm -- "$tmp"
}
nxgest_participants(){
  local scope data id service image status project
  local -a records=(); local -A seen=()
  for scope in project network; do
    if [[ $scope == project ]]; then data=$(timeout 10s docker --host unix:///var/run/docker.sock ps -aq --no-trunc --filter label=com.docker.compose.project=nxgestao) || return 1
    else data=$(timeout 10s docker --host unix:///var/run/docker.sock ps -aq --no-trunc --filter network=nxgestao_net) || return 1; fi
    [[ -n $data && ${#data} -le 4300 ]] || return 1
    local -a ids; mapfile -t ids <<< "$data"; [[ ${#ids[@]} -le 64 ]] || return 1
    for id in "${ids[@]}"; do
      [[ $id =~ ^[a-f0-9]{64}$ && -z ${seen[$scope:$id]+yes} ]] || return 1; seen[$scope:$id]=1
      service=$(nxgest_inspect '{{index .Config.Labels "com.docker.compose.service"}}' "$id") || return 1
      [[ $service != staging-app ]] || continue # resources.sh independently classifies every staging ID.
      project=$(nxgest_inspect '{{index .Config.Labels "com.docker.compose.project"}}' "$id") || return 1; [[ $project == nxgestao ]] || return 1
      image=$(nxgest_inspect '{{.Image}}' "$id"); status=$(nxgest_inspect '{{.State.Status}}' "$id"); [[ $status == running ]] || return 1
      if [[ $id == "$NXGEST_PREVIOUS_ID" ]]; then [[ $service == app && $image == "$NXGEST_PREVIOUS_IMAGE" ]] || return 1
      else "$NXGEST_JQ" -e --arg id "$id" --arg image "$image" --arg service "$service" '[.peers[]|select(.id==$id and .image==$image and .service==$service)]|length==1' "$NXGEST_BASE_FILE" >/dev/null || return 1; fi
      records+=("$scope|$id|$image|$status")
    done
    [[ -n ${seen[$scope:$NXGEST_PREVIOUS_ID]+yes} ]] || return 1
    while IFS= read -r id; do [[ -n ${seen[$scope:$id]+yes} ]] || return 1; done < <("$NXGEST_JQ" -r '.peers[].id' "$NXGEST_BASE_FILE")
  done
  [[ ${#records[@]} -gt 0 ]] || return 1
  printf '%s\n' "${records[@]}" | LC_ALL=C sort | sha256sum
}
nxgest_prepare_operation(){
  local env=$1; shift
  local sha=$1 tar=$2 zip=$3 run=$4 attempt=$5 artifact=$6 image=${7:-} stage=${8:-}
  [[ $sha =~ ^[a-f0-9]{40}$ && $tar =~ ^sha256:[a-f0-9]{64}$ && $zip =~ ^sha256:[a-f0-9]{64}$ && $run =~ ^[0-9]{1,20}$ && $attempt == 1 && $artifact =~ ^[0-9]{1,20}$ ]] || return 1
  nxgest_recurring_context "$env" || return 1
  local n; for n in nxgest-baseline-pending nxgest-staging-pending nxgest-production-pending nxgest-recurring-production-active; do [[ ! -e $NXGEST_GITDIR/$n && ! -L $NXGEST_GITDIR/$n ]] || return 1; done
  nxgest_current_production || return 1
  local op; op=$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n'); [[ $op =~ ^[a-f0-9]{32}$ ]] || return 1
  local out=$NXGEST_GITDIR/nxgest-recurring-$env-$op.policy
  if [[ $env == staging ]]; then
    local state=$NXGEST_GITDIR/nxgest-staging-selection marker=$NXGEST_GITDIR/nxgest-staging-sha consumed=$NXGEST_GITDIR/nxgest-staging-adoption-consumed
    local -a s m c; for n in "$state" "$marker" "$consumed"; do nxgest_secure_file "$n" 4096 || return 1; done
    mapfile -t s < "$state"; mapfile -t m < "$marker"; mapfile -t c < "$consumed"
    [[ ${#s[@]} == 8 && ${s[0]} == environment=staging && ${s[1]} =~ ^sha=[a-f0-9]{40}$ && ${s[7]} =~ ^image=sha256:[a-f0-9]{64}$ && ${#m[@]} == 1 && ${m[0]} == "${s[1]#sha=}" && ${#c[@]} == 1 && ${c[0]} =~ ^operation=[a-f0-9]{32}$ && $sha != "${m[0]}" && $(git rev-parse HEAD) == "${m[0]}" ]] || return 1
    git merge-base --is-ancestor "${m[0]}" "$sha" || return 1
    "$NXGEST_JQ" -e '(.topology|keys|sort)==(["baseline","legacyId","legacyImage","configSha256","mountsSha256","networksSha256","networkId"]|sort) and (.topology.baseline|keys|sort)==["id","image","sha"] and (.topology.baseline.id|test("^[a-f0-9]{64}$")) and (.topology.baseline.sha|test("^[a-f0-9]{40}$")) and (.topology.baseline.image|test("^sha256:[a-f0-9]{64}$")) and (.topology.legacyId|test("^[a-f0-9]{64}$")) and (.topology.legacyImage|test("^sha256:[a-f0-9]{64}$")) and all(.topology|.configSha256,.mountsSha256,.networksSha256,.networkId;test("^[a-f0-9]{64}$"))' "$NXGEST_BASE_FILE" >/dev/null || return 1
    local current snapshot config mounts networks exactconfig exactmounts exactnet participants net legacy legacyimage
    current=$(nxgest_inspect '{{.Id}}' staging-app); [[ $current =~ ^[a-f0-9]{64}$ && $(nxgest_inspect '{{.Image}}' "$current") == "${s[7]#image=}" ]] || return 1
    if [[ ${m[0]} == "$("$NXGEST_JQ" -r '.topology.baseline.sha' "$NXGEST_BASE_FILE")" ]]; then
      "$NXGEST_JQ" -e --arg id "$current" --arg image "${s[7]#image=}" '.topology.baseline.id==$id and .topology.baseline.image==$image' "$NXGEST_BASE_FILE" >/dev/null || return 1
    else
      local prior_op prior_work prior_policy prior_load prior_digest
      local -a prior_journal prior_tx prior_loading
      prior_op=$(nxgest_inspect '{{index .Config.Labels "nxgest.postbaseline.operation"}}' "$current") || return 1
      [[ $prior_op =~ ^[a-f0-9]{32}$ ]] || return 1
      prior_work=$NXGEST_GITDIR/nxgest-post-baseline-$prior_op; prior_policy=$NXGEST_GITDIR/nxgest-recurring-staging-$prior_op.policy; prior_load=$NXGEST_GITDIR/nxgest-post-baseline-load-$prior_op
      [[ -d $prior_work && ! -L $prior_work && $(stat -c %u "$prior_work") == "$(id -u)" && $(stat -c %a "$prior_work") == 700 ]] || return 1
      for n in "$prior_work/journal" "$prior_work/create-response.json" "$prior_work/payload.json" "$prior_policy" "$prior_load"; do nxgest_secure_file "$n" 1048576 || return 1; done
      mapfile -t prior_journal < "$prior_work/journal"; mapfile -t prior_tx < "$prior_policy"; mapfile -t prior_loading < "$prior_load"
      [[ ${#prior_journal[@]} -ge 7 && ${prior_journal[0]} == version=post-baseline-v1 && ${prior_journal[1]} == "operation=$prior_op" && ${prior_journal[2]} =~ ^payload_sha256=[a-f0-9]{64}$ && ${prior_journal[5]} == "new_image=${s[7]#image=}" && ${prior_journal[-1]} == phase=completed ]] || return 1
      [[ $("$NXGEST_JQ" -er '.Id' "$prior_work/create-response.json") == "$current" && ${#prior_tx[@]} == 22 && ${prior_tx[4]} == "operation=$prior_op" && ${prior_tx[10]} == "sha=${m[0]}" && ${prior_tx[11]} == "${s[2]}" && ${prior_tx[12]} == "${s[3]}" && ${prior_tx[13]} == "${s[4]}" && ${prior_tx[14]} == "${s[5]}" && ${prior_tx[15]} == "${s[6]}" ]] || return 1
      prior_digest=$(sha256sum -- "$prior_work/payload.json"); [[ "payload_sha256=${prior_digest%% *}" == "${prior_journal[2]}" ]] || return 1
      prior_digest=$(sha256sum -- "$prior_policy")
      [[ $(printf '%s\n' "${prior_loading[@]}" | grep -c '^operation_policy_sha256=') == 1 && $(printf '%s\n' "${prior_loading[@]}" | grep -c '^base_policy_sha256=') == 1 ]] || return 1
      printf '%s\n' "${prior_loading[@]}" | grep -Fx "operation_policy_sha256=sha256:${prior_digest%% *}" >/dev/null || return 1
      printf '%s\n' "${prior_loading[@]}" | grep -Fx "base_policy_sha256=$NXGEST_BASE_HASH" >/dev/null || return 1
    fi
    snapshot=$NXGEST_GITDIR/nxgest-recurring-observation-$op.json
    (umask 077; set -C; ulimit -f 1024; timeout 10s docker --host unix:///var/run/docker.sock inspect "$current" > "$snapshot") || return 1
    nxgest_secure_file "$snapshot" 1048576 || return 1
    config=$(nxgest_stage_config_hash "$snapshot"); mounts=$("$NXGEST_JQ" -cS '.[0].Mounts' "$snapshot" | sha256sum); networks=$(nxgest_stage_network_hash "$snapshot")
    [[ ${config%% *} == "$("$NXGEST_JQ" -r '.topology.configSha256' "$NXGEST_BASE_FILE")" && ${mounts%% *} == "$("$NXGEST_JQ" -r '.topology.mountsSha256' "$NXGEST_BASE_FILE")" && ${networks%% *} == "$("$NXGEST_JQ" -r '.topology.networksSha256' "$NXGEST_BASE_FILE")" ]] || return 1
    exactconfig=$("$NXGEST_JQ" -cS '{Config:.[0].Config,HostConfig:.[0].HostConfig}' "$snapshot" | sha256sum); exactmounts=$mounts; exactnet=$("$NXGEST_JQ" -cS '.[0].NetworkSettings.Networks' "$snapshot" | sha256sum)
    participants=$(nxgest_participants) || return 1
    net=$("$NXGEST_JQ" -r '.topology.networkId' "$NXGEST_BASE_FILE"); legacy=$("$NXGEST_JQ" -r '.topology.legacyId' "$NXGEST_BASE_FILE"); legacyimage=$("$NXGEST_JQ" -r '.topology.legacyImage' "$NXGEST_BASE_FILE")
    (umask 077; set -C; printf 'version=staging-post-baseline-v2\nenvironment=staging\nhost=%s\ndecision=%s\noperation=%s\nlegacy_id=%s\nlegacy_image=%s\nprevious_sha=%s\ncurrent_id=%s\ncurrent_image=%s\nsha=%s\nrun=%s\nattempt=1\nartifact=%s\nzip=%s\ntar=%s\nexpires_epoch=%s\nconfig_sha256=%s\nmounts_sha256=%s\nnetworks_sha256=%s\nparticipants_sha256=%s\nnetwork_id=%s\n' "$NXGEST_BASE_HOST" "$NXGEST_BASE_DECISION" "$op" "$legacy" "$legacyimage" "${m[0]}" "$current" "${s[7]#image=}" "$sha" "$run" "$artifact" "$zip" "$tar" "$NXGEST_BASE_EXPIRY" "${exactconfig%% *}" "${exactmounts%% *}" "${exactnet%% *}" "${participants%% *}" "$net" > "$out") || return 1
  else
    [[ $image =~ ^sha256:[a-f0-9]{64}$ && $stage =~ ^[0-9]{1,20}$ && $sha != "$NXGEST_PREVIOUS_SHA" ]] || return 1
    git merge-base --is-ancestor "$NXGEST_PREVIOUS_SHA" "$sha" || return 1
    nxgest_production_topology "$NXGEST_PREVIOUS_ID" || return 1
    nxgest_secure_file .env 1048576 || return 1
    local envsum compose participants; envsum=$(sha256sum .env); compose=$(sha256sum "$(dirname "${BASH_SOURCE[0]}")/docker-compose.prod.yml")
    [[ ${envsum%% *} == "$("$NXGEST_JQ" -r '.topology.envSha256' "$NXGEST_BASE_FILE")" && ${compose%% *} == "$("$NXGEST_JQ" -r '.topology.composeSha256' "$NXGEST_BASE_FILE")" ]] || return 1
    participants=$(nxgest_participants) || return 1
    (umask 077; set -C; printf 'version=production-preclients-v1\nenvironment=production\nhost=%s\ndecision=%s\nno_clients=yes\nprevious_sha=%s\nsha=%s\nci_run=%s\nattempt=1\nartifact=%s\nzip=%s\ntar=%s\nimage=%s\nstaging_run=%s\nexpires_epoch=%s\n' "$NXGEST_BASE_HOST" "$NXGEST_BASE_DECISION" "$NXGEST_PREVIOUS_SHA" "$sha" "$run" "$artifact" "$zip" "$tar" "$image" "$stage" "$NXGEST_BASE_EXPIRY" > "$out") || return 1
  fi
  local sum; sum=$(sha256sum -- "$out")
  printf '%s\nsha256:%s\n' "$out" "${sum%% *}"
}
if [[ ${BASH_SOURCE[0]} == "$0" ]]; then
  case ${1:-} in staging|production) env=$1; shift; nxgest_prepare_operation "$env" "$@" || { echo 'Política-base recorrente recusada' >&2; exit 1; };; *) exit 2;; esac
fi
