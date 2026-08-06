# PLAN-054 — Card de cobrança: "dias de atraso" alinhado ao FIM do valor

**Status:** Concluído

**Versão:** 1.0

**Início:** 06/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** identidade visual "Nexus" — refinamento de alinhamento pós-PLAN-053

---

## Objetivo

Posicionar o "N dias de atraso" na linha do badge **alinhado ao final do valor** (o texto "R$ X"), **antes do ">"** e **antes da borda do card** — não colado no badge nem encostado na ponta do componente.

## Implementação (`CobrancaCard.tsx`)

Linha do badge (linha 4) ganha `justify-between` (empurra o dias para a direita) + **`pr-5` condicional** quando o chevron ">" existe:

```tsx
<div className={`mt-2 flex min-h-6 items-center justify-between gap-2 ${onClick ? "pr-5" : ""}`}>
```

**Por que `pr-5` (20px):** o ">" (chevron `size-4` = 16px) + `gap-1` (4px) ficam depois do valor na linha 1 → o fim do texto do valor está **20px antes da borda direita**. O `pr-5` compensa, fazendo o "dias de atraso" terminar exatamente onde o valor termina.

**Comportamento por contexto:**
- Fila `/cobrancas` + Central (com ">") → `pr-5`: dias termina no fim do valor, à esquerda do ">".
- Rota (sem ">") → sem padding: dias termina à direita, alinhado com o valor (que também está à direita).

**Mantido:** linha do badge com `items-center` (dias verticalmente centralizado com o badge) · altura uniforme · full-width (sem truncar) · reflete nos 3 consumidores.

## Validação
- `npm run build` · `audit:ui` · `audit:styles` · `docs:audit`
- Verificação visual manual (fila + Central carousel + Rota)

## Referências
- PLAN-047/050/051/052/053 (card) · `CobrancaCard.tsx`
