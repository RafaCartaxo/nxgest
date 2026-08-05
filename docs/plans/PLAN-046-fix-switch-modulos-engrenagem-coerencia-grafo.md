# PLAN-046 — Fix do switch de módulos + engrenagem de configurações + coerência do grafo

**Status:** Concluído

**Versão:** 1.0

**Início:** 05/08/2026

**Última atualização:** 05/08/2026

**Roadmap:** estabilidade + organização do whitelabel (follow-up do PLAN-045)

---

## Objetivo

Corrigir o **switch de ativar/desativar módulos** (a bolinha "saindo" do botão), **consolidar** tema/cores/idioma numa **engrenagem única** no topo (com o comportamento pedido) e **propagar o grafo refinado** (PLAN-045) aos casos de teste/documentação.

## Escopo

| # | Entrega |
|---|---------|
| 1 | **Fix switch (ModulosModal):** `overflow-hidden` no pill + `left-0` no knob — a bolinha não sai mais do botão em ativo/inativo |
| 2 | **Topbar → engrenagem única** (`Settings`): dropdown com 3 seções — **Tema** (clica e alterna claro/escuro direto), **Cores** (5 paletas), **Idioma** (PT/EN/ES, com o **selecionado visível** no trigger, no lugar do nome do tema). Triggers/dropdown em `rounded-xl` + tokens (consistência) |
| 3 | **Coerência do grafo refinado:** CT-118 corrigido (`rota ⇒ cobrancas, contratos, clientes`) · **CT-119** novo (`atendidos ⇒ cobrancas`) · **UC-055** atualizado · **smoke MOD-100/101** (422 das novas deps) |

## Validação
- `npm run build` ✅ · `audit:ui` ✅ · `audit:styles` ✅ · `audit:modules` ✅ · `docs:audit` ✅
- `smoke:api` **109/109** (inclui MOD-100/101)

## Referências
- `PLAN-045` (manifest/grafo) · `08-UC-MODULOS.md` · `07-CASOS-DE-USO-API.md` (CT-117..119) · `06` (UC-055)
- `ModulosModal.tsx` · `Topbar.tsx`
