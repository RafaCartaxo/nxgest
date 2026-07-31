# PLAN-018 — Deploy do Primeiro Cliente

**Status:** Planejado

**Versão:** 2.0

**Data:** 30/07/2026

**Última atualização:** 31/07/2026

**Roadmap:** product/04-ROADMAP.md §5 (Fase 5 — Polimento)

**Mudança de estratégia (v2.0):** plataforma de deploy migrada de Fly.io para VPS Hostinger — custo fixo hospedando todos os clientes (multi-tenant PLAN-019), em vez de 1 deploy por cliente.

**Dependências:**
- PLAN-015 (Autenticação Multi-Usuário)
- PLAN-017 (Admin Panel + Níveis Permissionais)

---

## Objetivo

Preparar e executar o primeiro deploy do Nexus Platform para um cliente real, disponibilizando o sistema via internet com persistência confiável, HTTPS automático e zero custo inicial.

---

## Diagnóstico

| Aspecto | Estado atual | O que falta |
|---------|-------------|-------------|
| Banco de dados | SQLite via `better-sqlite3` — arquivo `gestao.db` hardcoded em `database.ts:9` | Tornar o caminho configurável via `DB_PATH` env var |
| Containerização | **Zero** — sem Dockerfile, docker-compose, `.dockerignore` | Dockerfile multi-stage |
| Health check | **Zero** — sem endpoint de health | `GET /api/health` com verificação de conexão DB |
| CORS | `app.use(cors())` sem restrição de origem | Configurar `CORS_ORIGIN` via env var em produção |
| Variáveis de ambiente | `.env.example` já contém `DB_PATH`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `ADMIN_DEFAULT_PASSWORD` (adicionado pelo PLAN-017). Porém: `JWT_SECRET` ainda tem fallback hardcoded (`?? "nexus-platform-dev-secret"`); `DB_PATH` está no `.env.example` mas **não é usado** no código (`database.ts:9` hardcoded `"gestao.db"`); `ADMIN_DEFAULT_PASSWORD` está no `.env.example` mas também tem fallback (`?? "admin123"`) | Remover fallback do `JWT_SECRET`; fazer `database.ts` ler `DB_PATH` da env var; adicionar `CORS_ORIGIN` ao `.env.example` |
| Deploy | **Zero** — sistema roda apenas local | VPS Hostinger + Docker Compose + Caddy |
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
| Plataforma de deploy | **VPS Hostinger (Linux VPS Standard 2GB)** | Custo fixo ~$2/mês (promo) — 1 servidor hospeda todos os clientes (multi-tenant PLAN-019); datacenter São Paulo disponível; domínio grátis 1º ano; mais barato que Fly.io (~$4,27/mês por cliente, que multiplicaria com o crescimento) |
| Persistência do banco | **Volume Docker** montado em `/data/` (volume `nexus_data`) | Dados sobrevivem a `docker compose up`/`down` e restarts; caminho configurável via `DB_PATH=/data/gestao.db` |
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
    → Fase D (VPS Hostinger) → Fase E (Pós-deploy)
```

---

## Fase A — Configuração de Ambiente

**Arquivos:** 3 alterados

### A.1 — Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/database.ts` | `new Database("gestao.db")` → `new Database(process.env.DB_PATH \|\| "gestao.db")` |
| `src/shared/utils/jwt.ts` | Remover fallback `?? "nexus-platform-dev-secret"`; lançar erro se `JWT_SECRET` não definido |
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

- [ ] `docker build -t nexus-platform .` completa sem erros
- [ ] `docker run -p 3000:3000 -e JWT_SECRET=test -e DB_PATH=/tmp/test.db -e NODE_ENV=development nexus-platform` inicia
- [ ] `curl http://localhost:3000/api/health` retorna 200
- [ ] `curl http://localhost:3000` retorna o HTML do frontend
- [ ] Container roda como non-root (`USER node`)
- [ ] `.dockerignore` exclui `node_modules`, `dist`, `*.db`, `.env`

---

## Fase D — Configuração VPS Hostinger

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
      - nexus_data:/data
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
  nexus_data:
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

```bash
# 1. Assinar VPS Hostinger (Linux VPS Standard 2GB) + registrar domínio no checkout
# 2. Apontar DNS: registro A  →  IP do VPS (hPanel)

# 3. Conectar no VPS
ssh root@<ip-do-vps>

# 4. Instalar Docker no VPS (Ubuntu)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 5. Clonar o repo e configurar env
git clone https://github.com/<seu-usuario>/nexus-platform.git /opt/nexus
cd /opt/nexus
cp .env.production.example .env
# Editar .env: DOMAIN, CORS_ORIGIN, JWT_SECRET (uuidgen), ADMIN_DEFAULT_PASSWORD

# 6. Subir
./scripts/deploy.sh
```

### D.5 — Checklist Fase D

- [ ] `Caddyfile` presente com `{$DOMAIN}` + proxy reverso para `app:8080`
- [ ] `docker-compose.prod.yml` presente com app + caddy + volume `nexus_data`
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
- [ ] Deploy subsequente mantém dados existentes (volume `nexus_data` preservado)

---

## Fase E — Operações Pós-Deploy

**Arquivos:** 0 novos (procedimentos documentados)

### E.1 — Backup manual (antes de qualquer migração futura)

```bash
# Copiar o banco do volume para fora do container
docker compose -f docker-compose.prod.yml exec app cp /data/gestao.db /data/gestao-backup-$(date +%Y%m%d).db

# Baixar para a máquina local (roda fora do VPS)
scp root@<ip-do-vps>:/var/lib/docker/volumes/nexusplatform_nexus_data/_data/gestao-backup-YYYYMMDD.db .
```

> **Nota:** o volume Docker fica em `/var/lib/docker/volumes/nexusplatform_nexus_data/_data/` no VPS (o prefixo vem do nome do diretório do projeto). A Hostinger também oferece **backups semanais gratuitos** e snapshots do VPS — é a rede de segurança principal.

### E.2 — Deploy de atualizações (fluxo normal)

```bash
# No VPS, dentro de /opt/nexus
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
| Volume Docker `nexus_data` corrompido | Baixa | Alto | Backup manual antes de qualquer deploy; Hostinger faz backups semanais + snapshots do VPS |
| VPS indisponível / queda da Hostinger | Baixa | Alto | Backups semanais; monitoramento básico (`docker stats`, uptime); provedor com uptime 99,9% |
| Promoção VPS termina e renovação encarece | Média | Médio | Verificar valor de renovação no checkout; custo ainda competitivo vs. múltiplos deploys Fly |
| `user node` sem permissão de escrita em `/data` | Baixa | Médio | Dockerfile já cria `/data` com `chown node:node`; validado no build local |
| Ataque/DDoS ao VPS | Baixa | Médio | Firewall da Hostinger + DDoS protection nativos; Caddy por HTTPS; manter SSH com chave |
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
| D — VPS Hostinger | Novo | 3 (+1 removido: `fly.toml`) | 0 | 🟡 Média |
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
- [ ] `./scripts/deploy.sh` sobe sem erros no VPS Hostinger
- [ ] Aplicação acessível via `https://<seu-dominio>`
- [ ] HTTPS automático emitido pelo Caddy (Let's Encrypt)
- [ ] Login admin default funcional em produção
- [ ] Volume `nexus_data` mantém dados entre deploys
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
