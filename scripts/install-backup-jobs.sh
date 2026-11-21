#!/usr/bin/env bash
# Explicit operational install from an already deployed, approved main SHA.
set -euo pipefail
umask 077
sha=${1:?approved source SHA required}
[[ $sha =~ ^[a-f0-9]{40}$ && $(id -u) == 0 ]]
cd /opt/nxgestao
[[ $(git rev-parse HEAD) == "$sha" ]]
exec 9<>.git/nxgest-deploy.lock;flock -n 9
[[ ! -e .git/nxgest-production-pending && ! -e .git/nxgest-recurring-production-active ]]
snapshot=$(mktemp -d .git/nxgest-backup-install.XXXXXXXX)
mkdir -p /opt/scripts/nxgest;chmod 700 /opt/scripts/nxgest
for file in backup-maintenance-common.sh backup-maintenance.sh backup-restore-check.sh backup-verify-latest.sh backup-offsite.sh backup-retention.sh backup-status.sh host-jq.sh container-health.sh verify-backup.sh;do
 [[ ! -L /opt/scripts/nxgest/$file ]]
 if [[ -f /opt/scripts/nxgest/$file ]];then cp -p /opt/scripts/nxgest/$file "$snapshot/$file.before";fi
 git show "$sha:scripts/$file" > "$snapshot/$file.new";bash -n "$snapshot/$file.new"
 install -m 600 "$snapshot/$file.new" /opt/scripts/nxgest/$file
done
for file in /etc/cron.d/nxgest-backup /etc/logrotate.d/nxgest-backup;do
 [[ ! -L $file ]];if [[ -f $file ]];then cp -p "$file" "$snapshot/$(basename "$(dirname "$file")").before";fi
done
cat > "$snapshot/cron.new" <<'CRON'
# NX Gest: UTC, paired data backup and isolated restore, private logs.
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
CRON_TZ=UTC
0 2,14 * * * root /usr/bin/timeout --signal=TERM --kill-after=30s 45m /bin/bash /opt/scripts/nxgest/backup-maintenance.sh >> /var/log/backup-nxgest.log 2>&1
30 3 * * 0 root /usr/bin/timeout --signal=TERM --kill-after=30s 15m /bin/bash /opt/scripts/nxgest/backup-verify-latest.sh >> /var/log/backup-restore-nxgest.log 2>&1
CRON
for file in /var/log/backup-nxgest.log /var/log/backup-restore-nxgest.log;do
 [[ ! -L $file ]];touch "$file";chmod 600 "$file"
done
install -m 600 "$snapshot/cron.new" /etc/cron.d/.nxgest-backup.new
mv -T /etc/cron.d/.nxgest-backup.new /etc/cron.d/nxgest-backup
git show "$sha:infra/backup-logrotate.conf" > "$snapshot/logrotate.new"
install -m 644 "$snapshot/logrotate.new" /etc/logrotate.d/nxgest-backup
logrotate --debug /etc/logrotate.d/nxgest-backup >/dev/null 2>&1
systemctl is-active crond >/dev/null
printf 'BACKUP_JOBS_INSTALLED source_sha=%s snapshot=%s\n' "$sha" "${snapshot##*/}"
