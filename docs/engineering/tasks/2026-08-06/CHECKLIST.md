# CHECKLIST — Card de cobrança: fix parcela + altura uniforme (PLAN-050)

**Data:** 06/08/2026

- [x] Bug "Parcela 30 de 20": `CobrancaCard` usa `proximoNumeroParcela` (número real) — antes usava `proximaParcela` (saldo em R$)
- [x] Altura uniforme: subtítulo `truncate` · status `min-h-6` + `truncate` · valor `whitespace-nowrap` → 3 linhas fixas
- [x] Hierarquia de informação: primário (nome+valor) · secundário (bairro · parcela) · terciário (badge + dias)
- [x] Reflete nos 3 consumidores: fila `/cobrancas` + `/atendidos` · Central (carousel) · Rota
- [x] `npm run build` · `audit:ui` · `audit:styles` · `docs:audit`

---

# CHECKLIST — Card de cobrança: bairro/parcela em linhas próprias + dias sem truncar (PLAN-051)

**Data:** 06/08/2026

- [x] 4 linhas fixas: Nome · Bairro · Parcela · StatusBadge
- [x] "N dias de atraso" na coluna direita sob o valor (text-xs danger) — nunca trunca
- [x] Uniformidade: coluna esquerda (4 linhas) sempre mais alta → mesma altura atrasado/vence hoje
- [x] Reflete nos 3 consumidores (fila + Central carousel + Rota)
- [x] `npm run build` · `audit:ui` · `audit:styles` · `docs:audit`

- [x] **Refino (PLAN-051):** dias de atraso alinhado na MESMA linha do badge (coluna direita `self-stretch` + `mt-auto`) — borda direita alinhada com o valor acima; altura uniforme e sem truncar mantidas

---

# CHECKLIST — Alinhamento fino do "dias de atraso" (PLAN-052)

**Data:** 06/08/2026

- [x] "dias de atraso" na linha do badge (coluna esquerda), `items-center` → centralizado com o badge
- [x] Saiu da coluna direita (sem `self-stretch`/`mt-auto`) → não passa mais o ">" do valor
- [x] `min-w-0 truncate` no texto (trunca só no carousel estreito)
- [x] Coluna direita volta a ter só o valor; altura uniforme mantida
- [x] `npm run build` · `audit:ui` · `audit:styles` · `docs:audit`

---

# CHECKLIST — Card de cobrança: linhas full-width (PLAN-053)

**Data:** 06/08/2026

- [x] Causa raiz: coluna do valor `shrink-0` encolhia todas as linhas (dias sumia no carousel ~90px)
- [x] Só a linha 1 é 2 colunas (nome + valor); linhas 2–4 full-width
- [x] Bairro/parcela/"dias de atraso" passam a usar os 252px do card → não trunca no carousel/mobile
- [x] Mantidos: 4 linhas uniformes · dias centralizado com o badge · valor à direita
- [x] `npm run build` · `audit:ui` · `audit:styles` · `docs:audit`
