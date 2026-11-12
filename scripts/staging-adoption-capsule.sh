#!/usr/bin/env bash
# Pré-transição: somente inspect e arquivos privados; nunca altera containers.
set -euo pipefail
umask 077
fail(){ echo 'Preparação de adoção recusada' >&2; exit 1; }
[[ $# == 10 ]] || fail
approved=$1; decision=$2; sha=$3; run=$4; attempt=$5; artifact=$6; zip=$7; tar=$8; host=$9; new_image=${10}
[[ "$new_image" =~ ^sha256:[a-f0-9]{64}$ ]] || fail
flock -n 9 || fail
source "$(dirname "$0")/host-jq.sh"
nxgest_use_jq || fail
bash "$(dirname "$0")/staging-adoption-policy.sh" "$approved" "$decision" "$sha" "$run" "$attempt" "$artifact" "$zip" "$tar" "$host" || fail
# O chamador confiável deve ter autenticado o artifact e associado o ID carregado.
gitdir=$(git rev-parse --absolute-git-dir) || fail
policy=$gitdir/nxgest-staging-adoption-policy
mapfile -t a < "$policy"
[[ ${#a[@]} == 17 ]] || fail
op=${a[4]#operation=}; legacy=${a[5]#legacy_id=}; old_image=${a[6]#legacy_image=}
config_hash=${a[7]#config_sha256=}; mounts_hash=${a[8]#mounts_sha256=}; networks_hash=${a[9]#networks_sha256=}
for name in nxgest-staging-sha nxgest-staging-selection nxgest-staging-pending nxgest-staging-adoption-consumed; do
  [[ ! -e "$gitdir/$name" && ! -L "$gitdir/$name" ]] || fail
done
work=$gitdir/nxgest-adoption-$op
mkdir -m 700 "$work" 2>/dev/null || fail
complete=0
cleanup(){ if [[ $complete == 0 && -d "$work" && ! -L "$work" ]]; then rm -f -- "$work/legacy.json" "$work/image.json" "$work/payload.json" "$work/journal"; rmdir -- "$work" 2>/dev/null || :; fi; }
trap cleanup EXIT
# Domínio compatível comprovado apenas para o daemon observado; não há fallback.
version=$(timeout 10s env -u DOCKER_CONTEXT -u DOCKER_HOST docker --host unix:///var/run/docker.sock version --format '{{.Server.Version}}|{{.Server.APIVersion}}' 2>/dev/null) || fail
[[ "$version" == '26.1.3|1.45' ]] || fail
# Limite de arquivo de 1 MiB também para saídas hostis do dublê/daemon.
(ulimit -f 1024; timeout 10s env -u DOCKER_CONTEXT -u DOCKER_HOST docker --host unix:///var/run/docker.sock inspect "$legacy" > "$work/legacy.json") 2>/dev/null || fail
(ulimit -f 1024; timeout 10s env -u DOCKER_CONTEXT -u DOCKER_HOST docker --host unix:///var/run/docker.sock image inspect "$new_image" > "$work/image.json") 2>/dev/null || fail
[[ -s "$work/legacy.json" && -s "$work/image.json" && $(stat -c %s "$work/legacy.json") -le 1048576 && $(stat -c %s "$work/image.json") -le 1048576 ]] || fail
# Topologia mínima revisável: um volume nomeado de staging e uma rede conhecida.
"$NXGEST_JQ" -e --arg id "$legacy" --arg old "$old_image" '
  length == 1 and .[0].Id == $id and .[0].Name == "/staging-app" and .[0].Image == $old and .[0].State.Running == true and
  (.[0].Mounts | length == 1 and .[0].Type == "volume" and .[0].Name == "nxgestao_nxgestao_staging_data" and .[0].Destination == "/data" and .[0].RW == true) and
  (.[0].NetworkSettings.Networks | keys == ["nxgestao_net"] and .nxgestao_net.NetworkID != "" and (.nxgestao_net.Aliases | type == "array")) and
  (.[0].HostConfig.Privileged == false and .[0].HostConfig.NetworkMode == .[0].NetworkSettings.Networks.nxgestao_net.NetworkID and (.[0].HostConfig.PortBindings == null or .[0].HostConfig.PortBindings == {}) and (.[0].HostConfig.Binds == null or .[0].HostConfig.Binds == []) and (.[0].HostConfig.Devices == null or .[0].HostConfig.Devices == [])) and
  (.[0].HostConfig | ((.CapAdd // []) == []) and ((.SecurityOpt // []) == []) and ((.ExtraHosts // []) == []) and ((.Dns // []) == []) and ((.Tmpfs // {}) == {}) and ((.PidMode // "") == "") and ((.UsernsMode // "") == "") and ((.ReadonlyRootfs // false) == false)) and
  (.[0].HostConfig | ((.CapDrop // []) == []) and ((.DnsOptions // []) == []) and ((.DnsSearch // []) == []) and ((.DeviceRequests // []) == []) and ((.GroupAdd // []) == []) and ((.VolumesFrom // []) == []) and ((.Links // []) == []) and ((.Sysctls // {}) == {}) and .IpcMode == "private" and .CgroupnsMode == "host" and .UTSMode == "" and .Isolation == "" and .Runtime == "runc" and .ShmSize == 67108864 and .Memory == 0 and .MemorySwap == 0 and .NanoCpus == 0 and .CpuShares == 0 and .CpusetCpus == "" and (.Ulimits == null or .Ulimits == []) and .Init == null and .PublishAllPorts == false and .AutoRemove == false and .RestartPolicy == {Name:"unless-stopped",MaximumRetryCount:0} and .LogConfig == {Type:"json-file",Config:{}} and (.Mounts | length == 1 and .[0].Type == "volume" and .[0].Source == "nxgestao_nxgestao_staging_data" and .[0].Target == "/data" and (.[0].VolumeOptions // {}) == {})) and
  (.[0].NetworkSettings.Networks.nxgestao_net | (.NetworkID | test("^[a-f0-9]{64}$")) and .IPAMConfig == null) and
  (.[0].HostConfig | (keys - ["Binds","ContainerIDFile","LogConfig","NetworkMode","PortBindings","RestartPolicy","AutoRemove","VolumeDriver","VolumesFrom","Mounts","ConsoleSize","CapAdd","CapDrop","CgroupnsMode","Dns","DnsOptions","DnsSearch","ExtraHosts","GroupAdd","IpcMode","Cgroup","Links","OomScoreAdj","PidMode","Privileged","PublishAllPorts","ReadonlyRootfs","SecurityOpt","StorageOpt","Tmpfs","UTSMode","UsernsMode","ShmSize","Sysctls","Runtime","Isolation","CpuShares","Memory","NanoCpus","CgroupParent","BlkioWeight","BlkioWeightDevice","BlkioDeviceReadBps","BlkioDeviceWriteBps","BlkioDeviceReadIOps","BlkioDeviceWriteIOps","CpuPeriod","CpuQuota","CpuRealtimePeriod","CpuRealtimeRuntime","CpusetCpus","CpusetMems","Devices","DeviceCgroupRules","DeviceRequests","KernelMemoryTCP","MemoryReservation","MemorySwap","MemorySwappiness","OomKillDisable","PidsLimit","Ulimits","CpuCount","CpuPercent","IOMaximumIOps","IOMaximumBandwidth","MaskedPaths","ReadonlyPaths","Init"]) | length == 0) and
  (.[0].Config | (keys - ["Hostname","Domainname","User","AttachStdin","AttachStdout","AttachStderr","ExposedPorts","Tty","OpenStdin","StdinOnce","Env","Cmd","Healthcheck","ArgsEscaped","Image","Volumes","WorkingDir","Entrypoint","NetworkDisabled","MacAddress","OnBuild","Labels","StopSignal","StopTimeout","Shell"]) | length == 0) and
  (.[0].Config.Labels["com.docker.compose.project"] == "nxgestao" and .[0].Config.Labels["com.docker.compose.service"] == "staging-app") and
  (.[0].Config.Env | type == "array" and all(.[]; type == "string")) and (.[0].Config.ExposedPorts | keys == ["8081/tcp"])
' "$work/legacy.json" >/dev/null || fail
"$NXGEST_JQ" -e --arg image "$new_image" 'length == 1 and .[0].Id == $image and (.[0].Config | type == "object")' "$work/image.json" >/dev/null || fail
for pair in "Config:$config_hash" "Mounts:$mounts_hash" "NetworkSettings.Networks:$networks_hash"; do
  field=${pair%%:*}; expected=${pair#*:}
  [[ "$field" != Config ]] || field="{Config: .[0].Config, HostConfig: .[0].HostConfig}"
  if [[ "$field" == \{* ]]; then expression=$field; else expression=".[0].$field"; fi
  actual=$("$NXGEST_JQ" -cS "$expression" "$work/legacy.json" | sha256sum); actual=${actual%% *}
  [[ "$actual" == "$expected" ]] || fail
done
# JSON é escrito em arquivo privado; nenhum valor de ambiente entra em argv ou stdout.
"$NXGEST_JQ" -n --slurpfile old "$work/legacy.json" --slurpfile new "$work/image.json" --arg image "$new_image" --arg op "$op" '
  $old[0][0] as $o | $new[0][0] as $n |
  ($o.Config | del(.Image,.Cmd,.Entrypoint,.WorkingDir,.User) |
    .Image=$image | .Cmd=$n.Config.Cmd | .Entrypoint=$n.Config.Entrypoint |
    .WorkingDir=$n.Config.WorkingDir | .User=$n.Config.User |
    .Labels=((.Labels // {}) + {"nxgest.adoption.operation":$op})) +
  {HostConfig:($o.HostConfig | .Mounts=[{Type:"volume",Source:"nxgestao_nxgestao_staging_data",Target:"/data",VolumeOptions:{NoCopy:true}}] | .Binds=null),
   NetworkingConfig:{EndpointsConfig:{nxgestao_net:{Aliases:$o.NetworkSettings.Networks.nxgestao_net.Aliases}}}}
' > "$work/payload.json" || fail
[[ $(stat -c %s "$work/payload.json") -le 1048576 ]] || fail
payload_hash=$(sha256sum -- "$work/payload.json"); payload_hash=${payload_hash%% *}
printf 'version=staging-adoption-v1\noperation=%s\npayload_sha256=%s\nstate=prepared\ntarget=staging-app\napi_socket=/var/run/docker.sock\napi_path=/v1.41/containers/create?name=staging-app\nlegacy_id=%s\nnew_image=%s\n' "$op" "$payload_hash" "$legacy" "$new_image" > "$work/journal" || fail
chmod 600 "$work/legacy.json" "$work/image.json" "$work/payload.json" "$work/journal"
complete=1
printf 'ADOPTION_CAPSULE_PREPARED operation=%s\n' "$op"
