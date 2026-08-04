# PLAN-037 — Coerência do whitelabel: combos validados + Central adapta (P025)

**Status:** Concluído

**Versão:** 1.0

**Início:** 03/08/2026

**Última atualização:** 04/08/2026

**Backlog:** plans/BACKLOG.md P025

**Roadmap:** product/04-ROADMAP.md (coerência do whitelabel — pré-requisito p/ multi-negócio)

---

## Objetivo

Tornar o whitelabel **coerente em qualquer combinação de módulos** — o princípio que sustenta a evolução para "um app, vários negócios" (cobrança hoje, agendamentos/vendas amanhã): **dado de módulo desativado nunca aparece em lugar nenhum**. Duas frentes:

1. **Grafo de dependências completo** — `contratos ⇒ clientes` (contrato não existe sem cliente) + validação **transitiva** de combos órfãos.
2. **Central se adapta (P025)** — o dashboard compõe só widgets dos módulos ativos e não dispara chamadas a módulos off.

## Escopo

| # | Entrega |
|---|---------|
| 1 | `MODULE_DEPENDENCIES`: adicionar `contratos ⇒ clientes` (backend + frontend `modules.ts`) |
| 2 | `validateModulos` checa dependências **transitivas** (ex.: `rota ⇒ contratos ⇒ clientes`) |
| 3 | **Central adapta**: KPIs financeiros (a receber/recebido/resultado/atrasado/a vencer) gated por `contratos`; "Pendentes do Dia" + KPI de clientes pendentes gated por `cobrancas`; skip de fetches de módulos off; estado vazio coerente |
| 4 | CTs API-CT-117/118 · UC-081 sem gap · smoke |

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Origem do dado | KPIs financeiros = dados de **contratos** (parcelas/pagamentos) → gated por `contratos` | Princípio "dado de módulo off nunca aparece" (não é o módulo `caixa` que gera esse dado) |
| Fila de cobrança | "Pendentes do Dia" + clientes pendentes = módulo **`cobrancas`** | É a fila do módulo cobranças |
| `caixa` sem `contratos` | Permitido (base/movimentações/auditoria são próprios); KPIs zeram | Dado próprio zerado ≠ dado órfão |
| Validação | Transitiva (não só direta) | Combos como `rota` sem `contratos`+`clientes` são órfãos |

## Implementação

### Backend
| Arquivo | Mudança |
|---------|---------|
| `src/modules/admin/domain/modules.ts` | `contratos: ["clientes"]` + `dependenciasFaltantes` (transitivas) em `validateModulos` |

### Frontend
| Arquivo | Mudança |
|---------|---------|
| `shared/modules/modules.ts` | `contratos` com `dependsOn: ["clientes"]` (propaga ao `ModulosModal`) |
| `modules/operacoes/pages/OperacoesDashboard.tsx` | `contratosAtivo`/`cobrancasAtivo` gateiam KPIs + seção "Pendentes do Dia" + skip de `listarCobrancasDoDia`/`listarPagamentosHoje`/`listGastos` quando o módulo está off; estado vazio `centralVazia` |
| `modules/operacoes/components/IndicadoresCards.tsx` | Prop `hideCobrancas` (oculta KPI de clientes pendentes) |
| i18n | `operacoes.centralVazia` (pt/en/es) |

## Regras de negócio
| BR | Descrição |
|----|-----------|
| BR-092 | Dependências ampliadas e **transitivas**: `contratos⇒clientes`; combos órfãos → 422 |
| BR-093 | Central e telas compõem só widgets/dados dos módulos ativos; módulo off não gera dado nem chamada |

## Validação
- `npm run build` ✅ · `npm run docs:audit` ✅ · `smoke:api` **107/107** ✅
- Teste real isolado: `PATCH modulos ["contratos"]` → 422 "requer: clientes"; `["rota"]` → 422 "requer: contratos, clientes" (transitiva); `["clientes","contratos"]` → 200.

## Follow-up
- Registrar a visão multi-negócio (templates) no roadmap — fases F2..F4 (branding por tenant, URL por tenant, templates de negócio).

## Referências
- `plans/PLAN-036-whitelabel-enforcement-backend.md` (enforcement) · `plans/BACKLOG.md` P025
- `frontend/src/shared/modules/modules.ts` · `src/modules/admin/domain/modules.ts`
- `product/06-CASOS-DE-USO.md` UC-081 · `07-CASOS-DE-USO-API.md` API-CT-117/118
