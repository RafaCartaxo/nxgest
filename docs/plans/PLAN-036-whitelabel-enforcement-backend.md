# PLAN-036 — Whitelabel: enforcement de módulos no backend (P024)

**Status:** Concluído

**Versão:** 1.0

**Início:** 03/08/2026

**Última atualização:** 04/08/2026

**Backlog:** plans/BACKLOG.md P024

**Roadmap:** product/04-ROADMAP.md (hardening do whitelabel)

---

## Objetivo

Fechar a lacuna do PLAN-031: o v1 de módulos era **gating de UI** (rotas/nav/entradas ocultas), mas a API continuava aberta. Este plano aplica **enforcement no backend** — módulo desativado devolve **403 `MODULE_DISABLED`** nas rotas do módulo.

## Escopo

| # | Entrega |
|---|---------|
| 1 | Middleware `requireModule('<id>')` (`src/shared/middleware/module.middleware.ts`) — lê `empresas.modulos` e bloqueia com 403 quando o módulo está off |
| 2 | Aplicação no mount das rotas (`main.ts`): clientes, contratos, caixa, gastos, pagamentos |
| 3 | Aplicação por endpoint em `/operacoes`: `POST /visitas` (rota), `GET /historico-atrasos` (cobrancas) |
| 4 | Tratamento `MODULE_DISABLED` no frontend (i18n pt/en/es) |
| 5 | CTs de validação (07: API-CT-106..110) + UC-079 |

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Origem do `modulos` | Leitura de `empresas.modulos` por request | O JWT não carrega `modulos` (`JwtPayload` = userId/role/empresaId); mesmo padrão do `authMiddleware` (que já consulta o usuário). Robustez a tokens antigos. |
| Super admin | Sem `?empresaId=` → passa (gestão global); com `?empresaId=` → valida a empresa-alvo | Mesma regra do `resolveUsuarioAlvo`; super admin não tem `empresaId` no token |
| `pagamentos` | Gated por `contratos` | Pagamento é aplicado a parcelas de contrato; contratos off → sem pagamentos |
| `/operacoes` | **Por endpoint**, não no mount | O router serve a Central (sempre on) — gating por módulo único quebraria Rota/Atendidos/Cobranças (todos consomem `GET /cobrancas`) |
| Endpoints compartilhados | `GET /cobrancas`, `pagamentos-hoje`, `parcelas-hoje`, `parcelas-semana` **não** têm gate | Alimentam a Central (sempre ativa) e outras páginas de módulo; gating exigiria separar o feed do dashboard (fora do v1) |
| Erro | `403 { code: "MODULE_DISABLED", message }` | Frontend mapeia `errors.MODULE_DISABLED` (traduzida), senão usa a mensagem do backend |

## Implementação

### Backend
| Arquivo | Mudança |
|---------|---------|
| `src/shared/middleware/module.middleware.ts` | Novo — `requireModule(id)`: resolve empresa efetiva (token p/ tenant; `?empresaId=` p/ super_admin), lê `empresas.modulos`, 403 `MODULE_DISABLED` se off; `null`/ausente = todos ativos |
| `src/main.ts` | `requireModule` no mount de `clientes`, `contratos`, `caixa`, `gastos`, `pagamentos` (=`contratos`) |
| `src/modules/operacoes/presentation/routes/operacoes.routes.ts` | `POST /visitas` → `requireModule("rota")`; `GET /historico-atrasos` → `requireModule("cobrancas")` |

### Frontend
| Arquivo | Mudança |
|---------|---------|
| `src/i18n/locales/{pt-BR,en,es}.json` | `errors.MODULE_DISABLED` traduzido |

## Regras de negócio
| BR | Descrição |
|----|-----------|
| BR-093 | Ampliada: além de ocultar superfícies, a API devolve 403 por módulo desativado (`requireModule`); fallback sem `modulos` = todos ativos; super admin sem empresa-alvo não é bloqueado |

## API
403 `MODULE_DISABLED` nas rotas de módulo off — ver `engineering/02-API.md` (nota no PATCH modulos) e `product/07-CASOS-DE-USO-API.md` (API-CT-106..110).

## UCs de validação
`product/06-CASOS-DE-USO.md` UC-079.

## Documentação atualizada (matriz SKILL-009)
- `02-BUSINESS-RULES.md` BR-093 · `02-API.md` · `07` (API-CT-106..110) · `06` (UC-079)
- `BACKLOG.md` P024 concluído · `plans/README.md` PLAN-036 · `UPDATES.md`

## Validação
- `npm run build` ✅ · `npm run docs:audit` ✅
- **Teste real em instância isolada** (seed + PORT=3002): módulos off → 403 `MODULE_DISABLED` (`caixa`, `gastos`, `rota` via `/visitas`, `cobrancas` via `/historico-atrasos`); ativos → 200; compartilhado `/operacoes/cobrancas` → 200; super admin sem `?empresaId=` → 200, com `?empresaId=` → 403; sem `modulos` (fallback) → 200.
- **`smoke:api` 105/105** (inclui novo MOD-097 e OPS-040).
- **Bug de fuso corrigido na validação:** `date(h.createdAt)` (UTC) × `hoje` (local) divergiam em certos horários → visita não refletia na lista. Corrigido com `'localtime'` (`operacoes.repository.impl.ts`).

## Referências
- `plans/PLAN-031-temas-modulos-whitelabel.md` (origem dos módulos) · `plans/BACKLOG.md` P024
- `src/modules/admin/domain/modules.ts` (registro canônico: `ALL_MODULES`, `parseModulos`)
- `src/shared/utils/scope.ts` (`resolveUsuarioAlvo` — regra da empresa-alvo do super admin)
