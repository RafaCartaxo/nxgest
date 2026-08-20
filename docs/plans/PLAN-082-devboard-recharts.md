# PLAN-082 — Board DEV: visualização com Recharts

**Status:** 📝 Planejado (não implementado)

**Versão:** 1.0

**Início:** 18/08/2026

**Origem:** melhorar a visualização de dados do Board DEV (`/devboard`, PLAN-078). Hoje a página é só KPIs numéricos + listas flat, sem nenhum gráfico/trend nem agrupamento por workflow. Direção validada: seguir com **Recharts** (mesma base do PLAN-080), usando como referência os padrões consagrados de dashboards de CI/CD (GitHub Actions, ferramentas de QA/reports).

> **⚠️ Dependência:** reusa o `ChartCard` canônico (`shared/components/ChartCard/`) criado no **PLAN-080**. Os módulos em si são independentes (o board é super_admin-only, sem whitelabel), mas o `ChartCard` é a única peça compartilhada — implementar o PLAN-080 antes (ou em paralelo, garantindo o `ChartCard`).

---

## Objetivo

Transformar o Board DEV de uma página de listas em um **dashboard de pipeline** com: visão geral (health) em um olhar, gráficos de tendência (pass rate, duração), falhas por workflow e runs agrupados por workflow — reutilizando o `ChartCard` e o gateway GitHub existentes.

---

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| D1 | Escopo | **Polimento visual + estrutura/hierarquia + gráficos** (sem novas ações/links por ora) |
| D2 | Biblioteca | **Recharts** (mesma do PLAN-080) — reusa `ChartCard` canônico |
| D3 | Base dos gráficos | **Mais runs agregados no backend** (ex.: `limit=100`), agregando no servidor — **sem endpoint GitHub novo** |
| D4 | Domínio | Módulo `devboard` **independente** do `insights` (PLAN-080): super_admin-only, fonte = GitHub API via gateway; não usa whitelabel |
| D5 | Arquitetura | Novo use-case `ResumirRuns` no módulo `devboard` (agregação); contrato `/api/devboard/runs` preservado + novo `/api/devboard/resumo` |
| D6 | Frontend | `ChartCard` compartilhado + agrupamento por workflow na lista de runs |

---

## Elementos visuais (escolhidos)

| Elemento | Tipo | Origem |
|---|---|---|
| Health / visão geral | Cards de destaque (pipeline status, pass rate %, duração média, último resultado) | agregado de runs |
| Pass rate trend | Barra/área por dia (verdes × total) | agregado de runs |
| Duração trend | Linha/área (média por dia) | agregado de runs |
| Falhas por workflow | Barra horizontal | agregado de runs |
| Runs agrupados por workflow | Lista com headers de seção (CI/CD) | runs |

---

## Backend — agregação (`src/modules/devboard/`)

Reusa o `GithubGateway.listRuns(limit)` existente (já suporta limit maior). Novo use-case:

- `application/use-cases/ResumirRuns/ResumirRunsUseCase.ts` — busca `limit=100`, agrega:
  ```
  { total, verdes, falhas, passRate, duracaoMediaSec, porDia: [{ dia, total, verdes, falhas }], porWorkflow: [{ workflow, total, falhas }] }
  ```
- `domain/devboard.types.ts` — tipos do resumo.
- `presentation/controllers/devboard.controller.ts` + `routes/devboard.routes.ts` — nova rota `GET /api/devboard/resumo`.

**Rotas:**
| Rota | Método | Proteção | Retorna |
|---|---|---|---|
| `/api/devboard/runs?limit=` | GET | auth + super_admin | lista de runs (contrato atual preservado) |
| `/api/devboard/resumo` | GET | auth + super_admin | agregado p/ health + gráficos |
| `/api/devboard/prs` | GET | auth + super_admin | PRs (inalterado) |
| `/api/devboard/dependabot` | GET | auth + super_admin | dependabot (inalterado) |

Sem novo endpoint GitHub — só agregação sobre o que já vem da API. Segue Clean Architecture + testes de use-case (mocks de port, `vi.fn`).

> **R6 (evitar duplicação de fetch / rate-limit):** hoje a página chama `useRuns(10)` para a lista. O resumo busca mais runs (ex.: 100). Decisão: o **`ResumirRuns`** usa `limit` próprio e é a **única fonte dos gráficos**; a **lista de runs** continua com `listRuns(10)` (uma chamada cada). Alternativa mais eficiente (opcional): derivar a lista dos runs do resumo quando o volume permitir — mas manter 2 chamadas é aceitável e evita acoplar. Adicionar CT que **não faz N chamadas redundantes por load** (monitora o nº de requests à GitHub API).

---

## Frontend (`frontend/src/modules/devboard/`)

Seguindo `06-UI-PATTERNS` (App Bar → Resumo → Conteúdo):

