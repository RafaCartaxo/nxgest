# ADR-005 — Governança de UI: por que o redesign deixou débito + guardrails anti-drift

**Status:** Aprovado

**Versão:** 1.0

**Data:** 05/08/2026

**Relacionados:** PLAN-043 (polimento), PLAN-044 (governança), `02-DESIGN-SYSTEM.md`, `UI-COVERAGE.md`, `scripts/audit-ui.mjs`

---

# Contexto

O redesign de identidade "Nexus" (PLAN-038/039/040) migrou a **casca** — `PageHeader` em todas as páginas, componentes compartilhados (Card, KpiCard, Field, Modal, QuickActions, tokens) reescritos. Apesar disso, **diversos pontos passaram batidos** (rows de Caixa/ContratoDetail, inputs de Perfil/Caixa/OperadorDetail, Rota card e GPS badge, gastos, SearchBar, Success/Error, QuickActions no perfil). Só foram encontrados depois, numa auditoria manual ampla (PLAN-043).

Este ADR registra o **porquê** (para não repetir) e as **guardrails** que passam a valer.

# Análise — 5 raízes do débito

| # | Raiz | Como aconteceu |
|---|---|---|
| A | **Sem inventário de cobertura** | O redesign não tinha um mapa de TODAS as superfícies internas (rows, inputs, badges, skeletons, empty states, modais custom). O critério de "redesenhado" virou *"a página tem PageHeader"* — não *"todo elemento segue o DS"*. |
| B | **Checklist de novas telas stale e auto-contraditório** | O "Checklist para Novas Telas" (MAPEAMENTO) mandava **"Inputs usam `rounded-md border px-3 py-2`"** — o padrão ANTIGO — ao lado do PageHeader novo. Quem seguisse a checklist (sessões, Lovable, devs) reintroduzia o antigo por instrução. |
| C | **Auditoria só pega cor fixa** | `audit:styles` falha em `bg-blue-500`, mas **não** pega padrões antigos (`rounded-md` em inputs/rows, rows `bg-surface`, `bg-secondary-light`, `border-l-4`, grids fixos). Drift invisível à automação. |
| D | **Sem protocolo de componente compartilhado** | Quando o `PageHeader` mudou (banner→limpo), consumidores "adicionados depois" (badge GPS branco, ações de hero) ficaram quebrados/antigos **sem re-auditar quem usa o componente**. |
| E | **Itens "adicionados depois" no padrão da época** | QuickActions grid no perfil, hero da Rota (PLAN-035) — feitos no padrão de então, nunca revistos quando o shared mudou. |

**Consequência no whitelabel granular:** cada módulo/negócio novo adiciona superfícies; sem guardrails, o débito se multiplica silenciosamente.

# Decisão

Adotar **governança de UI** com guardrails mecânicas (não dependem de revisão humana):

| Guardrail | Onde |
|---|---|
| **Inventário canônico** de telas/componentes/legado | `docs/engineering/design/UI-COVERAGE.md` |
| **Auditoria mecânica anti-drift** (`npm run audit:ui`) | `scripts/audit-ui.mjs` + gate no `deploy.sh` |
| **Checklist de novas telas corrigida** (nunca ensinar padrão antigo) | `05-MAPEAMENTO-TELAS.md` |
| **Protocolo de componente compartilhado** (mudou → varre consumidores no mesmo PR) | `scripts/consumers.mjs` + `AGENTS.md` + DS |
| **Template de PLAN de UI/módulo novo** (critérios de conclusão) | este ADR + `UI-COVERAGE.md` §5 |

# Consequências

**Benefícios**
- Drift de UI vira **regressão mecânica** (falha o `audit:ui`), não descoberta manual tardia.
- Qualquer novo módulo/negócio do whitelabel roda o mesmo gate — sem acúmulo.
- O inventário (`UI-COVERAGE.md`) deixa o estado de cada superfície visível e rastreável.

**Trade-offs / riscos**
- O `audit:ui` pode gerar **falso positivo** se um padrão novo for confundido com legado — mitigado por allowlists (skeletons, componentes shared) e revisão no momento de adicionar o padrão.
- Manutenção do inventário é manual (tabelas) — mitigado pelo gate no `deploy.sh` que força o `audit:ui`, e pelo checklist de conclusão.

# Referências

- `docs/engineering/design/UI-COVERAGE.md` · `02-DESIGN-SYSTEM.md`
- `scripts/audit-ui.mjs` · `scripts/consumers.mjs` · `AGENTS.md`
- `plans/PLAN-043-polimento-final-identidade-nexus.md` · `plans/PLAN-044-...`
