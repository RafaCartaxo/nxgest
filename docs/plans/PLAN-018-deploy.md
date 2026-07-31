# PLAN-018 — Deploy do Primeiro Cliente

**Status:** Concluído

**Versão:** 3.0

**Data:** 30/07/2026

**Conclusão:** 31/07/2026

**Última atualização:** 31/07/2026

**Roadmap:** product/04-ROADMAP.md §5 (Fase 5 — Polimento)

**Mudança de estratégia (v2.0):** plataforma de deploy migrada de Fly.io para VPS — custo fixo hospedando todos os clientes (multi-tenant PLAN-019), em vez de 1 deploy por cliente.

**Correção de provedor (v3.0):** o provedor contratado foi a **VPS Hosting Service** (`vpshostingservice.co`), e **não** a Hostinger. O servidor é AlmaLinux 8.10 (não Ubuntu) e **não oferece snapshots/backups do provedor** — a rede de segurança é o backup cron próprio (ver `engineering/06-PRODUCAO.md`).

**Dependências:**
- PLAN-015 (Autenticação Multi-Usuário)
- PLAN-017 (Admin Panel + Níveis Permissionais)

**Projeto implantado:**
- URL: `https://nxgestao.duckdns.org`
- IP: `172.245.152.223`
- Detalhes completos de operação: [engineering/06-PRODUCAO.md](../engineering/06-PRODUCAO.md)

---

## Objetivo

Preparar e executar o primeiro deploy do NX Gestão para um cliente real, disponibilizando o sistema via internet com persistência confiável, HTTPS automático e zero custo inicial.

---

## O que foi implantado (31/07/2026)

| Item | Valor |
|------|-------|
| URL | `https://nxgestao.duckdns.org` |
| IP do VPS | `172.245.152.223` |
| Provedor | VPS Hosting Service (`vpshostingservice.co`) — IP geolocalizado em Buffalo, NY (EUA) |
| Domínio | DuckDNS grátis (`nxgestao.duckdns.org`, A record → IP) — provisório até registrar `.com.br` |
| SO | AlmaLinux 8.10 (Cerulean Leopard) |
| Docker | 26.1.3 + Docker Compose v2.27.0 |
| Caminho do repo | `/opt/nxgestao` |
| Containers | `nxgestao-app-1` (porta 8080) + `nxgestao-caddy-1` (80/443) |
| Volumes Docker | `nxgestao_nxgestao_data` (banco), `nxgestao_caddy_data`, `nxgestao_caddy_config` |
| Banco | SQLite `/data/gestao.db` (volume persistente) |
| HTTPS | Let's Encrypt emitido automaticamente pelo Caddy |
| Admin default | `admin@cobranca.com` (senha no arquivo local `~/.config/nxgestao/vps-admin-pw.txt`, fora do repo) |
| Backup | Cron 2x/dia → `/opt/backups` (script `/opt/scripts/backup-nxgestao.sh`, retém 14 dias) |

### Segurança aplicada no VPS

- **Senha root trocada** (a senha original do provedor foi exposta em chat — invalidada na primeira conexão)
- **SSH:** `PasswordAuthentication no` + `PermitRootLogin prohibit-password` → acesso root **somente por chave SSH**
- Chave ed25519 instalada em `~/.ssh/authorized_keys` (máquina local de desenvolvimento)
- `JWT_SECRET` e senhas gerados com `openssl rand` e guardados **fora do repo** (`.env` local no VPS com `chmod 600`)

### Contas criadas

| Usuário | Email | Role | Status |
|---------|-------|------|--------|
| Admin | `admin@cobranca.com` | admin | Seed automático (senha via `ADMIN_DEFAULT_PASSWORD`) |
| Thalia N Medina | `thalianietomedina@hotmail.com` | admin | Criada via `POST /api/admin/operadores` em 31/07/2026 (senha em `~/.config/nxgestao/thaliana-pw.txt`) |

---

## Testes executados em produção (31/07/2026)

- [x] `https://nxgestao.duckdns.org/api/health` → 200 `{"status":"ok","db":"connected"}`
- [x] Frontend carrega com `<title>NX Gestão</title>` (HTTP 200)
- [x] Login admin (`admin@cobranca.com`) retorna token JWT
- [x] `POST /api/clientes` cria cliente (validação de CPF/campos obrigatórios funcionando)
- [x] `GET /api/clientes` lista com paginação
- [x] `DELETE /api/clientes/:id` remove (204) — cliente de teste removido após validação
- [x] Login da conta Thalia (role admin) validado
- [x] Backup cron executado e validado (arquivo `gestao-*.db` gerado + cópia off-site baixada)

