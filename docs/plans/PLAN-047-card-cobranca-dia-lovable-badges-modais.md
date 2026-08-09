# PLAN-047 — Identidade visual "Nexus": card de cobrança do dia + componentes + anti-drift

**Status:** Concluído

**Versão:** 2.0 (consolida PLAN-047..054)

**Início:** 05/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** identidade visual "Nexus" (polimento ponta a ponta, referência `site-personality-plus`)

---

> [!note] Plano consolidado
> Este é o **plano único** do lote de identidade visual recente. Absorve o que antes eram **PLAN-048..054**
> (arquivos removidos — histórico e rastreabilidade preservados na tabela abaixo e nos commits).
> Qualquer dúvida de "o que mudou no card/componente X": procure aqui primeiro, depois no `git log`.

## Objetivo

Redesenhar o **card de cobrança** (Central, fila `/cobrancas` e Rota) no padrão da referência Lovable (`site-personality-plus/src/components/nx/`), evoluir os **componentes compartilhados** e o **admin** para a identidade "Nexus" por completo, e **travar o padrão contra regressão** (anti-drift).

## Histórico de iterações (rastreabilidade)

| Plano antigo | O que fez | Commit |
|---|---|---|
| 047 | Card "Cobrança do dia" Lovable + `diasEmAtraso` backend + Switch + ModulosModal v2 + OperadorDetail | `855b173` |
| 048 | Modal assinatura Lovable (title/descricao/footer + bottom-sheet), FieldSelect/FieldTextarea, Tabs, EstadoTela, PageHeader/SectionHeader, StatusBadge com dot, ParcelaList + docs finais | `855b173` |
| 049 | Anti-drift: `audit:ui` estendido (select/textarea cru, header inline de modal, `role="tab"` fora do Tabs, `<Modal>` sem `title`) | `855b173` |
| 050 | Fix "Parcela X de Y" (era `proximaParcela`=R$, agora `proximoNumeroParcela`) + altura uniforme (3 linhas) | `b949619` |
| 051 | Bairro/parcela em linhas próprias + "dias de atraso" sem truncar (sob o valor) | `d61115b` · `22ca585` |
| 052 | Alinhamento fino do "dias de atraso" (linha do badge, centralizado) | `0222bf1` |
| 053 | Linhas full-width (só linha 1 é 2 colunas) — fim do truncamento no carousel/mobile | `5c657e1` |
| 054 | "dias de atraso" alinhado ao **fim do valor** (`justify-between` + `pr-5` condicional) | `da178a7` |

## Escopo consolidado

### 1. Card de cobrança (`CobrancaCard.tsx` — usado em Central, fila `/cobrancas`, `/atendidos` e Rota)

- **Estrutura fixa de 4 linhas, altura uniforme**:
  - **L1** Nome (primário) + Valor (`value-lg`, nowrap) — única linha em 2 colunas;
  - **L2** Bairro (secundário, `truncate`, largura total);
  - **L3** Parcela X de Y (secundário, `truncate`, largura total);
  - **L4** `StatusBadge` (Atrasado/Vence hoje) + "N dias de atraso" — `items-center` (centralizado com o badge), `justify-between` + `pr-5` condicional → o texto termina **no fim do valor**, antes do ">".
- **Dados**: `diasEmAtraso` no backend (`CobrancaItem`, subquery `julianday`) + **CT OPS-018** estendido no smoke. Parcela usa `proximoNumeroParcela` (número real).
- **Comportamento**: sem avatar; sem botões inline (ações só na Rota); `onClick` opcional (chevron + hover só quando clicável).
- **Design**: tone bar do `Card`, tokens `*-light`/`value-lg`, `truncate` nas linhas de contexto (trunca só no extremo estreito do carousel).

### 2. Componentes compartilhados (PLAN-048)

| Componente | Mudança |
|---|---|
| `Modal` | Assinatura Lovable (`title`/`descricao`/`footer` opcionais) + **bottom-sheet mobile** (`items-end sm:items-center`, `rounded-t-xl sm:rounded-xl`, `max-h-[90vh]`, keyframe `slideInFromBottom`) — sweep dos 14 consumidores |
| `FieldSelect` / `FieldTextarea` | Canônicos em `shared/components/Field/` (com `fieldControl` compartilhado); migrados os 3 `<select>` (OperadorForm, GastoForm) |
| `Tabs` | Pill group `rounded-xl border bg-card`, ativa `bg-primary-light` — migradas pills do AdminPage |
| `EstadoTela` | Unificado (API de booleans preservada): loading → card spinner; erro/vazio → ícone em círculo `size-11 rounded-full` |
| `PageHeader` / `SectionHeader` | Icon `size-11 rounded-xl`, título `text-[28px]`+`truncate` / `font-display text-[22px]` |
| `StatusBadge` | Pill `rounded-md` com **dot** interno (`size-1.5 rounded-full`) |
| `Switch` | Canônico `shared/components/Switch` — track `h-7 w-12`, knob `size-5` centralizado, inativo `bg-muted` |
| `ParcelaList` | Status das parcelas viram `StatusBadge` (Vencida/Vence hoje/Paga/Parcial/Pendente) |

### 3. Admin (PLAN-047)

- **`ModulosModal` v2**: `descricaoKey` por módulo (i18n `modules.<id>.descricao`) · linha **Central sempre ativa** (badge) · **auto-completar dependências** na abertura · **cascata-off** no toggle off.
- **`OperadorDetail`**: contratos do operador usam **`ContratoCard variant="list-item"`** navegável (`?usuarioId=&empresaId=`).

### 4. Anti-drift (PLAN-049)

`npm run audit:ui` estendido — falha se aparecer: `<select>`/`<textarea>` cru em módulos, header inline de modal, `role="tab"` fora do Tabs, `<Modal>` sem `title`.

### 5. Docs

- `04-UI-COMPONENTS.md` v1.7 (novos componentes + Modal/StatusBadge/EstadoTela; Bottom Sheet coberto pelo Modal).
- `06-PRODUCAO.md` (deploy cita os 3 gates `audit:ui/styles/modules`).
- `Lovable-NXGest.md` **superseded** (fonte viva = `Lovable-Admin-NXGest.md` + repo `site-personality-plus`).
- `UI-COVERAGE.md` · `docs/plans/README.md` · CHECKLISTs diários.

## Mudanças de comportamento
- Fila e Central: card de cobrança sem botões WhatsApp/Ligar/Navegar/Abrir inline — **ações só na Rota** (decisão de produto).
- `diasEmAtraso` = 0 para `venceHoje`, >= 1 para `atrasado`.
- Modais ganham X de fechar no header padrão (antes alguns só fechavam por botão interno) + body com scroll interno.

## Validação
- `npm run build` · `audit:ui` · `audit:styles` · `audit:modules` · `docs:audit` ✅ (a cada iteração)
- `smoke:api` **109/109** (inclui OPS-018 com `diasEmAtraso`)
- Verificação visual manual (fila + carousel + Rota, desktop/mobile)

## Referências
- Referência Lovable: `site-personality-plus/src/components/nx/{cobranca,kit,ui,ModulosModal}.tsx`
- `07-CASOS-DE-USO-API.md` (OPS-018) · `01-DATABASE.md`/`04-BACKEND.md` (shape cobranças)
- `CobrancaCard.tsx` · `Modal.tsx` · `Field/*` · `Tabs/*` · `EstadoTela.tsx` · `StatusBadge/*` · `ParcelaList.tsx` · `ModulosModal.tsx` · `OperadorDetail.tsx` · `operacoes.repository.impl.ts`
