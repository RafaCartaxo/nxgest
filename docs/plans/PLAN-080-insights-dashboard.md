# PLAN-080 — Insights Dashboard (whitelabel `insights` + Recharts)

**Status:** 📝 Planejado (não implementado)

**Versão:** 1.0

**Início:** 18/08/2026

**Origem:** dar visibilidade ao que o NX Gest faz — gráficos de indicadores operacionais/financeiros no app. Hoje o sistema só tem tiles numéricos (`KpiCard`), sem nenhuma biblioteca de gráficos. Requisito central: **reaproveitável e ativável/desativável a qualquer momento sem consequências**, via o mecanismo de whitelabel já existente.

> **⚠️ Dependência:** este plano depende do **PLAN-081** (navegação escalável). Sem a tab bar com cap 5 + aba "Mais" e a sidebar colapsável, o 6º item (`insights`) estoura a navegação mobile. Implementar o PLAN-081 antes.

---

## Objetivo

Introduzir um **módulo whitelabel `insights`** (leitura pura) com gráficos dos indicadores do NX Gest, usando **Recharts**, compondo com qualquer combinação de negócio e com **toggle on/off sem efeitos colaterais** — seguindo o padrão consolidado de módulos (PLAN-031/036/037/045).

---

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| D1 | Modelo do módulo | **Novo módulo whitelabel `insights`** (um interruptor só, read-only) — não distribuir gráficos nos módulos atuais |
| D2 | Biblioteca de gráficos | **Recharts** (declarativo React, SVG leve, compõe no DS; alternativa pesada/verbosa não compensa) |
| D3 | Faseamento | **Fase 1 = operador** (tendência + performance); Fase 2 = admin/sócio (fluxo, carteira, ranking); Fase 3 = página pública + relatórios (futuro) |
| D4 | Segurança do toggle | Módulo **read-only** → off = `403 MODULE_DISABLED` + UI oculta; sem guard BR-105 (não há dado em aberto a proteger), sem escrita, sem estado órfão |
| D5 | Arquitetura backend | Novo módulo `src/modules/insights/` em Clean Architecture, agregando em SQL (`GROUP BY`/`date_trunc`, sem N+1 — PLAN-077) |
| D6 | Isolamento | `resolveScope`/`resolveUsuarioAlvo` (operador = próprio; admin/sócio = subárvore), como nos módulos atuais |
| D7 | Frontend | `ChartCard` canônico (`shared/components/ChartCard/`) + **página própria `/insights`** (operador) — não seção no Central (G11) |
| D8 | Qualidade | CTs em todos os níveis + gates (`npm test`, `audit:ui/styles/modules/docs`, smoke) |
| D9 | Widget dono | **`insights.widgets: []`** — página própria, sem widget órfão; gating via módulo (`RequireModule` + `hasModule` + `requireModule`), **não** por widget (R1) |
| D10 | Dependência mínima por fase | **Fase 1 → `dependsOn: ["contratos"]`** (só lê pagamentos/parcelas); expandir p/ `["contratos","caixa","gastos"]` na Fase 2 (G2) |
| D11 | Dependência | Instalar `recharts` no `frontend/package.json` (G13) |

---

## Mapeamento insight → gráfico

| Insight | Tipo de gráfico | Origem dos dados |
|---|---|---|
| Tendência de recebimentos | Área/linha (recebido × a receber) | `Pagamento.data/valor` + `Parcela` |
| Performance de cobrança (meta × real) | Barra agrupada por período | Recebido vs previsto (`Parcela`) |
| Fluxo de caixa e gastos | Donut por categoria + barra entradas × saídas | `Gasto.data/valor/categoria` + `Movimentação` |
| Envelhecimento da carteira | Barra empilhada (atrasadas/a vencer/pagas) | `Parcela.status` + vencimento |
| Ranking de operadores | Barra horizontal | Agregado por operador (`GET /api/admin/equipe` / `dashboard`) |

---

## Whitelabel — registrar o módulo `insights`

### Backend `src/modules/admin/domain/modules.ts`
```
insights: {
  labelKey: "modules.insights",
  surfaces: ["/insights"],
  dados: ["/api/insights"],
  widgets: [],                       // R1: página própria — sem widget órfão (gating por módulo)
  capacidades: [],
  dependsOn: ["contratos"],          // Fase 1 (G2); expandir p/ ["contratos","caixa","gastos"] na Fase 2
  ucs: ["UC-0XX (novos)", "API-UC-0XX (novos)"],
}
```

> **W1 (crítico):** adicionar `"insights"` à **union `ModuleId`** (`modules.ts:3`) — pré-requisito nº 1 do whitelabel. Sem isso, `requireModule("insights")`, `validateModulos` e o manifest não reconhecem o módulo.
>
> **W3 (default do toggle):** `DEFAULT_MODULOS = [...ALL_MODULES]` → `insights` nasce **on** para novas empresas (via `empresa.repository.impl.ts:109`); desligável **sem bloqueio** (read-only, como `clientes`/`rota`/`gastos`).
>
> **W2 (cascata BR-105):** `insights.dependsOn=["contratos"]` → na `cascataDesativacao` (`impacto-desativacao.query.impl.ts`), desligar `contratos` **desliga `insights` na cascata**; read-only → **sem query de bloqueio própria**.

