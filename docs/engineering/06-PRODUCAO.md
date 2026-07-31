# 06 — Produção (Runbook de Operação)

**Status:** Aprovado

**Criado:** 31/07/2026

**Projeto:** NX Gestão

**Documentos relacionados:** `plans/PLAN-018-deploy.md` (deploy), `foundation/ADR-004-Infra-Deploy.md` (decisão de infra)

---

## 1. Visão geral do ambiente

| Item | Valor |
|------|-------|
| URL | `https://nxgestao.duckdns.org` |
| IP do VPS | `172.245.152.223` |
| Provedor | VPS Hosting Service (`vpshostingservice.co`) |
| SO | AlmaLinux 8.10 |
| Docker | 26.1.3 + Compose v2.27.0 |
| Repo no VPS | `/opt/nxgestao` (clone do GitHub `RafaCartaxo/nxgestao`) |
| Arquivo `.env` | `/opt/nxgestao/.env` (chmod 600, não versionado) |
| Banco | SQLite em volume `nxgestao_nxgestao_data`, montado em `/data/gestao.db` |
| Proxy + HTTPS | Caddy (container `nxgestao-caddy-1`), Let's Encrypt automático |

> **Alerta de infra:** o provedor **não oferece snapshots/backups**. A única proteção de dados é o backup cron (seção 5). Cópia off-site é responsabilidade manual.

---

## 2. Acesso SSH

- Acesso root **somente por chave SSH** (senha desabilitada).
- Chave pública instalada: `~/.ssh/authorized_keys` no VPS (ed25519 da máquina local de desenvolvimento).

```bash
ssh root@172.245.152.223
```

> Se a chave for perdida: recuperar acesso pelo painel do provedor (console/VNC) e reinstalar a chave em `/root/.ssh/authorized_keys`.

---

## 3. Credenciais

As credenciais **não ficam no repositório**. Localização dos valores:

| Credencial | Onde está | Nota |
|-----------|-----------|------|
| Admin default (`admin@cobranca.com`) | `.env` no VPS (`ADMIN_DEFAULT_PASSWORD`) + cópia local em `/tmp/opencode/vps-admin-pw.txt` | Senha gerada no deploy |
| Thalia N Medina (`thalianietomedina@hotmail.com`) | Cópia local `/tmp/opencode/thaliana-pw.txt` | Criada via admin em 31/07/2026 |
| `JWT_SECRET` | `.env` no VPS | Gerado com `openssl rand -hex 32` |
| Senha root do VPS | Cópia local `/tmp/opencode/vps-root-pw.txt` | Trocada no primeiro acesso; SSH usa chave |
| Usuários do sistema | Criados via `POST /api/admin/operadores` (role `admin`/`operator`) | Ver PLAN-017 |

> **Regra:** nunca versionar `.env`, senhas ou tokens. Trocar senha via `chpasswd` se vazar em chat/log.

---

## 4. Deploy de atualizações (fluxo normal)

```bash
# No VPS
cd /opt/nxgestao
git pull                      # puxa o novo código (senha/token via chave SSH do GitHub, ou https)
./scripts/deploy.sh           # build + up -d + prune de imagens órfãs
```

O `scripts/deploy.sh`:
1. Exige `.env` presente (senão aborta)
2. `docker compose -f docker-compose.prod.yml build app`
3. `docker compose -f docker-compose.prod.yml up -d`
4. `docker image prune -f`

**Dados:** o volume `nxgestao_nxgestao_data` sobrevive a builds e `up`/`down` — o banco não é recriado.

**Validação pós-deploy:**

```bash
curl -s https://nxgestao.duckdns.org/api/health
# → {"status":"ok","db":"connected",...}
```

---

## 5. Backup

### 5.1 — Automático (cron)

| Item | Valor |
|------|-------|
| Script | `/opt/scripts/backup-nxgestao.sh` (fora do repo) |
| Cron | `0 */12 * * *` (a cada 12h) |
| Destino | `/opt/backups/gestao-YYYYMMDD-HHMMSS.db` |
| Retenção | 14 dias (limpeza automática no script) |