---

## Diagnóstico

| Aspecto | Estado atual | O que falta |
|---------|-------------|-------------|
| Banco de dados | SQLite via `better-sqlite3` — arquivo `gestao.db` hardcoded em `database.ts:9` | Tornar o caminho configurável via `DB_PATH` env var |
| Containerização | **Zero** — sem Dockerfile, docker-compose, `.dockerignore` | Dockerfile multi-stage |
| Health check | **Zero** — sem endpoint de health | `GET /api/health` com verificação de conexão DB |
| CORS | `app.use(cors())` sem restrição de origem | Configurar `CORS_ORIGIN` via env var em produção |
| Variáveis de ambiente | `.env.example` já contém `DB_PATH`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `ADMIN_DEFAULT_PASSWORD` (adicionado pelo PLAN-017). Porém: `JWT_SECRET` ainda tem fallback hardcoded (`?? "nxgestao-dev-secret"`); `DB_PATH` está no `.env.example` mas **não é usado** no código (`database.ts:9` hardcoded `"gestao.db"`); `ADMIN_DEFAULT_PASSWORD` está no `.env.example` mas também tem fallback (`?? "admin123"`) | Remover fallback do `JWT_SECRET`; fazer `database.ts` ler `DB_PATH` da env var; adicionar `CORS_ORIGIN` ao `.env.example` |
| Deploy | **Zero** — sistema roda apenas local | VPS + Docker Compose + Caddy |
| Build production | Funcional — `npm run build` compila TS + Vite corretamente | Manter — apenas garantir paths corretos no container |
| `.gitignore` | Cobre `*.db`, `.env`, `dist/`, `node_modules/` | OK — nada a fazer |
| Logs | Apenas `console.log`/`console.error` | OK para MVP — Docker/Caddy capturam stdout/stderr nativamente |

### Arquivos que usam raw SQL (SQLite direto)

Identificados 3 repositórios + `database.ts` que acessam diretamente a instância `sqlite`:

| Arquivo | Uso | Mantém igual? |
|---------|-----|---------------|
| `src/database.ts` | `sqlite.exec()`, `sqlite.prepare().get()`, `.run()` — migrações + seed | Sim (SQLite mantido) |
| `src/modules/caixa/infrastructure/repositories/caixa.repository.impl.ts` | `sqlite.prepare().get()` — queries financeiras complexas | Sim (SQLite mantido) |
| `src/modules/contrato/infrastructure/repositories/contrato.repository.impl.ts` | `sqlite.prepare().get()`, `.exec("BEGIN IMMEDIATE")` — transações | Sim (SQLite mantido) |
| `src/modules/operacoes/infrastructure/repositories/operacoes.repository.impl.ts` | `sqlite.prepare()` — listagem de pagamentos por data | Sim (SQLite mantido) |

**Conclusão:** manter SQLite neste deploy evita reescrever ~15 queries raw em 4 arquivos.

---

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Banco de dados | **SQLite mantido** (sem migrar para PostgreSQL agora) | Evita reescrita de ~15 queries raw em 4 arquivos; elimina risco de conflito com PLAN-017; SQLite em volume persistente é suficiente para dezenas/centenas de registros com 2-3 usuários simultâneos |
| Plataforma de deploy | **VPS Hosting Service (2GB RAM)** | Custo fixo ~$2/mês — 1 servidor hospeda todos os clientes (multi-tenant PLAN-019); mais barato que Fly.io (~$4,27/mês por cliente, que multiplicaria com o crescimento). **Revisado em 31/07:** provedor é VPS Hosting Service (não Hostinger), sem backups nativos — backup cron próprio (Fase E) |
| Persistência do banco | **Volume Docker** montado em `/data/` (volume `nxgestao_data`) | Dados sobrevivem a `docker compose up`/`down` e restarts; caminho configurável via `DB_PATH=/data/gestao.db` |
| Containerização | **Dockerfile multi-stage** | Stage 1: build (tsc + vite). Stage 2: runtime Node 20 slim com apenas dist/ + frontend/dist/ + deps produção |
| Proxy reverso + HTTPS | **Caddy** (no mesmo compose) | HTTPS automático via Let's Encrypt (mesma experiência do Fly); zero config de certbot; substitui o `fly.toml` |
| Health check | Endpoint `GET /api/health` | Usado pelo Caddy (`health_uri`) e por monitoramento externo |
| CORS em produção | Origem específica via `CORS_ORIGIN` env var | Segurança básica; `*` em dev, domínio fixo em prod |
| JWT Secret | **Obrigatório via env var**, erro ao iniciar se ausente | Sem fallback hardcoded em produção |
| Multi-tenant | **1 VPS para todos os clientes** | Multi-tenant via `empresa_id` (PLAN-019) — custo marginal ~$0 por cliente; decisão revisada em 31/07/2026 (anterior: 1 deploy por cliente no Fly.io) |
| Storage de arquivos | **Postergado** — será plano separado (PLAN-019) | Upload de fotos/documentos vai usar volume do VPS (ou S3-compatible externo); banco só guarda a URL |
| Logs | `console.log`/`console.error` + `docker compose logs` | Caddy e Docker capturam stdout/stderr automaticamente; ferramenta de observabilidade fica para o futuro |

