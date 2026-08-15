# PLAN-076 — Contratos com periodicidade diária e semanal

**Status:** ✅ Implementado (14/08) — backend + frontend + regras + docs + testes

**Versão:** 1.0

**Início:** 14/08/2026

**Origem:** melhoria de negócio — além do contrato **diário** (padrão atual, implícito), o NX Gest precisa de contratos por **semana**. Antes deste plano, a periodicidade **não existia como campo**: o diário estava codificado no incremento `+1 dia` de `gerarParcelas` e `calcularDataFinal` (e no duplicado do frontend).

---

## Objetivo

Introduzir o campo `periodicidade` (`diaria | semanal`) no contrato, sem impacto retroativo: contratos existentes recebem `diaria` por default e parcelas já geradas **não são alteradas** (BR-040).

---

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| D1 | Representação | Enum `periodicidade: "diaria" \| "semanal"` (default `"diaria"`) |
| D2 | Vencimento semanal | Mesmo dia da semana da `dataInicio` (`+7*i` dias) |
| D3 | Edição de periodicidade | Permitida se não houver pagamento (regenera parcelas — padrão do `UpdateContrato`) |
| D4 | `dataInicio` em domingo | **Bloqueado** para semanal (BR-040-A) |
| D5 | Seed demo | 1 contrato semanal de exemplo por execução |
| D6 | Card do contrato | Badge de periodicidade (Diária/Semanal) |

---

## Arquivos alterados

### Backend
| Arquivo | Mudança |
|---|---|
| `src/modules/contrato/domain/contrato.entity.ts` | `Periodicidade` + campo no `Contrato` |
| `src/modules/contrato/domain/periodicidade.ts` | `PERIODICIDADES` + `isPeriodicidade` |
| `src/modules/contrato/domain/services/gerar-parcelas.ts` | `intervaloDePeriodicidade` (1/7) + incremento/ajuste de domingo condicional |
| `src/database.ts` | coluna `periodicidade` (schema + DDL + ALTER idempotente) |
| `CreateContratoInput.ts` / `UpdateContratoInput.ts` | Zod enum + `superRefine` domingo |
| `CreateContratoUseCase.ts` / `UpdateContratoUseCase.ts` | repassam `periodicidade` |
| `contrato.repository.impl.ts` | `rowToContrato` + `save` + `update` |
| `scripts/seed-demo.mjs` | INSERT com `periodicidade` + contrato semanal de exemplo |

### Frontend
| Arquivo | Mudança |
|---|---|
| `utils/calcularDataFinal.ts` | duplicado espelhado (incremento 1/7) |
| `services/contrato.service.ts` | tipo `Periodicidade` + campo |
| `schemas/contrato.schema.ts` | Zod com `periodicidade` + validação de domingo |
| `components/ContratoForm.tsx` | seletor Diária/Semanal + resumo |
| `components/ContratoCard.tsx` | badge de periodicidade |
| `pages/ContratoNovo.tsx` / `ContratoEdit.tsx` | payload com `periodicidade` |
| `i18n/locales/{pt-BR,en,es}.json` | chaves novas |

### Docs / regras
| Arquivo | Mudança |
|---|---|
| `docs/product/02-BUSINESS-RULES.md` | BR-039/040/040-A/042-A atualizadas |
| `docs/engineering/02-API.md` | payloads de contrato com `periodicidade` |
| `scripts/build-collection.mjs` + `docs/api-collection.json` | payloads regenerados |

---

## Regras de negócio

- **BR-039**: parcelas diárias **ou** semanais (semanal = mesmo dia da semana da `dataInicio`).
- **BR-040**: periodicidade configurável no contrato, sem retroatividade.
- **BR-040-A** (nova): contrato semanal não inicia em domingo.
- **BR-042**: nenhum vencimento em domingo (diária desliza para segunda; semanal não desliza pois o dia da semana é fixo).
- **BR-042-A**: `dataFinal = dataInicio + quantidadeParcelas × intervalo` (1 ou 7).

---

## KPIs — sem mudança de fórmula

Todas as queries de KPI (`valorEmAtraso`, `venceHoje`, `lucroPrevisto/Realizado`, `aReceberHoje`, `aVencer`, `saldoPendente`, `getVendasSemana`) usam `data_vencimento`/estado/`valor_base` → funcionam com vencimentos semanais. Contrato semanal aparece nas telas de cobrança **apenas no dia do vencimento** (comportamento esperado).

---

## Validação

- `tsc` (backend + frontend) · `npm test` · `build` · `docs:audit` · audits de estilo/ui/módulos
- Testes novos: `gerar-parcelas.test.ts` (diário com domingo, semanal, residual) e `calcularDataFinal.test.ts`