Script (para referência/recriação):

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p /opt/backups
docker exec nxgestao-app-1 cp /data/gestao.db /data/backup-$STAMP.db
docker cp nxgestao-app-1:/data/backup-$STAMP.db /opt/backups/gestao-$STAMP.db
docker exec nxgestao-app-1 rm -f /data/backup-$STAMP.db
find /opt/backups -name 'gestao-*.db' -mtime +14 -delete
```

### 5.2 — Cópia off-site (manual, recomendado ao menos semanal)

```bash
scp root@172.245.152.223:/opt/backups/gestao-<DATA>.db .
```

> Se o VPS for perdido por completo (falha de hardware/provedor), a cópia off-site é a única via de recuperação.

### 5.3 — Restauração

```bash
# 1. Parar o app (mantém o volume)
cd /opt/nxgestao
docker compose -f docker-compose.prod.yml stop app

# 2. Copiar o backup para dentro do volume
docker cp ./gestao-<DATA>.db nxgestao-app-1:/data/gestao.db

# 3. Subir de novo
docker compose -f docker-compose.prod.yml start app

# 4. Validar
curl -s https://nxgestao.duckdns.org/api/health
```

> **Cuidado:** `docker cp` para um arquivo dentro de um volume Docker aponta para a camada do container; o caminho confiável do volume é `/var/lib/docker/volumes/nxgestao_nxgestao_data/_data/`. Em dúvida, restaurar copiando direto nesse diretório com o container parado.

---

## 6. Logs e monitoramento

| O que | Comando |
|-------|---------|
| Logs do app (tempo real) | `docker compose -f /opt/nxgestao/docker-compose.prod.yml logs -f app` |
| Logs do Caddy | `docker compose -f /opt/nxgestao/docker-compose.prod.yml logs -f caddy` |
| Status dos containers | `docker compose -f /opt/nxgestao/docker-compose.prod.yml ps` |
| CPU/memória | `docker stats` |
| Disco | `df -h` |
| Processos | `docker ps` |
| Health check remoto | `curl -s https://nxgestao.duckdns.org/api/health` |

---

## 7. Rollback de emergência

```bash
# Opção 1 — reverter o código para um commit anterior e redeployar
cd /opt/nxgestao
git checkout <commit-anterior> -- src/ frontend/
./scripts/deploy.sh

# Opção 2 — reiniciar o container (se travou, mas a imagem ainda serve)
docker compose -f docker-compose.prod.yml restart app

# Opção 3 — reconstruir do zero (sem perder dados — volume persiste)
cd /opt/nxgestao
git reset --hard <commit-bom>   # cuidado: descarta mudanças locais no repo
./scripts/deploy.sh
```

> Antes de qualquer rollback que possa tocar o banco, executar um backup manual (seção 5).

---

## 8. Administração de usuários

- **Criar usuário** (role `admin` ou `operator`): `POST /api/admin/operadores` com `{ nome, email, senha, role }` — requer token de um admin.
- **Listar**: `GET /api/admin/operadores`
- **Editar/remover**: `PATCH` / `DELETE /api/admin/operadores/:id`
- Detalhes em `plans/PLAN-017-admin-panel.md`.

---

## 9. Problemas conhecidos e alertas

1. **Sem snapshot do provedor** → backup cron + off-site são obrigatórios (seção 5).
2. **Provedor com reputação mista** (Trustpilot ~2,9/5; relatos de troca de IP e nulling) → plano de migração de host para o próximo mês; domínio DuckDNS independente do provedor facilita a troca.
3. **Domínio `.duckdns.org` é provisório** → registrar `.com.br` e atualizar `DOMAIN`/`CORS_ORIGIN` no `.env` na migração.
4. **Latência ~120-180ms** (VPS nos EUA, clientes no Brasil) — aceitável para MVP; melhorar na migração para datacenter BR.
