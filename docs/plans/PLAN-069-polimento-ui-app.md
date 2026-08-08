# PLAN-069 — Polimento de UI (port-back do Lovable)

**Status:** 🔵 Aguardando protótipo Lovable (briefing `Lovable-Polimento-UI-NXGestao.md`)

**Versão:** 1.0

**Início:** 07/08/2026

**Origem:** polimento de 4 superfícies — briefing Lovable aprovado

**Execução:** fora deste chat — **seguir o protótipo Lovable como referência** (não inventar layout).

---

## Dependência

- Protótipo Lovable **aprovado** (design das 4 superfícies).

## Escopo (por área — mesma ordem do briefing)

1. **Configurações** — `frontend/src/shared/theme/PreferenciasModal.tsx`:
   - Preview ao vivo · modo segmentado (Sun/Moon/Monitor) · paleta com anel de seleção · idioma com nome+sigla · bottom-sheet mobile.
2. **Fechar caixa na Central** — `frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx`:
   - Modal de fechamento (resumo do dia: saldo/recebido/gastos + confirmar), reutilizando o fluxo do `/caixa`.
3. **Ajuste de caixa do operador** — `frontend/src/modules/admin/pages/OperadorDetail.tsx`:
   - Card com contexto (base atual + saldo) + `Field`/`FieldTextarea` + validação inline.
4. **Página Admin** — `frontend/src/modules/admin/pages/AdminPage.tsx` + `OperadoresList.tsx`:
   - Hierarquia de KPIs · destaque do "Recebido hoje" · avatar + role badge + status de convite (Ativo/Convite pendente) + reenviar.

## Regras

- Apenas tokens e componentes canônicos · i18n pt/en/es · a11y · mobile-first · dark + 5 paletas · `audit:ui`/`audit:styles` verdes.

## CTs (regressão)

- **Config:** mudar modo/paleta/idioma persiste e reflete no preview.
- **Fechar caixa:** modal abre com resumo real (saldo/recebido/gastos) e fecha de fato; cancelar não fecha.
- **Ajuste:** motivo obrigatório + validação inline + sucesso/erro no lugar.
- **Admin:** KPIs clicáveis abrem os modais; lista com status do convite; reenviar convite funciona.

## Validação

- `tsc` · `build` · `audit:ui` · `audit:styles` · `audit:modules` · `npm test` · `docs:audit` · preview mobile+desktop · regressão contra CTs.

## Docs

- `UPDATES.md` · `UI-COVERAGE.md` (se componente novo) · `docs/engineering/tasks/YYYY-MM-DD/CHECKLIST.md`.

## Referência

- `docs/plans/Lovable-Polimento-UI-NXGestao.md` (briefing — estado-alvo) + protótipo Lovable aprovado (prints/preview).
