# TESTES — Estratégia e rotina

**Status:** Ativo · **PLAN-067** (07/08/2026) — destrava o backlog P022.

## Como rodar

```bash
npm test              # unit (backend) + UI (RTL/jsdom) — gate obrigatório
npm run test:watch    # watch
npm run test:coverage # report v8 (reporta, NÃO bloqueia no início — meta sobe gradual)
```

## Camadas

`Unit use-case (back)` → `Unit shared/segurança` → `Unit lógica/estado (front)` → `Component/UI (RTL)` → `smoke API` → `CI + coverage`.

| Camada | Onde | Exemplo |
|---|---|---|
| Unit use-case | `src/modules/*/application/use-cases/**/*.test.ts` | Login, CriarLead (rollback), ConfirmarLead (single-use), DescartarLead (LGPD), Convidar (SE-04) |
| Unit shared/segurança | `src/shared/utils/*.test.ts` | `scope` (resolveUsuarioAlvo), `foto` (magic bytes/sem SVG), `jwt` (fail-closed), `clientIp` (CF-Connecting-IP) |
| Unit front lógica | `frontend/src/shared/**/*.test.ts` | `geo/alvo`, `modules`, `capacidades`, `geo/estadoGps` |
| Component/UI | `frontend/src/**/*.test.tsx` (`// @vitest-environment jsdom`) | `LoginPage` (toggle senha UC-041, submit) — destrava P022 |
| Integração API | `scripts/smoke-api.mjs` | 250 cenários (DB isolado + seed) |

## Convenções

- **Backend use-case**: mocks de ports com `vi.fn` (modelo `EsquecerSenhaUseCase.test.ts`/`CriarLeadUseCase.test.ts`).
- **Componentes**: `render` com providers mínimos (Auth/Theme/I18n mockados) + `vi.mock` de `api/client`/serviços; jest-dom; docblock `// @vitest-environment jsdom`.
- **Segredos/env**: nunca em teste hardcoded; `JWT_SECRET` setado por teste (com restore).
- **React**: root tem React **18.3.1** (alinha com o frontend) + `resolve.dedupe: ["react","react-dom"]` no `vitest.config.ts` — **não** reinstalar react 19 no root nem manter cópia aninhada no frontend (quebra hooks).
- **Feature nova inclui teste** (gate de review): pelo menos o use-case/lógica + smoke quando aplicável.

## Coverage

`npm run test:coverage` (v8, text+html). Meta inicial 0% **reportando**; subir gradual conforme a rotina amadurece. `AGENTS.md` lista `npm test` como obrigatório.

## CI/CD (desde 11/08)

**`.github/workflows/ci.yml`** (push/PR/manual) — gate de qualidade:
- Job `test`: `npm ci` (workspaces) → `tsc --noEmit` → `npm run build` → `audit:ui/styles/modules` → `npm test` (78) → `test:coverage` (+ artifact) → `docs:audit`.
- Job `smoke`: `scripts/create-schema.mjs` (schema isolado, sem boot) → `seed-demo` → **uma** instância com `JWT_SECRET` + `LOGIN_RATE_LIMIT_MAX=10000` + `USER_RATE_LIMIT_MAX=100000` → `smoke-api` (250 cenários).
- Job `deploy-staging` (push→main, `needs: [test, smoke]`): SSH → `scripts/deploy-staging.sh` → staging em `nxgestao.duckdns.org`.

**`.github/workflows/cd.yml`** — promoção para produção:
- Dispara por `workflow_run` (CI concluído em main) ou manual (`workflow_dispatch`, input `ref`).
- `validate`: CI verde + health do staging (gate: prod só passa se staging passou).
- `deploy-prod`: environment `production` → SSH → `scripts/deploy.sh` → health pós-deploy.

**Infra de build:** o repo usa **npm workspaces** (`frontend/`) — uma única `node_modules` com React hoisted (evita dupla cópia de React nos testes de UI). Lockfile único na raiz.

**Cobertura:** `npm run test:coverage` roda no CI e publica artifact (`coverage/`, 14 dias). Meta 0% reportando; subir gradual.
