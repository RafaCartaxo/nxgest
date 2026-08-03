# PLAN-033 — Exposição de atrasos do cliente e indicadores financeiros (P015)

**Status:** Concluído

**Versão:** 1.1

**Início:** 03/08/2026

**Última atualização:** 03/08/2026

**Roadmap:** product/04-ROADMAP.md (Sprint 3 — P015)

---

## Objetivo

Dar utilidade ao dado de **atraso** do cliente:

1. **Detalhe do cliente** (`/clientes/:id`): hoje só mostra `saldoDevedor` + `totalContratos`. Passa a exibir uma **grade de situação financeira** — saldo devedor, **em atraso** (valor + parcelas + dias), **vence hoje** e **lucro previsto** (P015) — além do **último pagamento**.
2. **Histórico de atrasos** (view `atrasado` em `/cobrancas`): avaliado e **descartado nesta entrega** — ver "Decisões de design". O dado ao vivo (banner) e o detalhe do cliente cobrem a necessidade.

## Escopo

| # | Entrega |
|---|---------|
| 1 | Backend: `IClienteFinanceiroQuery` + `ClienteFinanceiroQueryImpl` (valor/parcelas/dias em atraso, vence hoje, último pagamento, lucro previsto) injetado em `FindCliente` → `GET /clientes/:id` |
| 2 | Frontend Cliente: `SituacaoFinanceira` (grade 2×2 KpiCard + último pagamento) substituindo `SaldoInfo` |
| 3 | Documentação: PLAN + propagação SKILL-009 (BRs, UCs, API CTs, 02-API, mapeamento, BACKLOG) |

## Regras de negócio novas (BR-096..098)

- **BR-096** — situação de atraso do cliente (escopo: contratos `Ativo`, não deletados, do `userId`):
  - `valorEmAtraso` = Σ `saldoPendente` de parcelas com `dataVencimento < hoje`;
  - `parcelasEmAtraso` = contagem dessas parcelas;
  - `diasEmAtraso` = dias entre o `MIN(dataVencimento)` dessas parcelas e hoje (0 se nenhuma);
  - `valorVenceHoje` = Σ `saldoPendente` de parcelas com `dataVencimento = hoje`.
  - Parcela `Parcial` vencida **conta** para o atraso (tem `saldoPendente > 0`).
- **BR-097** — `ultimoPagamento` = pagamento mais recente do cliente (JOIN contrato) com `estornadoEm IS NULL`, ordenado por `data DESC, createdAt DESC` (a ordem por `createdAt` sozinha é ambígua em dados de seed em lote).
- **BR-098** — `lucroPrevisto` do cliente = Σ(`valorFinal − valorBase`) dos contratos **`Ativo`** (não deletados). Contratos `Finalizado` ficam fora (lucro já realizado).

## Decisões de design

| Decisão | Escolha |
|---------|---------|
| Exposição no cliente | Grade 2×2 de `KpiCard` (DS existente) — `danger` em atraso, `info` vence hoje, `green` lucro; linha discreta "Último pagamento" |
| "Último pagamento" | Incluído; exclui estornados; ordena `data DESC` (validado contra seed em lote) |
| Histórico de atrasos (snapshot/evolução) | **Removido da UI** (03/08): o `snapshots_atraso` só é gravado ao abrir Cobranças (on-access, sem job agendado) → dado esparso; o gráfico/Δ e a tabela duplicavam o banner ao vivo sem utilidade. O endpoint `GET /api/operacoes/historico-atrasos` e o registro do snapshot **permanecem** no backend (API-UC-022) para uso futuro. Se um dia um job diário (node-cron) entrar no escopo, a evolução pode voltar. |
| Escopo de dados | `userId` + `deletedAt IS NULL` + `estado = 'Ativo'` (parcelas/contratos); cliente deletado não entra |

## Implementação

### Backend
| Arquivo | Mudança |
|---------|---------|
| `src/modules/cliente/application/ports/cliente-financeiro.query.ts` | novo port `IClienteFinanceiroQuery` + tipos |
| `src/modules/cliente/infrastructure/queries/cliente-financeiro.query.impl.ts` | SQL (4 statements escopados) + `diasEmAtraso` em datas locais |
| `FindClienteUseCase.ts` | injeta `clienteFinanceiroQuery` (opcional) e espalha o resumo na resposta |
| `cliente.controller.ts` / `cliente.routes.ts` | construtor + `ClienteFinanceiroQuery` |

### Frontend
| Arquivo | Mudança |
|---------|---------|
| `cliente/services/cliente.service.ts` | tipo `Cliente` + campos financeiros |
| `cliente/components/SituacaoFinanceira.tsx` | novo — grade 2×2 KpiCard + último pagamento |
| `cliente/pages/ClienteDetail.tsx` | usa `SituacaoFinanceira` (remove `SaldoInfo`) |
| `cliente/components/SaldoInfo.tsx` | **removido** (sem referências) |
| `operacoes/components/AtrasoChart.tsx` | criado e **removido** (decisão acima) |
| `operacoes/pages/CobrancaListPage.tsx` | bloco "Histórico de atrasos" (gráfico + tabela) **removido**; banner ao vivo mantido |
| `operacoes/services/operacoes.service.ts` | remove `SnapshotAtraso`/`listarHistoricoAtrasos` (sem uso no front) |
| i18n (pt-BR/en/es) | chaves `cliente.*` novas; chaves `operacoes.historico*`/`atraso*` removidas |

## UCs (06) / CTs (07)
- UC-071: visualizar situação de atraso do cliente (detalhe).
- API-CT-103..104: campos financeiros em `GET /clientes/:id` e coerência com parcelas (Parcial vencida conta; `Finalizado` fora do lucro).
- (API-CT-105 do histórico/evolução foi criado e **removido** junto com a decisão acima; o endpoint `historico-atrasos` continua coberto por API-UC-022/CT-039.)

## Validação
- `npm run build` ✅ · `docs:audit` ✅ · `docs:collection` ✅ · **smoke 104/104** (instância isolada) ✅
- Consultas validadas contra banco dev real (read-only): Antônio Moreira → atraso 861/7 parcelas/9 dias, hoje 123, último pagamento 24/07, lucro 410; Finalizado excluído do lucro; Parcial vencida conta; multi-contrato soma; escopo `userId` isolado.

## Referências
- `product/02-BUSINESS-RULES.md` BR-096/097/098
- `product/06-CASOS-DE-USO.md` UC-071
- `product/07-CASOS-DE-USO-API.md` API-CT-103/104 (e API-UC-022/CT-039 p/ `historico-atrasos`)
- `engineering/05-MAPEAMENTO-TELAS.md` §2c e §5
- `docs/plans/BACKLOG.md` P015 (coberto)
