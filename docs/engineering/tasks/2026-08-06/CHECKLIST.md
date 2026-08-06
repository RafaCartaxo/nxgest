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
