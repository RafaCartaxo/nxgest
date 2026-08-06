# PLAN-048 — Polimento de referências Lovable + docs finais

**Status:** Concluído

**Versão:** 1.0

**Início:** 05/08/2026

**Última atualização:** 05/08/2026

**Roadmap:** identidade visual "Nexus" — fechamento do polimento (referência `site-personality-plus`)

---

## Objetivo

Fechar os "pingos no i" da identidade: **Modal** com assinatura Lovable (`title`/`descricao`/`footer`) + **bottom-sheet no mobile**, **`FieldSelect`/`FieldTextarea`** canônicos, **`Tabs`** compartilhado, **`EstadoTela`** unificado (card + ícone), **`PageHeader`/`SectionHeader`** com tipografia/ícone do padrão, **`StatusBadge` com dot** e **docs finais** (catálogo, runbook, briefing superseded).

## Escopo

| # | Entrega |
|---|---------|
| 1 | **`Modal` nova assinatura** (Lovable): `title`/`descricao`/`footer` opcionais + bottom-sheet mobile (`items-end sm:items-center`, `rounded-t-xl sm:rounded-xl`, `max-h-[90vh]`, keyframe `slideInFromBottom`) — **sweep de 14 consumidores** no mesmo PR (protocolo PLAN-044) |
| 2 | **`FieldSelect` + `FieldTextarea`** (`shared/components/Field/`, com `fieldControl` compartilhado) — migração dos 3 `<select>` (OperadorForm:2, GastoForm:1) |
| 3 | **`Tabs`** (`shared/components/Tabs`) — migração das pills do `AdminPage` |
| 4 | **`EstadoTela`** (API de booleans preservada): loading → card spinner; erro/vazio → ícone em círculo `size-11 rounded-full` + título/descrição/ação |
| 5 | **`PageHeader`** (icon `size-11 rounded-xl`, título `text-[28px]`+`truncate`) · **`SectionHeader`** (título `font-display text-[22px]`, API preservada) |
| 6 | **`StatusBadge` com dot** (pill `inline-flex items-center gap-1.5 rounded-md` + dot `size-1.5 rounded-full`) — 11 consumidores alinhados |
| 7 | **`ParcelaList`** — status das parcelas viram **`StatusBadge`** (Vencida/Vence hoje/Paga/Parcial/Pendente) no lugar do texto cru |

## Docs finais
- `04-UI-COMPONENTS.md` v1.7 (novos componentes + Modal/StatusBadge/EstadoTela atualizados; Bottom Sheet ❌ removido — coberto pelo Modal).
- `06-PRODUCAO.md` (deploy cita os 3 gates `audit:ui/styles/modules`).
- `Lovable-NXGestao.md` marcado como **superseded** (fonte viva = `Lovable-Admin-NXGestao.md` + repo `site-personality-plus`).

## Notas
- Tokens `*-soft` já existiam no tema (`*-light` é alias) — sem mudança de token.
- `tailwindcss-animate` não existe no app → keyframe próprio `slideInFromBottom` em `tailwind.config.js` (padrão dos `slide-in-right/left`).
- Mudanças de comportamento: modais ganham **X de fechar** no header padrão (antes só via botão interno em alguns) e **body com scroll interno** (`max-h-[90vh]`).

## Validação
- `npm run build` ✅ · `audit:ui` ✅ · `audit:styles` ✅ · `audit:modules` ✅ · `docs:audit` ✅
- `smoke:api` **109/109**

## Referências
- Referência Lovable: `site-personality-plus/src/components/nx/{kit,ui}.tsx`
- `04-UI-COMPONENTS.md` · `UI-COVERAGE.md` · `06-PRODUCAO.md`
- `Modal.tsx` · `Field/*` · `Tabs/*` · `EstadoTela.tsx` · `StatusBadge/*` · `ParcelaList.tsx`