> **Nota (G4):** o campo `dados` do manifest é **documentação** — o `audit:modules` não o valida. O **enforcement real** vem do `requireModule("insights")` no mount de `src/main.ts` (como `/api/clientes`, `/api/caixa`).

### Frontend `frontend/src/shared/modules/modules.ts`
- Entry em `MODULES`: `{ id: "insights", labelKey, descricaoKey, dependsOn: ["contratos"], icon }` (Fase 1).
- **R1:** `MODULE_WIDGETS.insights = []` — sem widget.
- i18n em `pt-BR.json` / `en.json` / `es.json`: `modules.insights` + `modules.insights.descricao` + `insights.*` (G5).
- Navegação: entry na sidebar (`AppLayout.tsx` via `hasModule`) + rota `/insights` em `RequireModule mod="insights"` no `App.tsx`.

### Contrato "off sem consequências" (cenários a validar)
- Off → `GET /api/insights/*` → `403 MODULE_DISABLED`, **sem vazar dado**.
- Off → nav e rota `/insights` somem; **nada quebra** nos demais módulos.
- On de novo → volta a funcionar; **idempotente**, sem estado residual.
- Dependência ausente (ex.: `insights` sem `caixa`) → `validateModulos` (backend) / `completarDependencias` (frontend) como nos módulos atuais.

`npm run audit:modules` deve ficar limpo (espelho backend⇄frontend obrigatório).

---

## Backend — `src/modules/insights/` (read-only)

| Rota | Método | Proteção | Retorna |
|---|---|---|---|
| `/api/insights/recebimentos?periodo=dia\|semana\|mes` | GET | auth + `requireModule("insights")` | tendência recebido × a receber |
| `/api/insights/performance?periodo=` | GET | auth + `requireModule("insights")` | meta × real por período |
| `/api/insights/fluxo?periodo=` | GET | auth + `requireModule("insights")` | entradas × saídas + gastos por categoria |
| `/api/insights/carteira` | GET | auth + `requireModule("insights")` | envelhecimento (atrasadas/a vencer/pagas) |
| `/api/admin/insights/ranking-operadores` | GET | auth + `adminMiddleware` + `requireModule("insights")` **por rota** | ranking por operador |

Estrutura (Clean Architecture): `domain/` (tipos + erros), `application/ports/insights.repository.ts`, `application/use-cases/*`, `infrastructure/repositories/insights.repository.impl.ts` (agregação SQL), `presentation/controllers` + `routes`. Registro em `src/main.ts`:
- `/api/insights` → `app.use("/api/insights", authMiddleware, userRateLimit, requireModule("insights"), insightsRoutes)` (padrão `main.ts:71`).
- `/api/admin/insights/ranking-operadores` → o `requireModule("insights")` vai **por rota** dentro de `admin.routes.ts` (padrão `operacoes.routes.ts:26-27`), pois o mount `/api/admin` não tem `requireModule` (G3).

**Isolamento:** todo use-case recebe o escopo (`resolveScope`); operador agrega só os próprios dados; admin/sócio a subárvore; super_admin com/sem `empresaId=` seguindo a regra atual.

---

## Frontend

| Arquivo | Finalidade |
|---|---|
| `frontend/package.json` | **adicionar `recharts`** (G13) |
| `frontend/src/modules/insights/services/insights.service.ts` | tipos + chamadas `apiRequest` |
| `frontend/src/modules/insights/hooks/useInsights.ts` | React Query por recurso |
| `frontend/src/modules/insights/components/*.tsx` | gráficos (Tendencia, Performance, Fluxo, Carteira, Ranking) |
| `frontend/src/modules/insights/pages/InsightsPage.tsx` | **página própria** `/insights` (G11) — monta os blocos |
| `frontend/src/shared/components/ChartCard/ChartCard.tsx` | **componente canônico**: Card + título + tooltip `formatCurrency`, só tokens |
| `frontend/src/shared/utils/chartColors.ts` | **helper `resolveChartColor` via `getComputedStyle`** p/ cores de série do tema (P11) |
| `frontend/src/test/setup.ts` | **mock `ResizeObserver`** (P6/P1) — único, compartilhado com PLAN-082 |
| `frontend/src/App.tsx` | rota `/insights` (lazy, `RequireModule`) |
| `frontend/src/shared/layout/AppLayout.tsx` | link na sidebar (`hasModule`) — via registro `nav.ts` (PLAN-081) |
| `frontend/src/i18n/locales/{pt-BR,en,es}.json` | chaves `insights.*` + `modules.insights*` (G5) |
| `docs/engineering/02-API.md` + `docs/api-collection.json` | **cada rota nova** documentada + `npm run docs:collection` (G12) |

`ChartCard` usa apenas tokens (sem cor fixa → `audit:styles` limpo). Atualizar `UI-COVERAGE.md`.

