# 06 — Operação

**Status:** Ativo · **Fonte:** `docs/engineering/06-PRODUCAO.md` (runbook completo)

---

## Ambientes e acesso

| Item | Valor |
|---|---|
| Produção | `https://nxgest.com.br` |
| Homologação | `https://nxgestao.duckdns.org` |
| VPS | `172.245.152.223` (root, **somente chave SSH**) · AlmaLinux 8.10 · Docker + Compose |
| Repo no VPS | `/opt/nxgestao` |
| `.env` | `/opt/nxgestao/.env` (prod) · `/opt/nxgestao/.env.staging` (staging) — chmod 600 |
| Banco | SQLite — prod `nxgestao_data` · staging `nxgestao_staging_data` |
| Proxy/HTTPS | Caddy (Let's Encrypt automático) |

> **Alerta:** o provedor **não oferece snapshots**. Backup próprio (cron) + cópia off-site são obrigatórios.

---

## Deploy

### Produção (via pipeline — normal)

```text
merge à main → CI verde → staging → CD → deploy-prod (automático)
```

### Manual (produção, sob demanda/rollback)

- GitHub: `Actions → CD → Run workflow` (input `ref`).
- Direto no VPS: `cd /opt/nxgestao && git pull && bash scripts/deploy.sh`.

### Homologação (staging)

- **Automático** no merge à main (job do CI).
- Manual no VPS: `bash scripts/deploy-staging.sh` (faz build, up, seed se DB vazio, caddy reload, health).

### `scripts/deploy.sh` (produção) — o que faz

1. Exige `.env` presente.
2. Garante a rede compartilhada `nxgestao_net`.
3. **Backup pré-deploy** (`/opt/scripts/backup-nxgest.sh`).
4. Gates de UI: `audit:ui`/`styles`/`modules` (aborta se falhar).
5. `docker compose -f docker-compose.prod.yml build app` + `up -d` + `prune`.

---

## Backup

| Item | Valor |
|---|---|
| Automático | Cron 2x/dia no VPS (`/opt/scripts/backup-nxgest.sh`) |
| Destino | `/opt/backups/gestao-<data>.db` + `uploads-<data>.tar.gz` |
| Validação | WAL checkpoint + contagem de usuários (backup vazio = `.invalid` + falha) |
| Retenção | 14 dias |
| Off-site | Manual `scp` + **cifrar** (gpg/age) — LGPD |

> **Anexos (PLAN-042):** o backup inclui `/data/uploads` (tar.gz). Nunca restaurar só o `.db`.

---

## Rollback (emergência)

```bash
# 1) reverter código e redeployar
cd /opt/nxgestao
git checkout <commit-anterior> -- src/ frontend/
bash scripts/deploy.sh

# 2) ou reset + deploy
git reset --hard <commit-bom>
bash scripts/deploy.sh
```

> Antes de qualquer rollback que toque o banco, rodar um backup manual. Restauração: ver `06-PRODUCAO.md §5.3`.

---

## Monitoramento

| O que | Comando/URL |
|---|---|
| Health remoto | `curl https://nxgest.com.br/api/health` (prod) · `https://nxgestao.duckdns.org/api/health` (staging) |
| Logs do app | `docker compose -f /opt/nxgestao/docker-compose.prod.yml logs -f app` |
| Logs do Caddy | idem, `logs -f caddy` |
| Status/CPU/disco | `docker compose ps` · `docker stats` · `df -h` |

---

## Documentos relacionados

- `docs/engineering/06-PRODUCAO.md` — runbook completo (acesso, deploy, backup, rollback, monitoramento, e-mail, hardening)
- `docs/plans/PLAN-018-deploy.md` — primeiro deploy
- `docs/foundation/ADR-004-Infra-Deploy.md` — decisão de infra