---

## Fases de implementação

```
Fase A (Config env) → Fase B (Health + CORS) → Fase C (Dockerfile)
    → Fase D (VPS) → Fase E (Pós-deploy)
```

---

## Fase A — Configuração de Ambiente

**Arquivos:** 3 alterados

### A.1 — Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/database.ts` | `new Database("gestao.db")` → `new Database(process.env.DB_PATH \|\| "gestao.db")` |
| `src/shared/utils/jwt.ts` | Remover fallback `?? "nxgestao-dev-secret"`; lançar erro se `JWT_SECRET` não definido |
| `.env.example` | Adicionar `CORS_ORIGIN=` (demais vars `DB_PATH`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `ADMIN_DEFAULT_PASSWORD` já existem — adicionadas pelo PLAN-017)

### A.2 — jwt.ts novo comportamento

```typescript
const SECRET = process.env.JWT_SECRET
if (!SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET env var is required in production")
  }
  throw new Error("JWT_SECRET env var is required. Set it in your .env file.")
}
```

### A.3 — .env.example resultado final

```env
# Ambiente
NODE_ENV=development

# Servidor
PORT=3000

# Banco de dados local (SQLite)
DB_PATH=gestao.db

# Segurança
JWT_SECRET=gere-uma-chave-segura-aqui
ADMIN_DEFAULT_PASSWORD=admin123

# CORS (apenas produção, opcional em dev)
CORS_ORIGIN=
```

**Nota:** `DB_PATH`, `JWT_SECRET`, `PORT`, `NODE_ENV`, e `ADMIN_DEFAULT_PASSWORD` já existiam no `.env.example` antes deste plano (adicionados pelo PLAN-017). A única adição nova é `CORS_ORIGIN`.

### A.4 — Checklist Fase A

- [ ] `database.ts` lê `DB_PATH` da env var, com fallback `gestao.db`
- [ ] `jwt.ts` exige `JWT_SECRET` obrigatório — sem fallback hardcoded
- [ ] `.env.example` adiciona `CORS_ORIGIN=` (demais vars já existem)
- [ ] `tsc --noEmit` passa sem erros

---

## Fase B — Health Check + CORS

**Arquivos:** 2 novos, 1 alterado

### B.1 — Novos arquivos

| Arquivo | Função |
|---------|--------|
| `src/modules/health/presentation/controllers/health.controller.ts` | Handler: executa `db.select().from(usuarios).limit(1)` para verificar conexão DB |
| `src/modules/health/presentation/routes/health.routes.ts` | Router: `GET /api/health` sem auth |

### B.2 — Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/main.ts` | Montar `healthRoutes` antes do `authMiddleware`; configurar CORS condicional via `CORS_ORIGIN` |

### B.3 — Health endpoint

```
GET /api/health
Response 200: { "status": "ok", "db": "connected", "timestamp": "2026-07-30T..." }
Response 503: { "status": "error", "db": "disconnected", "timestamp": "..." }
```

### B.4 — CORS condicional

```typescript
const corsOrigin = process.env.CORS_ORIGIN
app.use(cors(corsOrigin ? { origin: corsOrigin } : {}))
```

### B.5 — Checklist Fase B

- [ ] `GET /api/health` sem token retorna 200 com `db: "connected"`
- [ ] `GET /api/health` retorna 503 se banco inacessível
- [ ] CORS em dev: sem restrição (comportamento atual mantido)
- [ ] CORS em prod: apenas `CORS_ORIGIN` configurada
- [ ] `tsc --noEmit` passa sem erros

