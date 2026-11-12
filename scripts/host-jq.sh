#!/usr/bin/env bash
# jq portátil previamente provisionado; nenhuma busca ou instalação implícita.
nxgest_use_jq() {
  local gitdir dir tool owner dmode fmode digest
  gitdir=$(git rev-parse --absolute-git-dir) || return 1
  [ -d "$gitdir" ] && [ ! -L "$gitdir" ] || return 1
  dir="$gitdir/nxgest-tools"; tool="$dir/jq"
  [ -d "$dir" ] && [ ! -L "$dir" ] && [ -f "$tool" ] && [ ! -L "$tool" ] && [ -x "$tool" ] || return 1
  owner=$(id -u) || return 1
  [ "$(stat -c %u "$dir")" = "$owner" ] && [ "$(stat -c %u "$tool")" = "$owner" ] || return 1
  dmode=$(stat -c %a "$dir") || return 1; fmode=$(stat -c %a "$tool") || return 1
  [[ "$dmode" =~ ^[0-7]{3,4}$ && "$fmode" =~ ^[0-7]{3,4}$ ]] || return 1
  (( (8#$dmode & 8#7022) == 0 && (8#$fmode & 8#7022) == 0 )) || return 1
  digest=$(sha256sum -- "$tool") || return 1; digest=${digest%% *}
  [ "$digest" = b1c22172dd303f3be49e935aa56aa48a8b7a46e0bc838b4997d3bb451495870f ] || return 1
  NXGEST_JQ="$tool"; export NXGEST_JQ
}
