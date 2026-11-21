#!/usr/bin/env bash
# Encrypt and upload the newest coherent set, including images and recovery config.
set -euo pipefail
umask 077
base=$(cd "$(dirname "$0")" && pwd -P)
source "$base/backup-maintenance-common.sh"
nxg_backup_setup
config=$PROJECT_DIR/.git/nxgest-offsite.env
[[ -f $config && ! -L $config && $(stat -c %u "$config") == "$(id -u)" && $(stat -c %a "$config") == 600 ]] || { nxg_backup_fail offsite-config-missing-or-not-private;exit 1; }
set -a;source "$config";set +a
# Never mistake another directory on this VPS for an off-site destination.
case "${RESTIC_REPOSITORY:-}" in b2:*|s3:https://*|sftp:*) ;; *) nxg_backup_fail remote-repository-required;exit 1;;esac
[[ -n ${RESTIC_PASSWORD_FILE:-} && -f $RESTIC_PASSWORD_FILE && ! -L $RESTIC_PASSWORD_FILE && $(stat -c %a "$RESTIC_PASSWORD_FILE") == 600 && $(stat -c %u "$RESTIC_PASSWORD_FILE") == "$(id -u)" ]]
restic=${NXGEST_RESTIC_BIN:-/usr/local/bin/restic}
[[ -x $restic && -f $restic && ! -L $restic ]]
bundle=$(nxg_backup_latest);id=${bundle##*/};nxg_backup_verify "$bundle"
work=$(mktemp -d "$BACKUP_DIR/.offsite.XXXXXXXX")
trap 'rm -rf -- "$work"' EXIT
trap 'exit 130' INT;trap 'exit 143' TERM
mkdir "$work/recovery"
for kind in image database_image;do
 image=$(sed -n "s/^$kind=//p" "$bundle/metadata.txt")
 [[ $image =~ ^sha256:[a-f0-9]{64}$ ]]
 timeout --signal=TERM --kill-after=10s 10m docker image save "$image" | gzip -1 > "$work/recovery/$kind.tar.gz"
done
# Secrets are included only inside the encrypted remote snapshot, never its logs.
install -m 600 "$PROJECT_DIR/.env" "$work/recovery/production.env"
cp "$PROJECT_DIR/infra/docker-compose.prod.yml" "$PROJECT_DIR/infra/Caddyfile" "$work/recovery/"
cp "$base/"*.sh "$work/recovery/"
(cd "$work/recovery";sha256sum -- * > SHA256SUMS)
# Fixed recovery path inside snapshot keeps restores and deduplication predictable.
mkdir "$work/payload";cp -a "$bundle" "$work/payload/$id";mv "$work/recovery" "$work/payload/recovery"
(cd "$work/payload"; "$restic" backup --json --host nxgest-production --tag nxgest --tag "$id" -- .) > "$work/result.jsonl"
snapshot=$("$NXGEST_JQ" -er 'select(.message_type=="summary")|.snapshot_id' "$work/result.jsonl")
[[ $snapshot =~ ^[a-f0-9]{64}$ ]]
# Download the entire new snapshot and verify every copied byte before receipt.
"$restic" restore "$snapshot" --target "$work/roundtrip" >/dev/null
nxg_backup_verify "$work/roundtrip/$id"
(cd "$work/roundtrip/recovery";sha256sum --check --status SHA256SUMS)
proof=$(sha256sum "$bundle/SHA256SUMS")
nxg_backup_record "offsite-$id" "$id" "${proof%% *}"
printf 'OFFSITE_VERIFIED id=%s snapshot=%s roundtrip=true\n' "$id" "$snapshot"
