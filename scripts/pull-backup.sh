#!/usr/bin/env bash
set -euo pipefail

# pull-backup.sh
# Baixa os backups do PostgreSQL e a pasta de uploads do VPS para a máquina local
# Destino: ~/.config/nxgestao/backups/

VPS_HOST="${VPS_HOST:-172.245.152.223}"
VPS_USER="${VPS_USER:-root}"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/id_ed25519}"
REMOTE_BACKUP_DIR="/opt/backups"
LOCAL_BACKUP_DIR="${HOME}/.config/nxgestao/backups"

mkdir -p "$LOCAL_BACKUP_DIR"
chmod 700 "$LOCAL_BACKUP_DIR"

echo "==> Conectando ao VPS ($VPS_HOST) para sincronizar backups..."

SSH_CMD="ssh"
SCP_CMD="scp"
if [ -f "$SSH_KEY" ]; then
  SSH_CMD="ssh -i $SSH_KEY"
  SCP_CMD="scp -i $SSH_KEY"
fi

# Verifica conectividade
if ! $SSH_CMD -o BatchMode=yes -o ConnectTimeout=5 "${VPS_USER}@${VPS_HOST}" "true" 2>/dev/null; then
  echo "ERRO: Não foi possível conectar ao VPS via SSH (${VPS_USER}@${VPS_HOST})."
  echo "Verifique sua chave SSH (~/.ssh/id_ed25519) ou a conectividade com a rede."
  exit 1
fi

echo "==> Baixando arquivos de dump e uploads..."
$SCP_CMD "${VPS_USER}@${VPS_HOST}:${REMOTE_BACKUP_DIR}/pg-*.dump" "$LOCAL_BACKUP_DIR/" 2>/dev/null || echo "Aviso: Nenhum arquivo pg-*.dump encontrado no VPS."
$SCP_CMD "${VPS_USER}@${VPS_HOST}:${REMOTE_BACKUP_DIR}/uploads-*.tar.gz" "$LOCAL_BACKUP_DIR/" 2>/dev/null || echo "Aviso: Nenhum arquivo uploads-*.tar.gz encontrado no VPS."

chmod 600 "$LOCAL_BACKUP_DIR"/* 2>/dev/null || true

echo "==> Backups salvos com sucesso em: $LOCAL_BACKUP_DIR"
ls -lh "$LOCAL_BACKUP_DIR" | tail -n 10
