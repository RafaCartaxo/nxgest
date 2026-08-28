# PLAN-085 — Contratos com periodicidade alternada

**Status:** ✅ Implementado (27/08) — backend + frontend + regras + docs + testes

**Versão:** 1.0

**Início:** 27/08/2026

**Origem:** 3º modelo de contrato pedido pelos clientes que o sistema não representava — **pagar dia sim, dia não** (`alternada`). Plano fechado no vault `brainwork` (referência `NX Gest - Contrato periodicidade alternada`) e validado contra o código antes da execução.

---

## Objetivo

Adicionar `alternada` ao enum de `periodicidade`, com intervalo de **2 dias** e default de **10 parcelas**, sem migração de banco e sem mudança na abstração de intervalo (`number`). A `diaria` e a `semanal` ficam intactas (BR-039/BR-040).

---

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| D1 | Representação | `"alternada"` no enum `Periodicidade` (valor persistido, não renomear) |
| D2 | Intervalo | **2 dias** (dia sim, dia não) — 1º vencimento em `dataInicio+2` |
| D3 | Domingo | Desliza para segunda (BR-042) — sem `superRefine` novo (exclusivo do `semanal`, BR-040-A) |
| D4 | Default de parcelas | **10** (padrão comercial ~20 dias; span real 22-24 dias pelos deslizes) |
| D5 | Migração | **Zero** — coluna `periodicidade TEXT NOT NULL DEFAULT 'diaria'` sem CHECK (`database.ts:123,444`) |
| D6 | Regras | 2 BRs novas: **BR-107** (alternada, estende BR-039) e **BR-108** (`dataFinal` intervalo 1\|2\|7, revoga BR-042-A) |

---

## Arquivos alterados

### Backend
| Arquivo | Mudança |
|---|---|
| `src/modules/contrato/domain/contrato.entity.ts` | `Periodicidade` ganha `"alternada"` |
| `src/modules/contrato/domain/periodicidade.ts` | `PERIODICIDADES` ganha `"alternada"` |
| `src/modules/contrato/domain/services/gerar-parcelas.ts` | `intervaloDePeriodicidade` → `2` para `alternada` |
| `CreateContratoInput.ts` / `UpdateContratoInput.ts` | enum zod (via `PERIODICIDADES`) + mensagem de erro atualizada |
| `src/modules/contrato/domain/services/gerar-parcelas.test.ts` | casos `alternada`: traçados de início, deslize de domingo, residual, span real |

### Frontend
| Arquivo | Mudança |
|---|---|
| `services/contrato.service.ts` | type `Periodicidade` ganha `"alternada"` |
| `utils/calcularDataFinal.ts` | espelho do intervalo (`2` para `alternada`) |
| `utils/calcularDataFinal.test.ts` | **novo** — mesma matriz do backend (pega divergência do espelho) |
| `schemas/contrato.schema.ts` | enum zod |
| `components/ContratoForm.tsx` | `grid-cols-3` + array com `"alternada"` + lookup de default de parcelas (2 pontos) + rótulo do resumo (lookup) |
| `components/ContratoCard.tsx` | badge por lookup `periodicidadeOpcoes.${p}` (era ternário diária/semanal) |
| `i18n/locales/{pt-BR,en,es}.json` | `periodicidadeOpcoes.alternada` + `porAlternada` (paridade nos 3) |

### Docs / regras
| Arquivo | Mudança |
|---|---|
| `docs/product/02-BUSINESS-RULES.md` | **BR-107** (alternada) e **BR-108** (`dataFinal` 1\|2\|7) + notas de extensão/revogação |
| `docs/product/01-DOMAIN.md` | periodicidade + fórmula da `dataFinal` na descrição de Contrato |
| `docs/product/06-CASOS-DE-USO.md` | UC-016/UC-049 citam periodicidade alternada |
| `docs/product/07-CASOS-DE-USO-API.md` | API-CT-017d (criar) + API-CT-023d (editar) + coerência |
| `docs/engineering/02-API.md` | tabela de validação do POST com `alternada` |
| `docs/plans/PLAN-085` + `docs/plans/README.md` | plano + índice |
| `docs/skills/SKILL-009-documentation-sync.md` | linha do espelho `intervaloDePeriodicidade` |
| `docs/UPDATES.md` · `docs/STATUS.md` | registros |

---

## Regras de negócio

- **BR-107** (nova): `alternada` = intervalo 2, 1º vencimento `dataInicio+2`, sem restrição de dia de início — **estende a BR-039**.
- **BR-108** (nova): `dataFinal = dataInicio + quantidadeParcelas × intervalo` com `intervalo` `1 | 2 | 7` — **revoga a BR-042-A**.

---

## KPIs — sem mudança de fórmula

As queries de KPI usam `data_vencimento`/estado/`valor_base` → funcionam com vencimentos alternados, como já funcionam com os semanais. Contrato alternado aparece nas telas de cobrança **apenas nos dias de vencimento**.

---

## Validação

- `tsc` (backend + frontend) · `npm test` · `build` · `docs:audit` · audits de estilo/ui/módulos
- Testes novos: `gerar-parcelas.test.ts` (alternada) e `calcularDataFinal.test.ts` (frontend) — **espelho com a mesma matriz**
- Manual: criar contrato `alternada` fechando em cada dia da semana; conferir 1ª parcela em `dataInicio+2`, nenhum vencimento em domingo e `dataFinal` exibida = persistida