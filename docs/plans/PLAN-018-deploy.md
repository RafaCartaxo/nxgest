# PLAN-018 — Deploy do Primeiro Cliente

**Status:** Planejado

**Versão:** 1.1

**Data:** 30/07/2026

**Última atualização:** 30/07/2026

**Roadmap:** product/04-ROADMAP.md §5 (Fase 5 — Polimento)

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
| Deploy | **Zero** — sistema roda apenas local | `fly.toml` + conta Fly.io + volume persistente |
| Build production | Funcional — `npm run build` compila TS + Vite corretamente | Manter — apenas garantir paths corretos no container |
| `.gitignore` | Cobre `*.db`, `.env`, `dist/`, `node_modules/` | OK — nada a fazer |
| Logs | Apenas `console.log`/`console.error` | OK para MVP — Fly.io captura stdout/stderr nativamente |

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
| Plataforma de deploy | **Fly.io** | Free tier (1 VM + 1GB volume); HTTPS automático via Let's Encrypt; deploy via `fly deploy` com Dockerfile; região São Paulo disponível |
| Persistência do banco | **Volume Fly.io** montado em `/data/` | Dados sobrevivem a deploys e restarts; caminho configurável via `DB_PATH=/data/gestao.db` |
| Containerização | **Dockerfile multi-stage** | Stage 1: build (tsc + vite). Stage 2: runtime Alpine com apenas dist/ + frontend/dist/ + deps produção |
| Health check | Endpoint `GET /api/health` | Exigido pelo Fly.io para monitoramento e restart automático |
| CORS em produção | Origem específica via `CORS_ORIGIN` env var | Segurança básica; `*` em dev, domínio fixo em prod |
| JWT Secret | **Obrigatório via env var**, erro ao iniciar se ausente | Sem fallback hardcoded em produção |
| Multi-tenant | **1 deploy por cliente** | Isolação total de dados; simplicidade operacional; multi-tenant via `empresa_id` fica para o futuro |
| Storage de arquivos | **Postergado** — será plano separado (PLAN-019) | Upload de fotos/documentos vai usar Tigris (S3-compatible, 5GB free, nativo do Fly.io); banco só guarda a URL |
| Logs | `console.log`/`console.error` mantidos | Fly.io captura stdout/stderr automaticamente; ferramenta de observabilidade fica para o futuro |

---

## Fases de implementação

```
Fase A (Config env) → Fase B (Health + CORS) → Fase C (Dockerfile)
    → Fase D (Fly.io) → Fase E (Pós-deploy)
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

## Fase D — Configuração Fly.io

**Arquivos:** 1 novo (`fly.toml`) + execução de comandos CLI

### D.1 — fly.toml

```toml
app = "nexus-platform"
primary_region = "gru"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

  [[http_service.checks]]
    path = "/api/health"
    interval = "15s"
    timeout = "5s"
    grace_period = "10s"
    method = "GET"

[mounts]
  source = "nexus_data"
  destination = "/data"

[[vm]]
  cpu_kind = "shared-cpu-1x"
  cpus = 1
  memory_mb = 256
```

### D.2 — Comandos de setup (executar uma vez)

```bash
# Autenticar no Fly.io
fly auth login

# Criar app (gera fly.toml se não existir)
# Atenção: fly launch pode perguntar sobre criar banco Postgres — responder "No"
fly launch --name nexus-platform --region gru --now=false

# Criar volume persistente para o banco SQLite
fly volumes create nexus_data --region gru --size 1

# Configurar secrets
fly secrets set JWT_SECRET="$(uuidgen)"
fly secrets set ADMIN_DEFAULT_PASSWORD="$(uuidgen | cut -c1-16)"
fly secrets set CORS_ORIGIN="https://nexus-platform.fly.dev"
fly secrets set DB_PATH="/data/gestao.db"

# Deploy
fly deploy
```

### D.3 — Variáveis de ambiente no Fly.io

| Variável | Origem | Valor |
|----------|--------|-------|
| `NODE_ENV` | `fly.toml` [env] | `production` |
| `PORT` | `fly.toml` [env] | `8080` |
| `DB_PATH` | Secret (manual) | `/data/gestao.db` |
| `JWT_SECRET` | Secret (manual) | UUID gerado no setup |
| `ADMIN_DEFAULT_PASSWORD` | Secret (manual) | Senha forte gerada no setup |
| `CORS_ORIGIN` | Secret (manual) | `https://nexus-platform.fly.dev` |

