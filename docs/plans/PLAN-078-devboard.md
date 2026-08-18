# PLAN-078 — Board Dev (visibilidade de git/CI)

**Status:** ✅ Implementado (17/08) — backend proxy + frontend + testes + docs

**Versão:** 1.0

**Início:** 17/08/2026

**Origem:** melhoria de visibilidade do processo de dev — o Rafael queria um **board visual via URL** (não TUI de terminal) mostrando o estado do git/CI do `nxgest` no GitHub, com a cara do NX Gest, e bem modularizado.

---

## Objetivo

Dar visibilidade de CI/CD + PRs + dependabot num **board web** dentro do próprio NX Gest, rota protegida `/devboard` (só admin/sócio), consumindo a **GitHub API** via proxy backend com token guardado no servidor — sem expor o token ao navegador.

---

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| D1 | Onde vive | Dentro do NX Gest, rota protegida `/devboard` (reuso do tema/layout) |
| D2 | Acesso | **Exclusivo do super_admin** — `SuperAdminRoute` (frontend) + `superAdminMiddleware` (backend); admin/sócio/operator **bloqueados** (403) |
| D3 | Token GitHub | `GITHUB_TOKEN` env var no servidor (fora do repo); proxy backend fala com a API |
| D4 | Escopo v1 | Runs de CI/CD + PRs abertos + dependabot |
| D5 | Arquitetura backend | Módulo `devboard` em Clean Architecture (novo gateway `infrastructure`) |
| D6 | Frontend | Módulo `devboard` reusando `apiRequest` + componentes canônicos (Card, StatusBadge, KpiCard, PageHeader) |
| D7 | Atualização | React Query com refetch a cada 60s (staleTime 30s) |
| D8 | Navegação | Sidebar desktop + aba na BottomTabBar (mobile), ícone `Activity`, só super_admin |

---

## Arquivos alterados

### Backend (novo módulo `src/modules/devboard/`)
| Arquivo | Finalidade |
|---|---|
| `domain/devboard.types.ts` | `RunInfo`, `PRInfo`, `DependabotPR` |
| `domain/errors/devboard.error.ts` | `GitHubApiError`, `GitHubTokenAusenteError`, `GitHubTimeoutError` |
| `application/ports/github-gateway.port.ts` | interface `IGithubGateway` |
| `application/use-cases/ListarRuns` / `ListarPRs` / `ListarDependabot` | use-cases |
| `infrastructure/gateways/github-gateway.impl.ts` | fetch na GitHub API com `GITHUB_TOKEN` |
| `presentation/controllers/devboard.controller.ts` | handlers + erro → HTTP |
| `presentation/routes/devboard.routes.ts` | rotas |
| `src/main.ts` | registro `/api/devboard` com `authMiddleware` + `adminMiddleware` |

### Backend (testes)
| Arquivo | Finalidade |
|---|---|
| `.../ListarRunsUseCase.test.ts` | limite/default/clamp + repasse |
| `.../ListarPRsUseCase.test.ts` | ListarPRs + ListarDependabot |
| `.../github-gateway.impl.test.ts` | token, mapeamento, isDependabot, não-200, timeout |
| `src/shared/middleware/super-admin.middleware.test.ts` | exclusividade: super_admin → next; admin/sócio/operator → 403 |

### Frontend (novo módulo `frontend/src/modules/devboard/`)
| Arquivo | Finalidade |
|---|---|
| `services/devboard.service.ts` | tipos + `listRuns/listPRs/listDependabot` via `apiRequest` |
| `hooks/useDevBoard.ts` | React Query por recurso |
| `components/RunsList.tsx` | lista de runs com StatusBadge + duração + há-quanto |
| `components/PRsList.tsx` | PRs abertos + badge de rascunho |
| `components/DependabotList.tsx` | PRs do dependabot |
| `pages/DevBoardPage.tsx` | monta KPIs + 3 blocos |
| `frontend/src/App.tsx` | rota `/devboard` (lazy, `SuperAdminRoute`) |
| `shared/layout/AppLayout.tsx` | link "Board Dev" na sidebar (super_admin) |
| `shared/layout/BottomTabBar.tsx` | aba "Board" na tab bar mobile (super_admin) |
| `i18n/locales/{pt-BR,en,es}.json` | chaves `devboard.*` |

### Docs / config
| Arquivo | Mudança |
|---|---|
| `.env.example` | `GITHUB_TOKEN=` placeholder |
| `docs/engineering/02-API.md` | endpoints `/api/devboard/*` |
| `docs/qa/devboard/CTs.md` | sessão de casos de teste manuais |

---

## API

| Rota | Método | Proteção | Retorna |
|---|---|---|---|
| `/api/devboard/runs?limit=10` | GET | auth + **super_admin** | `{ runs: RunInfo[] }` |
| `/api/devboard/prs` | GET | auth + **super_admin** | `{ prs: PRInfo[] }` |
| `/api/devboard/dependabot` | GET | auth + **super_admin** | `{ dependabot: DependabotPR[] }` |

Erros: `503 GITHUB_TOKEN_AUSENTE`, `504 GITHUB_TIMEOUT`, `502 GITHUB_API_ERROR`, `403 FORBIDDEN` (não-super).

---

## Segurança

- `GITHUB_TOKEN` só no `.env` do servidor (VPS `/opt/nxgestao/.env`, chmod 600) — nunca no repo.
- O navegador nunca recebe o token; o proxy backend é o único cliente da GitHub API.
- Rotas atrás de `authMiddleware` + `superAdminMiddleware` — **exclusividade do super_admin** (admin/sócio/operator → 403).

---

## Validação

- Backend: `npx tsc --noEmit` + 16 testes vitest verdes (use-cases, gateway, `superAdminMiddleware`).
- Frontend: `npx tsc --noEmit` + 10 testes vitest verdes.
- Gates: `audit:ui`, `audit:styles`, `audit:modules`, `docs:audit`, `npm test`.
