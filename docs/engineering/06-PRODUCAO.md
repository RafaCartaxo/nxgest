# 06 — Produção (Runbook de Operação)

**Status:** Aprovado

**Criado:** 31/07/2026

**Projeto:** NX Gest

**Documentos relacionados:** `plans/PLAN-018-deploy.md` (deploy), `foundation/ADR-004-Infra-Deploy.md` (decisão de infra)

---

## 1. Visão geral do ambiente

| Item | Valor |
|------|-------|
| URL | **oficial:** `https://nxgest.com.br` (PLAN-068 aplicado 08/08) |
| Homologação | **staging:** `https://nxgestao.duckdns.org` (desde 11/08 — ex-transitório de prod, agora QA) |
| IP do VPS | `172.245.152.223` |
| Provedor | VPS Hosting Service (`vpshostingservice.co`) |
| SO | AlmaLinux 8.10 |
| Docker | 26.1.3 + Compose v2.27.0 |
| Repo no VPS | `/opt/nxgestao` (clone do GitHub `RafaCartaxo/nxgest`) |
| Arquivo `.env` | `/opt/nxgestao/.env` (prod, chmod 600) · `/opt/nxgestao/.env.staging` (staging, chmod 600) |
| Banco | **PostgreSQL 16** (PLAN-070): prod em `nxgestao_pgdata` (container `nxgest-postgres`) · staging em `nxgestao_staging_pgdata` · SQLite `gestao.db` mantido como legado/rollback durante a transição |
| Proxy + HTTPS | Caddy (container `nxgestao-caddy-1`), roteia 2 blocos: `nxgest.com.br → app:8080` · `nxgestao.duckdns.org → staging-app:8081` |
| Rede compartilhada | `nxgestao_net` (external) — permite o Caddy alcançar os dois stacks |

> **Alerta de infra:** o provedor **não oferece snapshots/backups**. A única proteção de dados é o backup cron (seção 5). Cópia off-site é responsabilidade manual.

---

## 1.1 — Pipeline CI/CD (desde 11/08)

| Etapa | Onde | Gatilho |
|-------|------|---------|
| **CI** (`.github/workflows/ci.yml`) | GitHub Actions | push/PR/manual |
| — job `test` | tsc · build · check-dist · audit:ui/styles/modules · vitest (154) · coverage · docs:audit | — |
| — job `smoke` | schema isolado → seed → smoke-api (274 cenários, DB/rate limits isolados) | — |
| — job `deploy-staging` | SSH → VPS → `scripts/deploy-staging.sh` → **staging no ar** | merge/push à `main`, após test+smoke |
| **CD** (`.github/workflows/cd.yml`) | GitHub Actions | `workflow_run` (CI concluído em main) + manual (`workflow_dispatch` com input `ref`) |
| — job `validate` | CI verde do push + health do staging (gate de promoção) | — |
| — job `deploy-prod` | environment `production` → SSH → `scripts/deploy.sh` → health pós-deploy | após `validate` |

**Regra de promoção:** produção **só recebe código que passou CI e staging**. No automático, o CD é acionado pelo `workflow_run` do CI (que inclui o deploy-staging). No manual, `Actions → CD → Run workflow` com opção de escolher `ref` (branch/tag/commit) para deploy sob demanda ou rollback.

**Secrets usados:** `VPS_HOST` · `VPS_USER` · `VPS_SSH_KEY` (privada `id_ed25519` sem passphrase, do host dev).

**Staging:** DB isolado + seed fake (200 clientes/29 usuários, senha `teste123!`). Seed aplicado **apenas na 1ª vez** (banco sem clientes). Produção nunca é tocada pelo deploy-staging.

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
| DuckDNS (`nxgestao.duckdns.org`) | `rafael.cartaxo@hotmail.com` | Login via Google (OAuth) | Domínio de **homologação (staging)** desde 11/08 |
| GitHub | `RafaCartaxo` | `gh` CLI (keyring) | Repo `RafaCartaxo/nxgest` |
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
2. **Backup pré-deploy** — chama `/opt/scripts/backup-nxgest.sh` (snapshot do banco antes do build; se o script estiver ausente, avisa e segue). **Pós-PLAN-070 (PostgreSQL):** o script do VPS deve fazer `pg_dump -Fc` (ver seção 5.0) — o `wal_checkpoint + cp` do SQLite não se aplica mais.
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

