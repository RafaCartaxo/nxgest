# TESTES — Estratégia e rotina

**Status:** Ativo

**Última atualização:** 07/08/2026

> Estratégia de testes do NX Gestão. Implementação priorizada em `plans/PLAN-067-testes.md`.

---

## Visão

Testes são **parte integrada do projeto**: rodam no CI, cobrem o negócio (use-cases), a segurança (shared/middleware), a lógica front e a UI crítica — além do smoke de API.

## Camadas

| Camada | Ferramenta | O que cobre |
|---|---|---|
| **Unit — use-cases (back)** | vitest | regras de negócio, escopo, distribuição financeira |
| **Unit — shared/segurança** | vitest | `resolveUsuarioAlvo`, `jwt`, `foto` (magic bytes), middlewares |
| **Unit — lógica/estado (front)** | vitest | utils, schemas, AuthContext, ThemeProvider, api/client |
| **Component/UI** | vitest + jsdom + RTL | telas críticas, fluxos de conta, rota, pagamento, leads |
| **Integração API** | `scripts/smoke-api.mjs` | cenários da `07` (248) — exige DB isolado (seed-demo) |
| **CI** | GitHub Actions | gate: tsc/build/audits/test/docs:audit/smoke |

## Como rodar

```bash
npm test              # unit + UI (vitest)
npm run test:coverage # com cobertura (meta 50% statements, subir gradual)
npm run test:watch    # desenvolvimento
# smoke (DB isolado):
DB_PATH=/tmp/nxgestao-smoke.db node scripts/seed-demo.mjs && node scripts/smoke-api.mjs
```

## Convenções

- **Use-cases (back):** mock de ports com `vi.fn` — modelo `EsquecerSenhaUseCase.test.ts` / `CriarLeadUseCase.test.ts`.
- **Componentes/UI:** `render` com providers (Auth/Theme/I18n) + mock de `apiRequest`/serviços; docblock `// @vitest-environment jsdom`.
- **Fluxos de conta:** cobrir convite (inclui reenvio que invalida anterior — SE-04), ativação, forgot/reset, convidado bloqueado.
- **Segurança:** `resolveUsuarioAlvo` (todos os papéis), `jwt` (fail-closed), `foto` (sem SVG), middlewares (401/403).
- **Mock necessários:** `navigator.geolocation` (RotaPage) · canvas (comprovante — polyfill no setup).

## Rotina

- **Feature nova inclui teste** (gate de review) — ver `AGENTS.md`.
- `npm test` obrigatório antes de subir/commitar.
- `npm run test:coverage` para monitorar o drift de cobertura.

## Referências

- `plans/PLAN-067-testes.md` · `AGENTS.md` · `docs/product/07-CASOS-DE-USO-API.md` (smoke/CTs)