**Acesso por papel (R2):** a página `/insights` é gated por `RequireModule mod="insights"` + nav `hasModule`. Escopo por papel:
- **Fase 1** — operador (e admin/sócio, que agregam a subárvore).
- **Fase 2** — admin/sócio (fluxo, carteira, ranking).
- **super_admin** — vê `/insights` com visão global (sem whitelabel, como o Central); se precisar de `?empresaId=`, segue a regra do `requireModule`/`resolveEmpresaId`.

**Fase 1:** página `/insights` (operador) com Tendência + Performance — gated por módulo (`RequireModule`/`hasModule`), **não** por widget (R1).
**Fase 2:** adiciona Fluxo/Carteira + Ranking (admin/sócio) — expande `dependsOn` p/ `["contratos","caixa","gastos"]`.
**Fase 3 (futuro):** página pública de divulgação com gráficos ilustrativos + relatórios exportáveis.

---

## QA / CTs (anti-falhas)

| Camada | Entrega |
|---|---|
| Unit use-case | um teste por endpoint de agregação (mocks de Ports, `vi.fn`) |
| Unit front | `modules.test.ts` (novo id `insights` + dependências) + formatação |
| Component/UI | `ChartCard` (jsdom, docblock G15) + `InsightsPage` renderiza/oculta por módulo |
| Smoke API | novos cenários em `07-CASOS-DE-USO-API.md` + `smoke-api.mjs` (250 → ~260) |
| UCs | novos UCs em `06-CASOS-DE-USO.md` + linha na matriz `08-UC-MODULOS.md` |
| Gates | `npm test` + `audit:ui` + `audit:styles` + `audit:modules` + `audit:docs` + smoke limpos; **PR passa no CI (test+smoke) antes do merge (P9)** |

**Notas de infra de teste (G14/G15):**
- `ResponsiveContainer` do Recharts depende de `ResizeObserver`, ausente no jsdom → **mock `global.ResizeObserver` no `frontend/src/test/setup.ts`** (P6 — local único, compartilhado com PLAN-082), não "no teste".
- Testes de componente exigem o docblock `// @vitest-environment jsdom` (default do vitest é `node`).

**Cores de série (P11):** o Recharts precisa de cor concreta no `stroke`/`fill` (não aceita `var(--color-*)` no path SVG). Usar `resolveChartColor("--color-primary")` via `getComputedStyle` — cor do tema (dark/paletas/whitelabel) sem cor fixa (audit:styles limpo).

**CTs críticos de toggle (cruzar no smoke):**
- On → `200` com shape e coerência.
- Off → `403 MODULE_DISABLED`, sem vazar dado.
- Isolamento: operador vê só o próprio; admin/sócio a subárvore.
- Super_admin com e sem `?empresaId=`.
- Dependência ausente → 4xx/validação coerente.
- Re-toggle idempotente (on→off→on).
- Coerência: `Σ ranking-operadores = totais` (padrão API-CT-088).
- **W1:** `insights` reconhecido pelo `ModuleId`/`validateModulos` (não "módulo inválido").
- **W2:** desligar `contratos` → `insights` entra na cascata (desligado junto).
- **W3:** nova empresa nasce com `insights` on por default; desligar sem `force` → `200` (read-only, sem bloqueio).
- **R2:** `/insights` acessível por papel conforme a fase (operador/admin/sócio); super_admin com visão global.

---

## Segurança

- Rotas atrás de `authMiddleware` + `requireModule("insights")` — dados jamais vazam quando o módulo está off.
- Módulo **read-only**: nenhuma rota de escrita; sem exposição de dados fora do escopo do usuário.

---

## Validação (critérios de aceite)

- `npm run audit:modules` limpo (novo módulo espelhado).
- `npm test` verde (unit use-cases + unit front + component, com mock `ResizeObserver` no `setup.ts`).
- `npm run smoke:api` — novos cenários passando (250 → ~260).
- `npm run audit:ui` + `npm run audit:styles` + `npm run docs:audit` limpos (cada rota nova em `02-API.md` + collection).
- `UI-COVERAGE.md` e `08-UC-MODULOS.md` atualizados.
- Toggle `insights` off: nav/rota somem, API 403, demais módulos intactos; on: volta a funcionar.
- `insights` nasce on por default; desligável sem bloqueio (W3); cascata com `contratos` (W2).
- Fase 1 entregue (operador): página `/insights` com tendência + performance.
- Cores dos gráficos seguem o tema (via `resolveChartColor`), sem cor fixa.
- PR passa no CI (test + smoke) antes do merge.

---

## Referências

- PLAN-031 (whitelabel v1) · PLAN-036 (enforcement 403) · PLAN-037 (coerência) · PLAN-045 (Module Manifest + `audit:modules`) · PLAN-044 (UI governance) · PLAN-077 (performance) · **PLAN-081 (navegação escalável — dependência)**
- `docs/product/08-UC-MODULOS.md` · `07-CASOS-DE-USO-API.md` · `06-CASOS-DE-USO.md` · `docs/engineering/design/UI-COVERAGE.md`
- `src/modules/admin/domain/modules.ts` · `frontend/src/shared/modules/modules.ts`
