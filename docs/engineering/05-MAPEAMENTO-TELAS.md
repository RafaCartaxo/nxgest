# MAPEAMENTO DE TELAS

**Status:** Aprovado

**Versão:** 1.7

**Última atualização:** 30/07/2026

---

# Objetivo

Documentar todas as telas do sistema, seus componentes, estrutura visual e aderência ao Design System. Serve como referência para tasks de design system, code review e onboarding.

---

# Visão Geral

| # | Tela | Rota | Módulo | Tipo |
|---|------|------|--------|------|
| 1 | Central de Operações | `/` | operacoes | Dashboard |
| 2 | Rota de Cobrança | `/rota` | operacoes | Operação |
| 3 | Lista de Clientes | `/clientes` | cliente | Lista |
| 4 | Novo Cliente | `/clientes/novo` | cliente | Formulário |
| 5 | Detalhe do Cliente | `/clientes/:id` | cliente | Detalhe |
| 6 | Editar Cliente | `/clientes/:id/editar` | cliente | Formulário |
| 7 | Lista de Contratos | `/contratos` | contrato | Lista |
| 8 | Novo Contrato | `/contratos/novo` | contrato | Formulário |
| 9 | Detalhe do Contrato | `/contratos/:id` | contrato | Detalhe |
| 10 | Editar Contrato | `/contratos/:id/editar` | contrato | Formulário |
| 11 | Login | `/login` | auth | Formulário |
| 12 | Administração | `/admin` | admin | Dashboard |

**Total:** 12 telas | 5 módulos | 34 componentes (12 shared + 3 feedback + 13 módulo + 2 domínio + 4 auth/admin)

---

# Árvore de Componentes

