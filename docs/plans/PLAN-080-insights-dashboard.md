# PLAN-080 — Insights Dashboard (whitelabel `insights` + Recharts)

**Status:** 📝 Planejado (não implementado) · **Fase 0.5 (correção de direção) aplicada em 28/08**

**Versão:** 1.1

**Início:** 18/08/2026

**Origem:** dar visibilidade ao que o NX Gest faz — gráficos de indicadores operacionais/financeiros no app. Hoje o sistema só tem tiles numéricos (`KpiCard`), sem nenhuma biblioteca de gráficos. Requisito central: **reaproveitável e ativável/desativável a qualquer momento sem consequências**, via o mecanismo de whitelabel já existente.

---

## ⚠️ Revisão 28/08 — Fase 0.5 (correções de direção, doc-only)

> Direção corrigida antes da implementação (fonte: nota de revisão do vault `brainwork`). As seções abaixo já refletem as correções; onde houver resíduo da versão 1.0, vale **este bloco**.

| # | Mudança | Decisão |
|---|---|---|
| D1, D9 | **Manter** | módulo único read-only, página própria, `widgets: []` |
| D10 | **Reescrever** | `dependsOn: []` **permanente** + degradação graciosa por gráfico (`hasModule` do dono) + empty-states. **Nunca expandir** para `caixa`/`gastos` |
| D12 (novo) | Classe de dado | 4 classes por gráfico (ver abaixo); **veto a `snapshots_atraso`** (classe 4) |
| D13 (novo) | Endpoint | **um agregado único** por fase — `/api/insights/resumo?periodo=` (padrão PLAN-083), não 5 rotas |
| D14 (novo) | Cores | Regra de hex no `audit:styles` para `modules/insights/**` + `ChartCard/**` + sonda no `chartColors.ts` |
| Fase 1 | Conteúdo | **Só classes 1 e 2**; sai tendência de atraso; "meta × real" vira **"previsto × recebido"**; **sem item de nav** (rota alcançável por URL) |
| Fase 2 | Conteúdo | "Ranking" vira **"contribuição"** (composição do total, sem placar) |
| PLAN-081 | Desacoplar | vira pré-requisito só de **descoberta** (item de nav), não de **entrega** |

### Classes de dado por gráfico (D12) — a espinha da correção

| Classe | Fontes | Uso permitido |
|---|---|---|
| **1. Evento** (append-only, retroativo) | `pagamentos`, `pagamento_parcelas`, `movimentacoes_financeiras`, `gastos`, `historico_operacional` | **série temporal** |
| **2. Cronograma imutável** | `parcelas.valor_previsto`, `parcelas.data_vencimento` (zero `UPDATE` no backend) | **série temporal** |
| **3. Estado mutável** | `saldo_pendente`, `estado`, `data_quitacao`, `caixa_config` | **snapshot do presente** — nunca série |
| **4. Snapshot amostrado** | `snapshots_atraso` (escrito sob demanda, sem scheduler) | **nenhum gráfico** — veto (ver `docs/UPDATES.md` §"Removido") |

> **Armadilha:** valor atrasado/recebido em D reconstrói-se do event log — `Σ parcelas.valor_previsto (data_vencimento ≤ D) − Σ pagamento_parcelas.valor JOIN pagamentos WHERE pagamentos.data ≤ D`, tratando `estornado_em` como evento datado e respeitando `deleted_at`. **Nunca** usar `saldo_pendente` para série.

### Vetos (valem em toda a execução)

- [ ] Nenhum gráfico tem `snapshots_atraso` como fonte (classe 4)
- [ ] Nenhum gráfico de **série** usa fonte classe 3 (`saldo_pendente`, `estado`, `data_quitacao`, `caixa_config`)
- [ ] `insights.dependsOn` continua `[]` — **não** foi expandido para `caixa`/`gastos`
- [ ] Nenhum literal `#rrggbb` / `rgb(` / `hsl(` em arquivo de gráfico
- [ ] `/api/operacoes/historico-atrasos` **não** é consumido pelo insights
- [ ] Nenhuma propriedade nova inserida **antes** de `dependsOn` nas entradas de `MODULES` (regex do `audit-modules.mjs`)

---

## Objetivo

Introduzir um **módulo whitelabel `insights`** (leitura pura) com gráficos dos indicadores do NX Gest, usando **Recharts**, compondo com qualquer combinação de negócio e com **toggle on/off sem efeitos colaterais** — seguindo o padrão consolidado de módulos (PLAN-031/036/037/045).

---

## Estrutura de fases (revisada 28/08)

