# UI COMPONENTS

**Status:** Aprovado

**Versão:** 1.8

**Última atualização:** 06/08/2026

---

# Componentes canônicos (PLAN-038/044)

> **Fonte da verdade de cobertura:** `UI-COVERAGE.md` (inventário de telas/componentes/legado). Este catálogo detalha os componentes; o inventário é o mapa de quem usa o quê.

Componentes compartilhados ativos da identidade "Nexus" (em `frontend/src/shared/components/`):

| Componente | Status |
|---|---|
| `PageHeader` (título limpo + badge de ícone + eyebrow) | ✅ |
| `Card` (`rounded-xl bg-card` + tone) | ✅ |
| `KpiCard` (Card-based, `value-lg`) | ✅ |
| `Field` · `FieldSelect` · `FieldTextarea` (input/select/textarea canônicos `rounded-xl border-strong`) | ✅ |
| `Modal` base (assinatura Lovable: `title`/`descricao`/`footer` + bottom-sheet mobile) | ✅ |
| `Tabs` (pills `rounded-xl border bg-card`, ativa `bg-primary-light`) | ✅ |
| `Switch` (track `h-7 w-12`, knob centralizado) | ✅ |
| `QuickActions` (grid adaptativo) | ✅ |
| `Button` / `ButtonLink` | ✅ |
| `StatusBadge` (pill `rounded-md` com dot) · `SectionHeader` · `EstadoTela` · `SuccessState` · `ErrorBanner` · `SearchBar` · `Carousel` · `Logo` | ✅ |
| `BottomTabBar` (5 abas gated, `shared/layout/BottomTabBar.tsx`) · `UserMenu` (avatar, `shared/layout/UserMenu.tsx`) | ✅ | nav app-first |
| `Avatar` (foto \| iniciais, data URL ≤200px) · `AvatarField` | ✅ PLAN-057 |
| `CapacidadesModal` (toggles de recursos por empresa, `modules/admin/components/`) · `ImpactConfirmModal` (confirmação/forçar de desativação com contagens, BR-105) | ✅ PLAN-059 |

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

Representar visualmente o estado de uma informação — pill `rounded-md` com **dot** interno (`size-1.5 rounded-full` na cor da variante).

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

Orientar o operador quando não existirem dados — card `rounded-xl border bg-card` com ícone em círculo `size-11 rounded-full` (`bg-muted text-text-muted`) + título + descrição + ação (padrão Lovable, PLAN-047).

---

### Deve conter

- ícone em círculo soft;
- mensagem objetiva;
- ação principal.

---

# Skeleton

**Status:** ✅ `EstadoTela.tsx`

## Objetivo

Representar carregamento de conteúdo — card com spinner `Loader2 animate-spin text-primary` + "Carregando…".

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

# Field (inputs)

**Status:** ✅ `shared/components/Field/` — `Field` (input), `FieldSelect`, `FieldTextarea`

## Objetivo

Campos de formulário canônicos — todos com o mesmo `fieldControl` (`rounded-xl min-h-12 border-strong` + foco `ring-primary`).

---

### Variantes

- `Field` — `<input>` (label, erro, hint, `right`);
- `FieldSelect` — `<select>` com `options` e `placeholder` (option vazio disabled/hidden);
- `FieldTextarea` — `<textarea>` (rows 3).

---

### API

```tsx
<Field label={t("admin.nome")} value={nome} onChange={...} error={...} />
<FieldSelect label={t("admin.role")} options={[{ value: "admin", label: "Admin" }]} {...form.register("role")} />
<FieldTextarea label={t("caixa.motivo")} rows={4} {...form.register("observacao")} />
```

---

# Button

**Status:** ✅ `shared/components/Button.tsx` (variantes completas — PLAN-056)

## Objetivo

Ação primária/contextual do sistema. Variantes: `primary`, `secondary`, `soft`, `outline`, `ghost`, `danger`, `success`; sizes `sm | md | lg | block`. Base `rounded-xl min-h-11` (toque confortável). `ButtonLink` espelha as mesmas variantes/sizes com `to`.

## Texto segue o tema (PLAN-056)

Nenhum botão usa `text-white` fixo — o texto segue o tema via tokens de foreground:
- `primary` → `text-primary-foreground` (branco no claro · **escuro no escuro**);
- `success`/`danger` → `text-success-foreground`/`text-danger-foreground`;
- `soft`/`secondary`/`ghost` → `text-primary-text`/`text-text-primary`/`text-text-secondary`.

Assim todos os botões **mudam junto com o tema** (claro/escuro/paletas) com contraste correto.

## Vocabulário único por tipo de ação

