# 03 — Engenharia

**Status:** Ativo · **Fonte:** `docs/engineering/04-BACKEND.md` · `docs/engineering/03-FRONTEND.md` · `docs/engineering/01-DATABASE.md` · `docs/engineering/02-API.md`

---

## Backend (Express + TypeScript)

### Boot e organização

- `src/main.ts` — cria o app Express, aplica middlewares globais e sobe na porta `PORT` (default 3000).
- `src/database.ts` — conexão PostgreSQL, schema/migrações idempotentes e seeds iniciais (admin default + super admin + empresa "Desenvolvimento").
- Módulos em `src/modules/<modulo>/` (ver `02-ARQUITETURA.md`).

### Middlewares globais (ordem no `main.ts`)

| Middleware | Função |
|---|---|
| `helmet` | Security headers + CSP (styles inline + Google Fonts + blob p/ PDF) |
| `cors` | Fail-closed em produção sem `CORS_ORIGIN` |
| `express.json({limit:"2mb"})` | Body JSON (fotos/anexos dataURL) |
| `trust proxy` | Confia no Caddy (`X-Forwarded-For`) p/ rate limit real por IP |

### Autenticação e autorização

- **JWT** (`src/shared/utils/jwt.ts`) — payload `{ userId, role, empresaId }`; **fail-closed**: sem `JWT_SECRET` lança erro (produção não inicia login).
- Middlewares: `auth` (decodifica JWT + valida usuário), `admin` (admin/super), `super-admin`, `module` (whitelabel), `capability` (recursos finos), `userRateLimit` (por usuário).

### Rate limits

| Limiter | Rota | Default |
|---|---|---|
| Login | `POST /api/auth/login` | 10/15min por IP (`LOGIN_RATE_LIMIT_MAX`) |
| Forgot | `POST /api/auth/forgot` | 3/15min por e-mail+IP |
| Público | `ativar`/`reset` | 10/15min |
| Leads | `POST /api/leads` + `/confirmar` | 10/15min; reenviar 3/15min |
| Autenticado | todas com `userRateLimit` | 600/min por usuário (`USER_RATE_LIMIT_MAX`) |

> `clientIp` usa `CF-Connecting-IP` (Cloudflare) → Caddy, com fallback para `req.ip`.

### Regra de ouro

Use Case = **uma** operação. Repositórios implementam Ports. Nunca regra de negócio em controller/infra.

---

## Frontend (React + Vite)

### Estrutura e padrões

- Módulos por contexto (`frontend/src/modules/<modulo>/`): `pages`, `components`, `schemas` (zod), `hooks`, `services`, `types`.
- `shared/`: componentes canônicos (Button, Card, StatusBadge, Field…), `feedback` (FeedbackOverlay/useFeedback), `theme` (dark mode), `auth` (AuthContext), `api/client`.
- **React Query** no `main.tsx` para dados de servidor; **React Hook Form + zod** para formulários.
- **i18n** (`react-i18next`) — pt-BR/en/es em `frontend/src/i18n/locales/`.
- **Design system**: tokens + componentes compartilhados; anti-drift garantido por `audit:ui`/`audit:styles` (PLAN-044/047/035).

### Regra de ouro

Frontend só renderiza/navega/valida formato — regra de negócio e cálculo financeiro **só no backend**.

---

## Banco de dados

### Modelo

| Grupo | Entidades |
|---|---|
| Empresa (tenant) | `empresas` (modulos/capacidades JSON, documento, ativa) |
| Usuários | `usuarios` (role, empresaId, soft-delete) |
| Operacional | `clientes`, `contratos`, `parcelas`, `pagamentos`, `pagamento_parcelas`, `movimentacoesFinanceiras`, `caixa_config`, `gastos`, `fechamentos_semanais`, `historico_operacional`, `snapshots_atraso` |
| Suporte | `auth_tokens` (convite/reset), `anexos`, `leads`, `auditoria_modulos`, `auditoria_caixa`, `auditoria_estornos` |

### Integridade e regras-chave

- UUID v4 como PK; FKs via JOIN para isolamento.
- Soft-delete (`deletedAt`); bloqueio de exclusão (cliente com contrato → 409; contrato com pagamento → bloqueado).
- Pagamentos distribuem em parcelas (BR-045/046); estorno gera movimentação reversa + auditoria.
- Caixa: ajuste de base, saldo, recebido/entradas/saídas, fechamento semanal, auditoria.
- Juros percentuais, geração de parcelas pulando domingo (BR-042).
- **PG-070 (PLAN-070):** migração para PostgreSQL é o próximo plano em aberto.

---

## API — leitura essencial

- `docs/engineering/02-API.md` — contrato completo (request/response).
- `docs/product/07-CASOS-DE-USO-API.md` — casos de uso + cenários (base do smoke).
- `docs/api-collection.json` — collection Postman (regenerada por `npm run docs:collection`).

---

## Documentos relacionados

- `docs/engineering/04-BACKEND.md` · `03-FRONTEND.md` · `01-DATABASE.md` · `02-API.md`
- `docs/product/02-BUSINESS-RULES.md` (BR-001..106)