### D.4 — Checklist Fase D

- [ ] `fly.toml` presente e configurado com health check + volume + HTTPS
- [ ] Volume `nexus_data` de 1GB criado na região `gru`
- [ ] `DB_PATH` aponta para `/data/gestao.db` dentro do volume
- [ ] `JWT_SECRET` configurado como secret (senha forte, nunca exposta no código)
- [ ] `ADMIN_DEFAULT_PASSWORD` configurado como secret (senha forte, não a default `admin123`)
- [ ] `CORS_ORIGIN` configurado como secret
- [ ] `fly deploy` sobe sem erros
- [ ] `https://nexus-platform.fly.dev/api/health` retorna 200 com `db: "connected"`
- [ ] `https://nexus-platform.fly.dev` carrega o SPA (login ou dashboard)
- [ ] Login com admin default funcional (senha definida no secret `ADMIN_DEFAULT_PASSWORD`)
- [ ] HTTPS forçado (HTTP → redirect 301 para HTTPS)
- [ ] Deploy subsequente (`fly deploy` após alteração de código) mantém dados existentes (volume preservado)

---

## Fase E — Operações Pós-Deploy

**Arquivos:** 0 novos (procedimentos documentados)

### E.1 — Backup manual (antes de qualquer migração futura)

```bash
# Conectar ao volume e copiar o banco localmente
fly ssh console -C "cp /data/gestao.db /data/gestao-backup-$(date +%Y%m%d).db"

# Download para máquina local
fly sftp get /data/gestao-backup-YYYYMMDD.db
```

### E.2 — Deploy de atualizações (fluxo normal)

```bash
# Após commitar mudanças no código:
fly deploy

# Verificar logs em tempo real:
fly logs

# Verificar status:
fly status
```

### E.3 — Rollback de emergência

```bash
# Listar versões anteriores
fly releases

# Rollback para versão específica
fly deploy --image registry.fly.io/nexus-platform:deployment-<ID>
```

### E.4 — Monitoramento

| O que | Comando |
|-------|---------|
| Logs em tempo real | `fly logs` |
| Status da VM | `fly status` |
| Uso de CPU/memória | `fly dashboard` (web) |
| Conexão SSH | `fly ssh console` |

### E.5 — Checklist Fase E

- [ ] Comando de backup documentado e testado
- [ ] `fly deploy` de atualização testado (sem perda de dados)
- [ ] Rollback documentado
- [ ] Admin default funcional após deploy
- [ ] CRUD de 1 cliente + 1 contrato + 1 pagamento testado em produção

---

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Volume Fly.io corrompido | Baixa | Alto | Backup manual antes de qualquer deploy; Fly.io faz snapshots automáticos |
| `user node` sem permissão de escrita em `/data` | Baixa | Médio | Testar no `fly ssh console` antes do primeiro deploy com dados |
| Cold start (>30s) incomoda o cliente | Baixa | Baixo | `auto_start_machines = true` + `min_machines_running = 1` no fly.toml mantém a VM sempre ativa |
| Expirar free tier sem aviso | Baixa | Baixo | Monitorar uso pelo `fly dashboard`; upgrade para plano pago é ~$5/mês |
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
| D — Fly.io | Novo | 1 | 0 | 🟡 Média |
| E — Pós-deploy | Doc | 0 | 0 | 🟢 Baixa |
| **Total** | | **6** | **4** | |

---

## Critérios de conclusão

- [ ] `DB_PATH` env var controla localização do banco SQLite
- [ ] `JWT_SECRET` obrigatório — erro claro se ausente
- [ ] `ADMIN_DEFAULT_PASSWORD` configurável via env var (não hardcoded)
- [ ] `GET /api/health` público retorna status do banco (200 ou 503)
- [ ] CORS configurável via `CORS_ORIGIN`
- [ ] `docker build` gera imagem funcional
- [ ] Container sobe corretamente com `docker run` + env vars
- [ ] `fly deploy` sobe sem erros no Fly.io
- [ ] Aplicação acessível via `https://nexus-platform.fly.dev`
- [ ] Health check do Fly.io passa (verde no dashboard)
- [ ] Login admin default funcional em produção
- [ ] Volume persistente mantém dados entre deploys
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