```
App
├── Navbar (sticky top, sempre visível)
│   ├── NavLink: Central (/)
│   ├── NavLink: Clientes (/clientes)
│   ├── NavLink: Contratos (/contratos)
│   ├── NavLink: Caixa (/caixa)
│   ├── NavLink: Admin (/admin) [condicional: role=admin]
│   ├── Nome do usuário + botão Sair
│   └── Language Switcher (PT/EN/ES)
│
├── [Shared Components]
│   ├── Button (primary, secondary, danger, ghost)
│   ├── ButtonLink (Link + Button styles)
│   ├── EstadoTela (loading/error/empty wrapper)
│   ├── ConfirmModal
│   ├── ErrorBoundary (fallback com retry)
│   ├── StatusBadge (success, warning, danger, info, neutral)
│   ├── ErrorBanner (message, onRetry?, onDismiss?)
│   ├── SectionHeader (title, action?)
│   ├── SearchBar (value, onChange, onClear?)
│   ├── KpiCard (blue, green, yellow, gray)
│   ├── QuickActions (horizontal, vertical)
│   ├── Card (Root, Header, Title, Body, Dot, Indicator, Indicators, Badge, Actions)
│   ├── FeedbackOverlay (barra fixa superior, loading/success/error/warning/info)
│   ├── ClienteCard (list-item, detail)
│   └── ContratoCard (list-item, detail)
│
├── [Shared Auth]
│   ├── AuthContext (Provider: user, token, login, logout)
│   └── ProtectedRoute (sem token → /login)
│
└── [Pages]
    ├── LoginPage
    │   ├── Identidade visual (logo/nome do sistema)
    │   ├── Campo email
    │   ├── Campo senha
    │   └── Botão Entrar + feedback de erro
    │
    ├── AdminPage
    │   ├── EstadoTela > Conteúdo
    │   │   ├── KPIs consolidados (KpiCard × 4)
    │   │   ├── SectionHeader ("Operadores" + botão Novo)
    │   │   ├── SearchBar (busca por nome/email)
    │   │   └── OperadoresList (Card.Root list-item × N)
    │   └── OperadorForm (Modal: nome, email, senha, role)
    │
    ├── OperacoesDashboard
    │   ├── IndicadoresCards (4 cards: a receber, recebido, clientes, resultado)
    │   ├── RotaCobrancaSection (card c/ botão Iniciar Rota)
    │   ├── CobrancaList (cards de cobrança por cliente)
    │   └── PagamentosHojeModal (modal de pagamentos do dia)
    │
    ├── RotaPage
    │   ├── Header (voltar, título, contador, GPS badge, fechar)
    │   ├── Card do Cliente Atual
    │   │   ├── Info do cliente (nome, valor, parcelas, distância, situação)
    │   │   ├── Botões de ação (Navegar, WhatsApp, Ligar, Abrir)
    │   │   ├── Botão Pagar (primário)
    │   │   └── Botões de visita (Pular, Não Encontrado, Promessa)
    │   ├── Navegação (Anterior/Próximo)
    │   ├── PagamentoModal
    │   ├── Modal de Promessa (date picker)
    │   └── Modal de Comprovante (canvas + compartilhar)
    │
    ├── ClienteList
    │   ├── Header (voltar, título, Novo Cliente)
    │   ├── Busca (Search icon + input)
    │   └── EstadoTela > Cards de cliente
    │
    ├── ClienteNovo / ClienteEdit
    │   ├── Header (voltar, título)
    │   ├── Formulário (react-hook-form + zod)
    │   │   ├── Dados do Cliente (nome, telefone, CPF, comércio)
    │   │   ├── Endereço (logradouro, número, bairro, complemento, cidade, UF)
    │   │   └── Botões (Salvar, Cancelar)
    │
    ├── ClienteDetail
    │   ├── Header (voltar, nome do cliente, Editar)
    │   ├── EstadoTela > Conteúdo
    │   │   ├── ClienteInfo (card com dados do cliente)
    │   │   ├── Card de Contratos (contagem + links)
    │   │   └── SaldoInfo (card com situação financeira)
    │
    ├── ContratoList
    │   ├── Header (voltar dinâmico, título, Novo Contrato)
    │   ├── Filtro dropdown (buscar cliente)
    │   ├── Botão Limpar (inline)
    │   └── EstadoTela > Cards de contrato + Paginação
    │
    ├── ContratoNovo
    │   ├── Header (voltar, título)
    │   ├── Formulário
    │   │   ├── Seleção de cliente (dropdown com busca)
    │   │   ├── Condições (valor, juros, parcelas, data início)
    │   │   ├── Preview monetário (total, valor parcela, término)
    │   │   └── Botões (Salvar, Cancelar)
    │
    ├── ContratoDetail
    │   ├── Header (voltar, nome do cliente, Editar condicional)
    │   ├── EstadoTela > Conteúdo
    │   │   ├── ContratoInfo (resumo financeiro completo)
    │   │   ├── ParcelaList (grid de cards por parcela)
    │   │   ├── Pagamentos anteriores (lista)
    │   │   ├── Botão Excluir (condicional)
    │   │   ├── PagamentoModal
    │   │   ├── ConfirmModal (exclusão)
    │
    └── ContratoEdit
        ├── Header (voltar, título)
        ├── EstadoTela > Formulário
        │   ├── Nome do cliente (display somente)
        │   ├── Condições (valor, juros, parcelas, data início)
        │   ├── Preview monetário
        │   └── Botões (Salvar, Cancelar)
        └── Tela de bloqueio (se houver pagamentos)
```

---

# Mapeamento por Tela

## 1. Central de Operações (Dashboard)

