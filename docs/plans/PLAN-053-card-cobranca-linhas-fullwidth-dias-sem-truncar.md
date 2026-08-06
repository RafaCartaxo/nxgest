# PLAN-053 — Card de cobrança: linhas full-width (fim do truncamento do "dias de atraso")

**Status:** Concluído

**Versão:** 1.0

**Início:** 06/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** identidade visual "Nexus" — correção estrutural de espaço pós-PLAN-052

---

## Objetivo

O PLAN-052 deixou o "dias de atraso" alinhado ao badge, mas **ainda truncava** e havia **espaço desperdiçado**. Causa raiz estrutural: o card era um **flex de 2 colunas** — a coluna do valor (`shrink-0`, `value-lg`) encolhia **todas** as linhas. No carousel da Central (card `w-72` = 288px), a coluna do valor (~150px) deixava só ~90px para a coluna esquerda inteira → o "dias de atraso" (e bairro/parcela) ficavam espremidos/invisíveis.

## Escopo

| # | Mudança (`CobrancaCard.tsx`) | Efeito |
|---|------------------------------|--------|
| 1 | **Somente a linha 1 é 2 colunas** (nome `flex-1 truncate` + valor `shrink-0`) | valor só compete com o nome |
| 2 | **Linhas 2–4 viram bloco full-width**: bairro, parcela e linha do badge | bairro/parcela/"dias de atraso" usam os **252px inteiros** do card |

**Resultado:** no carousel, a linha do badge passa a ter largura total → badge + "180 dias de atraso" (~188px) **cabem sem truncar**. Mobile idem.

**Mantido:** 4 linhas uniformes (altura constante) · "dias de atraso" centralizado com o badge (`items-center`) · valor à direita na linha 1 · bairro/parcela com `truncate` (largura total agora).

## Validação
- `npm run build` · `audit:ui` · `audit:styles` · `docs:audit`
- Verificação visual manual (fila + carousel + Rota)

## Referências
- PLAN-047 (card) · PLAN-050 (altura uniforme) · PLAN-051 (linhas próprias) · PLAN-052 (alinhamento) · `CobrancaCard.tsx`
