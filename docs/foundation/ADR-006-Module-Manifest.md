# ADR-006 — Module Manifest: fonte única do whitelabel granular

**Status:** Aprovado

**Versão:** 1.0

**Data:** 05/08/2026

**Relacionados:** PLAN-045 · `src/modules/admin/domain/modules.ts` · `frontend/src/shared/modules/modules.ts` · `08-UC-MODULOS.md`

---

# Contexto

O whitelabel tem 7 módulos granulares, mas o que cada módulo "é" estava **espalhado**: dependências no `MODULE_DEPENDENCIES`, superfícies no gating manual (`hasModule`), dados no `requireModule`, widgets no `OperacoesDashboard` (gating KPI-a-KPI), UCs no 06 sem etiqueta de módulo. Para o **verdadeiro whitelabel** (vários negócios plugáveis), é preciso uma **fonte única** do que cada módulo expõe.

# Decisão

Adotar um **Module Manifest declarativo** por módulo, com:

- `labelKey` — rótulo i18n;
- `surfaces` — rotas/páginas do frontend;
- `dados` — endpoints protegidos por `requireModule` (403 quando off);
- `widgets` — chaves de widgets da **Central** que o módulo é DONO (composição dinâmica);
- `capacidades` — o que habilita em outros módulos (ex.: `contratos` → pagamento; `rota` → visitas);
- `dependsOn` — grafo de dependências (validação transitiva);
- `ucs` — UCs/API-UCs de validação (matriz `08-UC-MODULOS.md`).

- `ALL_MODULES`, `DEFAULT_MODULOS` e `MODULE_DEPENDENCIES` são **derivados** do manifest (uma só fonte).
- **Espelho frontend** (`shared/modules/modules.ts`) com `MODULE_WIDGETS` + `isWidgetActive` — a **Central composável** renderiza widgets dos módulos ativos (fim do gating manual por `hasModule`).
- **Grafo refinado:** `rota ⇒ cobrancas` e `atendidos ⇒ cobrancas` (agregadores da fila de cobrança); `pagamentos` documentado como **capacidade de `contratos`** (não módulo); `caixa` tem 2 formas (isolado × integrado).
- **Guarda:** `npm run audit:modules` valida o manifest (IDs, deps espelhadas, grafo sem ciclo, widget com 1 dono) — **gate do deploy**.

# Consequências

**Benefícios**
- Novo negócio = adicionar um módulo ao manifest (+ superfícies + widgets + UCs) — sem editar a lógica do dashboard.
- Coerência validada por máquina (`audit:modules`), não por revisão manual.
- A matriz `08-UC-MODULOS.md` permite validar cada combinação on/off.

**Trade-offs / riscos**
- Manifest duplicado backend×frontend — mitigado pelo `audit:modules` (espelho checado).
- Mudar uma dependência pode invalidar combos existentes — mitigado pela validação transitiva (422) e pela migração (re-PATCH).

# Referências

- `plans/PLAN-045-modularizacao-whitelabel.md` · `UI-COVERAGE.md` · `08-UC-MODULOS.md`
- `scripts/audit-modules.mjs` · `AGENTS.md`
