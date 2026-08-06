# PLAN-047 — Card "Cobrança do dia" (referência Lovable) + badges + modais + contrato do admin

**Status:** Concluído

**Versão:** 1.0

**Início:** 05/08/2026

**Última atualização:** 05/08/2026

**Roadmap:** identidade visual "Nexus" (polimento ponta a ponta, referência `site-personality-plus`)

---

## Objetivo

Redesenhar o **card de cobrança** (Central, fila `/cobrancas` e Rota) no padrão da referência Lovable (`src/components/nx/cobranca.tsx`), trazer o **dias de atraso** do backend, alinhar o **Switch**, evoluir o **ModulosModal** (descrição por módulo, Central sempre ativa, auto-completar deps, cascata-off) e trocar o card cru de contratos do **OperadorDetail** pelo `ContratoCard list-item`.

## Escopo

| # | Entrega |
|---|---------|
| 1 | **`CobrancaCard`** display (Lovable): tone bar + nome + `bairro · Parcela X de Y` + `StatusBadge` + "N dias de atraso" + `value-lg` + chevron (interativo só com `onClick`). Usado em Central/`/cobrancas` (display + clique → rota) e Rota (display; ações abaixo). **Sem avatar.** i18n `operacoes.parcelaDe` + `operacoes.diasAtraso_*` |
| 2 | **Backend `diasEmAtraso`** no `CobrancaItem` (subquery `julianday` na query de cobranças) + **CT OPS-018** estendido no smoke |
| 3 | **`Switch` canônico** (`shared/components/Switch`) — track `h-7 w-12`, knob `size-5` centralizado, inativo `bg-muted` (padrão Lovable) |
| 4 | **`ModulosModal` v2**: `descricaoKey` por módulo (i18n `modules.<id>.descricao`) · linha **Central sempre ativa** (switch on + badge) · **auto-completar dependências** na abertura · **cascata-off** no toggle off (quem depende de um módulo desligado também desliga) |
| 5 | **`OperadorDetail`**: contratos do operador passam a usar **`ContratoCard variant="list-item"`** navegável para `/contratos/:id?usuarioId=&empresaId=` (padrão do `ContratoList`) |

## Mudanças de comportamento
- Fila e Central: card de cobrança deixou de ter os botões WhatsApp/Ligar/Navegar/Abrir inline — **ações só na Rota** (decisão de produto).
- `diasEmAtraso` = 0 para `venceHoje`, >= 1 para `atrasado` (maior atraso entre parcelas pendentes).

## Validação
- `npm run build` ✅ · `audit:ui` ✅ · `audit:styles` ✅ · `audit:modules` ✅ · `docs:audit` ✅
- `smoke:api` **109/109** (inclui OPS-018 com `diasEmAtraso`)

## Referências
- Referência Lovable: `site-personality-plus/src/components/nx/{cobranca,kit,ui}.tsx`
- `07-CASOS-DE-USO-API.md` (OPS-018) · `01-DATABASE.md`/`04-BACKEND.md` (shape cobranças)
- `CobrancaCard.tsx` · `ModulosModal.tsx` · `OperadorDetail.tsx` · `operacoes.repository.impl.ts`