**Arquivo:** `frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ [Navbar]                          │
├──────────────────────────────────┤
│ Central de Operações (h1)        │
│ [Erro banner - condicional]       │
│                                  │
│ ┌──────┬──────┬──────┬──────┐   │
│ │A Rec.│Receb.│Client│Result│   │  ← IndicadoresCards
│ │ azul │verde │ambar │cinza │   │
│ └──────┴──────┴──────┴──────┘   │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 📍 Rota de Cobrança  [Start]│ │  ← RotaCobrancaSection
│ │ N clientes · ~X km          │ │
│ └──────────────────────────────┘ │
│                                  │
│ Cobranças do Dia                 │
│ ┌──────────────────────────────┐ │
│ │ ● Nome Cliente               │ │  ← CobrancaCard
│ │   R$ valor · N parcelas      │ │
│ │   [Atrasado] [Nav][WA][Tel]  │ │
│ └──────────────────────────────┘ │
│ ...                              │
│                                  │
│ Visitados                        │
│ ┌──────────────────────────────┐ │
│ │ ● Nome Cliente (esmaecido)   │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header Navigation | ✅ Não se aplica (dashboard usa Navbar) | |
| Tipografia | ✅ `text-3xl font-semibold` no título | |
| Cores semânticas | ✅ `yellow` nos indicadores conforme token `color-warning` | |
| Cards | ✅ `rounded-md border p-4` | |
| Skeleton loading | ✅ `animate-pulse bg-gray-100` | |
| Espaçamento | ✅ `p-4`, `gap-4` conforme escala 8px | |
| Sem header `< Back` | ✅ Dashboard é exceção documentada | |

---

## 2. Rota de Cobrança

**Arquivo:** `frontend/src/modules/operacoes/pages/RotaPage.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Rota de Cobrança  GPS 1/5  ✕ │  ← Header
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ ● NOME CLIENTE    [Visitado] │ │  ← Card do cliente
│ │   R$ VALOR                   │ │
│ │   N parcelas · ~X km         │ │
│ │   [Atrasado]                 │ │
│ │                              │ │
│ │  [Navegar][WhatsApp][Ligar]  │ │  ← Ações rápidas
│ │  [Abrir]                     │ │
│ │                              │ │
│ │  ┌──────────────────────────┐│ │
│ │  │         PAGAR            ││ │  ← Botão primário
│ │  └──────────────────────────┘│ │
│ │                              │ │
│ │  [Pular][Não Encont.][Prom.] │ │  ← Ações de visita
│ └──────────────────────────────┘ │
│                                  │
│ [← Anterior]  3 clientes  [Próx→]│  ← Navegação
│ N visitados                      │
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header `< Título [Ação]` | ✅ `< Back Título Contador GPS ✕` | |
| Tipografia | ✅ `font-bold` no nome do cliente (destaque de operação) | |
| Cores | ✅ `green-600` no botão Pagar conforme token `color-success` | |
| Cores | ✅ `blue` no botão Navegar conforme token `color-info` | |
| Estados | ✅ Ativo: azul, Atrasado: vermelho | |
| Modais | ✅ Overlay `bg-black/40`, `rounded-md`, Escape key | |
| Feedback | ✅ FeedbackOverlay (barra fixa superior z-50) | |

---

## 3. Lista de Clientes

