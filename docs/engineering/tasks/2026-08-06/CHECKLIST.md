# CHECKLIST — Card de cobrança: fix parcela + altura uniforme (PLAN-050)

**Data:** 06/08/2026

- [x] Bug "Parcela 30 de 20": `CobrancaCard` usa `proximoNumeroParcela` (número real) — antes usava `proximaParcela` (saldo em R$)
- [x] Altura uniforme: subtítulo `truncate` · status `min-h-6` + `truncate` · valor `whitespace-nowrap` → 3 linhas fixas
- [x] Hierarquia de informação: primário (nome+valor) · secundário (bairro · parcela) · terciário (badge + dias)
- [x] Reflete nos 3 consumidores: fila `/cobrancas` + `/atendidos` · Central (carousel) · Rota
- [x] `npm run build` · `audit:ui` · `audit:styles` · `docs:audit`
