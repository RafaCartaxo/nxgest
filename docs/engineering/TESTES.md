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
| Integração API | `scripts/smoke-api.mjs` | 248 cenários (DB isolado + seed) |

## Convenções

- **Backend use-case**: mocks de ports com `vi.fn` (modelo `EsquecerSenhaUseCase.test.ts`/`CriarLeadUseCase.test.ts`).
- **Componentes**: `render` com providers mínimos (Auth/Theme/I18n mockados) + `vi.mock` de `api/client`/serviços; jest-dom; docblock `// @vitest-environment jsdom`.
- **Segredos/env**: nunca em teste hardcoded; `JWT_SECRET` setado por teste (com restore).
- **React**: root tem React **18.3.1** (alinha com o frontend) + `resolve.dedupe: ["react","react-dom"]` no `vitest.config.ts` — **não** reinstalar react 19 no root nem manter cópia aninhada no frontend (quebra hooks).
- **Feature nova inclui teste** (gate de review): pelo menos o use-case/lógica + smoke quando aplicável.

## Coverage

`npm run test:coverage` (v8, text+html). Meta inicial 0% **reportando**; subir gradual conforme a rotina amadurece. `AGENTS.md` lista `npm test` como obrigatório.

## CI

`.github/workflows/ci.yml` (GitHub Actions): job `test` (tsc · build · audits · npm test · docs:audit) + job `smoke` (instância isolada: boot → seed-demo → smoke-api).