| Fase | Conteúdo | Nav |
|---|---|---|
| **0** | base sem módulo e sem nav (recharts, `ChartCard`, `chartColors` com sonda, mock `ResizeObserver`, regra de hex) — desbloqueia o PLAN-082 em paralelo | — |
| **0.5** | decisões irreversíveis (este bloco) — doc-only | — |
| **1** | backend + página, **só classes 1 e 2**; rota `/insights` por URL **sem item de nav** | — |
| **1.5** | navegação (depois do PLAN-081): item `insights` entra no **"Mais"** via `hasModule` | aba "Mais" |
| **2** | classe 3 (snapshot), gastos por categoria, **contribuição** por operador; `dependsOn` continua `[]` | — |

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
| D10 | Dependência mínima por fase | **`dependsOn: []` permanente** (revisão 28/08) — granularidade por gráfico via `hasModule` do dono; expandir para `caixa`/`gastos` é **proibido** (quebraria tenants com `gastos` off) |
| D11 | Dependência | Instalar `recharts` no `frontend/package.json` (G13) |
| D12 | Classe de dado por gráfico | 4 classes (evento/cronograma/estado/snapshot) + veto a `snapshots_atraso` (ver bloco de revisão) |
| D13 | Endpoint | **um agregado único por fase** `/api/insights/resumo?periodo=` — padrão PLAN-083, sem 5 rotas |
| D14 | Cores | Regra de hex no `audit:styles` para `modules/insights/**` + `ChartCard/**`; `chartColors.ts` com técnica de sonda |

---

## Mapeamento insight → gráfico