---

## Fase C — Dockerfile + Containerização

**Arquivos:** 3 novos

### C.1 — Novos arquivos

| Arquivo | Função |
|---------|--------|
| `Dockerfile` | Multi-stage: build (tsc + vite) → runtime Alpine com Node.js 20 |
| `.dockerignore` | Excluir `node_modules/`, `dist/`, `*.db`, `.env`, `docs/`, `scripts/`, `.git/` |
| `docker-compose.yml` | Dev local opcional (não usado no deploy, conveniência) |

### C.2 — Dockerfile multi-stage

```dockerfile
# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Backend
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

# Frontend
COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ ./
RUN npx vite build

# Stage 2: Production runtime
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/frontend/dist/ ./frontend/dist/

EXPOSE 8080
USER node
CMD ["node", "dist/main.js"]
```

### C.3 — .dockerignore

```
node_modules/
dist/
*.db
*.db-shm
*.db-wal
.env
.git/
docs/
scripts/
```

### C.4 — Verificação de paths em produção

No container, a estrutura é:
```
/app/
  dist/                # backend compilado
    main.js
    database.js
    modules/...
  frontend/
    dist/              # frontend build
      index.html
      assets/...
  node_modules/
  package.json
```

`dist/main.js` resolve `../frontend/dist` → `/app/frontend/dist` ✓

### C.5 — Checklist Fase C

- [ ] `docker build -t nxgestao .` completa sem erros
- [ ] `docker run -p 3000:3000 -e JWT_SECRET=test -e DB_PATH=/tmp/test.db -e NODE_ENV=development nxgestao` inicia
- [ ] `curl http://localhost:3000/api/health` retorna 200
- [ ] `curl http://localhost:3000` retorna o HTML do frontend
- [ ] Container roda como non-root (`USER node`)
- [ ] `.dockerignore` exclui `node_modules`, `dist`, `*.db`, `.env`

---

## Fase D — Configuração VPS

**Arquivos:** 3 novos (`Caddyfile`, `docker-compose.prod.yml`, `scripts/deploy.sh`) + 1 remoção (`fly.toml`)

### D.1 — Caddyfile (proxy reverso + HTTPS automático)

```caddyfile
{$DOMAIN} {
	reverse_proxy app:8080
}
```

O Caddy obtém e renova certificados Let's Encrypt automaticamente (mesma experiência do Fly.io). O domínio vem da env var `DOMAIN`, passada pelo compose.

### D.2 — docker-compose.prod.yml

```yaml
services:
  app:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=8080
      - DB_PATH=/data/gestao.db
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_DEFAULT_PASSWORD=${ADMIN_DEFAULT_PASSWORD}
      - CORS_ORIGIN=${CORS_ORIGIN}
    volumes:
      - nxgestao_data:/data
    expose:
      - "8080"

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      - DOMAIN=${DOMAIN}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  nxgestao_data:
  caddy_data:
  caddy_config:
```

### D.3 — Variáveis de ambiente no VPS (`.env`)

| Variável | Origem | Valor |
|----------|--------|-------|
| `NODE_ENV` | `docker-compose.prod.yml` | `production` |
| `PORT` | `docker-compose.prod.yml` | `8080` |
| `DB_PATH` | `docker-compose.prod.yml` | `/data/gestao.db` |
| `JWT_SECRET` | `.env` (arquivo) | UUID gerado no setup |
| `ADMIN_DEFAULT_PASSWORD` | `.env` (arquivo) | Senha forte gerada no setup |
| `CORS_ORIGIN` | `.env` (arquivo) | `https://<seu-dominio>` |
| `DOMAIN` | `.env` (arquivo) | `<seu-dominio.com.br>` |

Modelo em `.env.production.example` (nunca commitar o `.env`).

### D.4 — Comandos de setup (executar uma vez)

> **Nota de execução real (31/07/2026):** o provedor contratado foi **VPS Hosting Service** (AlmaLinux 8.10). O comando `curl -fsSL https://get.docker.com | sh` **falha** em AlmaLinux (`Unsupported distribution`); usou-se o repositório oficial Docker via `yum-config-manager` (ver abaixo). O domínio foi um subdomínio grátis **DuckDNS**.

