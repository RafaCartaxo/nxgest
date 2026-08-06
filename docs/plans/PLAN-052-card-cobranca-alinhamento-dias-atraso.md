# PLAN-052 — Card de cobrança: alinhamento fino do "dias de atraso"

**Status:** Concluído

**Versão:** 1.0

**Início:** 06/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** identidade visual "Nexus" — refinamento de alinhamento pós-PLAN-051

---

## Objetivo

Corrigir dois desalinhamentos do "N dias de atraso" no `CobrancaCard` (PLAN-051 o havia colocado na coluna direita, sob o valor):

1. **Vertical** — o texto ficava preso à base da coluna direita (`mt-auto`), alinhado à **parte de baixo** do badge (que é centralizado na sua linha) → parecia "caído".
2. **Horizontal** — com `items-end`, o texto ficava **colado no canto direito** do card, na área do ">" do valor.

## Escopo

| # | Mudança (`CobrancaCard.tsx`) | Efeito |
|---|------------------------------|--------|
| 1 | "dias de atraso" movido para a **linha do badge** (coluna esquerda), após o `StatusBadge`, com `items-center` na linha + `min-w-0 truncate` no texto | centralizado verticalmente com o badge (`[● Atrasado] 3 dias de atraso`); sai do canto/passa o ">" do valor |
| 2 | Coluna direita volta a ter **só o valor** (removidos `self-stretch` e o span do dias) | valor `R$ X >` limpo à direita |

**Tradeoff registrado:** na linha do badge, o texto pode **truncar** apenas no carousel estreito da Central (`w-72`) — tratado com `truncate` elegante. Na fila (`/cobrancas`, `/atendidos`) e na Rota (largas) fica completo.

**Altura uniforme mantida** (coluna esquerda de 4 linhas continua a mais alta).

## Validação
- `npm run build` · `audit:ui` · `audit:styles` · `docs:audit`
- Verificação visual manual (fila + carousel + Rota)

## Referências
- PLAN-050 (altura uniforme) · PLAN-051 (bairro/parcela em linhas próprias) · `CobrancaCard.tsx`