> **Pós-PLAN-070 (PostgreSQL):** o backup passa a ser **`pg_dump`** (container `nxgest-postgres`). As seções 5.0–5.3 abaixo em **SQLite/WAL são legado pré-cutover**; a 5.0b é a versão vigente. Durante a transição, manter o backup SQLite (`gestao.db`) como rollback até a estabilização.

### 5.0b — PostgreSQL: `pg_dump` (vigente pós-cutover)

**Script de referência** (`/opt/scripts/backup-nxgest.sh`, no VPS):

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=/opt/backups
CONTAINER=nxgest-postgres
OUT=$BACKUP_DIR/pg-${STAMP}.dump
UPLOADS_TAR=/data/uploads-${STAMP}.tar.gz
OUT_UPLOADS=$BACKUP_DIR/uploads-${STAMP}.tar.gz
mkdir -p $BACKUP_DIR
# 1) pg_dump custom-format (validação embutida: pg_restore -l)
docker exec $CONTAINER pg_dump -U "$PG_USER" -d "$PG_DB" -Fc -f /tmp/backup.dump
docker cp $CONTAINER:/tmp/backup.dump $OUT
docker exec $CONTAINER rm -f /tmp/backup.dump
pg_restore -l $OUT > /dev/null || { echo "ERRO: dump inválido"; exit 1; }
# 2) Anexos (/data/uploads) — PLAN-042
docker exec nxgestao-app-1 sh -c "cd /data && tar czf $UPLOADS_TAR uploads 2>/dev/null || tar czf $UPLOADS_TAR --files-from /dev/null" || true
docker cp nxgestao-app-1:$UPLOADS_TAR $OUT_UPLOADS || true
# 3) Retenção 14 dias
find $BACKUP_DIR -name "pg-*.dump" -mtime +14 -delete
find $BACKUP_DIR -name "uploads-*.tar.gz" -mtime +14 -delete
ls -lh $BACKUP_DIR | tail -4
```

- **Restauração:** `docker exec nxgest-postgres pg_restore -U "$PG_USER" -d "$PG_DB" --clean --if-exists < dump` (com o container de app parado), depois validar `SELECT COUNT(*) FROM usuarios` > 0 e o health.
- **Validação do backup:** `pg_restore -l pg-<DATA>.dump` lista os objetos (dump vazio/corrompido falha aqui).
- **Pré-deploy:** o `deploy.sh` chama este script — cada deploy gera `pg-<DATA>.dump` antes do build.

### 5.0 — Alerta WAL (causa raiz, corrigido em 02/08/2026) — LEGADO SQLite

O banco roda em **WAL mode**: os dados vivos ficam no arquivo `.db-wal` (~1MB) e o `gestao.db` principal pode ter só alguns KB. O script antigo copiava apenas `gestao.db` cru → backups **vazios/incompletos** (arquivos de 4KB sem schema — validado: "no such table: usuarios"). **Correção:** o script faz `wal_checkpoint(TRUNCATE)` (materializa o WAL no arquivo principal) antes do `cp`, e **valida** o backup (`SELECT COUNT(*) FROM usuarios` > 0) antes de mantê-lo.

> **Ao verificar um backup:** abrir e conferir dados (`node -e "const db=require('better-sqlite3')('<arquivo>'); db.prepare('SELECT COUNT(*) FROM usuarios').get()"`). Backup de 4KB = **inválido**.

### 5.1 — Automático (cron)

| Item | Valor |
|------|-------|
| Script | `/opt/scripts/backup-nxgest.sh` (fora do repo) |
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
> **PLAN-066 (P1): criptografar a cópia off-site** — contém dados pessoais/financeiros (LGPD). Usar `age` ou `gpg` simétrico:
> ```bash
> # gpg (simétrico, senha forte) — na origem e no destino
> gpg --symmetric --cipher-algo AES256 --output backup-offsite-gestao.db.gpg ~/.config/nxgestao/backups/backup-offsite-gestao.db
> rm ~/.config/nxgestao/backups/backup-offsite-gestao.db   # só a versão cifrada fica off-site
> # restaurar:
> gpg --decrypt backup-offsite-gestao.db.gpg > gestao-<DATA>.db
> ```
> A senha da cifra vai em `~/.config/nxgestao/ACESSOS.md` (fora do repo). A cópia **sem** cifra NÃO deve permanecer em armazenamento externo.
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

## 9. E-mail — Resend + domínio (`nxgest.com.br`)

> Suporte ao **PLAN-065** (fluxo de conta: convite/ativação + esqueci a senha) e **PLAN-071** (11/08 — deliverability: sair do spam). Envio via **Resend** com display name **"NX Gest"** (`MAIL_FROM_NAME` + `MAIL_FROM_ADDRESS`).

### Estado (07/08)

- [x] Domínio `nxgest.com.br` **registrado** no registro.br
- [x] **Add Domain** no Resend (`no-reply@nxgest.com.br`)
- [x] **DNS movido para o Cloudflare** (plano Free) — NS `lara.ns.cloudflare.com` / `hunts.ns.cloudflare.com`
- [x] **Records no Cloudflare**: DKIM `resend._domainkey` · MX `send` (prioridade 10) · SPF `send` (`include:amazonses.com`) · **SPF da raiz corrigido** (`v=spf1 include:amazonses.com ~all`) · **DMARC `p=none`**
- [x] **Verificação no Resend ✅ verde** (07/08)
- [x] **E-mail em produção ATIVO (08/08, PLAN-068)**: `.env` do VPS com `MAIL_PROVIDER=resend` · `RESEND_API_KEY` · `MAIL_FROM=no-reply@nxgest.com.br` · `APP_URL=https://nxgest.com.br`; `docker-compose.prod.yml` passando `APP_URL`/`MAIL_*`; `forgot`/convite **enviam de verdade** (validado: forgot de e-mail existente → 200 + e-mail real). **Fail-closed**: sem chave/domínio não verificado → **503 EMAIL_UNAVAILABLE**.