```bash
# 1. Assinar VPS (VPS Hosting Service) + criar domínio grátis em duckdns.org
#    A record: nxgestao.duckdns.org → <ip-do-vps>

# 2. Conectar no VPS (primeiro acesso: trocar senha + instalar chave SSH)
ssh root@<ip-do-vps>

# 3. Instalar Docker (AlmaLinux/RHEL — get.docker.com NÃO suporta AlmaLinux)
dnf install -y yum-utils
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

# 4. Instalar git e clonar o repo
dnf install -y git openssl
git clone https://github.com/RafaCartaxo/nxgestao.git /opt/nxgestao
cd /opt/nxgestao
cp .env.production.example .env
# Editar .env: DOMAIN, CORS_ORIGIN, JWT_SECRET (openssl rand -hex 32), ADMIN_DEFAULT_PASSWORD

# 5. Subir
./scripts/deploy.sh
```

### D.5 — Checklist Fase D

- [ ] `Caddyfile` presente com `{$DOMAIN}` + proxy reverso para `app:8080`
- [ ] `docker-compose.prod.yml` presente com app + caddy + volume `nxgestao_data`
- [ ] `scripts/deploy.sh` presente e executável
- [ ] `fly.toml` removido do repo (decisão: VPS)
- [ ] Domínio registrado e DNS **A** apontando para o IP do VPS
- [ ] `JWT_SECRET` e `ADMIN_DEFAULT_PASSWORD` gerados (fortes, nunca expostos no código)
- [ ] `CORS_ORIGIN` e `DOMAIN` configurados no `.env`
- [ ] `./scripts/deploy.sh` sobe sem erros no VPS
- [ ] `https://<seu-dominio>/api/health` retorna 200 com `db: "connected"`
- [ ] `https://<seu-dominio>` carrega o SPA (login ou dashboard)
- [ ] Login com admin default funcional (senha definida no `.env`)
- [ ] HTTPS automático emitido pelo Caddy (Let's Encrypt)
- [ ] Deploy subsequente mantém dados existentes (volume `nxgestao_data` preservado)

---

## Fase E — Operações Pós-Deploy

**Arquivos:** 0 novos (procedimentos documentados)

### E.1 — Backup automático (cron no VPS)

> **Importante:** a VPS Hosting Service **não oferece** snapshots/backups do provedor. O backup é responsabilidade própria — executado por script cron a cada 12h, retendo 14 dias.

**Script:** `/opt/scripts/backup-nxgestao.sh` (fora do repo, para não interferir no `git pull`).

```bash
# Cria uma cópia do banco dentro do container e copia para /opt/backups
docker exec nxgestao-app-1 cp /data/gestao.db /data/backup-$(date +%Y%m%d-%H%M%S).db
docker cp nxgestao-app-1:/data/backup-<STAMP>.db /opt/backups/gestao-<STAMP>.db
# Retenção: apaga backups com mais de 14 dias
```

**Cron instalado** (`crontab -l`):
```
0 */12 * * * /opt/scripts/backup-nxgestao.sh >/dev/null 2>&1
```

**Cópia off-site (manual):** baixar um backup para a máquina local:
```bash
scp root@<ip-do-vps>:/opt/backups/gestao-YYYYMMDD-HHMMSS.db .
```

**Restauração:** ver `engineering/06-PRODUCAO.md` §Restauração.

### E.2 — Deploy de atualizações (fluxo normal)

```bash
# No VPS, dentro de /opt/nxgestao
git pull
./scripts/deploy.sh

# Verificar logs em tempo real:
docker compose -f docker-compose.prod.yml logs -f app

# Verificar status:
docker compose -f docker-compose.prod.yml ps
```

### E.3 — Rollback de emergência

```bash
# Reconstruir a partir de um commit/estado anterior no git
git checkout <commit-anterior> -- src/ frontend/
./scripts/deploy.sh

# Ou, se o container estiver quebrado mas o anterior ainda existir:
docker compose -f docker-compose.prod.yml restart app
```

### E.4 — Monitoramento

| O que | Comando |
|-------|---------|
| Logs em tempo real | `docker compose -f docker-compose.prod.yml logs -f app` |
| Status dos containers | `docker compose -f docker-compose.prod.yml ps` |
| Uso de CPU/memória | `docker stats` (VPS) |
| Uso de disco | `df -h` (VPS) |
| Conexão SSH | `ssh root@<ip-do-vps>` |
| Certificado SSL | Automático (Caddy renova Let's Encrypt sozinho) |

### E.5 — Checklist Fase E

- [ ] Comando de backup documentado e testado
- [ ] `./scripts/deploy.sh` de atualização testado (sem perda de dados)
- [ ] Rollback documentado
- [ ] Admin default funcional após deploy
- [ ] CRUD de 1 cliente + 1 contrato + 1 pagamento testado em produção

---

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Volume Docker `nxgestao_data` corrompido | Baixa | Alto | Backup cron a cada 12h em `/opt/backups` (retém 14 dias) + cópia off-site manual; ver `06-PRODUCAO.md` |
| VPS indisponível / queda do provedor | Baixa | Alto | Backup cron + cópia off-site; migração de host planejada (próximo mês) — domínio DuckDNS facilita troca de IP |
| Provedor com má reputação / risco de nulling | Média | Alto | Backups próprios a cada 12h (dados nunca ficam "reféns" no host); migrar de host no próximo mês (decisão registrada no ADR-004) |
| Promoção VPS termina e renovação encarece | Média | Médio | Custo ainda competitivo (~$2-4/mês) vs. múltiplos deploys Fly; revisão na migração de host |
| `user node` sem permissão de escrita em `/data` | Baixa | Médio | Dockerfile já cria `/data` com `chown node:node`; validado no build local |
| Ataque/DDoS ao VPS | Baixa | Médio | SSH somente por chave; Caddy por HTTPS; firewall básico; senha root trocada |
| Bloqueio do SQLite com múltiplos usuários | Baixa | Médio | WAL mode já ativo; para 2-3 operadores simultâneos não há contenção relevante |

> **Nota:** O risco de conflito com PLAN-017 foi removido — o PLAN-017 já foi implementado (aguardando commit). As alterações do PLAN-018 em `database.ts` (ler `DB_PATH` da env var) e `main.ts` (health route + CORS) são independentes e não conflitam com o que foi feito.

> **Nota sobre `node:20-slim`:** `better-sqlite3` publica binários pré-compilados para glibc (Debian/Ubuntu). Usar `node:20-slim` evita compilação nativa no `npm ci`, eliminando a necessidade de build tools no container. Imagem final fica ~50MB maior que Alpine, sem impacto prático.

---

## Resumo de arquivos

| Fase | Origem | Novos | Alterados | Complexidade |
|------|--------|-------|-----------|--------------|
| A — Config env | Existente | 0 | 3 | 🟢 Baixa |
| B — Health + CORS | Novo | 2 | 1 | 🟢 Baixa |
| C — Dockerfile | Novo | 3 | 0 | 🟡 Média |
| D — VPS | Novo | 3 (+1 removido: `fly.toml`) | 0 | 🟡 Média |
| E — Pós-deploy | Doc | 0 | 0 | 🟢 Baixa |
| **Total** | | **8** | **4** | |

---

## Critérios de conclusão

- [ ] `DB_PATH` env var controla localização do banco SQLite
- [ ] `JWT_SECRET` obrigatório — erro claro se ausente
- [ ] `ADMIN_DEFAULT_PASSWORD` configurável via env var (não hardcoded)
- [ ] `GET /api/health` público retorna status do banco (200 ou 503)
- [ ] CORS configurável via `CORS_ORIGIN`
- [ ] `docker build` gera imagem funcional
- [ ] Container sobe corretamente com `docker run` + env vars
- [ ] `./scripts/deploy.sh` sobe sem erros no VPS
- [ ] Aplicação acessível via `https://<seu-dominio>`
- [ ] HTTPS automático emitido pelo Caddy (Let's Encrypt)
- [ ] Login admin default funcional em produção
- [ ] Volume `nxgestao_data` mantém dados entre deploys
- [ ] `tsc --noEmit` passa em todo o projeto
- [ ] `.env.example` documenta todas variáveis de ambiente (incluindo `CORS_ORIGIN` e `ADMIN_DEFAULT_PASSWORD`)
- [ ] Procedimento de backup manual documentado e testado
- [ ] Procedimento de rollback documentado

---

## Referências

- `product/04-ROADMAP.md`
- `product/01-DOMAIN.md`
- `engineering/00-ARCHITECTURE.md`
- `engineering/01-DATABASE.md`
- `engineering/02-API.md`
- `engineering/04-BACKEND.md`
- `engineering/03-FRONTEND.md`
- `foundation/ADR-001-Arquitetura.md`
- `foundation/ADR-003-Auth-Autorizacao.md`
- `plans/PLAN-015-autenticacao.md`
- `plans/PLAN-017-admin-panel.md`
