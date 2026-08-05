# PLAN-045 — Modularização para o whitelabel real (Module Manifest + Central composável)

**Status:** Concluído

**Versão:** 1.0

**Início:** 05/08/2026

**Última atualização:** 05/08/2026

**Roadmap:** whitelabel granular (F4) — base para novos negócios plugáveis

---

## Objetivo

Transformar a modularização de "gating espalhado" (deps num lugar, superfícies no `hasModule`, dados no `requireModule`, widgets KPI-a-KPI, UCs sem módulo) em um **Module Manifest único** que alimenta uma **Central composável** — para comportar os mais diversos negócios (agenda, vendas, etc.) sem rework.

## Decisões confirmadas

- **`rota ⇒ cobrancas`** e **`atendidos ⇒ cobrancas`** (agregadores da fila de cobrança; transitivo ⇒ contratos ⇒ clientes).
- **`pagamentos`** documentado como **capacidade de `contratos`** (não módulo).
- **`caixa`** com 2 formas: isolado (base/movimentações) × integrado (KPIs de parcela zeram sem contratos).
- **Module Manifest + Central composável agora** (não só na F4).

## Escopo

| # | Entrega |
|---|---------|
| A | `MODULE_MANIFEST` backend (`modules.ts`): labelKey, surfaces, dados, widgets, capacidades, dependsOn, ucs; `ALL_MODULES`/`DEFAULT_MODULOS`/`MODULE_DEPENDENCIES` **derivados**; grafo refinado |
| B | Espelho frontend (`modules.ts`): `MODULE_WIDGETS` + `isWidgetActive` + ícones + `dependsOn` |
| C | **Central composável**: `OperacoesDashboard` usa `isWidgetActive` (KPIs, ações rápidas, pendentes, atendidos) — fim do gating manual; **fix dead-end** do `SuccessState` "Ver resumo → /atendidos" (link só com `atendidos` ativo) |
| D | **`08-UC-MODULOS.md`** — matriz UC/CT × módulo (validação on/off) |
| E | **`npm run audit:modules`** (`scripts/audit-modules.mjs`) — valida manifest (IDs, deps espelhadas, grafo sem ciclo, widget com 1 dono) — **gate no deploy** |
| F | Template de novo módulo (`UI-COVERAGE.md`) + docs (BR-092/093, ADR-006, DS) |

## Validação
- `npm run build` ✅ · `npm run audit:modules` ✅ (7 módulos, grafo ok, 13 widgets) · `audit:ui` ✅ · `audit:styles` ✅ · `docs:audit` ✅ · `smoke` ✅
- Deploy com gate `audit:ui` + `audit:styles` + `audit:modules`

## Referências
- `foundation/ADR-006-Module-Manifest.md` · `engineering/design/UI-COVERAGE.md`
- `product/08-UC-MODULOS.md` · `scripts/audit-modules.mjs` · `AGENTS.md`
- Base: `PLAN-031` (módulos), `PLAN-036/037` (enforcement/coerência), `PLAN-044` (governança)
