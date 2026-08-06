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
| Admin default (`admin@cobranca.com`) | `.env` no VPS (`ADMIN_DEFAULT_PASSWORD`) + cópia local em `~/.config/nxgestao/vps-admin-pw.txt` | Senha gerada no deploy |
| Thalia N Medina (`thalianietomedina@hotmail.com`) | Cópia local `~/.config/nxgestao/thaliana-pw.txt` | Criada via admin em 31/07/2026 |
| `JWT_SECRET` | `.env` no VPS | Gerado com `openssl rand -hex 32` |
| Senha root do VPS | Cópia local `~/.config/nxgestao/vps-root-pw.txt` | Trocada no primeiro acesso; SSH usa chave |
| Usuários do sistema | Criados via `POST /api/admin/operadores` (role `admin`/`operator`) | Ver PLAN-017 |

> **Regra:** nunca versionar `.env`, senhas ou tokens. Trocar senha via `chpasswd` se vazar em chat/log.

### 3.1 — Acessos externos (contas fora do repo)

| Serviço | Conta | Como acessar | Detalhes |
|---------|-------|--------------|----------|
| Painel VPS (`vpshostingservice.co`) | `rafael.cartaxo@hotmail.com` | Login no site do provedor | Senha não registrada no repo — ver `~/.config/nxgestao/ACESSOS.md` |
| DuckDNS (`nxgestao.duckdns.org`) | `rafael.cartaxo@hotmail.com` | Login via Google (OAuth) | Domínio provisório; migrar para `.com.br` |
| GitHub | `RafaCartaxo` | `gh` CLI (keyring) | Repo `RafaCartaxo/nxgestao` |
| VPS SSH | `root` | Chave ed25519 local | Senha desabilitada (`PasswordAuthentication no`) |

> Todos os valores de senha externos ficam em **`~/.config/nxgestao/ACESSOS.md`** (chmod 600, fora do repo).

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
2. **Backup pré-deploy** — chama `/opt/scripts/backup-nxgestao.sh` (snapshot do banco antes do build; se o script estiver ausente, avisa e segue)
3. **Gates de UI** — roda `audit:ui`, `audit:styles` e `audit:modules` via `docker run node:20-slim` (o host não tem node no PATH); **aborta o deploy se qualquer gate falhar**
4. `docker compose -f docker-compose.prod.yml build app`
5. `docker compose -f docker-compose.prod.yml up -d`
6. `docker image prune -f`

**Dados:** o volume `nxgestao_nxgestao_data` sobrevive a builds e `up`/`down` — o banco não é recriado.

**Validação pós-deploy:**

```bash
curl -s https://nxgestao.duckdns.org/api/health
# → {"status":"ok","db":"connected",...}
```

---

## 5. Backup

### 5.0 — Alerta WAL (causa raiz, corrigido em 02/08/2026)

O banco roda em **WAL mode**: os dados vivos ficam no arquivo `.db-wal` (~1MB) e o `gestao.db` principal pode ter só alguns KB. O script antigo copiava apenas `gestao.db` cru → backups **vazios/incompletos** (arquivos de 4KB sem schema — validado: "no such table: usuarios"). **Correção:** o script faz `wal_checkpoint(TRUNCATE)` (materializa o WAL no arquivo principal) antes do `cp`, e **valida** o backup (`SELECT COUNT(*) FROM usuarios` > 0) antes de mantê-lo.

> **Ao verificar um backup:** abrir e conferir dados (`node -e "const db=require('better-sqlite3')('<arquivo>'); db.prepare('SELECT COUNT(*) FROM usuarios').get()"`). Backup de 4KB = **inválido**.

### 5.1 — Automático (cron)

| Item | Valor |
|------|-------|
| Script | `/opt/scripts/backup-nxgestao.sh` (fora do repo) |
| Cron | `0 */12 * * *` (a cada 12h) |
| Destino | `/opt/backups/gestao-YYYYMMDD-HHMMSS.db` + `uploads-YYYYMMDD-HHMMSS.tar.gz` |
| Retenção | 14 dias (limpeza automática no script) |
| Validação | Embutida — backup vazio é renomeado `.invalid` e o script falha |

**Backup pré-deploy:** `scripts/deploy.sh` (no repo) chama o script de backup **antes** do build — cada deploy gera snapshot do estado anterior (ver seção 4).

