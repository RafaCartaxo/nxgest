# PLAN-040 — Painel Admin: identidade "Nexus" + UX (módulos/empresas)

**Status:** Planejado

**Versão:** 1.0

**Início:** 04/08/2026

**Última atualização:** 04/08/2026

**Roadmap:** follow-up do PLAN-038/039 — área administrativa

---

## Objetivo

Padronizar a **área administrativa** com a identidade "Nexus" (PLAN-038/039) e melhorar a **UX de gerenciamento de módulos (whitelabel) e empresas**. Serve de referência de implementação e de briefing para ferramentas de IA (`Lovable-Admin-NXGestao.md`).

## Escopo

| # | Entrega | Prioridade |
|---|---------|------------|
| 1 | `OperadorForm` e `EmpresaForm` → componente `Field` (inputs canônicos) | Alta |
| 2 | **`ModulosModal` v2** — switches por módulo + hint de dependência (BR-092/093) + agrupamento | Alta |
| 3 | `AdminPage` — abas/pills da identidade + seções consistentes | Média |
| 4 | `EmpresaList` — avatar/iniciais + badges de módulos ativos | Média |
| 5 | **Branding por empresa** (nomeFantasia/corPrimária/logo — whitelabel, hook `--tenant-primary`) | **Futuro** (documentado) |

## Estado atual (base)

- **Já padrão:** `PageHeader`, `KpiCard` (barra de tom), `Card` (`rounded-xl bg-card`), `Modal` base, sidebar com seção "Administração".
- **Despadronizado:** inputs dos forms (`OperadorForm`, `EmpresaForm`) em `rounded-md` (antigo); `ModulosModal` sem switch/hint visual; `EmpresaList` sem identidade; abas do `AdminPage` em pill antiga.

## Regras de negócio envolvidas

- **BR-092** — super_admin controla módulos da empresa via `PATCH /api/admin/empresas/:id/modulos`; dependências obrigatórias (`gastos⇒caixa`, `rota/cobrancas/atendidos⇒contratos`); combinação inválida → 422.
- **BR-093** — módulo desativado oculta superfícies (gating UI) e, após PLAN-036/037, a API devolve 403 (`MODULE_DISABLED`) e a Central se adapta.
- Fonte canônica dos módulos: `frontend/src/shared/modules/modules.ts` (`MODULES` com `dependsOn`).

## Decisões de design

| Decisão | Escolha |
|---------|---------|
| Forms | Migrar para `Field` (canônico DS v2) |
| ModulosModal | **Switch** por módulo + estado **desabilitado** com hint "Requer: X" quando dependência off + agrupamento (Base / Financeiro / Cobrança) |
| AdminPage | Abas em pills da identidade (`rounded-xl`, ativa em `bg-primary-light text-primary-text`) |
| EmpresaList | Card com avatar (iniciais) + badges de módulos ativos |
| Branding | Fase futura (colunas `empresas.*`, `login`/`me`, painel super admin) — separado |

## Validação
- `npm run build` · `npm run audit:styles` · `npm run docs:audit` · conferência manual (super → Empresas → configurar módulos; admin → Painel/equipe)

## Referências
- Briefing para IA: `docs/plans/Lovable-Admin-NXGestao.md`
- DS v2 (`engineering/design/02-DESIGN-SYSTEM.md`) · mapa de forms (`engineering/07-FORMS-INPUTS.md`)
- PLAN-038 (identidade) · PLAN-039 (forms/inputs) · BR-092/093 · PLAN-036/037 (whitelabel)
