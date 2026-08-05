# UI COMPONENTS

**Status:** Aprovado

**Versão:** 1.6

**Última atualização:** 05/08/2026

---

# Componentes canônicos (PLAN-038/044)

> **Fonte da verdade de cobertura:** `UI-COVERAGE.md` (inventário de telas/componentes/legado). Este catálogo detalha os componentes; o inventário é o mapa de quem usa o quê.

Componentes compartilhados ativos da identidade "Nexus" (em `frontend/src/shared/components/`):

| Componente | Status |
|---|---|
| `PageHeader` (título limpo + badge de ícone + eyebrow) | ✅ |
| `Card` (`rounded-xl bg-card` + tone) | ✅ |
| `KpiCard` (Card-based, `value-lg`) | ✅ |
| `Field` (input canônico `rounded-xl border-strong`) | ✅ |
| `Modal` base | ✅ |
| `QuickActions` (grid adaptativo) | ✅ |
| `Button` / `ButtonLink` | ✅ |
| `StatusBadge` · `SectionHeader` · `EstadoTela` · `SuccessState` · `ErrorBanner` · `SearchBar` · `Carousel` · `Logo` | ✅ |
| `Topbar` (dropdowns tema/cores/idioma, `shared/layout/Topbar.tsx`) | ✅ |
| `Avatar` (foto \| iniciais) | ⏳ PLAN-041 (Lovable) |

Regras: usar **apenas** estes componentes em telas novas (checklist do MAPEAMENTO) e nunca reintroduzir padrões legado (verificado por `npm run audit:ui`).

---

# Legenda de Status

| Ícone | Significado |
|-------|-------------|
| ✅ | Implementado como shared component |
| ⚠️ | Existe inline no código, precisa ser extraído para shared/ |
| ❌ | Planejado para implementação futura |

---

# Objetivo

Definir os componentes oficiais da interface do sistema.

Este documento representa o catálogo oficial da biblioteca de componentes (UI Library), especificando a responsabilidade, estrutura e regras de utilização de cada componente.

Ele complementa o `DESIGN-SYSTEM.md`, que define a identidade visual do projeto.

---

# Princípios

Todo componente deverá:

- possuir responsabilidade única;
- ser reutilizável;
- ser desacoplado das regras de negócio;
- receber dados exclusivamente por propriedades;
- manter comportamento consistente em toda a aplicação.

---

# Information Card

**Status:** ✅ Implementado em `shared/components/Card/`

## Objetivo

Apresentar um resumo de uma entidade do sistema.

Exemplos:

- Cliente
- Contrato
- Pagamento
- Operação
- Gasto

---

### Estrutura

Header

↓

Body

↓

Indicators

↓

Actions

---

### Deve conter

- informação principal;
- informações complementares;
- indicadores;
- ações rápidas (quando aplicável).

---

### Não deve conter

- formulários;
- regras de negócio;
- consultas à API.

---

# ContratoCard

**Status:** ✅ Implementado em `modules/contrato/components/ContratoCard.tsx`

## Objetivo

Apresentar informações financeiras do contrato.

---

### Variantes

- `list-item` → clienteNome, valorBase, juros, saldo, parcelas, datas, estado
- `detail` → saldoDevedor, recebido, valorBase, total, parcelas, juros, datas, estado

---

### API

```tsx
<ContratoCard variant="list-item" contrato={contrato} />
<ContratoCard variant="detail" contrato={contrato} />
```

---

### Responsabilidades

- exibir informações do contrato;
- escolher layout conforme variant;
- compor `Card.Root`, `Card.Header`, `Card.Body`, `StatusBadge`.

---

### Referências

- `plans/PLAN-006-padronizacao-visual.md`

---

# ClienteCard

**Status:** ✅ Implementado em `modules/cliente/components/ClienteCard.tsx`

## Objetivo

Apresentar informações cadastrais do cliente.

---

### Variantes

- `list-item` → nome, comércio, telefone, cidade
- `detail` → comércio, CPF, telefone, endereço completo

---

### API

```tsx
<ClienteCard variant="list-item" cliente={cliente} />
<ClienteCard variant="detail" cliente={cliente} />
```

Navegação externa ao componente (via `Link` ou `Card.Root as="link"`).

---

### Responsabilidades

- exibir informações do cliente;
- escolher layout conforme variant;
- compor `Card.Root`, `Card.Header`, `Card.Body` internamente.

---

### Não faz

- regras de negócio;
- chamadas HTTP;
- navegação (deve ser externa);
- loading/disabled.

---

### Referências

- `plans/PLAN-005-cliente-card.md`

---

# KPI Card

**Status:** ✅ Implementado em `shared/components/KpiCard/`

## Objetivo

Exibir indicadores numéricos.

Exemplos:

- Estimado do Dia;
- Recebido Hoje;
- Caixa Base;
- Resultado da Semana.

---

### Deve conter

- título;
- valor principal;
- informação complementar (opcional).

---

### Pode possuir

- navegação para detalhamento.

---

# Status Badge

**Status:** ✅ Implementado em `shared/components/StatusBadge/`

## Objetivo

Representar visualmente o estado de uma informação.

---

### Estados

- Success
- Warning
- Error
- Info
- Neutral

