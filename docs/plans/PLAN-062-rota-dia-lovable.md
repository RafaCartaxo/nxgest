# PLAN-062 — Rota do dia: card de ações Lovable + progresso + modais 3→2

**Status:** ✅ Pronto para execução (handoff)

**Versão:** 1.0

**Início:** 07/08/2026

**Prioridade:** Alta (experiência do operador em campo)

**Origem:** protótipo Lovable (`site-personality-plus`, commit `ac218f45`) — `src/components/nx/RotaCarrossel.tsx`

**Regra de ouro:** **não alterar** o `CobrancaCard` (informações da parcela já validadas pelo usuário) nem o `QuickActions` usado em outras telas (Central, ClienteDetail).

---

## Objetivo

Alinhar a tela `/rota` do app real ao protótipo Lovable: novo layout do **progresso da rota**, **card de ações** no estilo do protótipo, contador **"Parada X de Y"** e consolidação de **3 modais → 2** (comprovante integrado ao pagamento).

---

## Escopo

### Fase 0 — CTs primeiro (antes de qualquer código)

- [ ] Criar `docs/engineering/tasks/2026-08-07/ROTA-REGRESSAO-CT.md` (~50 CTs, Grupos A–G, Dado/Quando/Então)
- [ ] Baseline verde antes de mexer: `tsc` · `build` · `audit:ui` · `audit:styles` · `audit:modules` · `npm test`

### Fase 1 — i18n (pt/en/es)

- [ ] Chaves novas: `operacoes.progresso` ("Progresso"/"Progress"/"Progreso") · `operacoes.promessas` · `operacoes.paradaDe` ("Parada {{atual}} de {{total}}" / "Stop ... of ..." / "Parada ... de ...") · `operacoes.registrarPagamento` · `operacoes.abrirContrato`

### Fase 2 — Rota (`RotaPage` + `RouteProgress` + `PagamentoModal`)

- [ ] `RouteProgress.tsx` → layout Lovable: linha "Progresso" + **%** (tabular), barra `role="progressbar"` (`aria-valuenow/min/max`), `grid-cols-4` com **Pagos · Promessas · Visitados · Pendentes** (nº `font-display text-lg` + label `text-[11px]`, tokens). **Manter posição abaixo do carrossel** (decisão).
- [ ] Contador **"Parada {i+1} de {N}"** acima do `Carousel` (`RotaPage`), só quando há pendentes.
- [ ] **Card de ações** estilo Lovable:
  - Linha 1: **4 ícones** (Navegar · WhatsApp · Ligar · Abrir contrato) — box `min-h-16` ícone+label, mantendo gating de capacidade (`rota:navegar/whatsapp/ligar`) e "Navegar" desabilitado sem alvo (`alvoNavegavel`)
  - **"Registrar pagamento"** `success block` com spinner "Processando…" (substitui "Pagar")
  - Linha 2: **3 outline** (Promessa · Visitado · Não encontrado) em `grid-cols-3`
  - Mantém `operando` desabilitando **tudo** (sem concorrência); **remover a barra de progresso do topo** do card
- [ ] **Modais 3 → 2**:
  - `PagamentoModal` ganha `sucessoContent?: (data: PagamentoSuccessData, fechar: () => void) => ReactNode` **opcional** — após pagamento, o modal **permanece aberto no passo comprovante** (canvas + Compartilhar + WhatsApp + Fechar)
  - `RotaPage` remove o 3º modal (comprovante separado) e o estado `comprovante`; gera o comprovante dentro do `sucessoContent`
  - `ContratoDetail` **não muda** (prop opcional)
- [ ] Banner de resultado quando finalizada: **NÃO incluir** — no fluxo real o item sai da rota ao ser marcado (refetch), então o banner nunca apareceria. Decisão registrada.

### Fase 3 — Extras (do protótipo)

- [ ] **Alça no `Modal`**: `h-1.5 w-10 bg-border-strong` no topo do bottom-sheet (`sm:hidden`) — vale p/ todos os modais (20 consumidores, transparente)
- [ ] **`<html lang>` dinâmico**: `i18n.on("languageChanged", ...)` em `frontend/src/i18n/config.ts` → `document.documentElement.lang`
- [ ] **FAB**: `FabContext`/`useFab` + slot no `AppLayout` (`fixed right-4 z-40 bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+0.75rem)] lg:hidden`); registro em `ClienteList` ("Novo cliente") e `ContratoList` ("Novo contrato") via `useEffect` com limpeza no unmount. Onde NÃO colocar: Central, Gastos, Caixa, Cobranças.

### Fase 4 — Docs

- [ ] `docs/UPDATES.md` · `docs/engineering/tasks/2026-08-07/CHECKLIST.md` · `docs/engineering/design/UI-COVERAGE.md` (Rota/Modal/AppLayout-FAB)

### Fase 5 — Validação

- [ ] `tsc` · `npm run build` · `audit:ui` · `audit:styles` · `audit:modules` · `npm test` · `docs:audit`
- [ ] `node scripts/consumers.mjs Modal` + `PagamentoModal`
- [ ] Preview manual (dev server): rota (progresso, ações, "Parada 1 de N"), **2 modais**, FAB (mobile/desktop), alça, troca de idioma
- [ ] **Regressão contra os CTs** (`ROTA-REGRESSAO-CT.md`) em DEV, marcando resultado

---

## Arquivos afetados

| Ação | Arquivo |
|---|---|
| Alterar | `frontend/src/modules/operacoes/components/RouteProgress.tsx` |
| Alterar | `frontend/src/modules/operacoes/pages/RotaPage.tsx` |
| Alterar | `frontend/src/modules/pagamento/components/PagamentoModal.tsx` |
| Alterar | `frontend/src/shared/components/Modal/Modal.tsx` |
| Alterar | `frontend/src/i18n/config.ts` |
| Alterar | `frontend/src/shared/layout/AppLayout.tsx` (FabContext + slot) |
| Alterar | `frontend/src/modules/cliente/pages/ClienteList.tsx` (FAB) |
| Alterar | `frontend/src/modules/contrato/pages/ContratoList.tsx` (FAB) |
| Alterar | `frontend/src/i18n/locales/pt-BR.json` · `en.json` · `es.json` |
| Novo | `docs/engineering/tasks/2026-08-07/ROTA-REGRESSAO-CT.md` |

## CTs

Ver `docs/engineering/tasks/2026-08-07/ROTA-REGRESSAO-CT.md`.

## Referências

- Protótipo Lovable: `src/components/nx/RotaCarrossel.tsx` (repo `RafaCartaxo/site-personality-plus`)
- Briefing navegação: `docs/plans/Stitch-Nav-AppFirst-NXGestao.md` (concluído)
- Regras de UI: `docs/engineering/design/UI-COVERAGE.md` · `AGENTS.md`
