# ROADMAP

**Status:** Aprovado

**Versão:** 2.7

**Última atualização:** 03/08/2026

---

# Objetivo

Definir a ordem de implementação do projeto, organizando por fases com base no estado atual do sistema, bugs conhecidos, mapeamento de telas e gaps de design system.

Este documento substitui a v0.1 e reflete o estado real do código + documentação.

---

# Estado Atual

## O que existe

| Camada | Qtde | Detalhes |
|--------|------|----------|
| Backend | 10 módulos | health, auth, admin, empresas, cliente, contrato, pagamento, operações, caixa, gasto |
| Frontend | 18 telas | 7 módulos (operacoes, cliente, contrato, auth, admin, caixa, gasto) |
| Shared Components | 15 | Button, Card, Carousel, ConfirmModal, ErrorBanner, ErrorBoundary, EstadoTela, KpiCard, Modal, Navbar, QuickActions, SearchBar, SectionHeader, StatusBadge, SuccessState (+ FeedbackOverlay em `shared/feedback`) |
| Module Components | 25 | ClienteInfo, SaldoInfo, ContratoInfo, ParcelaList, CobrancaList, IndicadoresCards, RotaCobrancaSection, PagamentosHojeModal, PagamentoModal, CobrancaCard, ClienteCard, ContratoCard, GastoForm, GastoList, OperadoresList, OperadorForm, EquipeModal, ContribuicaoModal, EmpresaForm, EmpresaList, ContratosSemanaModal, GastosPeriodoModal, PagamentosPeriodoModal, ParcelasHojeModal, RouteProgress |
| Documentação | ~55 arquivos | Foundation, Product, Engineering, Design, Plans, Skills, Tasks, Templates |
| Design System | 6 docs | UX, DESIGN-SYSTEM, COMPONENT-ARCHITECTURE, UI-COMPONENTS, TOKEN, UI-PATTERNS |

## O que não existe (planejado)

| Módulo | BRs | Depende de |
|--------|-----|------------|
| "Esqueci minha senha" + convite/ativação de conta | — | Backlog P020 (novo escopo: fluxo de conta + infra de e-mail) |
| Mapa | — | Fase 5.3 |
| PWA | — | Fase 5.4 |
| Testes | — | Fase 5.5 |

## O que foi entregue além do roadmap

| Módulo | Onde |
|--------|------|
| Multi-Tenant (super admin + empresas) | Fase 5.7 (PLAN-019) |
| Caixa e Gasto | Fase 4 (PLAN-014) |
| Auditoria de caixa, modais, nomenclatura, estorno | Backlog → PLAN-026/027/028 |

## O que está inconsistente

| Problema | Severidade | Detalhe |
|----------|-----------|---------|
| Cards de cliente espalhados em 3 arquivos | Média | ClienteList, ClienteInfo, ClienteDetail — markup duplicado |
| Card de contratos inline em ClienteDetail | Baixa | Não usa `Card.Root`, usa `rounded-md border bg-white p-4` manual |
| 4 cálculos de negócio no frontend | Média | valorFinal, pagasRange, resultadoDoDia duplicados |

---

# Pré-requisito

Os 7 componentes extraídos na Fase 1 devem nascer com tokens semânticos para evitar retrabalho na Fase 2. Por isso, a configuração de design tokens antecede a extração de componentes.

## 0 — Design Tokens no tailwind.config.js

**Status:** Concluído ✅

**Objetivo:** Definir cores semânticas que os novos componentes shared utilizarão, sem quebrar classes raw existentes.

### Configuração adicionada:

```js
colors: {
  primary:   { DEFAULT: "#2563EB", hover: "#1D4ED8", light: "#DBEAFE", text: "#1E40AF" },
  success:   { DEFAULT: "#16A34A", hover: "#15803D", light: "#DCFCE7", text: "#166534" },
  warning:   { DEFAULT: "#CA8A04", light: "#FEF9C3", text: "#854D0E" },
  danger:    { DEFAULT: "#DC2626", hover: "#B91C1C", light: "#FEE2E2", text: "#991B1B" },
  info:      { DEFAULT: "#2563EB", light: "#DBEAFE", text: "#1E40AF" },
  secondary: { DEFAULT: "#6B7280", light: "#F9FAFB" },
}
```

**Impacto:** As classes raw (`blue-600`, `green-100`, etc.) continuam funcionando. Novos componentes usam `bg-primary`, `text-success`, etc.

---

# Fases

## Fase 1 — Bug Fixes & Consistência Visual

**Status:** Concluído ✅

**Objetivo:** Eliminar todas as inconsistências visuais e componentes duplicados antes de implementar novas features.

### 1.1 Extrair ErrorBanner → shared/
- **Arquivos:** Criar `shared/components/ErrorBanner/`
- **Substituir:** 5+ banners inline em `OperacoesDashboard.tsx`, `RotaPage.tsx`, `ClienteNovo.tsx`, `ContratoNovo.tsx`, `ContratoDetail.tsx`
- **Estados:** `message`, `onRetry?`, `onDismiss?`
- **Tamanho do problema:** 5 arquivos alterados

