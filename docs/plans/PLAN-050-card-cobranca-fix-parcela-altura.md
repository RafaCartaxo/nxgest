# PLAN-050 — Card de cobrança: fix "Parcela X de Y" + altura uniforme

**Status:** Concluído

**Versão:** 1.0

**Início:** 06/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** identidade visual "Nexus" — correção pós-deploy do PLAN-047/048

---

## Objetivo

Corrigir dois problemas observados nos cards de cobrança após o PLAN-047/048:
1. **"Parcela 30 de 20"** — número da parcela errado;
2. **Alturas diferentes entre cards** — variação de conteúdo (atraso/vencimento/endereço) gerava 3 tamanhos distintos.

## Investigação (ponto a ponto)

### Bug 1 — parcela errada
`CobrancaCard` usava `item.proximaParcela` como número da parcela, mas no backend (`operacoes.repository.impl.ts`) o campo é o **saldo pendente em R$** da próxima parcela. O número real é `proximoNumeroParcela` (`p2.numero`).

### Variação de altura — fontes
| Região | Antes | Casos |
|---|---|---|
| Subtítulo `bairro · Parcela X de Y` | sem `truncate` | bairro longo quebrava em 2 linhas |
| Linha de status | `flex flex-wrap` | atrasado (badge + "N dias") quebrava em telas estreitas; vence hoje ficava com 1 linha |
| Valor | sem `whitespace-nowrap` | valores longos podiam estourar |

Combinações → 3 alturas (atrasado+bairro longo / atrasado+bairro curto ou vence hoje+bairro longo / vence hoje+bairro curto).

## Escopo

| # | Mudança (`CobrancaCard.tsx`) | Efeito |
|---|------------------------------|--------|
| 1 | `atual: item.proximoNumeroParcela` (guard `> 0`) | "Parcela X de Y" correta (X = número real da próxima pendente) |
| 2 | `truncate` no subtítulo | endereço longo corta com "…" — 1 linha sempre |
| 3 | Status: `flex min-h-6 items-center` + `truncate` no texto de atraso | linha de status sempre 1 linha, altura fixa (badge = altura constante) |
| 4 | `whitespace-nowrap` no valor | valor nunca quebra |

**Hierarquia de informação:** primário (nome + valor), secundário (bairro · parcela, muted truncado), terciário (badge + dias de atraso). Cards com **3 linhas fixas e mesma altura**, nos 3 consumidores (fila `/cobrancas`, `/atendidos`, Central carousel, Rota).

## Validação
- `npm run build` · `audit:ui` · `audit:styles` · `docs:audit`
- Verificação visual manual dos 3 casos lado a lado (fila + carousel + Rota)

## Referências
- `CobrancaCard.tsx` · `operacoes.repository.impl.ts` (`proximoNumeroParcela`/`proximaParcela`)
- PLAN-047 (card original) · PLAN-048 (polimento)