**Arquivo:** `frontend/src/modules/cliente/pages/ClienteList.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Clientes          [Novo Cliente]│  ← Header padrão
├──────────────────────────────────┤
│ 🔍 Buscar por nome...            │  ← Busca padrão DS
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Nome Cliente                 │ │  ← Card clicável
│ │ Comércio                     │ │
│ │ (11) 99999-9999              │ │
│ │ Cidade - UF                  │ │
│ └──────────────────────────────┘ │
│ ...                              │
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header `< Título [Ação]` | ✅ `< Back Clientes [Novo Cliente]` | |
| Busca | ✅ `Search icon + pl-10` conforme DS §360-379 | |
| Cards em lista | ✅ `rounded-md border p-4 hover:border-blue-300` | Sem sombra, conforme DS §267-273 |
| EstadoTela | ✅ Loading/Error/Empty tratados | |
| Tipografia | ✅ `text-base font-semibold` no nome | |

---

## 4. Novo Cliente / 6. Editar Cliente

**Arquivos:** `frontend/src/modules/cliente/pages/ClienteNovo.tsx`, `ClienteEdit.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Novo Cliente                   │  ← Header (sem ação à direita)
├──────────────────────────────────┤
│ Dados do Cliente (h2)            │
│ Nome *         [____________]    │
│ Telefone *     [____________]    │
│ CPF            [____________]    │
│ Comércio *     [____________]    │
│                                  │
│ Endereço (h2)                    │
│ Logradouro *   [____] [Número]   │
│ Bairro         [____] [Compl.]   │
│ Cidade         [________] [UF]   │
│                                  │
│ [Salvar]  [Cancelar]             │
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `< Back Título` (sem ação extra - OK para forms) | |
| Inputs | ✅ `rounded-md border px-3 py-2 text-base` | |
| Focus | ✅ `focus:ring-2 focus:ring-blue-500` | |
| Labels | ✅ Sem `:` no final | |
| Erros | ✅ `text-xs text-red-500` abaixo do campo | |
| Títulos de seção | ✅ `text-xl font-semibold text-gray-800` | |
| Botões | ✅ `Button` primário + secundário `flex-1` | |
| Skeleton | ✅ ClienteEdit tem skeleton próprio no loading | |

---

## 5. Detalhe do Cliente

**Arquivo:** `frontend/src/modules/cliente/pages/ClienteDetail.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Nome do Cliente      [Editar]  │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Dados do Cliente (h3)        │ │  ← ClienteInfo
│ │ Comércio                     │ │
│ │ CPF: 000.000.000-00          │ │
│ │ (11) 99999-9999              │ │
│ │ Endereço completo            │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Contratos (h3)               │ │  ← Card contratos
│ │ N contrato(s)                │ │
│ │ Ver contratos →              │ │
│ │ Novo contrato →              │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Situação Financeira (h3)     │ │  ← SaldoInfo
│ │ R$ VALOR                     │ │
│ │ Em Aberto                    │ │
│ │ R$ VALOR                     │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `< Back Nome [Editar]` | |
| Cards | ✅ `border p-4` sem sombra, conforme DS §160-165 | |
| Valores financeiros | ✅ `text-2xl font-bold` conforme DS | |
| Tipografia | ✅ `text-lg font-semibold` nos títulos de card | |
| EstadoTela | ✅ Loading/Error/Empty tratados | |

---

## 7. Lista de Contratos

**Arquivo:** `frontend/src/modules/contrato/pages/ContratoList.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Contratos        [Novo Contrato]│
├──────────────────────────────────┤
│ [Todos os clientes ▾]  [Limpar]  │  ← Filtro dropdown
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Nome Cliente                 │ │
│ │ Capital: R$ X    Juros: Y%  │ │
│ │ Saldo: R$ X      Total: R$ Y│ │
│ │ Parcela 1/20 • Início → Fim │ │
│ │                     [Ativo]  │ │
│ └──────────────────────────────┘ │
│ ...                              │
│                                  │
│ [Anterior]  1 de 3  [Próximo]    │  ← Paginação
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `< Back Clientes [Novo Contrato]` (volta dinâmico) | |
| Dropdown | ✅ `rounded-md border shadow-lg` | |
| Cards | ✅ `rounded-md border p-4` com `hover:border-blue-300` via ContratoCard | |
| Badges | ✅ `rounded-full` com cores semânticas | |
| Botão Limpar | ✅ `Button variant="ghost"` com ícone `X` | |
| Paginação | ✅ `Button variant="secondary"` | |
| EstadoTela | ✅ Loading/Error/Empty tratados | |

---

## 8. Novo Contrato

