# PLAN-034 — Atraso no card do contrato (lista de contratos)

**Status:** Concluído

**Versão:** 1.0

**Início:** 03/08/2026

**Última atualização:** 03/08/2026

**Roadmap:** follow-up do PLAN-033 (exposição de atraso)

---

## Objetivo

Expor a situação de **atraso por contrato** na lista de contratos (`/contratos`): o `ContratoCard` (list-item) já mostra o resumo financeiro (valor, juros, saldo, total, parcelas, datas, estado); passa a exibir uma **linha vermelha de atraso** ("N parcelas em atraso · R$ Y · D dias") quando o contrato tem parcelas vencidas — espelhando o destaque vermelho da `ParcelaList` no detalhe.

## Escopo

| # | Entrega |
|---|---------|
| 1 | Backend: `GET /api/contratos` (lista) devolve `emAtraso`, `parcelasEmAtraso`, `diasEmAtraso` por contrato (BR-099) |
| 2 | Frontend: `ContratoCard` (list-item) linha de atraso + tipo `Contrato` + i18n |
| 3 | Documentação: BR-099, 02-API, UC-072, API-CT-105, mapeamento v1.22, PLAN |

> **Fora de escopo:** a **lista de clientes** permanece enxuta — reserva de espaço para a futura **foto do cliente** (decisão do Rafael, 03/08).

## Regras de negócio nova (BR-099)

A lista de contratos expõe, por contrato, atraso com os mesmos critérios da BR-096 **escopados ao contrato**:
- `emAtraso` = Σ `saldoPendente` de parcelas com `dataVencimento < hoje`;
- `parcelasEmAtraso` = quantidade dessas parcelas;
- `diasEmAtraso` = dias desde o `MIN(dataVencimento)` dessas parcelas (0 se nenhuma);
- Parcela `Parcial` vencida **conta**.

## Implementação

### Backend
| Arquivo | Mudança |
|---------|---------|
| `src/modules/contrato/infrastructure/repositories/contrato.repository.impl.ts` | `findAll`: estende o agregado `GROUP BY contratoId` (que já calcula `saldoPendente`/`parcelasPagas`) com `emAtraso`, `parcelasEmAtraso`, `maisAntigaAtraso`; `diasEmAtraso` em TS (datas locais) |
| `src/modules/contrato/domain/contrato.entity.ts` | campos opcionais `emAtraso?`, `parcelasEmAtraso?`, `diasEmAtraso?` |

### Frontend
| Arquivo | Mudança |
|---------|---------|
| `contrato/services/contrato.service.ts` | tipo `Contrato` + os 3 campos |
| `contrato/components/ContratoCard.tsx` | list-item: linha danger (pontinho) "N parcelas em atraso · R$ Y · D dias" quando `parcelasEmAtraso > 0` |
| i18n (pt-BR/en/es) | `contrato.emAtrasoDetalhe` + `contrato.diasEmAtraso` |

## UCs (06) / CTs (07)
- UC-072: atraso no card do contrato (lista).
- API-CT-105: lista de contratos retorna atraso coerente com as parcelas (BR-099).

## Validação
- `npm run build` ✅ · `docs:audit` ✅
- `GET /api/contratos` no dev: contrato do Antônio Moreira → `emAtraso: 861`, `parcelasEmAtraso: 7`, `diasEmAtraso: 9`.

## Referências
- `product/02-BUSINESS-RULES.md` BR-099
- `product/06-CASOS-DE-USO.md` UC-072
- `product/07-CASOS-DE-USO-API.md` API-CT-105
- `engineering/05-MAPEAMENTO-TELAS.md` v1.22 (§7)
- Segue o PLAN-033 (BR-096..098) na exposição de atraso
