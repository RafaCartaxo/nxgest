# PLAN-051 — Card de cobrança: bairro/parcela em linhas próprias + dias sem truncamento

**Status:** Concluído

**Versão:** 1.0

**Início:** 06/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** identidade visual "Nexus" — melhoria de visibilidade pós-PLAN-050

---

## Objetivo

O PLAN-050 padronizou a altura dos cards, mas à custa de visibilidade: o subtítulo `bairro · parcela` ficou espremido numa linha e o "N dias de atraso" **truncava** (escondendo informação) em telas estreitas (carousel `w-72` e mobile). Além disso, a linha de status era assimétrica (atrasado = badge + dias; vence hoje = só badge).

## Solução (Opção B)

Estrutura fixa de **4 linhas**, com bairro e parcela em **linhas próprias** e o "dias de atraso" alocado na **coluna direita, sob o valor** (linha própria → nunca trunca):

```
Linha 1  Nome (semibold, truncate)            [R$ 1.234,56] (value-lg, nowrap)
Linha 2  Bairro (muted, truncate)             [180 dias de atraso] (text-xs danger, direita)
Linha 3  Parcela 5 de 20 (muted, truncate)
Linha 4  [● Atrasado] | [● Vence hoje]
```

**Uniformidade:** a coluna esquerda (4 linhas ≈ 90px) é sempre mais alta que a direita (máx. 2 linhas ≈ 44px) → atrasado e vence hoje com **a mesma altura**, mesmo com a linha extra do dias.

**Sem truncamento:** o dias fica sozinho na coluna direita (~105px, cabe até no carousel `w-72`). Badge permanece curto (`Atrasado`/`Vence hoje`).

**Assimetria de conteúdo, simetria de layout:** vence hoje não tem dado equivalente ao dias (o badge já informa) — a altura não muda por causa disso.

## Escopo
- `CobrancaCard.tsx` (ponto único) → reflete em: fila `/cobrancas` + `/atendidos`, Central (carousel), Rota.

## Validação
- `npm run build` · `audit:ui` · `audit:styles` · `docs:audit`
- Verificação visual manual dos 3 casos lado a lado (fila/carousel/Rota)

## Referências
- PLAN-047 (card original) · PLAN-050 (altura uniforme, base deste) · `CobrancaCard.tsx`