**Arquivo:** `frontend/src/modules/contrato/pages/ContratoNovo.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Novo Contrato                  │
├──────────────────────────────────┤
│ Cliente (h2)                     │
│ Cliente * [Selecione um cliente▾]│  ← Dropdown com busca
│                                  │
│ Condições do Contrato (h2)       │
│ Valor emprestado *  [________]   │
│ Juros (%) *    [___] [Parcelas]  │
│ Data de Início *   [________]    │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Total a Receber              │ │  ← Preview
│ │ R$ VALOR                     │ │
│ │ Nx de R$ VALOR               │ │
│ │ Término: data                │ │
│ └──────────────────────────────┘ │
│                                  │
│ [Salvar]  [Cancelar]             │
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `< Back Título` | |
| Inputs | ✅ Padrão com focus ring | |
| Preview | ✅ `bg-gray-50 rounded-md p-4` `text-2xl font-bold text-blue-600` | |
| Botões | ✅ `Button` primário + secundário | |
| Dropdown | ✅ Padrão consistente com ContratoList | |

---

## 9. Detalhe do Contrato

**Arquivo:** `frontend/src/modules/contrato/pages/ContratoDetail.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Nome Cliente         [Editar]  │  ← Editar condicional
├──────────────────────────────────┤
│ Resumo do Contrato (h3)          │
│ Saldo Dev. R$ X   Recebido R$ Y │  ← ContratoInfo
│ ──────────────────────────────── │
│ Valor Emp. R$ X   Total    R$ Y │
│ Parcelas Nx       Valor    R$ Y │
│ Início data       Término  data │
│ Juros X%          [Ativo]        │
│ [Ver Cliente]                    │
│                                  │
│ Parcelas (h3)                    │
│ Pagas: N  Pendentes: N  Venc: N │  ← Legenda
│ ┌──────┬──────┬──────┐          │
│ │ 01   │ 02   │ 03   │          │  ← ParcelaList (grid)
│ │data  │data  │data  │          │
│ │R$ X  │R$ X  │R$ X  │          │
│ │ ●    │ ●    │ ●    │          │
│ └──────┴──────┴──────┘          │
│ ...                              │
│                                  │
│ Pagamentos                       │
│ data    R$ X    N parcela(s)    │
│                                  │
│ [Excluir]                        │  ← Condicional
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `< Back NomeCliente [Editar]` | |
| ContratoInfo | ✅ Grid 2 colunas, estados semânticos | |
| ParcelaList | ✅ Cores por estado (Verde=Paga, Azul=Parcial, Amarelo=Pendente, Vermelho=Vencida) | |
| Modais | ✅ PagamentoModal + ConfirmModal com padrão DS | |
| Feedback | ✅ FeedbackOverlay (barra fixa superior z-50) | |

---

## 10. Editar Contrato

**Arquivo:** `frontend/src/modules/contrato/pages/ContratoEdit.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Editar Contrato                │
├──────────────────────────────────┤
│ Cliente: Nome                    │  ← Display somente
│                                  │
│ Condições do Contrato (h2)       │
│ Valor emprestado *  [________]   │
│ Juros (%) *    [___] [Parcelas]  │
│ Data de Início *   [________]    │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Total a Receber              │ │
│ │ R$ VALOR                     │ │
│ └──────────────────────────────┘ │
│                                  │
│ [Salvar]  [Cancelar]             │
└──────────────────────────────────┘
```

**Tela de Bloqueio (se houver pagamentos):**
```
┌──────────────────────────────────┐
│ ← Editar Contrato                │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ ⚠ Este contrato possui       │ │
│ │   pagamentos registrados e   │ │
│ │   não pode ser editado.      │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `t("contrato.editar")` com i18n | |
| Bloqueio | ✅ `bg-yellow-50 border-yellow-300` padrão warning | |
| EstadoTela | ✅ Loading/Error tratados | |

---

## 11. Login

**Arquivo:** `frontend/src/modules/auth/pages/LoginPage.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│                                  │
│        🏷️ Nome do Sistema        │
│                                  │
│  E-mail *      [_____________]   │
│  Senha *       [_____________]   │
│                                  │
│  [       Entrar       ]          │
│                                  │
│  ⚠ E-mail ou senha inválidos.   │  ← Erro condicional
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | — | Sem Navbar; tela isolada pré-auth |
| Inputs | ✅ `rounded-md border px-3 py-2 text-base` | |
| Botão | ✅ `Button primary` com `useFeedback().run()` | |
| Loading | ✅ Spinner no botão durante login | |
| Erro | ✅ `ErrorBanner` condicional abaixo do botão | |
| Acessibilidade | ✅ `type="email"`, `type="password"`, `autoComplete` | |
| i18n | ✅ `auth.*` (pt-BR, en, es) | |