### 1.2 Extrair SectionHeader → shared/
- **Arquivos:** Criar `shared/components/SectionHeader/`
- **Substituir:** `text-xl font-semibold text-gray-800` em `ClienteNovo.tsx`, `ClienteEdit.tsx`, `ContratoNovo.tsx`, `ContratoEdit.tsx`
- **Estados:** `title`, `action?` (label + onClick)
- **Tamanho do problema:** 4 arquivos alterados

### 1.3 Extrair SearchBar → shared/
- **Arquivos:** Criar `shared/components/SearchBar/`
- **Substituir:** Input com `Search icon + pl-10` em `ClienteList.tsx`
- **Estados:** `value`, `onChange`, `placeholder`, `onClear?`
- **Tamanho do problema:** 1 arquivo alterado
- **Nota:** `ContratoList.tsx` e `ContratoNovo.tsx` possuem inputs de busca DENTRO de dropdowns de filtro — padrão diferente (DropdownFilter), sem Search icon nem pl-10. Esses serão tratados como parte do dropdown específico ou refatorados separadamente.

### 1.4 Extrair StatusBadge → shared/
- **Arquivos:** Criar `shared/components/StatusBadge/`
- **Substituir:** 8+ badges inline (`rounded-full px-2 py-0.5 text-xs font-medium`)
- **Variantes:** `success` | `warning` | `danger` | `info` | `neutral`
- **Mapeamento de estados:**
  - Success: Paga, Ativo, Finalizado, Quitado
  - Warning: Pendente, Parcial
  - Danger: Atrasado, Vencida
  - Info: Vence Hoje, Visitado
  - Neutral: Em Andamento

### 1.5 Extrair QuickActions → shared/
- **Arquivos:** Criar `shared/components/QuickActions/`
- **Substituir:** Grade de 4 botões em `CobrancaList.tsx` (layout horizontal) e `RotaPage.tsx` (layout vertical)
- **Props:** `actions: Array<{icon, label, onClick, variant?}>`, `layout?: "horizontal" | "vertical"` — máx 4 ações
- **Nota:** Os dois locais usam layouts diferentes (CobrancaList: `flex-wrap` inline; RotaPage: `flex-col` com ícone acima). O componente precisa suportar ambas as variantes.

### 1.6 Extrair Card + variantes → shared/
- **Arquivos:** Criar `shared/components/Card/`
- **Substituir:** 4 variações de card:
  - `ClienteList.tsx:86-99` — card de listagem
  - `ClienteInfo.tsx:21-37` / `SaldoInfo.tsx` — cards de detalhe
  - `CobrancaList.tsx:53-121` — card de cobrança (dashboard)
  - `RotaPage.tsx:409-527` — card de operação (rota)
