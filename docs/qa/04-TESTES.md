# 04 — Testes (Estratégia de QA)

**Status:** Ativo · **Fonte:** `docs/engineering/TESTES.md` · `docs/product/07-CASOS-DE-USO-API.md` · `docs/product/06-CASOS-DE-USO.md`

---

## Pirâmide de camadas

```text
                 Component/UI (RTL/jsdom)
               Unit lógica frontend
            Unit shared/segurança
         Unit use-case (backend)
      Smoke API (integração, 250 cenários)
    CI/CD (gates automáticos) · Cobertura
```

| Camada | Onde | Exemplo | Cobre |
|---|---|---|---|
| Unit use-case | `src/modules/*/application/use-cases/**/*.test.ts` | Login, CriarLead, ConfirmarLead, DescartarLead, Convidar | Regras de negócio dos casos de uso |
| Unit shared/segurança | `src/shared/utils/*.test.ts` | `scope`, `foto`, `jwt`, `clientIp`, `env` | Helpers críticos e segurança |
| Unit lógica front | `frontend/src/shared/**/*.test.ts` | `geo/alvo`, `modules`, `capacidades`, `estadoGps` | Lógica pura do frontend |
| Component/UI | `frontend/src/**/*.test.tsx` (jsdom) | `LoginPage` | Interação de UI (renders, submit, toggle) |
| Integração API | `scripts/smoke-api.mjs` | 250 cenários (DB isolado + seed) | Endpoints + coerência de retornos |

---

## Como rodar

```bash
npm test               # unit + UI (vitest) — gate obrigatório
npm run test:watch     # watch
npm run test:coverage  # cobertura v8 (report-only, meta sobe gradual)
```

### Smoke API (integração — 250 cenários)

```bash
# instância isolada (nunca usar o dev/3000)
DB_PATH=/tmp/nxgest-smoke.db npx tsx scripts/create-schema.mjs   # schema sem boot
DB_PATH=/tmp/nxgest-smoke.db node scripts/seed-demo.mjs          # seed (senha teste123!)
DB_PATH=/tmp/nxgest-smoke.db PORT=3002 LOGIN_RATE_LIMIT_MAX=10000 \
  USER_RATE_LIMIT_MAX=100000 JWT_SECRET=ci-smoke-secret npx tsx src/main.ts &
sleep 6
node scripts/smoke-api.mjs --baseUrl http://127.0.0.1:3002
```

> **Por que `create-schema.mjs`?** O smoke costumava subir o servidor 2× (boot pra criar tabelas + boot real) — causava `EADDRINUSE`. Agora o schema é criado sem abrir porta.

---

## Audits (gates de qualidade)

| Audit | Comando | O que falha |
|---|---|---|
| UI | `npm run audit:ui` | Padrão legado/fora-do-canônico no frontend (PLAN-044/047) |
| Styles | `npm run audit:styles` | Cor fixa da paleta no frontend (PLAN-035) |
| Modules | `npm run audit:modules` | Module Manifest incoerente (whitelabel, PLAN-045) |
| Docs | `npm run audit:docs` | Rota sem doc / doc sem rota (SKILL-009) |

---

## Convenções (resumo)

- **Backend use-case:** mocks de Ports com `vi.fn`.
- **Componentes:** providers mínimos (Auth/Theme/I18n mockados) + `vi.mock` de serviços; docblock `// @vitest-environment jsdom`.
- **Segredos:** nunca hardcoded; `JWT_SECRET` setado por teste com restore.
- **React:** única cópia (root 18.3.1) via workspaces + `dedupe` no vitest — **não** instalar react 19 nem cópia aninhada.
- **Feature nova inclui teste** (gate de review): use-case/lógica + smoke quando aplicável.

---

## Estado atual (11/08)

- **78 testes** verdes (18 arquivos) — unit + UI.
- **Smoke 250/250** — integração API.
- **Cobertura:** report-only (threshold 0) — meta sobe gradual com a rotina (PLAN-067 F4).
- `docs:audit` 0 divergências (62 rotas = 62 endpoints = 62 telas mapeadas).

---

## Documentos relacionados

- `docs/engineering/TESTES.md` — estratégia e rotina
- `docs/product/07-CASOS-DE-USO-API.md` — cenários da API (fonte do smoke)
- `docs/product/06-CASOS-DE-USO.md` — fluxos de validação por tela
- `docs/plans/PLAN-067-testes.md` — plano de testes (infra + próximas camadas)