---

## 12. Administração

**Arquivo:** `frontend/src/modules/admin/pages/AdminPage.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Administração                  │
├──────────────────────────────────┤
│ ┌────────┬────────┬────────┬────┐│
│ │  Opers │Clientes│Contr At│Res ││  ← KpiCard × 4 (admin)
│ │    3   │   45   │   12   │ R$ ││
│ └────────┴────────┴────────┴────┘│
│                                  │
│ Operadores           + Novo Op.  │  ← SectionHeader
│ [🔍 Buscar por nome/email...  ]  │  ← SearchBar
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Admin Joao     Administrador │ │  ← Card.Root list-item
│ │ joao@cobranca.com            │ │     StatusBadge: role
│ │ 15 clientes · 4 contratos    │ │     Card.Indicators: stats
│ │                  [✏️] [🗑️]   │ │     Card.Actions
│ ├──────────────────────────────┤ │
│ │ Maria Op       Operador      │ │
│ │ maria@cobranca.com           │ │
│ │ 30 clientes · 8 contratos    │ │
│ │                  [✏️] [🗑️]   │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘

Modal OperadorForm (criação/edição):
┌──────────────────────────────────┐
│ Novo Operador / Editar Operador  │
├──────────────────────────────────┤
│ Nome *        [_____________]    │
│ E-mail *      [_____________]    │
│ Senha *       [_____________]    │  ← Oculto na edição
│ Papel *       [admin ▾]          │  ← Select admin/operator
│                                  │
│ [Cancelar]        [Salvar]       │
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `t("admin.title")` com i18n | |
| KPIs | ✅ Reusa `KpiCard` (blue, green, yellow, gray) | |
| Busca | ✅ `SearchBar` com placeholder i18n | |
| Cards | ✅ `Card.Root list-item` com Header/Body/Actions | |
| Status | ✅ `StatusBadge`: admin=info, operator=neutral | |
| Formulário | ✅ `react-hook-form` + `zod` + `useFeedback().run()` | |
| Modal | ✅ `ConfirmModal` para remoção de operador | |
| Estados | ✅ `EstadoTela` (loading/empty/error) na lista | |
| Restrições | ✅ Admin não remove a si mesmo; não rebaixa o próprio role | BR-069, BR-070 |
| i18n | ✅ `admin.*` (pt-BR, en, es) | |

---

# Design System Reference (Resumo)

## Cores (Tokens)
| Semântica | Tailwind | Hex |
|-----------|----------|-----|
| Primary | `blue-600` | #2563EB |
| Success | `green-600` | #16A34A |
| Warning | `yellow-600` | #CA8A04 |
| Danger | `red-600` | #DC2626 |
| Info | `blue-600` | #2563EB |

## Tipografia
| Uso | Classe |
|-----|--------|
| Título da Página | `text-3xl font-semibold` |
| Título de Seção | `text-xl font-semibold text-gray-800` |
| Título de Card | `text-lg font-semibold` |
| Valor Financeiro | `text-2xl font-bold` |
| Texto Principal | `text-base` |
| Texto Auxiliar | `text-sm` |
| Badges/Legendas | `text-xs font-medium` |

## Espaçamento
Escala 8px: `4, 8, 16, 24, 32, 40, 48`

## Componentes Base
| Componente | Classe Base |
|------------|-------------|
| Card | `rounded-md border p-4` |
| Input | `rounded-md border px-3 py-2 text-base` |
| Button Primary | `bg-blue-600 text-white hover:bg-blue-700` |
| Badge | `rounded-full text-xs font-medium` |

---

# Convenções de Nomenclatura

## Arquivos
- Pages: `PascalCase.tsx` (ex: `ClienteList.tsx`)
- Components: `PascalCase.tsx` (ex: `ClienteInfo.tsx`)
- Services: `*.service.ts` (ex: `cliente.service.ts`)
- Utils: `camelCase.ts` (ex: `formatarData.ts`)

## Props
- Callbacks: `on{Evento}` (ex: `onClose`, `onSuccess`)
- Boleano: `is{Estado}` ou `has{Algo}` (ex: `loading`, `danger`)

## i18n Keys
- `modulo.chave` (ex: `cliente.nome`, `contrato.juros`)
- `common.chave` para strings compartilhadas
- `modulo.validacao.chave` para mensagens de validação

---

# Checklist para Novas Telas

Ao implementar uma nova tela, verificar:

- [ ] Header segue padrão `< Back Título [Ação]`
- [ ] Inputs usam `rounded-md border px-3 py-2 text-base`
- [ ] Focus visível com `focus:ring-2 focus:ring-blue-500`
- [ ] Cores usam apenas tokens da paleta (sem `emerald`, `purple`, `amber`)
- [ ] Tipografia segue escala definida
- [ ] Espaçamento usa múltiplos de 8 (evitar `gap-3`)
- [ ] Estados tratados: Loading, Error, Empty, Sucesso
- [ ] Ícones apenas do Lucide React
- [ ] Labels sem `:` no final
- [ ] Cards clicáveis usam `hover:border-blue-300`
- [ ] Botões usam componente `Button` compartilhado (nunca `<button>` inline)
- [ ] Strings via `t()` do i18n, nunca hardcoded
- [ ] Valores financeiros usam `formatCurrency()`
- [ ] Busca textual segue padrão `Search icon + pl-10`
- [ ] Layout `max-w-2xl mx-auto p-4`

---

# Histórico de Correções

| Data | Versão | Mudança |
|------|--------|---------|
| 02/07/2026 | 1.0 | Mapeamento inicial das 10 telas |
| 02/07/2026 | 1.2 | Roadmap v2.0: Fases definidas, status por tela, referências atualizadas |
| 04/07/2026 | 1.3 | Adicionado ClienteCard e ContratoCard na árvore de componentes |
| 04/07/2026 | 1.4 | Removidas pendências de gap-3 e hover, padronização visual concluída |
| 30/07/2026 | 1.6 | Adicionada tela 11 (Login) e 12 (Admin); auth context e protected route; Navbar com admin link condicional |
| 30/07/2026 | 1.7 | Dark mode em LoginPage e Admin Panel (tokens CSS); scroll-to-error em todos os formulários (shouldFocusError + setFocus); field-level errors em ContratoNovo/Edit e GastoForm |

# Referências

- `product/04-ROADMAP.md` — Roadmap v2.0 com fases e prioridades
- `engineering/tasks/2026-07-02/CHECKLIST.md` — Checklist de preparação para Fase 1
- `design/02-DESIGN-SYSTEM.md` — Regras visuais oficiais
- `design/05-TOKEN.md` — Design tokens implementados
- `design/01-UX.md` — Perfil do operador e jornadas
- `design/03-COMPONENT-ARCHITECTURE.md` — Arquitetura dos componentes
- `design/04-UI-COMPONENTS.md` — Catálogo de componentes da UI
- `design/06-UI-PATTERNS.md` — Padrões de composição e anti-patterns
- `03-FRONTEND.md` — Arquitetura do frontend