### Política de envio por ambiente e deliverability (PLAN-071 — 11/08)

| Ambiente | `MAIL_PROVIDER` | Comportamento |
|---|---|---|
| dev (`NODE_ENV=development`) | qualquer | **`ConsoleMailer` — nunca envia** (regra dura, ignora a chave) |
| staging | `resend` + chave Resend própria | envia real |
| produção | `resend` + chave | envia real |
| default (sem `MAIL_PROVIDER`) | — | `production` → resend se houver chave, senão fail-closed · demais → console |

- **Display name:** `MAIL_FROM_NAME=NX Gest` (presente no `.env` do VPS) + `MAIL_FROM_ADDRESS`/fallback `MAIL_FROM=no-reply@nxgest.com.br` → From `NX Gest <no-reply@...>` (reduz sinal de automação/spam). **Corrigido (13/08):** `fromAddress()` trata `MAIL_FROM_ADDRESS` vazio com `||`/`.trim()` — nunca mais `NX Gest <>`.
- **Reply-To:** suportado no payload (`reply_to`); ainda sem endereço monitorado (aguarda caixa corporativa).
- **DMARC:** ✅ `v=DMARC1; p=none; rua=mailto:rafael.cartaxo@hotmail.com` aplicado (13/08, propagado). **Próximo:** monitorar 2–4 semanas (SPF/DKIM verdes, sem bounces) → **`p=quarantine`** (manter `rua`). DNS manual no Cloudflare (PLAN-071 Fase 3/4).
- **Aquecimento:** domínio com poucos dias de envio (ativo desde 08/08) → manter volume baixo/consistente; acompanhar Resend dashboard (deliverability/bounces/complaints) e `mail-tester.com` (meta ≥9/10).
- **Assunto do lead** mudou de "Confirme seu e-mail — NX Gest" → **"Confirme seu interesse no NX Gest"** (menos padrão phishing).