---

### Exemplos

Financeiro:

- Pago
- Parcial
- Atrasado

Operacional:

- Em Atendimento
- Concluído
- Não Localizado

---

# Quick Actions

**Status:** ✅ Implementado em `shared/components/QuickActions/`

## Objetivo

Agrupar ações rápidas relacionadas a uma entidade.

---

### Limite

Máximo de quatro ações simultâneas.

---

### Exemplos

- WhatsApp
- Ligação
- Abrir Contrato
- Navegação

---

# Feedback Global

**Status:** ✅ Implementado em `shared/feedback/`
├── `FeedbackOverlay.tsx`
├── `FeedbackProvider.tsx`
└── `useFeedback.ts`

## Objetivo

Comunicar o andamento das operações.

---

### Estados

- Loading
- Success
- Error
- Warning
- Info

---

### Fluxo

Loading

↓

Success

ou

↓

Error

---

# Search Bar

**Status:** ✅ Implementado em `shared/components/SearchBar/`

## Objetivo

Filtrar informações.

---

### Deve conter

- campo de busca;
- ação de limpar;
- ícone de pesquisa.

---

# Theme Provider

**Status:** ✅ Implementado em `shared/theme/`

## Objetivo

Gerenciar tema claro/escuro da aplicação.

---

### API

```tsx
// Provider no main.tsx
<ThemeProvider>
  <App />
</ThemeProvider>

// Hook em qualquer componente
const { theme, toggle } = useTheme()
```

---

### Responsabilidades

- aplicar/remover classe `dark` no `<html>`
- persistir tema em `localStorage("theme")`
- detectar `prefers-color-scheme` como fallback
- expor `theme: "light" | "dark"` e `toggle()`

---

### Referências

- `plans/PLAN-013-dark-mode.md`
- `engineering/design/05-TOKEN.md`

---

# Empty State

**Status:** ✅ `EstadoTela.tsx`

## Objetivo

Orientar o operador quando não existirem dados.

---

### Deve conter

- ilustração simples;
- mensagem objetiva;
- ação principal.

---

# Skeleton

**Status:** ✅ `EstadoTela.tsx`

## Objetivo

Representar carregamento de conteúdo.

---

### Deve respeitar

A estrutura visual do conteúdo final.

---

# Section Header

**Status:** ✅ Implementado em `shared/components/SectionHeader/`

## Objetivo

Separar visualmente grupos de conteúdo.

---

### Deve conter

- título;
- ação secundária (opcional).

---

# Modal

**Status:** ✅ `Modal` (base compartilhado) + `PagamentoModal`, `ConfirmModal`, `PagamentosHojeModal`, `EquipeModal`, `ContribuicaoModal`

## Objetivo

Executar fluxos secundários.

## Base compartilhado

`shared/components/Modal/Modal.tsx` provê a mecânica uniforme dos modais (PLAN-026):

- `open`, `onClose` — controle de exibição;
- `backdropClose` (bool) — clicar fora fecha? **Configurável por instância** (preserva a semântica atual de cada tela);
- `escapeClose` (bool, padrão `true`) — tecla Escape fecha;
- `maxWidth` — largura do conteúdo (ex.: `max-w-sm`, `max-w-md`);
- overflow do body oculto enquanto aberto;
- `role="dialog"` + `aria-modal`.

Os modais de domínio (`PagamentoModal`, `ConfirmModal`, `EquipeModal`, `ContribuicaoModal`, `OperadorForm`) usam o base. *(PLAN-030: `ResultadoDiaModal` removido — sem usos.)*

---

### Não utilizar

Para operações principais do sistema.

---

# Confirm Dialog

**Status:** ✅ `ConfirmModal.tsx`

## Objetivo

Solicitar confirmação antes de ações destrutivas.

---

### Exemplos

- Excluir contrato;
- Remover gasto;
- Cancelar operação.

---

# Error Banner

**Status:** ✅ Implementado em `shared/components/ErrorBanner/`

## Objetivo

Apresentar mensagens de erro com ação de retry.

---

# Bottom Sheet

**Status:** ❌ Planejado (futuro — Fase 5)

## Objetivo

Apresentar ações secundárias em dispositivos móveis.

---

# List Item

**Status:** ❌ Planejado (futuro — Fase 5)

## Objetivo

Representar um item simples de lista.

---

# Divider

**Status:** ❌ Planejado (futuro — Fase 5)

## Objetivo

Separar grupos de informações.

---

# Chip

**Status:** ❌ Planejado (futuro — Fase 5)

## Objetivo

Representar filtros ou categorias.

---

# Avatar

**Status:** ❌ Planejado (futuro — Fase 5)

## Objetivo

Representar visualmente uma pessoa ou entidade.

---

# Convenções

Novos componentes deverão ser adicionados neste documento antes de sua implementação.

Componentes duplicados não deverão existir.

Sempre que um novo componente puder reutilizar outro já existente, a reutilização deverá ser priorizada.

---

# Referências

- DESIGN-SYSTEM.md
- UX.md
- FRONTEND.md
- TOKEN.md
- UI-PATTERNS.md
- MAPEAMENTO-TELAS.md
- ROADMAP.md (`product/04-ROADMAP.md`)