| Arquivo | Finalidade |
|---|---|
| `pages/DevBoardPage.tsx` | reorganiza: health (resumo) → gráficos → listas agrupadas |
| `components/HealthCards.tsx` | cards de health (pipeline status, pass rate, duração média, último) — usa `KpiCard`/`Card` |
| `components/PassRateTrend.tsx` | gráfico pass rate por dia — `ChartCard` + Recharts |
| `components/DurationTrend.tsx` | gráfico duração média por dia — `ChartCard` + Recharts |
| `components/FalhasPorWorkflow.tsx` | gráfico falhas por workflow — `ChartCard` + Recharts |
| `components/RunsList.tsx` | **agrupar por workflow** com headers de seção |
| `services/devboard.service.ts` | tipos + `getResumo` via `apiRequest` |
| `hooks/useDevBoard.ts` | `useResumo` (React Query, refetch 60s) |
| `frontend/src/test/setup.ts` | **mock `ResizeObserver`** (P1) — único, compartilhado com PLAN-080 |
| `frontend/src/shared/utils/chartColors.ts` | **helper que resolve tokens via `getComputedStyle`** p/ cores de série (P11) |

Reusa `ChartCard` do PLAN-080 (Card + título + tooltip `formatCurrency`/formato, só tokens → `audit:styles` limpo).

**Notas de implementação:**
- **P10 (coerência de limite):** `ListarRunsUseCase` clampa o limite a **50** (`Math.min(Math.max(base,1),50)`). O `ResumirRuns` terá **limite próprio** (não reusa o clamp do `ListarRuns`) para buscar a base dos gráficos — decisão explícita, sem passar pelo clamp de 50.
- **P11 (cores de série):** Recharts precisa de **cor concreta** no `stroke`/`fill` (não aceita `var(--color-*)` direto no path SVG). Criar `resolveChartColor("--color-primary")` usando `getComputedStyle(document.documentElement).getPropertyValue(...)` — garante cor do tema (dark/paletas/whitelabel) sem cor fixa (audit:styles limpo). Compartilhado com o `ChartCard` do PLAN-080.

---

## QA / CTs

| Camada | Entrega |
|---|---|
| Unit use-case | `ResumirRunsUseCase.test.ts` — agregação (divisão por zero → passRate 0, sem runs → vazio, coerência Σ verdes+falhas, porDia/porWorkflow) + limite próprio do resumo (P10) |
| Unit front | formatação/agrupamento por workflow + `resolveChartColor` (P11) |
| Component/UI | gráficos (jsdom + **mock `ResizeObserver`** no `setup.ts`, P1) + `RunsList` agrupado — **docblock `// @vitest-environment jsdom`** (G15); interação com **`@testing-library/user-event`** (P2: hover de tooltip/expansão) |
| Smoke API | `/api/devboard/resumo` on=200 shape coerente; off/não-super=403 |
| Eficiência (R6) | CT de que o load não dispara N chamadas redundantes à GitHub API (runs + resumo = 2, sem excesso) |
| Gates | `npm test` + `audit:ui` + `audit:styles` + `audit:modules` + `audit:docs` + smoke limpos; **PR passa no CI (test+smoke) antes do merge (P9)** |
| Docs | rota nova `/api/devboard/resumo` em `02-API.md` + `npm run docs:collection` (G12/P5) |
| CTs | enumerar CTs manuais novos em `docs/qa/devboard/CTs.md`: health em um olhar; cada gráfico (pass rate, duração, falhas por workflow); agrupamento por workflow; estados vazios; **erro do GitHub (429/504/503) nos gráficos mostra estado elegante, não quebra a página (P4)**; interação de hover |

---

## Critérios de aceite

- `npm run audit:ui` / `audit:styles` / `audit:modules` / `audit:docs` + `npm test` limpos.
- `02-API.md` + `api-collection.json` com a rota `/api/devboard/resumo`.
- Board DEV mostra: health em um olhar + pass rate trend + duração trend + falhas por workflow + runs agrupados.
- Gráficos renderizam sem erro em jsdom (mock ResizeObserver no `setup.ts`) e com estados vazios elegantes.
- Erro do GitHub (429/504/503) nos gráficos → estado de erro elegante, página não quebra.
- Cores dos gráficos seguem o tema (via `resolveChartColor`), sem cor fixa.
- Load não dispara chamadas redundantes à GitHub API (R6).
- Acesso continua exclusivo do super_admin (403 para admin/sócio/operator).
- PR passa no CI (test + smoke) antes do merge.

---

## Referências

- PLAN-078 (Board Dev original) · PLAN-080 (insights + `ChartCard` — dependência) · PLAN-081 (navegação) · PLAN-044 (UI governance) · PLAN-077 (performance)
- `frontend/src/modules/devboard/*` · `src/modules/devboard/*` · `docs/qa/devboard/CTs.md`
- `docs/engineering/design/06-UI-PATTERNS.md` · `01-UX.md` · `UI-COVERAGE.md`
