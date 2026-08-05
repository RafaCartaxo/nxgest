# PLAN-044 — Governança de UI / Anti-drift (evitar o débito do redesign)

**Status:** Concluído

**Versão:** 1.0

**Início:** 05/08/2026

**Última atualização:** 05/08/2026

**Roadmap:** organização/manutenabilidade do whitelabel granular

---

## Objetivo

Impedir que o **débito invisível de UI** (superfícies fora do padrão "Nexus") volte a se acumular — em especial com o whitelabel de módulos granularizados, onde cada módulo/negócio novo adiciona superfícies. Trata a causa raiz (falta de organização) com **inventário + auditoria mecânica + protocolo + checklist corrigido**.

## Contexto (por que aconteceu — ADR-005)

O redesign (PLAN-038) migrou a "casca" mas não teve inventário de cobertura (raiz A); a "Checklist para Novas Telas" **ensinava o padrão antigo** `rounded-md` (raiz B); a auditoria só pegava cor fixa, não padrão antigo (raiz C); mudanças em componente compartilhado não varriam consumidores (raiz D); itens "adicionados depois" nunca revistos (raiz E).

## Escopo

| # | Entrega |
|---|---------|
| 1 | **Checklist para Novas Telas** corrigida (MAPEAMENTO): `Field`/canônico (nunca `rounded-md`), rows/badges/skeletons/modais, gate `audit:ui` |
| 2 | **`UI-COVERAGE.md`** — inventário canônico (19 telas × shell+internas; componentes+consumidores; padrões→canônico; legado rastreado) |
| 3 | **`scripts/audit-ui.mjs` + `npm run audit:ui`** — falha em padrões legado (`rounded-md` em módulos, `bg-secondary-light`, `border-l-*`, `onDark`, `RotaCobrancaSection`, `bg-gradient-accent` fora do Button, grid fixo) — **gate no `deploy.sh`** |
| 4 | **`scripts/consumers.mjs`** + protocolo de componente compartilhado (DS/AGENTS): mudou shared → varre consumidores no mesmo PR |
| 5 | **Template de PLAN de UI/módulo novo** (DS): critérios de conclusão (`audit:ui`/`audit:styles`/`docs:audit`/`UI-COVERAGE`) |
| 6 | **ADR-005** "Por que o redesign deixou débito" (5 raízes + guardrails) |
| 7 | **Correções imediatas**: RotaPage modal comprovante (`rounded-xl bg-card`); **UC-074** (banner → PageHeader); `04-UI-COMPONENTS.md` (Field/Topbar/canônicos); `AGENTS.md` (audit:ui + protocolo) |

## Validação
- `npm run audit:ui` ✅ limpo (100 arquivos) · `npm run audit:styles` ✅ · `npm run docs:audit` ✅ · `npm run build` ✅ · `smoke` ✅
- Deploy com **gate `audit:ui` + `audit:styles`** (falha impede deploy com legado)

## Referências
- `foundation/ADR-005-UI-Governance.md` · `engineering/design/UI-COVERAGE.md` · `02-DESIGN-SYSTEM.md`
- `scripts/audit-ui.mjs` · `scripts/consumers.mjs` · `AGENTS.md`
