# 08 — UC × MÓDULO — Matriz de validação por módulo (PLAN-045)

**Status:** Ativo

**Objetivo:** mapear **quais casos de uso (06) e cenários de API (07) validam cada módulo** do whitelabel — para saber o que conferir quando um módulo está **on** (validar o módulo) ou **off** (validar que nada vaza). Complementa `UI-COVERAGE.md`.

> A matriz é espelhada no campo `ucs` do **Module Manifest** (`src/modules/admin/domain/modules.ts`) — alterar o manifest e este doc em conjunto.

---

## Escopo e verticais (ADR-007)

O NX Gest é uma **plataforma modular** (escopo por capacidades). Este doc valida o **módulo** (nível 2), o que é independente do vertical (nível 1). Hoje existe **um** vertical — **crédito em campo** — formado por `clientes`, `contratos`, `cobrancas`, `rota` e `atendidos`; `caixa`/`gastos` são genéricos e `central`/`auth`/`admin` são plataforma. Uma **nova vertical** entra pelos critérios de admissão do **ADR-007** (caber no manifest com tudo declarado, preservar isolamento, rastreabilidade, UCs/CTs + linha aqui, sem novo motor de persistência/autorização, 3 idiomas).

---

## Módulos × validação

| Módulo | Deps | UCs (06) | API-UCs (07) | Validação "off" |
|---|---|---|---|---|
| **clientes** | — | 015, 017, 047, 048, 071, 080 | 004–008 | CRUD → 403; Central sem "Novo cliente" |
| **contratos** | clientes | 006, 007, 008, 016, 017, 022, 029, 030, 033, 035, 049, 050, 072 | 009–017 | CRUD + pagamentos → 403; KPIs financeiros ocultos na Central |
| **caixa** | — | 012, 013, 014, 025, 026 | 024–028 | API → 403; Central sem "Fechar caixa"; (KPIs de parcela zeram sem contratos) |
| **gastos** | caixa | 011, 051 | 029–031 | API → 403; Central sem "Gastos hoje" |
| **rota** | cobrancas | 002, 003, 004, 005, 018, 019, 037 | 023 | POST /visitas → 403; Central sem "Minha rota" |
| **cobrancas** | contratos | 009, 020, 038 | 018, 022 | historico-atrasos → 403; Central sem Pendentes/clientes pendentes |
| **atendidos** | cobrancas | 010, 021, 036, 070 | — | UI-gated; Central sem link Atendidos/"Ver resumo" |

## Módulos transversais / compositores

| Módulo | UCs (06) | API-UCs (07) | Observação |
|---|---|---|---|
| **central** (dashboard, sempre on) | 001, 018, 020, 034, 036, 038, 058, 081 | 018–021 | Compositor: widgets dos módulos ativos (PLAN-045); nunca "off" |
| **auth / admin / super_admin** | 023–033, 039–046, 052, 061–069 | 032–042 | Gestão/plataforma — não são módulos de negócio (não gateáveis) |
| **whitelabel/tema** | 055–060, 073–080 | 091–099, 106–118 | Validação do mecanismo de módulos (combos, enforcement, sessão) |

## Como validar um novo negócio (ex.: adicionar `agenda`)

1. Registrar no manifest (`modules.ts` backend + frontend): `surfaces`, `dados`, `widgets`, `capacidades`, `dependsOn`, `ucs`.
2. Criar as UCs/CTs do módulo em 06/07 e **adicionar a esta matriz**.
3. Garantir: `npm run audit:modules` limpo + widgets na Central (composição automática).
4. Validar "on" (o módulo) e "off" (nada vaza).

---

## Capacidades (recursos finos — BR-104)

Recurso individual de um módulo, ativável/desativável por empresa (`empresas.capacidades`). Capacidade exige o **módulo dono** ativo. Manifest: `src/modules/admin/domain/capacidades.ts` (espelho `frontend/src/shared/modules/capacidades.ts`).

| Capacidade | Dono | Superfícies | Enforcement |
|---|---|---|---|
| `cliente:whatsapp` | clientes | ClienteDetail (WhatsApp) | UI |
| `cliente:ligar` | clientes | ClienteDetail (Ligar) | UI |
| `cliente:navegar` | clientes | ClienteDetail (Navegar) | UI |
| `cliente:anexos` | clientes | ClienteDetail (Anexos) | **API** (`/clientes/:id/anexos*` → 403 `CAPABILITY_DISABLED`) |
| `rota:whatsapp` | rota | RotaPage (WhatsApp) | UI |
| `rota:ligar` | rota | RotaPage (Ligar) | UI |
| `rota:navegar` | rota | RotaPage (Navegar) | UI |
| `pagamento:comprovante_whatsapp` | contratos | RotaPage/ContratoDetail (comprovante WhatsApp) | UI |

CTs: 07 — `CAP-CT-101..110`. Smoke: `CAP-100..110`.

## Guard de desativação com dados (BR-105)

O `PATCH /modulos` protege dados em aberto ao desligar módulos:

| Módulo | Dado que bloqueia (409) | Sem esse dado |
|---|---|---|
| `contratos` | parcelas em aberto (`saldoPendente > 0`) | confirmação |
| `cobrancas` | clientes com pendência | confirmação |
| `caixa` | `caixa_base != 0` (**nunca forcável**) | 200 |
| `gastos` | — | confirmação |
| `clientes` / `rota` / `atendidos` | — | confirmação (contagens no impacto) |

- `force: true` + motivo (só super admin) sobrepõe contratos/cobrancas/clientes; **caixa nunca**.
- `GET /:id/impacto?modulos=<JSON>` devolve a prévia.
- Auditoria em `auditoria_modulos`. CTs: 07 — `IMP-CT-1/2`, `MOD-G-CT-1..11`. Smoke: `MOD-G-1..11`, `IMP-001/002`.

## Referências

- `src/modules/admin/domain/modules.ts` (MODULE_MANIFEST — `ucs`) · `frontend/src/shared/modules/modules.ts` (MODULE_WIDGETS)
- `06-CASOS-DE-USO.md` · `07-CASOS-DE-USO-API.md` · `UI-COVERAGE.md`
- PLAN-045 (modularização) · BR-092/093