- **Estrutura (conforme 04-UI-COMPONENTS.md):** `Card.Header → Card.Body → Card.Indicators → Card.Actions`
- **Especificação técnica:**
  - Padding: `p-4` (16px)
  - Dot indicador: `h-4 w-4` (16px)
  - Cor secundária: `text-gray-500` (#6B7280)
  - Borda: `border-gray-200`, hover: `border-blue-300`
  - Sombra: nenhuma (DS §160-165)
- **Dependência:** StatusBadge (1.4) deve ser extraído antes de Card, pois `Card.Badge` delega internamente para `StatusBadge`.
- **Correções durante extração:**
  - `ContratoList.tsx:211` — corrigir `hover:bg-gray-50` → `hover:border-blue-300` (DESIGN-SYSTEM.md §271)
  - `ClienteInfo.tsx:25` — Comércio como `text-base font-medium` (N1) → rebaixar para N3 (CHECKLIST §63)
  - `ClienteInfo.tsx:21` / `SaldoInfo.tsx:13` — unificar cards de detalhe sem perder informações financeiras

### 1.7 Extrair KpiCard → shared/
- **Arquivos:** Extrair de `IndicadoresCards.tsx`
- **Props:** `title`, `value`, `variant` (blue/green/yellow/gray), `onClick?`
- **Unificar:** 4 cards do Dashboard (aReceber, recebido, clientes, resultado)

### 1.8 Remover código morto
- Remover imports não utilizados após substituições
- Remover arquivos/components inline que foram extraídos
- Verificar com `tsc --noEmit`

### 1.9 Mapeamento de telas v1.2
- Atualizar `05-MAPEAMENTO-TELAS.md`:
  - Adicionar referência a `design/06-UI-PATTERNS.md`
  - Adicionar referência a `tasks/2026-07-02/CHECKLIST.md`
  - Adicionar anti-patterns por tela
  - Atualizar árvore de componentes com shared components extraídos
  - Atualizar `04-UI-COMPONENTS.md` com status "Implementado" para os extraídos

### 1.10 ClienteCard (componente de domínio)

**Status:** Concluído ✅

#### Objetivo

Extrair a exibição de dados do cliente para um componente `ClienteCard` reutilizável,
eliminando markup duplicado entre ClienteList, ClienteInfo e ClienteDetail.

O `ClienteCard` **compõe** `Card.Root` internamente — não substitui o Design System.

#### API

```tsx
<ClienteCard variant="list-item" cliente={cliente} />
<ClienteCard variant="detail" cliente={cliente} />
```

Navegação é externa ao componente (via `Link` ou `Card.Root as="link"`).

#### Responsabilidades

- exibir informações do cliente;
- escolher layout conforme variant;
- compor `Card.Root`, `Card.Header`, `Card.Body`.

#### Não faz

- regras de negócio;
- chamadas HTTP;
- navegação;
- loading/disabled.

#### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `modules/cliente/components/ClienteCard.tsx` |
| Alterar | `ClienteList.tsx` — usar `<ClienteCard>` + `<Link>` externo |
| Alterar | `ClienteInfo.tsx` — simplificar para wrapper |
| Alterar | `ClienteDetail.tsx` — card de contratos → `Card.Root` |

#### Descontinuado

- `ClienteSummary` (proposto anteriormente) → substituído por `ClienteCard variant="list-item"`
- `ClienteDetails` (proposto anteriormente) → substituído por `ClienteCard variant="detail"`

#### Próximos componentes de domínio

Após validação do padrão, aplicar a mesma estratégia para:

- ContratoCard
- PagamentoCard
- GastoCard

#### Checklist de execução

| # | Entrega | Arquivos | Status |
|---|---------|----------|--------|
| P0 | Criar `ClienteCard.tsx` | 1 novo | ✅ Concluído |
| P1 | Substituir card em `ClienteList.tsx` | 1 alterado | ✅ Concluído |
| P2 | Simplificar `ClienteInfo.tsx` | 1 alterado | ✅ Concluído |
| P3 | Card de contratos em `ClienteDetail.tsx` | 1 alterado | ✅ Concluído |
| P4 | Remover imports não utilizados | 1 | ✅ Concluído |
| P5 | `tsc --noEmit` | — | ✅ Concluído |

#### Referência

- `plans/PLAN-005-cliente-card.md` — Plano detalhado de implementação
- `engineering/tasks/2026-07-04/CHECKLIST-FASE4.md` — Checklist executável

### 1.11 Padronização Visual (Tokens + ContratoCard)

**Status:** Concluído ✅

#### Objetivo

Eliminar inconsistências visuais remanescentes: migrar classes raw para tokens
semânticos, padronizar ContratoInfo com `Card.Root`, criar `ContratoCard`.

#### Fases

| # | Entrega | Arquivos | Complexidade | Status |
|---|---------|----------|--------------|--------|
| F1 | Criar `ContratoCard` + migrar consumers | 1 novo + 2 alt | Média | ✅ |
| F2 | Tokens + gap-3 + cards inline | ~10 | Média | ✅ |
| F3 | Atualizar documentação | ~5 | Baixa | ✅ |

#### Referência

- `plans/PLAN-006-padronizacao-visual.md` — Plano detalhado
- `engineering/tasks/2026-07-04/CHECKLIST-FASE5.md` — Checklist executável

### 1.12 Padronização de Cards de Cobrança

**Status:** Concluído (PLAN-007)

#### Objetivo

Eliminar inconsistências visuais em telas operacionais: ícones de ações,
cores fora da paleta (amber), sombras em cards (ParcelaList), inputs com
shadow-sm, cabeçalhos inconsistentes, e extrair CobrancaCard.

#### Fases

| # | Entrega | Arquivos | Complexidade | Status |
|---|---------|----------|--------------|--------|
| F1 | Ícones no CobrancaList | 1 | Muito baixa | ✅ |
| F4 | Amber → tokens warning | 2 | Muito baixa | ✅ |
| F5 | ParcelaList sem sombra | 1 | Baixa | ✅ |
| F6 | Inputs sem shadow-sm | 4 | Baixa | ✅ |
| F7 | Cabeçalhos consistentes | 2 | Muito baixa | ✅ |
| F2 | Criar CobrancaCard | 1 novo + 2 alt | Média | ✅ |
| F3 | Botões RotaPage padronizados | 1 | Média | ✅ |

#### Referência

- `plans/PLAN-007-padronizacao-cobrancas.md` — Plano detalhado
- `engineering/tasks/2026-07-04/CHECKLIST-FASE6.md` — Checklist executável

### 1.13 Carrossel de Navegação Horizontal

**Status:** Concluído ✅

#### Objetivo

Substituir a navegação vertical/contador por um carrossel horizontal em duas telas,
melhorando a ergonomia mobile com gestos de swipe e scroll horizontal.

#### Telas afetadas

| Tela | Modo | Comportamento |
|------|------|---------------|
| **RotaPage** | `slide` | 1 item por vez, swipe + setas + dots |
| **Dashboard** | `scroll` | Vários itens visíveis, scroll horizontal com snap |
| ContratoDetail, ClienteDetail, ClienteList, ContratoList | — | Não aplicável (permanecem verticais) |

#### Entregas

| # | Entrega | Arquivos | Complexidade | Status |
|---|---------|----------|--------------|--------|
| C1 | Criar Carousel component | shared/components/Carousel/ | 🟡 Média | ✅ |
| C2 | Migrar RotaPage para slide | RotaPage.tsx | 🟡 Média | ✅ |
| C3 | Migrar Dashboard para scroll | OperacoesDashboard.tsx | 🟡 Média | ✅ |

#### Referência

- `plans/PLAN-008-carrossel-navegacao.md` — Plano detalhado
- `engineering/tasks/2026-07-04/CHECKLIST-FASE7.md` — Checklist executável

---

### 1.14 Conceito de Atendimento (PLAN-009)

**Status:** Concluído ✅

**Objetivo:** Padronizar o conceito de Atendimento de Cobrança e Resultado Operacional,
diferenciando PENDENTE, VISITADO, NAO_ENCONTRADO e PROMESSA.

Telas afetadas:

| Tela | Impacto |
|------|---------|
| **RotaPage** | QuickActions condicionais ao resultado atual |
| **Dashboard** | Ordenação consistente (PENDENTE primeiro) |
| **CobrancaListPage** | Filtros usando resultadoOperacional |
| **CobrancaCard** | Badge com cor/label para cada resultado |
| Todas | Listas atualizadas via EventBus após registro |

Entregas:

| # | Entrega | Arquivos | Complexidade | Status |
|---|---------|----------|--------------|--------|
| P0 | Event Bus (shared/events/) | 1 novo | 🟢 Baixa | ✅ |
| P1 | Backend: resultadoOperacional | 1 alt | 🟡 Média | ✅ |
| P2 | Frontend: tipo + constantes | 1 alt | 🟢 Baixa | ✅ |
| P3 | CobrancaCard: badge por resultado | 1 alt | 🟢 Baixa | ✅ |
| P4 | RotaPage: QuickActions condicionais | 1 alt | 🟢 Baixa | ✅ |
| P5 | Sort/filter usar resultadoOperacional | 3 alt | 🟢 Baixa | ✅ |
| P6 | i18n: chaves dos resultados | 3 alt | 🟢 Baixa | ✅ |
| P7 | Dashboard: ordenação consistente | 1 alt | 🟢 Baixa | ✅ |
| P8 | Listas escutarem EventBus | 3 alt | 🟢 Baixa | ✅ |

#### Referência

- `plans/PLAN-009-conceito-atendimento.md` — Plano detalhado
- `engineering/tasks/2026-07-05/CHECKLIST-FASE8.md` — Checklist executável

---

### 1.15 Fila Operacional de Cobrança (PLAN-010)

**Status:** Concluído ✅

**Objetivo:** Transformar a Rota, Cobranças do Dia e Dashboard em filas operacionais — exibindo exclusivamente clientes pendentes. Qualquer atendimento registrado remove o cliente da fila.

| # | Entrega | Arquivos | Complexidade |
|---|---------|----------|--------------|
| P0 | Carousel: prop `hideDots` + `maxDots` + `itemKey` | 1 alt | 🟢 Baixa |
| P1 | RouteProgress: componente de progresso | 1 novo | 🟢 Baixa |
| P2 | RotaPage: só PENDENTE na fila | 1 alt | 🟢 Baixa |
| P3 | Cobranças: simplificar lista + remover filtros | 2 alt | 🟢 Baixa |
| P4 | Dashboard: só PENDENTE | 1 alt | 🟢 Baixa |

#### Referência

- `plans/PLAN-010-barra-progresso.md` — Plano detalhado
- `engineering/tasks/2026-07-05/CHECKLIST-FASE9.md` — Checklist executável

---

### 1.16 Atendidos Hoje (PLAN-011)

**Status:** Concluído

**Objetivo:** Exibir todos os clientes atendidos no dia com filtro por resultado operacional, complementando a fila operacional do PLAN-010.

| # | Entrega | Arquivos | Complexidade |
|---|---------|----------|--------------|
| P1 | AtendidosPage | 1 novo | 🟢 Baixa |
| P2 | Rota `/atendidos` | 1 alt | 🟢 Baixa |
| P3 | Link no Dashboard | 1 alt | 🟢 Baixa |
| P4 | i18n: 2 chaves | 3 alt | 🟢 Baixa |

#### Referência

- `plans/PLAN-011-atendidos-hoje.md` — Plano detalhado
- `engineering/tasks/2026-07-05/CHECKLIST-FASE10.md` — Checklist executável

---

### 1.17 Resumo Operacional da Rota (PLAN-012)

**Status:** Concluído

**Objetivo:** Evoluir o RouteProgress com resumo detalhado dos resultados operacionais (visitados, promessas, não encontrados, pagos).

| # | Entrega | Arquivos | Complexidade |
|---|---------|----------|--------------|
| P1 | RouteProgress: novas props + layout | 1 alt | 🟢 Baixa |
| P2 | RotaPage: fetch pagamentos + contagens | 1 alt | 🟢 Baixa |
| P3 | i18n: `resumo.pagos` | 3 alt | 🟢 Baixa |

#### Referência

- `plans/PLAN-012-resumo-operacional-rota.md` — Plano detalhado
- `engineering/tasks/2026-07-05/CHECKLIST-FASE11.md` — Checklist executável

---

## Fase 2 — Tema & Identidade Visual

**Status:** Concluído ✅

**Objetivo:** Dar identidade visual ao sistema, refinando tokens já configurados (Fase 0) e aplicando identidade visual.

### 2.1 CSS custom properties no index.css
- Definir `:root { --color-primary: ..., --font-sans: ... }`
- Permitir que dark mode ou futuros temas sobrescrevam as variáveis

### 2.2 Migração gradual de classes raw para tokens
- **Não quebrar nada existente** — classes `blue-600`, `green-600` continuam funcionando
- Só novas implementações usam `bg-primary`, `text-success`, etc.
- Prioridade: componentes extraídos na Fase 1 já nascem com tokens ✅ (Pré-requisito 0)

### 2.3 Fonte Inter explícita
- `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');` no `index.html`
- `fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] }` no Tailwind config

### 2.4 Favicon + title + metatags
- Adicionar `<title>Gestão de Cobranças</title>` no `index.html`
- Adicionar `<link rel="icon">` (criar favicon)
- Adicionar viewport + theme-color metatags

### 2.5 Verificar contraste WCAG AA
- Contraste mínimo 4.5:1 para texto normal
- Contraste mínimo 3:1 para texto grande
- Ferramenta: verificar combinações das cores customizadas

---

## Fase 3 — Qualidade Técnica

**Status:** Concluído ✅

**Objetivo:** Reduzir endividamento técnico — unificar feedback, migrar formulários para react-hook-form+zod, organizar schemas por módulo, remover duplicação de lógica. Cada arquivo alterado no máximo 1 vez.

**Ordem de implementação refinada conforme `plans/PLAN-004-feedback.md`.** Não seguir a numeração abaixo como ordem — consultar `CHECKLIST-FASE3.md` e `PLAN-004-feedback.md`.

### 3.1 Error boundaries globais
- **Ordem:** Primeiro (independente, zero dependências)
- **Arquivos:** Criar `shared/components/ErrorBoundary.tsx`, alterar `App.tsx`
- **Escopo:** Capturar erros não tratados no React, exibir fallback amigável

### 3.2 Feedback Global — Infraestrutura
- **Ordem:** Segundo (antes de qualquer consumidor)
- **Plano:** `plans/PLAN-004.1-feedback.md` (detalha implementação)
- **Arquivos:** Criar `shared/feedback/FeedbackProvider.tsx`, `shared/feedback/useFeedback.ts`, `shared/feedback/FeedbackOverlay.tsx`
- **Escopo:** Provider + hook + componente de overlay (barra fixa superior). Nenhuma tela alterada nesta etapa.
- **Detalhes:** Posicionamento topo, não bloqueante, 3 estados (loading/success/error), duração 600ms/1200ms/4000ms

### 3.3 Formulários + react-hook-form + zod + Feedback Global
- **Ordem:** Terceiro (depende do Feedback infra)
- **Arquivos:** `ClienteNovo.tsx`, `ClienteEdit.tsx`, `ContratoNovo.tsx`, `ContratoEdit.tsx`
- **Processo:** Para cada formulário, migrar em 1 toque:
  - Substituir `useState` + `validar()` por `useForm` + `zod` + `@hookform/resolvers`
  - Integrar com Feedback Global (`useFeedback().run()`)
  - Remover estados locais de loading/erro
  - Remover Toasts/ErrorBanner locais
- **Schemas:** Organizados por módulo: `cliente/schemas/`, `contrato/schemas/`
- **Cálculos preview:** `valorFinal` mantido para exibição informativa (backend é fonte oficial)
- **Validações:** Apenas visuais (tamanho, formato). Regras de negócio no backend.

### 3.4 Remover Button.loading
- **Ordem:** Quarto (apenas após todos os consumidores migrados)
- **Escopo:** Remover prop `loading` e `<Spinner />` interno do `Button.tsx`

### 3.5 Migrar feedback restante
- **Ordem:** Quinto
- **Arquivos:** `RotaPage.tsx` (banner verde), `ContratoDetail.tsx` (Toast), `PagamentoModal.tsx` (loading)

### 3.6 Refactors finais
- **Ordem:** Sexto
- **Arquivos:** `PagamentoModal.tsx` (pagasRange), `OperacoesDashboard.tsx` (resultadoDoDia)

### Referências
- `plans/PLAN-004-feedback.md` — Sistema global de feedback
- `engineering/tasks/2026-07-03/CHECKLIST-FASE3.md` — Checklist executável

---

## Fase 4 — Novos Módulos

**Status:** Concluído ✅

**Objetivo:** Implementar módulos de Caixa e Gasto, completando as regras de negócio documentadas em BUSINESS-RULES.md.

### 4.1 Módulo Caixa (BR-018 a BR-027)
- **Backend:**
  - Entidades: `Caixa`, `MovimentacaoFinanceira`, `FechamentoSemanal`
  - Use Cases: `AjustarCaixaBase`, `ListarMovimentacoes`, `LiquidarSemana`
  - Endpoints: `GET /api/caixa`, `POST /api/caixa/ajuste`, `GET /api/caixa/movimentacoes`, `POST /api/caixa/liquidar`
- **Frontend:**
  - Tela: Caixa (indicadores + ajuste + movimentações + liquidação)
  - Componentes: `CaixaIndicadores`
- **Integração:** Dashboard com KPI card de Caixa Base, Navbar com link Caixa

### 4.2 Módulo Gasto (BR-028)
- **Backend:**
  - Entidades: `Gasto`
  - Use Cases: `CreateGasto`, `ListGastos`, `DeleteGasto`
  - Endpoints: `POST /api/gastos`, `GET /api/gastos`, `DELETE /api/gastos/:id`
- **Frontend:**
  - Tela: Gastos (formulário + lista)
  - Componentes: `GastoForm`, `GastoList`
- **Integração:** Dashboard com KPI card de Gastos do Dia, Navbar com link Gastos

### 4.3 Atualizar Dashboard com indicadores completos
- Caixa Base atual
- Gastos do Dia
- Indicadores semanais na tela de Caixa

### 4.4 Banco de Dados
- Nova tabela `gastos`
- Nova tabela `fechamentos_semanais`

#### Referência

- `plans/PLAN-014-caixa-gasto.md` — Plano detalhado
- `engineering/tasks/2026-07-11/CHECKLIST-FASE12.md` — Checklist executável

---

## Fase 5 — Polimento (Futuro)

**Status:** Em andamento

### 5.1 Dark mode ✅
- Strategy: `class` no Tailwind
- Toggle no Navbar
- Variáveis CSS para modo escuro
- **Status:** Concluído — `plans/PLAN-013-dark-mode.md`

### 5.2 Multi-usuário + Autenticação + Admin Panel

**Status:** Concluído ✅

A autenticação multi-usuário e o painel de administração são implementados em duas ondas:

#### 5.2a — Autenticação base (PLAN-015)

- Login JWT com email + senha (BR-055, BR-058)
- Isolamento de dados por operador (BR-056)
- 8 tabelas com coluna `userId` + filtro em ~60 queries
- Frontend: LoginPage, AuthContext, ProtectedRoute, logout no Navbar
- **Prioridade:** Média

> **Pendência registrada (PLAN-015):** a "tela de perfil" (troca de senha pelo próprio usuário) foi **adiada** na implementação original — agora coberta pelo **PLAN-029** (BR-089/BR-090). "Esqueci minha senha" segue **fora de escopo** (backlog P020).

#### 5.2b — Admin Panel + Permissões (PLAN-017)

- Coluna `role` (`admin` / `operator`) na tabela `usuarios` (BR-066)
- Middleware `admin.middleware.ts` para rotas administrativas
- Módulo admin backend: CRUD de operadores + dashboard consolidado (BR-067, BR-068)
- AdminPage: gestão de operadores com componentes shared existentes
- Restrições: admin não pode auto-remover (BR-070) nem auto-rebaixar (BR-069)
- **Prioridade:** Média

#### Referências

- `plans/PLAN-015-autenticacao.md` — Plano de autenticação base
- `plans/PLAN-017-admin-panel.md` — Plano do painel de administração
- `foundation/ADR-003-Auth-Autorizacao.md` — Decisão arquitetural do subsistema de auth

#### 5.2c — Evoluções do painel admin (PLAN-020 a PLAN-030)

**Status:** Concluído ✅

- **PLAN-020** — Drill-down Admin → Operador + Caixa por `?usuarioId=` + fix da dobra de saldo/lucro.
- **PLAN-021/022** — Painel com contexto de empresa, KPIs por seção, login por role, ajustes de KPIs.
- **PLAN-023/024** — Ajustes pós-validação; página admin no padrão do sistema, usuário corrente na Equipe.
- **PLAN-025** — Ajuste do Caixa Base **exclusivo de admin** (operador 403); contexto de empresa no super admin.
- **PLAN-026** — Sprint 1 do backlog: auditoria de caixa (BR-088), `Modal` base compartilhado e nomenclatura Equipe/Administradores/Operadores.
- **PLAN-029** — Senha e Perfil (troca de senha própria, `PATCH /api/auth/senha`, mostrar/ocultar no login).
- **PLAN-030** — Visão da equipe no admin: KPIs de Operação com **totais da equipe** (BR-091), `GET /api/admin/equipe`, `ContribuicaoModal`, navbar com Administração/Empresas visíveis.
- **PLAN-031** — Temas & gradientes (5 por usuário) + **Super Admin whitelabel**: módulos por empresa (BR-092/093), `PATCH /modulos`, gating de UI.
- **PLAN-036** — Whitelabel **enforcement no backend**: 403 `MODULE_DISABLED` por módulo desativado (P024) — `requireModule` no mount das rotas + por endpoint em `/operacoes`.
- **PLAN-037** — Coerência do whitelabel: `contratos ⇒ clientes` + validação **transitiva** de combos + **Central se adapta por módulo** (P025) — dado de módulo off nunca aparece.

Backlog de refinamentos em `plans/BACKLOG.md` (P013/P015/P016 ✅ — PLAN-033/055/056/063; P017, P019, P020 [novo fluxo de conta], P021, P022, P023 pendentes).

> **Whitelabel futuro (5.10) — visão multi-negócio:** o princípio de coerência (PLAN-037) é a base para **um app, vários negócios** (cobrança hoje, agendamentos/vendas amanhã). Evolução em fases:
> - **F2 — Branding por tenant:** `empresa.tema` (paleta padrão do cliente) + nome/logo no login/navbar;
> - **F3 — URL por tenant:** `empresas.dominio` + resolução do tenant pelo **Host header** + login por URL + Caddy multi-domínio (subdomínio `tenant.app.com.br` e/ou domínio próprio do cliente);
> - **F4 — Multi-negócio:** templates de negócio (`tipo_negocio` — preset coerente de módulos/labels/ícones) + novos módulos (agenda, vendas) + dashboard que compõe qualquer conjunto de módulos.
> Sem coluna/cronograma ainda (F2..F4).

### 5.3 Visualização em mapa
- Integração com Google Maps (já tem `maps.ts`)
- Pin dos clientes no mapa
- Rota otimizada
- **Prioridade:** Média — já existe `RotaCobrancaSection`

### 5.4 PWA / instalação mobile
- Service worker
- Manifest.json
- Cache de assets
- **Prioridade:** Média — melhor experiência mobile

### 5.5 Testes automatizados
- **API/backend:** `scripts/smoke-api.mjs` (91 cenários da `07` — validado 03/08/2026) ✅; testes unitários pendentes.
- **UI/frontend:** **pendente (T1)** — Vitest + React Testing Library para as telas alteradas (login, perfil, admin/equipe, navbar); `npm test` hoje não encontra arquivos (exit 1).
- **Prioridade:** Média — cobertura de UI atual = 0%

### 5.6 Endereço do Comércio + GPS
- Separar endereço pessoal do endereço do comércio
- Botão "Usar local atual" via GPS do dispositivo
- Botão Navegar usa endereço do comércio como destino
- **Status:** Planejado — `plans/PLAN-016-endereco-comercio.md`
- **Prioridade:** Média — melhora usabilidade do operador em campo

### 5.7 Multi-Tenant: Super Admin + Empresas

**Status:** Concluído

**Objetivo:** Transformar o sistema de single-tenant para multi-tenant, introduzindo papel `super_admin`, entidade `Empresa` e isolamento de dados por `empresaId` (derivado via JOIN, zero coluna nova nas 10 tabelas operacionais).

| Papel | Acesso |
|---|---|
| **super_admin** | Acesso irrestrito a todas as empresas. Gerencia empresas (criar, listar). Pode fazer drill-down em qualquer empresa. |
| **admin** | Acesso a todos os dados da sua empresa. Gerencia operadores da sua empresa. |
| **operator** | Acesso restrito aos próprios dados dentro da sua empresa. |

**Endpoints:**
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/admin/empresas` | super_admin | Lista todas empresas com stats |
| `POST` | `/api/admin/empresas` | super_admin | Cria empresa + admin vinculado (atômico) |

**Hardening de auth:**
- Rate limiting: 10 tentativas/15min no `POST /api/auth/login`
- `auth.middleware` valida existência do usuário no banco (bloqueia soft-deleted)
- `GET /api/auth/me` retorna `empresaId` + `empresaNome`

**Plano:** `plans/PLAN-019-multi-tenant.md`

**Dependências:** PLAN-015 (Concluído), PLAN-017 (Concluído)

---

### 5.8 Testes automatizados
- **API:** `scripts/smoke-api.mjs` ✅ (91 cenários, validado 03/08)
- **UI (pendente T1):** Vitest + React Testing Library — telas alteradas (login, perfil, admin/equipe, navbar); `npm test` sem arquivos hoje
- **Prioridade:** Média — cobertura de UI atual = 0%

---

### 5.9 Perfil do usuário e senha (PLAN-029)

**Status:** Concluído ✅

**Objetivo:** completar o ciclo de autenticação adiado no PLAN-015 — o usuário vê e gerencia a própria senha.

| Entrega | Detalhe |
|---|---|
| Mostrar/ocultar senha no login | Toggle Eye/EyeOff no campo senha (UC-041) |
| Trocar a própria senha | `PATCH /api/auth/senha` — senha atual + nova (BR-089/090, UC-042) |
| Seção "Meus dados" p/ todos os perfis | Perfil com dados + troca de senha; admin funde com a aba existente (UC-042) |
| i18n | Chaves `auth.*`/`perfil.*` nos 3 idiomas |

**Fora de escopo:** "esqueci minha senha" → backlog **P020** (sem infraestrutura de e-mail hoje; admin redefine via `PATCH /api/admin/operadores/:id`).

**Regras:** `02-BUSINESS-RULES.md` BR-089, BR-090

---

# Marcos (Milestones)

| Marco | Fase | Prazo estimado | Critério de conclusão |
|-------|------|---------------|-----------------------|
| M0 — Design tokens configurados | Pré-req | Antes de F1 | `tailwind.config.js` com cores semânticas, `tsc --noEmit` |
| M1 — Componentes inline extraídos | F1 | Próxima sessão | 7 novos shared components, 0 código inline duplicado, `tsc --noEmit` |
| M2 — Telas consistentes | F1 | +1 sessão | Nenhum anti-pattern ativo, cards unificados, badges padronizados, hover corrigido |
| M3 — Tema implementado | F2 | +1 sessão | CSS custom properties, fonte Inter, favicon, WCAG AA |
| M4 — ErrorBoundary + Feedback infra | F3 | +1 sessão | ErrorBoundary no App, FeedbackOverlay funcional, zero consumidores ainda |
| M5 — Formulários migrados + Feedback ativo | F3 | +2 sessões | 4 formulários com react-hook-form+zod, Feedback Global integrado, Button.loading removido |
| M6 — Caixa + Gasto | F4 | ✅ Concluído | BR-018 a BR-028 implementados, testados |
| M7a — Autenticação base (PLAN-015) | F5 | ✅ Concluído | Login JWT, isolamento de dados, LoginPage, AuthContext, ProtectedRoute |
| M7b — Admin Panel (PLAN-017) | F5 | ✅ Concluído | Coluna `role`, admin.middleware, CRUD operadores, AdminPage, dashboard consolidado |
| M8 — PWA + Mapa | F5 | TBD | Funcionalidades extras |
| M9 — Endereço do Comércio | F5 | Planejado | PLAN-016: endereço comércio separado + GPS |
| M10 — Multi-Tenant (PLAN-019) | F5 | Concluído | Super admin, empresas, isolamento por empresaId, hardening de auth |

---

# Fluxo de Execução

Cada fase segue o processo definido nas Skills do projeto:

```
SKILL-003 (Planejar) → SKILL-004 (Implementar) → SKILL-005 (Revisar)
  → SKILL-002 (Validar Arquitetura) → SKILL-007 (Avaliar UX)
  → SKILL-001 (Atualizar Documentação)
```

Para bugs: `SKILL-006 (Bug Investigator)` antes de `SKILL-004`.

A Fase 3 possui checklist próprio: `tasks/2026-07-03/CHECKLIST-FASE3.md`.

---

# Referências

- `product/00-PROJECT.md` — Visão do produto
- `product/01-DOMAIN.md` — Entidades do domínio
- `product/02-BUSINESS-RULES.md` — Regras de negócio (BR-001 a BR-071)
- `product/03-PRD.md` — Product Requirements Document
- `product/05-CONVENTIONS.md` — Convenções de código
- `foundation/ADR-001-Arquitetura.md` — Decisão arquitetural base
- `foundation/ADR-002-Arquitetura-Front.md` — Decisão arquitetural do frontend
- `foundation/ADR-003-Auth-Autorizacao.md` — Decisão arquitetural de auth + autorização
- `engineering/05-MAPEAMENTO-TELAS.md` — Mapeamento das 18 telas
- `engineering/design/02-DESIGN-SYSTEM.md` — Identidade visual
- `engineering/design/03-COMPONENT-ARCHITECTURE.md` — Arquitetura de componentes
- `engineering/design/04-UI-COMPONENTS.md` — Catálogo de componentes
- `engineering/design/05-TOKEN.md` — Design tokens
- `engineering/design/06-UI-PATTERNS.md` — Padrões de composição e anti-patterns
- `engineering/tasks/2026-07-02/CHECKLIST.md` — Checklist de preparação para F1
- `plans/PLAN-004-feedback.md` — Sistema global de feedback (estratégia refinada)
- `plans/PLAN-005-cliente-card.md` — ClienteCard: componentização e padronização
- `plans/PLAN-015-autenticacao.md` — Plano de autenticação multi-usuário
- `plans/PLAN-017-admin-panel.md` — Plano do painel de administração
- `plans/PLAN-019-multi-tenant.md` — Plano multi-tenant