> **Anexos (PLAN-042):** desde a implementação dos uploads, o backup **inclui `/data/uploads`** (tar.gz). Anexo perdido no desastre = dado perdido — nunca restaurar só o `.db`.

Script (para referência/recriação):

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=/opt/backups
CONTAINER=nxgestao-app-1
DB_PATH=/data/gestao.db
TMP_DB=/data/backup-$STAMP.db
OUT=$BACKUP_DIR/gestao-$STAMP.db
UPLOADS_TAR=/data/uploads-$STAMP.tar.gz
OUT_UPLOADS=$BACKUP_DIR/uploads-$STAMP.tar.gz
mkdir -p $BACKUP_DIR
# 1) Checkpoint WAL (materializa dados do .db-wal no arquivo principal)
docker exec $CONTAINER node -e "
  const db = require(\"better-sqlite3\")(\"$DB_PATH\");
  const r = db.pragma(\"wal_checkpoint(TRUNCATE)\");
  if (r && r[0] && r[0].busy !== 0) { process.exit(2); }
  db.close();" || { echo "ERRO: checkpoint WAL falhou"; exit 1; }
# 2) Copiar (consistente) + validar dentro do container
docker exec $CONTAINER cp $DB_PATH $TMP_DB
if docker exec $CONTAINER node -e "
  const db = require(\"better-sqlite3\")(\"$TMP_DB\");
  const r = db.prepare(\"SELECT COUNT(*) c FROM usuarios\").get();
  db.close(); process.exit((r && r.c > 0) ? 0 : 3);"; then
  echo "Backup válido"
else
  docker exec $CONTAINER rm -f $TMP_DB; echo "ERRO: backup inválido" >&2; exit 1
fi
# 3) Anexos (/data/uploads) em tar.gz (PLAN-042)
docker exec $CONTAINER sh -c "cd /data && tar czf $UPLOADS_TAR uploads 2>/dev/null || tar czf $UPLOADS_TAR --files-from /dev/null" || true
docker cp $CONTAINER:$TMP_DB $OUT
docker cp $CONTAINER:$UPLOADS_TAR $OUT_UPLOADS
docker exec $CONTAINER rm -f $TMP_DB $UPLOADS_TAR
find $BACKUP_DIR -name "gestao-*.db" -mtime +14 -delete
find $BACKUP_DIR -name "uploads-*.tar.gz" -mtime +14 -delete
ls -lh $BACKUP_DIR | tail -4
```

### 5.2 — Cópia off-site (manual, recomendado ao menos semanal)

```bash
scp root@172.245.152.223:/opt/backups/gestao-<DATA>.db ~/.config/nxgestao/backups/backup-offsite-gestao.db
scp root@172.245.152.223:/opt/backups/uploads-<DATA>.tar.gz ~/.config/nxgestao/backups/backup-offsite-uploads.tar.gz
```

> **Corrigido em 02/08/2026:** a cópia off-site anterior estava **vazia** (4KB, gerada do `gestao.db` cru sem WAL). Substituída pelo backup consistente (`gestao-20260802-115822.db`, 241KB, 5 usuários). O `scp` deve sempre baixar um backup **válido** de `/opt/backups/` (nunca o `gestao.db` cru do volume).
>
> **Desde PLAN-042:** baixar também o `uploads-<DATA>.tar.gz` (anexos). 
>
> Se o VPS for perdido por completo (falha de hardware/provedor), a cópia off-site é a única via de recuperação.

### 5.3 — Restauração

```bash
# 1. Parar o app (mantém o volume)
cd /opt/nxgestao
docker compose -f docker-compose.prod.yml stop app

# 2. Copiar o backup para dentro do volume
docker cp ./gestao-<DATA>.db nxgestao-app-1:/data/gestao.db

# 3. Restaurar anexos (PLAN-042), se houver uploads-<DATA>.tar.gz
docker cp ./uploads-<DATA>.tar.gz nxgestao-app-1:/data/uploads-<DATA>.tar.gz
docker exec nxgestao-app-1 sh -c "cd /data && rm -rf uploads && tar xzf uploads-<DATA>.tar.gz && rm -f uploads-<DATA>.tar.gz"

# 4. Subir de novo
docker compose -f docker-compose.prod.yml start app

# 5. Validar
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