| Insight | Tipo de gráfico | Origem dos dados | Classe |
|---|---|---|---|
| Tendência de recebimentos | Área/linha | `pagamentos` / `movimentacoes_financeiras` (event log) | 1 |
| Performance (previsto × recebido) | Barra agrupada por período | Previsto = `parcelas.valor_previsto` por `data_vencimento` (classe 2) · recebido = reconstruído do event log | 1+2 |
| Fluxo de caixa e gastos | Donut por categoria + barra entradas × saídas | `gastos.categoria` + `movimentacoes_financeiras` | 1 |
| Envelhecimento da carteira | Barra empilhada (atrasadas/a vencer/pagas) | **Snapshot do presente** — estado derivado | 3 (nunca série) |
| Contribuição de operadores | Barra horizontal (composição do total, sem placar) | Agregado por operador | 1 |

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
  dependsOn: [],                     // D10 revisado (28/08): permanente — nunca expandir p/ caixa/gastos
  ucs: ["UC-0XX (novos)", "API-UC-0XX (novos)"],
}
```

> **W1 (crítico):** adicionar `"insights"` à **union `ModuleId`** (`modules.ts:3`) — pré-requisito nº 1 do whitelabel. Sem isso, `requireModule("insights")`, `validateModulos` e o manifest não reconhecem o módulo.
>
> **W3 (default do toggle):** `DEFAULT_MODULOS = [...ALL_MODULES]` → `insights` nasce **on** para novas empresas (via `empresa.repository.impl.ts:109`); desligável **sem bloqueio** (read-only, como `clientes`/`rota`/`gastos`).
>
> **W2 (cascata BR-105):** com `dependsOn: []` (D10 revisado), **não há cascata** — desligar `contratos` não afeta `insights`; a granularidade é por gráfico (`hasModule` do dono), cada bloco com empty-state próprio.

> **Nota (G4):** o campo `dados` do manifest é **documentação** — o `audit:modules` não o valida. O **enforcement real** vem do `requireModule("insights")` no mount de `src/main.ts` (como `/api/clientes`, `/api/caixa`).

### Frontend `frontend/src/shared/modules/modules.ts`
- Entry em `MODULES`: `{ id: "insights", labelKey, descricaoKey, dependsOn: [], icon }` (D10 revisado).
- **R1:** `MODULE_WIDGETS.insights = []` — sem widget.
- i18n em `pt-BR.json` / `en.json` / `es.json`: `modules.insights` + `modules.insights.descricao` + `insights.*` (G5).
- Navegação: **Fase 1 sem item de nav** (rota por URL, `RequireModule mod="insights"` no `App.tsx`); item entra só na **Fase 1.5** (após PLAN-081), na aba **"Mais"**.

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
| `/api/insights/resumo?periodo=dia\|semana\|mes` | GET | auth + `requireModule("insights")` | **agregado único** (D13): tendência, previsto × recebido, fluxo, carteira, contribuição — `date_trunc` + `GROUP BY` no padrão PLAN-083 |

> **D13 (revisão 28/08):** um endpoint agregado por fase, em vez de 5 rotas — evita saturar o pool PG (`max: 10`; PLAN-077 registra ~13 queries ao montar Dashboard+Caixa). Granularidade por gráfico com `staleTime` longo e **sem `refetchOnWindowFocus`**.

Estrutura (Clean Architecture): `domain/` (tipos + erros), `application/ports/insights.repository.ts`, `application/use-cases/*`, `infrastructure/repositories/insights.repository.impl.ts` (agregação SQL), `presentation/controllers` + `routes`. Registro em `src/main.ts`:
- `/api/insights` → `app.use("/api/insights", authMiddleware, userRateLimit, requireModule("insights"), insightsRoutes)` (padrão `main.ts:71`).

**Isolamento:** todo use-case recebe o escopo (`resolveScope`); operador agrega só os próprios dados; admin/sócio a subárvore; super_admin com/sem `empresaId=` seguindo a regra atual.

---

## Frontend

| Arquivo | Finalidade |
|---|---|
| `frontend/package.json` | **adicionar `recharts`** (G13) |
| `frontend/src/modules/insights/services/insights.service.ts` | tipos + chamadas `apiRequest` |
| `frontend/src/modules/insights/hooks/useInsights.ts` | React Query por recurso |
| `frontend/src/modules/insights/components/*.tsx` | gráficos (Tendencia, PrevistoRecebido, Fluxo, Carteira, Contribuicao) |
| `frontend/src/modules/insights/pages/InsightsPage.tsx` | **página própria** `/insights` (G11) — monta os blocos, com **empty-state da página** (tenant sem `contratos`) |
| `frontend/src/shared/components/ChartCard/ChartCard.tsx` | **componente canônico**: Card + título + tooltip `formatCurrency`, só tokens |
| `frontend/src/shared/utils/chartColors.ts` | **helper `resolveChartColor` via `getComputedStyle`** p/ cores de série do tema (P11) |
| `frontend/src/test/setup.ts` | **mock `ResizeObserver`** (P6/P1) — único, compartilhado com PLAN-082 |
| `frontend/src/App.tsx` | rota `/insights` (lazy, `RequireModule`) |
| `frontend/src/shared/layout/AppLayout.tsx` | link na sidebar — **Fase 1.5**, via registro `nav.ts` (PLAN-081), na aba "Mais" |
| `frontend/src/i18n/locales/{pt-BR,en,es}.json` | chaves `insights.*` + `modules.insights*` (G5) |
| `docs/engineering/02-API.md` + `docs/api-collection.json` | **cada rota nova** documentada + `npm run docs:collection` (G12) |

`ChartCard` usa apenas tokens (sem cor fixa → `audit:styles` limpo). Atualizar `UI-COVERAGE.md`.

**Acesso por papel (R2):** a página `/insights` é gated por `RequireModule mod="insights"` + nav `hasModule` (na Fase 1.5). Escopo por papel:
- **Fase 1** — operador (e admin/sócio, que agregam a subárvore).
- **Fase 2** — admin/sócio (fluxo, carteira, contribuição).
- **super_admin** — vê `/insights` com visão global (sem whitelabel, como o Central); se precisar de `?empresaId=`, segue a regra do `requireModule`/`resolveEmpresaId`.

**Fase 1:** backend + página `/insights` (operador) com Tendência + Previsto × Recebido — gated por módulo (`RequireModule`/`hasModule`), **não** por widget (R1); rota alcançável **por URL, sem item de nav**.
**Fase 1.5:** após o PLAN-081, item `insights` entra na aba **"Mais"** (não primária — Rota permanece primária).
**Fase 2:** adiciona Fluxo/Carteira (**classe 3 como snapshot**, nunca série) + **Contribuição** de operadores (composição do total, sem placar). `dependsOn` **continua `[]`**.
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
- Coerência: `Σ contribuição operadores = totais` (padrão API-CT-088)
- **W1:** `insights` reconhecido pelo `ModuleId`/`validateModulos` (não "módulo inválido").
- **W2:** com `dependsOn: []`, desligar `contratos` **não** desliga `insights` — bloco do gráfico sem o dono mostra **empty-state próprio**.
- **W3:** nova empresa nasce com `insights` on por default; desligar sem `force` → `200` (read-only, sem bloqueio).
- **R2:** `/insights` acessível por papel conforme a fase (operador/admin/sócio); super_admin com visão global.
- **D12:** gráfico de **série** aponta para fonte classe 1 ou 2 — **falha** se apontar classe 3 ou 4.

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
- `insights` nasce on por default; desligável sem bloqueio (W3); `dependsOn: []` — sem cascata (W2 revisado).
- Fase 1 entregue (operador): página `/insights` com tendência + previsto × recebido, **sem item de nav**.
- Cores dos gráficos seguem o tema (via `resolveChartColor` + sonda), sem cor fixa (audit:styles com regra de hex).
- PR passa no CI (test + smoke) antes do merge.

---

## Referências

- PLAN-031 (whitelabel v1) · PLAN-036 (enforcement 403) · PLAN-037 (coerência) · PLAN-045 (Module Manifest + `audit:modules`) · PLAN-044 (UI governance) · PLAN-077 (performance) · **PLAN-081 (navegação — pré-requisito só de descoberta, Fase 1.5)**
- Revisão 28/08 (Fase 0.5): nota `NX Gest - Insights e gráficos (PLAN-080)` no vault `brainwork` · `docs/UPDATES.md` §"Removido: bloco Histórico de atrasos"
- `docs/product/08-UC-MODULOS.md` · `07-CASOS-DE-USO-API.md` · `06-CASOS-DE-USO.md` · `docs/engineering/design/UI-COVERAGE.md`
- `src/modules/admin/domain/modules.ts` · `frontend/src/shared/modules/modules.ts`
