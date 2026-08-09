# PLAN-069 — Polimento de UI (port-back do Lovable)

**Status:** 🔵 Em execução — **Configurações (PreferenciasModal + SegmentedControl) ✅ · Ajuste caixa (AjusteCaixaCard) ✅ · Fechar caixa na Central (FecharCaixaModal) ✅** · Admin (parcial — KPIs/badges já existentes) · 08/08

**Versão:** 1.1

**Início:** 07/08/2026

**Origem:** polimento de 4 superfícies — briefing `Lovable-Polimento-UI-NXGest.md` + protótipo `RafaCartaxo/site-personality-plus` (commit `42f1adcb`)

**Execução:** fora deste chat — **seguir o protótipo Lovable como referência** (não inventar layout).

---

## Dependência

- Protótipo Lovable **aprovado** (08/08): `src/components/nx/preferencias.tsx` · `FecharCaixaModal.tsx` · `AjusteCaixaCard.tsx` · `src/routes/admin.index.tsx` · `src/routes/central.tsx` · `src/components/nx/kit.tsx` (`SegmentedControl`/`Skeleton`) · `src/lib/moeda.ts` · `src/data/admin.ts`.

## Escopo (por área — mesma ordem do briefing)

1. **Configurações** — `frontend/src/shared/theme/PreferenciasModal.tsx`:
   - Preview ao vivo · modo segmentado (Sun/Moon/Monitor) · paleta com anel de seleção · idioma com nome+sigla · bottom-sheet mobile.
   - **Novo no kit:** `SegmentedControl` (port de `kit.tsx`) — reusar em Admin.
2. **Fechar caixa na Central** — `frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx`:
   - Modal de fechamento (resumo do dia: saldo/recebido/gastos + confirmar), reutilizando o fluxo real do caixa.
   - **Novo:** `FecharCaixaModal.tsx` (port) ligado ao QuickAction "Fechar caixa".
3. **Ajuste de caixa do operador** — `frontend/src/modules/admin/pages/OperadorDetail.tsx`:
   - Card com contexto (base atual + saldo) + `Field`/`FieldTextarea` + validação inline.
   - **Novo:** `AjusteCaixaCard.tsx` (port) substituindo os inputs crus atuais.
4. **Página Admin** — `frontend/src/modules/admin/pages/AdminPage.tsx` + `OperadoresList.tsx`:
   - Hierarquia de KPIs · destaque do "Recebido hoje" · avatar + role badge + status de convite (Ativo/Convite pendente) + reenviar.

---

## Verificação do protótipo — adaptações e correções (07/08)

> Verificação completa do protótipo (commit `42f1adcb`). **100% do briefing entregue**; i18n 3/3 em todas as chaves. Correções a aplicar no port:

### Dead code / não usado (no protótipo)
- `Skeleton`/`SkeletonLista` (kit) — criados mas **nunca usados** → aplicar nas listas/estados de carga OU não portar.
- `moeda.ts` — só o `AjusteCaixaCard` usa; no port usar `masks.ts` real (`maskMonetario`/`unmaskMonetario`).
- `StatusConvite` (admin.ts) — tipo do mock; portar como tipo se útil.
- Etapa `erro` do `FecharCaixaModal` — **inalcançável** no mock; no port o erro real (API) ganha gatilho.

### Inconsistências a corrigir no port
1. **`central.tsx`: "Receber" → `/caixa`** — corrigir para **`/cobrancas`** (no real).
2. **Admin: filtro duplicado** — KPIs de equipe clicáveis **e** `SegmentedControl` filtram a mesma lista → manter um só (decidir: KPIs clicáveis + filtro "todos" no segmented, ou só um).
3. **"Meus dados" mockado** — reusar o **Perfil real** (`/perfil`), não o mock.
4. **`OperadorForm` mock** (só nome funcional) — reusar o **form real**.
5. **`PreviewAoVivo`** com `SWATCH` de cores fixas + `data-theme`/`dark` no container — adaptar ao tema global real (`ThemeProvider` no `<html>`).
6. **Toast "Desfazer" não desfaz** — mapear pro `useFeedback` real; desfazer real ou remover a ação.
7. **"Fechar caixa" (diário) × "Fechar semana"** (`/caixa`) — alinhar semântica com o fluxo real de caixa.

### Adaptações de stack (protótipo → app real)
- **`sonner` → `useFeedback`/`FeedbackProvider`** (o real não tem sonner).
- **`moeda.ts` → `masks.ts`** (`maskMonetario`/`unmaskMonetario`).
- **i18n:** adicionar as chaves do protótipo (`prefs.*`, `caixa.*`, `operador.*`, `admin.*`, `common.desfazer/reabrir`) no `pt-BR/en/es.json` do real.
- **`AjusteCaixaCard`:** ligar à API real `ajustarCaixaBase(valor, motivo, id)` + escopo admin (operador → 403).
- **`FecharCaixaModal`:** ligar à API real de fechamento + gating do módulo caixa.
- **`admin.index`:** usar `listOperadores`/`getDashboard`/`getEquipe` reais + modais reais (Equipe/Contribuição/Reassign/Confirm) + estorno/caixa do operador.
- **central:** descartar mocks hardcoded (Contrato 4821/ParcelaList); manter gating por módulo.

## Regras

- Apenas tokens e componentes canônicos · i18n pt/en/es · a11y · mobile-first · dark + 5 paletas · `audit:ui`/`audit:styles` verdes.

## CTs (regressão)

- **Config:** mudar modo/paleta/idioma persiste e reflete no preview (tema global real).
- **Fechar caixa:** modal abre com resumo real (saldo/recebido/gastos) e fecha de fato; cancelar não fecha; **erro de API → etapa de erro visível**; **"Receber" → `/cobrancas`** (não `/caixa`).
- **Ajuste:** motivo obrigatório + validação inline + sucesso/erro no lugar; **operador → 403** (escopo admin).
- **Admin:** KPIs clicáveis (filtro único) abrem os modais; lista com status do convite; reenviar convite funciona; "Meus dados" = Perfil real.

## Validação

- `tsc` · `build` · `audit:ui` · `audit:styles` · `audit:modules` · `npm test` · `docs:audit` · preview mobile+desktop · regressão contra CTs.

## Docs

- `UPDATES.md` · `UI-COVERAGE.md` (se componente novo) · `docs/engineering/tasks/YYYY-MM-DD/CHECKLIST.md`.

## Referência

- Briefing: `docs/plans/Lovable-Polimento-UI-NXGest.md`
- Protótipo (referência visual): `RafaCartaxo/site-personality-plus` commit `42f1adcb` → `src/components/nx/preferencias.tsx` · `FecharCaixaModal.tsx` · `AjusteCaixaCard.tsx` · `src/routes/admin.index.tsx` · `src/routes/central.tsx` · `src/components/nx/kit.tsx` · `src/lib/moeda.ts`