### Validar envio real (VPS) — `mail:test`

Procedimento para disparar um e-mail **de verdade** (Resend) para conferir render, identidade visual e entregabilidade (spam). Executável de qualquer sessão com acesso SSH ao VPS (`root@172.245.152.223`, chave local `~/.ssh/id_ed25519`).

> **Por que via VPS:** o host local roda `NODE_ENV=development` → regra dura "dev não envia" (`ConsoleMailer`). O `.env` de produção (com `RESEND_API_KEY`) só existe no VPS. O host do VPS **não tem `node`** — roda via imagem `node:20-slim` (mesmo padrão do deploy).

1. **Garantir que o VPS tem a versão nova dos arquivos** (se ainda não commitados/deployados):
   ```bash
   scp -i ~/.ssh/id_ed25519 src/shared/email/templates.ts root@172.245.152.223:/opt/nxgestao/src/shared/email/
   scp -i ~/.ssh/id_ed25519 scripts/mail-test.ts root@172.245.152.223:/opt/nxgestao/scripts/
   ```
   Depois de commitado/deployado, pular este passo (o repo do VPS já tem).

2. **Disparar o envio real** (envia os 3 templates — convite, reset, lead):
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@172.245.152.223 '
     cd /opt/nxgestao &&
     docker run --rm -v "$(pwd)":/app -w /app \
       --env-file "$(pwd)/.env" \
       node:20-slim npx --yes tsx scripts/mail-test.ts <EMAIL-DESTINO> [pt-BR|en|es]
   '
   ```
   - `<EMAIL-DESTINO>`: seu e-mail real (ex.: `rafael.cartaxo@hotmail.com`)
   - Idioma opcional (default `pt-BR`): rodar de novo com `en` / `es` para validar os 3 idiomas
   - O `--env-file` carrega `NODE_ENV=production` + `MAIL_PROVIDER=resend` + `RESEND_API_KEY` (sem ele, cai em fail-closed/console)

3. **Confirmar na caixa de entrada**: 3 e-mails (`convite`, `reset`, `lead`) com marca NX, botão azul `#3571eb`, fallback textual ("Se o botão não funcionar, copie e cole o endereço") e rodapé institucional. Se cair em **spam**, ver seção "Problemas conhecidos" e PLAN-071.

