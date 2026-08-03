# PLAN-031 — Temas & gradientes + Super Admin whitelabel (módulos por empresa)

**Status:** Concluído

**Versão:** 1.0

**Início:** 03/08/2026

**Última atualização:** 03/08/2026

**Roadmap:** product/04-ROADMAP.md §5.2 (evolução do painel admin) + whitelabel futuro

---

## Objetivo

1. **Temas modernos com gradientes** por usuário — base para whitelabel (cada cliente com a "cara" dele no futuro).
2. **Super Admin como centro de controle**: página redesenhada + **ativar/desativar módulos por empresa** (v1 gerencial, UI-gating).

## Escopo

| # | Entrega |
|---|---------|
| 1 | 5 temas por usuário (default, aurora, ocean, grape, sunset) × light/dark, via CSS vars |
| 2 | Tokens de gradiente (`--gradient-page/accent/text`) + utilities |
| 3 | Seletor de tema na engrenagem (swatches) + toggle claro/escuro |
| 4 | Gradientes aplicados: fundo do app, LoginPage, botão primário, navbar ativo |
| 5 | **Módulos por empresa** (7 granulares + `central` sempre on) — coluna `empresas.modulos`, `PATCH /modulos`, `login`/`me` com `modulos` |
| 6 | Gating de UI: `RequireModule` (rotas), Navbar, Central, Caixa, ClienteDetail |
| 7 | Super Admin redesenhado: banner gradiente + `ModulosModal` + `EmpresaForm` no Modal base |

**Fora de escopo:** enforcement no backend (403 por módulo) → **P024** (hardening futuro); tema por tenant (whitelabel) → seam documentado, sem coluna agora.

---

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Temas | 5 paletas por usuário (localStorage), light/dark por tema | O tema já é 100% CSS vars — blocos `[data-theme]` × `.dark` |
| Whitelabel | Seam documentado (tema/módulos vindos do tenant no futuro) | Sem coluna agora; infra pronta |
| Módulos | Granulares (7): `clientes, contratos, caixa, gastos, rota, cobrancas, atendidos` | 1:1 rota→módulo, sem regra de agrupamento |
| `central` | Sempre ativo (landing de todos) | Todo usuário cai no dashboard |
| Dependências | `gastos⇒caixa`; `rota/cobrancas/atendidos⇒contratos` | Evita estados sem entrada/links quebrados |
| "Só central" | Permitido (`modulos: []` = tenant dashboard-only) | Whitelabel aceita subconjuntos mínimos |
| v1 gating | UI (rotas/nav/entradas/dados) | Backend enforcement = P024 (follow-up) |

## Implementação

### Backend
| Arquivo | Mudança |
|---------|---------|
| `src/database.ts` | `empresas.modulos` (drizzle) + migração boot (`PRAGMA table_info` → `ALTER`) |
| `src/modules/admin/domain/modules.ts` | IDs canônicos, dependências, `validateModulos`, `parseModulos` |
| `src/modules/admin/infrastructure/repositories/empresa.repository.impl.ts` | `modulos` em findAll/findById + `updateModulos` |
| `src/modules/admin/presentation/controllers/empresa.controller.ts` | `updateModulos` (valida + 422/404) |
| `src/modules/admin/presentation/routes/empresa.routes.ts` | `PATCH /:id/modulos` |
| `src/modules/auth/presentation/controllers/auth.controller.ts` | `login`/`me` retornam `empresaNome` + `modulos` |

### Frontend
| Arquivo | Mudança |
|---------|---------|
| `shared/theme/themes.ts`, `ThemeProvider.tsx`, `index.css` | 5 temas + gradientes |
| `shared/modules/modules.ts` | Registro canônico de módulos (id/label/dependência) |
| `shared/auth/AuthContext.tsx`, `auth.service.ts` | `user.modulos` |
| `shared/auth/RequireModule.tsx` | Guarda de rota por módulo |
| `App.tsx` | Rotas flagáveis com `RequireModule` |
| `Navbar.tsx` | Seletor de temas + filtro de links por módulo |
| `OperacoesDashboard.tsx`, `IndicadoresCards.tsx` | Entradas por módulo (rota/pendentes/atendidos/gastos) |
| `CaixaPage.tsx` | Blocos de gastos condicionais |
| `ClienteDetail.tsx` | Card de contratos condicional |
| `SuperAdminPage.tsx`, `ModulosModal.tsx`, `EmpresaList.tsx` | Redesign + controle de módulos |
| `Button.tsx` | Primário com tokens + gradiente "brand" |
| i18n | `theme.*`, `modules.*`, `superAdmin.*` |

## Regras de negócio
| BR | Descrição |
|----|-----------|
| BR-092 | Super admin controla módulos por empresa (`PATCH /modulos`); dependências validadas; array vazio = só central; admin → 403 |
| BR-093 | Módulo off oculta superfícies (nav/rotas/entradas/dados); `central` sempre on; `modulos` via login/me; ausência = todos ativos |

## API
`PATCH /api/admin/empresas/:id/modulos` + `modulos` em login/me/empresas — ver `engineering/02-API.md` e `product/07-CASOS-DE-USO-API.md` (API-UC-043, CT-091..096).

## UCs de fluxo
`product/06-CASOS-DE-USO.md` UC-055..060 (combina módulos, superfícies ativas, tema, tenant subconjunto, dependência, sessão).

## Documentação atualizada (matriz SKILL-009)
- `02-API.md` (PATCH modulos, login/me) · `07` (API-UC-043 + CTs) · `06` (UC-055..060)
- `02-BUSINESS-RULES.md` BR-092/093 · `05-TOKEN`/`02-DESIGN-SYSTEM` (temas/gradiente)
- `05-MAPEAMENTO-TELAS.md` §13 + navbar (v1.18) · `api-collection.json` · `UPDATES.md`
- `BACKLOG.md` P024 (hardening backend) · roadmap (whitelabel futuro)

## Validação
- `npm run build` ✅ · Smoke estendido: **97/97** (inclui MOD-091..096) ✅ · auditoria limpa ✅

## Referências
- `engineering/design/04-UI-COMPONENTS.md`, `05-TOKEN.md`, `06-UI-PATTERNS.md`
- `product/02-BUSINESS-RULES.md` BR-092/093
- `plans/BACKLOG.md` P024
