#!/usr/bin/env bash
# Snapshot privado: o chamador deve autenticar o artifact e vincular o image ID.
# Não inicia, para, cria, renomeia ou remove containers.
set -euo pipefail
umask 077
fail(){ echo 'Cápsula pós-baseline recusada' >&2; exit 1; }
[[ $# == 10 || ( $# == 11 && ${11} == --own-pending ) ]] || fail
args=("${@:1:9}"); [[ $# == 10 ]] || args+=(--own-pending); image=${10}; [[ $image =~ ^sha256:[a-f0-9]{64}$ ]] || fail
base=$(cd "$(dirname "$0")" && pwd -P)
flock -n 9 || fail
source "$base/host-jq.sh"; nxgest_use_jq || fail
bash "$base/staging-post-baseline-observe.sh" "${args[@]}" >/dev/null || fail
gitdir=$(git rev-parse --absolute-git-dir) || fail
mapfile -t p < "${NXGEST_OPERATION_POLICY:-$gitdir/nxgest-staging-post-baseline-policy}"
[[ ${#p[@]} == 22 ]] || fail
op=${p[4]#operation=}; current=${p[8]#current_id=}; old_image=${p[9]#current_image=}; network_id=${p[21]#network_id=}
work=$gitdir/nxgest-post-baseline-$op
mkdir -m 700 "$work" 2>/dev/null || fail
complete=0
cleanup(){ if [[ $complete == 0 && -d $work && ! -L $work ]]; then rm -f -- "$work/current.json" "$work/recheck.json" "$work/image.json" "$work/payload.json" "$work/journal"; rmdir -- "$work" 2>/dev/null || :; fi; }
trap cleanup EXIT
export DOCKER_HOST=unix:///var/run/docker.sock; unset DOCKER_CONTEXT
version=$(timeout 10s docker --host unix:///var/run/docker.sock version --format '{{.Server.Version}}|{{.Server.APIVersion}}' 2>/dev/null) || fail
[[ $version == '26.1.3|1.45' ]] || fail
(ulimit -f 1024; timeout 10s docker --host unix:///var/run/docker.sock inspect "$current" > "$work/current.json") 2>/dev/null || fail
(ulimit -f 1024; timeout 10s docker --host unix:///var/run/docker.sock image inspect "$image" > "$work/image.json") 2>/dev/null || fail
for f in current.json image.json; do [[ -s $work/$f && $(stat -c %s "$work/$f") -le 1048576 ]] || fail; done
"$NXGEST_JQ" -e --arg id "$current" --arg img "$old_image" --arg net "$network_id" '
 .[0] as $c | length == 1 and .[0].Id == $id and .[0].Name == "/staging-app" and .[0].Image == $img and .[0].State.Running == true and
 (.[0].Mounts | length == 1 and .[0].Type == "volume" and .[0].Name == "nxgestao_nxgestao_staging_data" and .[0].Destination == "/data" and .[0].RW == true) and
 (.[0].NetworkSettings.Networks | keys == ["nxgestao_net"] and .nxgestao_net.NetworkID == $net and (.nxgestao_net.Aliases | type == "array")) and
 (.[0].HostConfig | .Privileged == false and (.Binds == null or .Binds == []) and (.PortBindings == null or .PortBindings == {}) and (.Devices == null or .Devices == []) and .PublishAllPorts == false and .AutoRemove == false and .NetworkMode == $c.NetworkSettings.Networks.nxgestao_net.NetworkID) and
 (.[0].HostConfig | ((.CapAdd // []) == []) and ((.CapDrop // []) == []) and ((.SecurityOpt // []) == []) and ((.ExtraHosts // []) == []) and ((.Dns // []) == []) and ((.Tmpfs // {}) == {}) and ((.Devices // []) == []) and ((.DeviceRequests // []) == []) and ((.GroupAdd // []) == []) and ((.VolumesFrom // []) == []) and ((.Links // []) == []) and ((.Sysctls // {}) == {}) and ((.PidMode // "") == "") and ((.UsernsMode // "") == "")) and
 (.[0].HostConfig | (keys - ["Binds","ContainerIDFile","LogConfig","NetworkMode","PortBindings","RestartPolicy","AutoRemove","VolumeDriver","VolumesFrom","Mounts","ConsoleSize","CapAdd","CapDrop","CgroupnsMode","Dns","DnsOptions","DnsSearch","ExtraHosts","GroupAdd","IpcMode","Cgroup","Links","OomScoreAdj","PidMode","Privileged","PublishAllPorts","ReadonlyRootfs","SecurityOpt","StorageOpt","Tmpfs","UTSMode","UsernsMode","ShmSize","Sysctls","Runtime","Isolation","CpuShares","Memory","NanoCpus","CgroupParent","BlkioWeight","BlkioWeightDevice","BlkioDeviceReadBps","BlkioDeviceWriteBps","BlkioDeviceReadIOps","BlkioDeviceWriteIOps","CpuPeriod","CpuQuota","CpuRealtimePeriod","CpuRealtimeRuntime","CpusetCpus","CpusetMems","Devices","DeviceCgroupRules","DeviceRequests","KernelMemoryTCP","MemoryReservation","MemorySwap","MemorySwappiness","OomKillDisable","PidsLimit","Ulimits","CpuCount","CpuPercent","IOMaximumIOps","IOMaximumBandwidth","MaskedPaths","ReadonlyPaths","Init"]) | length == 0) and
 (.[0].Config | (keys - ["Hostname","Domainname","User","AttachStdin","AttachStdout","AttachStderr","ExposedPorts","Tty","OpenStdin","StdinOnce","Env","Cmd","Healthcheck","ArgsEscaped","Image","Volumes","WorkingDir","Entrypoint","NetworkDisabled","MacAddress","OnBuild","Labels","StopSignal","StopTimeout","Shell"]) | length == 0) and
 (.[0].NetworkSettings.Networks.nxgestao_net | (.IPAMConfig == null) and (.Aliases | index("staging-app") != null)) and
 (.[0].Config.ExposedPorts | keys == ["8081/tcp"] or keys == ["8080/tcp","8081"]) and
 (.[0].Config.Env | type == "array" and all(.[];type == "string"))
' "$work/current.json" >/dev/null || fail
"$NXGEST_JQ" -e --arg image "$image" 'length == 1 and .[0].Id == $image and (.[0].Config | type == "object")' "$work/image.json" >/dev/null || fail
expressions=('{Config: .[0].Config, HostConfig: .[0].HostConfig}' '.[0].Mounts' '.[0].NetworkSettings.Networks')
expected=("${p[17]#config_sha256=}" "${p[18]#mounts_sha256=}" "${p[19]#networks_sha256=}")
for i in 0 1 2; do actual=$("$NXGEST_JQ" -cS "${expressions[$i]}" "$work/current.json" | sha256sum); [[ ${actual%% *} == "${expected[$i]}" ]] || fail; done
"$NXGEST_JQ" -n --slurpfile old "$work/current.json" --slurpfile new "$work/image.json" --arg image "$image" --arg op "$op" '
 $old[0][0] as $o | $new[0][0] as $n |
 ($o.Config | del(.Image,.Cmd,.Entrypoint,.WorkingDir,.User) | .Image=$image | .Cmd=$n.Config.Cmd | .Entrypoint=$n.Config.Entrypoint | .WorkingDir=$n.Config.WorkingDir | .User=$n.Config.User | .Labels=((.Labels // {}) + {"nxgest.postbaseline.operation":$op})) +
 {HostConfig:($o.HostConfig | .Mounts=[{Type:"volume",Source:"nxgestao_nxgestao_staging_data",Target:"/data",VolumeOptions:{NoCopy:true}}] | .Binds=null),NetworkingConfig:{EndpointsConfig:{nxgestao_net:{Aliases:$o.NetworkSettings.Networks.nxgestao_net.Aliases}}}}
' > "$work/payload.json" || fail
[[ $(stat -c %s "$work/payload.json") -le 1048576 ]] || fail
bash "$base/staging-post-baseline-observe.sh" "${args[@]}" >/dev/null || fail
(ulimit -f 1024; timeout 10s docker --host unix:///var/run/docker.sock inspect "$current" > "$work/recheck.json") 2>/dev/null || fail
[[ -s $work/recheck.json && $(stat -c %s "$work/recheck.json") -le 1048576 ]] || fail
for i in 0 1 2; do actual=$("$NXGEST_JQ" -cS "${expressions[$i]}" "$work/recheck.json" | sha256sum); [[ ${actual%% *} == "${expected[$i]}" ]] || fail; done
rm -- "$work/recheck.json"
payload_hash=$(sha256sum -- "$work/payload.json"); payload_hash=${payload_hash%% *}
printf 'version=post-baseline-v1\noperation=%s\npayload_sha256=%s\nstate=prepared\ncurrent_id=%s\nnew_image=%s\n' "$op" "$payload_hash" "$current" "$image" > "$work/journal" || fail
complete=1
printf 'POST_BASELINE_CAPSULE_PREPARED\n'