4. **Limpar** o scp manual (se o passo 1 foi usado), revertendo no VPS:
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@172.245.152.223 'cd /opt/nxgestao && git checkout -- src/shared/email/templates.ts scripts/mail-test.ts'
   ```

### Por que Cloudflare (e não o painel do registro.br)

O **registro.br não permite criar registros TXT** no painel ("Configurar endereçamento" só faz redirect + servidor de e-mail; "Alterar servidores DNS" só troca NS). Por isso o DNS de envio foi delegado ao **Cloudflare (plano Free, $0)**, que suporta TXT/MX.

### Passo a passo (reproduzir)

1. **Resend** → Domains → `nxgest.com.br` → aba **Records** → copie cada registro (Type/Name/Value).
2. **Cloudflare** (plano Free) → Add a site → `nxgest.com.br` → anote os **2 nameservers**.
3. **Registro.br** → "Alterar servidores DNS" → cole os 2 NS do Cloudflare → salvar (`+dns`). **Não** habilitar `+dnssec`.
4. Aguarde a transição (~2h) → Cloudflare fica **Active**.
5. **Cloudflare → DNS → Add record** (Proxy status = **DNS only**):
   - TXT `resend._domainkey` → `p=…` (o valor do Resend)
   - MX `send` → `feedback-smtp.sa-east-1.amazonses.com` · priority `10`
   - TXT `send` → `v=spf1 include:amazonses.com ~all`
6. **Resend** → `nxgest.com.br` → **Verify DNS Records** → verde.

### Ajustes recomendados (feitos)

- **SPF da raiz**: default do registro.br era `v=spf1 -all` → trocado para **`v=spf1 include:amazonses.com ~all`** (o `From` é `no-reply@nxgest.com.br`).
- **DMARC**: `p=reject` → **`p=none`** até confirmar envio real; depois endurecer (`quarantine` → `reject`).

### Troubleshooting (verificação vermelha)

- **Host errado** — DKIM é `resend._domainkey`, não a raiz.
- **SPF duplicado** — um SPF por nome; nunca dois no mesmo host.
- **Propagação** — NS em transição pode levar horas; re-verifique depois.
- **Proxy status** — TXT/MX devem estar **DNS only** (cinza), não Proxied.

### Notas

- **`APP_URL`** — produção aponta para `https://nxgest.com.br`; staging usa `https://nxgestao.duckdns.org` (`.env.staging`). Links de convite/reset refletem o ambiente de cada stack.
- Já existem **A record** `nxgest.com.br → 172.245.152.223` (VPS, Proxied) e `www` CNAME → raiz. Na migração (PLAN-068): SSL mode **Full (strict)** no Cloudflare + decidir proxy vs DNS-only.
- Modo dev **nunca envia e-mail real** (regra dura, PLAN-071) — mesmo com `RESEND_API_KEY` configurada, usa `ConsoleMailer` e loga o link no console.
- **Caixa corporativa (ponto de atenção — futuro):** o Cloudflare tem **MX nulo na raiz** (`nxgest.com.br MX → .`) = "não recebe e-mail" (proposital). Quando quiser `rafael@nxgest.com.br` (inbox/webmail): contratar provedor de caixa (Zoho Mail free / Google Workspace / M365) e **substituir o MX nulo** pelo MX real + SPF/DKIM dele. **Não conflita com o Resend** (que usa `send.nxgest.com.br`).
- **Fail-closed de e-mail:** em **produção sem `RESEND_API_KEY`** (ou com domínio não verificado) os endpoints de e-mail devolvem **503 `EMAIL_UNAVAILABLE`** (`forgot`/`reconfirmar`/convite/lead) — **nunca mentem o 200 "verde"**. Em dev, o link é logado no console (não quebra). Validar antes do go-live com: `npm run mail:test -- <email>` (usa `RESEND_API_KEY`/`MAIL_FROM_*` do ambiente).

---

## 10. Problemas conhecidos e alertas

1. **Sem snapshot do provedor** → backup cron + off-site são obrigatórios (seção 5).
2. **Provedor com reputação mista** (Trustpilot ~2,9/5; relatos de troca de IP e nulling) → plano de migração de host para o próximo mês; domínio DuckDNS independente do provedor facilita a troca.
3. **Domínio `.duckdns.org` = homologação** → desde 11/08 o `nxgestao.duckdns.org` é o **staging** (QA), roteado pelo Caddy para `staging-app:8081`; `nxgest.com.br` é produção exclusiva. E-mail (Resend) ativo no `nxgest.com.br`.
4. **Latência ~120-180ms** (VPS nos EUA, clientes no Brasil) — aceitável para MVP; melhorar na migração para datacenter BR.

---

## 11. Hardening do host (PLAN-066 · P1)

> Verificar/aplicar no VPS (AlmaLinux 8.10, root):

- **firewalld** — liberar apenas 80/443 + SSH:
  ```bash
  systemctl enable --now firewalld
  firewall-cmd --permanent --add-service=http --add-service=https
  firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address=SEU_IP service name=ssh accept'
  firewall-cmd --permanent --remove-service=ssh   # SSH só do seu IP
  firewall-cmd --reload
  ```
- **fail2ban** no SSH (evita brute-force):
  ```bash
  dnf install -y fail2ban
  systemctl enable --now fail2ban
  # /etc/fail2ban/jail.local → [sshd] enabled = true, bantime = 1h, maxretry = 3
  ```
- **Confirmar** com `firewall-cmd --list-all` e `fail2ban-client status sshd`; registrar o resultado no CHECKLIST do dia.