| Ação | Componente |
|---|---|
| Criar/editar (ex.: "Novo cliente", "Novo contrato", "Fechar semana", "Nova empresa", "Editar") | `Button/ButtonLink primary size="sm"` + **ícone** (`Plus`/`Pencil`/`Wallet`/`Building2`) no `PageHeader action` |
| Contextual (ex.: "Ver contratos", "Novo contrato" na ficha, "Anexar") | `Button soft size="sm"` + ícone |
| Ver/abrir (ex.: "Ver rota") | `Button ghost size="sm"` + `ChevronRight` |
| Enviar form ("Salvar", "Registrar", "Criar empresa", "Confirmar", "Salvar módulos") | `Button primary` (flex-1/block) + `Check` |
| Ação positiva de destaque ("Registrar pagamento") | `Button success` |
| Destrutivo ("Estornar", "Excluir") | `Button danger` |
| Cancelar / Fechar (forms e modais) | `Button ghost` |
| Navegação secundária (paginação, WhatsApp do comprovante) | `Button secondary` |
| Remover (listas) | botão ícone com `aria-label` + hover `danger` |

Regras: sem seta literal "→" (usar `ChevronRight`); sem `<Link>` cru; sem classe de cor crua; **todo** botão de ação principal/contextual tem ícone.

---

# GpsControl

**Status:** ✅ `shared/geo/GpsControl.tsx` (port Lovable — PLAN-056)

## Objetivo

Controle de GPS/localização de um endereço — **controlado** pelo form. 3 estados: `vazio` (Capturar) · `capturada` (badge + coords + Recapturar) · `invalidada` (texto editado — coords descartadas). `role="group"` + `aria-live`. Usado no `ClienteForm` (comércio e residencial).

---

# PreferenciasModal

**Status:** ✅ `shared/theme/PreferenciasModal.tsx` (port Lovable — PLAN-056)

## Objetivo

Preferências do app num modal (aberto pelo **menu do usuário** no avatar — topo fino mobile / rodapé da sidebar desktop): **Modo** (Tabs claro/escuro/sistema) · **Cores** (swatches das 5 paletas) · **Idioma** (PT/EN/ES). Depende do `ThemeProvider` com `mode`.

---

# ClienteSelect

**Status:** ✅ `modules/contrato/components/ClienteSelect.tsx` (port Lovable — PLAN-056)

## Objetivo

Seletor de cliente **buscável** (nome/telefone/bairro, `role="listbox"`, vazio "Nenhum cliente encontrado"). Prop-driven (`clientes` + `value`/`onChange`). Pronto para o `ContratoForm`.

---

# Switch

**Status:** ✅ `shared/components/Switch/`

## Objetivo

Toggle canônico — track `h-7 w-12` com borda, knob `size-5` centralizado (`translate-x-1`/`translate-x-6`), ativo `bg-primary`, inativo `bg-muted` (padrão Lovable, PLAN-047). Suporta `label`, `disabled` e `motivo` (tooltip quando bloqueado).

---

# Tabs

**Status:** ✅ `shared/components/Tabs/`

## Objetivo

Grupo de abas/pills — container `rounded-xl border bg-card p-1`, aba ativa `bg-primary-light text-primary-text`, inativa `text-text-muted hover:bg-surface-hover`.

---

### API

```tsx
<Tabs value={tab} onChange={setTab} items={[{ value: "equipe", label: "Equipe" }, { value: "meusDados", label: "Meus dados" }]} />
```

---

# Modal

**Status:** ✅ `Modal` (base compartilhado) + `PagamentoModal`, `ConfirmModal`, `PagamentosHojeModal`, `EquipeModal`, `ContribuicaoModal`

## Objetivo

Executar fluxos secundários.

## Base compartilhado

`shared/components/Modal/Modal.tsx` provê a mecânica uniforme dos modais (PLAN-026/048):

- `open`, `onClose` — controle de exibição;
- `title`, `descricao?`, `footer?` — header padronizado (título `font-display text-[18px]` + X `size-9 rounded-lg`) e rodapé (assinatura Lovable, PLAN-047);
- `backdropClose` (bool) — clicar fora fecha? **Configurável por instância** (preserva a semântica atual de cada tela);
- `escapeClose` (bool, padrão `true`) — tecla Escape fecha;
- `maxWidth` — largura do conteúdo (ex.: `max-w-sm`, `max-w-md`);
- **Bottom-sheet no mobile**: `items-end sm:items-center` + `rounded-t-xl sm:rounded-xl` + animação `slide-in-from-bottom`; `max-h-[90vh]` com body de scroll interno;
- overflow do body oculto enquanto aberto;
- `role="dialog"` + `aria-modal`.

Os modais de domínio (`PagamentoModal`, `ConfirmModal`, `EquipeModal`, `ContribuicaoModal`, `OperadorForm`/`EmpresaForm` via página, `ModulosModal`, listas de período) usam o base. *(PLAN-030: `ResultadoDiaModal` removido — sem usos.)*

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

**Status:** ✅ Coberto pelo `Modal` (bottom-sheet no mobile — PLAN-047)

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