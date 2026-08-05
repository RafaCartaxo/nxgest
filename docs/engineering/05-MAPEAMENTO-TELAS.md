# MAPEAMENTO DE TELAS

**Status:** Aprovado

**Versão:** 1.25

**Última atualização:** 03/08/2026

---

# Objetivo

Documentar todas as telas do sistema, seus componentes, estrutura visual e aderência ao Design System. Serve como referência para tasks de design system, code review e onboarding.

---

# Visão Geral

| # | Tela | Rota | Módulo | Tipo |
|---|------|------|--------|------|
| 1 | Central de Operações | `/` | operacoes | Dashboard |
| 2 | Rota de Cobrança | `/rota` | operacoes | Operação |
| 2b | Atendidos Hoje | `/atendidos` | operacoes | Lista |
| 2c | Cobranças (Pendentes do Dia / Saldo em Atraso) | `/cobrancas` | operacoes | Lista |
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
| 13 | Super Admin (Empresas) | `/admin/empresas` | admin | Dashboard |
| 14 | Admin em contexto de empresa | `/admin/empresas/:id` | admin | Dashboard |
| 15 | Detalhe do Operador | `/admin/operadores/:id` | admin | Detalhe |
| 16 | Caixa | `/caixa` | caixa | Dashboard |
| 17 | Gastos | `/gastos` | gasto | Formulário |
| 18 | Perfil (Meus dados) | `/perfil` | auth | Formulário |

**Total:** 19 telas (páginas) · 20 rotas | 7 módulos | 45 componentes (15 shared + 2 feedback + 3 auth + 25 módulo)

> **Nota de navegação:** esta tabela é o espelho das rotas de `frontend/src/App.tsx`. Qualquer rota nova (ou removida) exige atualizar esta tabela + a seção correspondente — ver `SKILL-009-documentation-sync.md`.

---

# Árvore de Componentes

```
App
├── AppLayout (sidebar lateral desktop + drawer mobile; PLAN-036)
│   ├── [operator/socio/admin] NavLink: Central (/)
│   ├── [operator/socio/admin] NavLink: Clientes (/clientes) [módulo clientes]
│   ├── [operator/socio/admin] NavLink: Contratos (/contratos) [módulo contratos]
│   ├── [operator/socio/admin] NavLink: Caixa (/caixa) [módulo caixa]
│   ├── [socio/admin] NavLink: Administração (/admin) — sócio = painel escopado à subárvore (PLAN-032)
│   ├── [super_admin] NavLink: Empresas (/admin/empresas) [PLAN-030]
│   │      — super admin NÃO vê as páginas operacionais (sem dados próprios)
│   ├── Engrenagem (dropdown de configurações):
│   │   ├── Meus dados (/perfil) [PLAN-029]
│   │   ├── Temas (5 paletas + claro/escuro) [PLAN-031]
│   │   ├── Idioma (PT/EN/ES)
│   │   └── Sair
│
├── [Shared Components]
│   ├── Button (primary, secondary, danger, ghost)
│   ├── ButtonLink (Link + Button styles)
│   ├── EstadoTela (loading/error/empty wrapper)
│   ├── ConfirmModal
│   ├── Modal (base compartilhado — Escape/backdrop configurável, usado pelos modais)
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
    │   ├── Campo senha (+ toggle mostrar/ocultar — Eye/EyeOff) [PLAN-029]
    │   └── Botão Entrar + feedback de erro
    │
    ├── PerfilPage
    │   ├── Header (voltar, título "Meus dados")
    │   ├── Card com dados do usuário (nome, e-mail, badge de role)
    │   └── Formulário "Trocar senha" (senha atual, nova senha, confirmação) [PLAN-029]
    │
    ├── AdminPage
    │   ├── Contexto: header <h1> por nível — admin self: nome do usuário + badge Administrador; super admin (/admin/empresas/:id): nome da empresa + badge Super Admin [PLAN-022]
    │   ├── Redirect: super_admin em /admin → /admin/empresas
    │   ├── Bloco "Equipe": KPIs Admins × Operadores (KpiCard × 2)
    │   ├── Bloco "Operação": Clientes, Contratos Ativos, Recebido hoje (KpiCard × 3) — **totais da equipe** com subtítulo "da equipe · N"; clique → ContribuicaoModal (por operador) [PLAN-030 / BR-091]
    │   ├── Abas: Equipe (default) / Meus dados (admin)
    │   ├── SectionHeader ("Operadores" + botão Novo)
    │   ├── SearchBar (busca por nome/email)
    │   └── OperadoresList (Card.Root list-item × N)
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
    ├── AtendidosPage
    │   ├── Header (voltar, título, filtro Todos/Visitado/Não encontrado/Promessa/Pagos)
    │   ├── CobrancaList (deduplicada: exclui clientes já pagos)
    │   └── Bloco "Pagos Hoje" (PagamentoDoDia cards)
    │
    ├── CobrancaListPage
    │   ├── Header (voltar, título)
    │   ├── Banner resumo de atrasados (filtro `atrasado`)
    │   └── CobrancaCard por cliente
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
    ├── ContratoEdit
    │   ├── Header (voltar, título)
    │   ├── EstadoTela > Formulário
    │   │   ├── Nome do cliente (display somente)
    │   │   ├── Condições (valor, juros, parcelas, data início)
    │   │   ├── Preview monetário
    │   │   └── Botões (Salvar, Cancelar)
    │   └── Tela de bloqueio (se houver pagamentos)
    │
    ├── CaixaPage
    │   ├── Header (voltar, título, Liquidar semana)
    │   ├── KPIs "Hoje" (a receber hoje, recebido semana, cobrado hoje)
    │   ├── KPIs "Semana" (vendas, gastos, resultado — com navegação de semana)
    │   ├── KPIs "Caixa" (lucro, saldo atual, caixa base + último fechamento)
    │   ├── Bloco "Histórico de ajustes" (auditoria)
    │   ├── Bloco "Movimentações" (entrada/saída, origem, cliente, categoria)
    │   ├── Bloco "Ajustar caixa" (condicional: admin/super_admin)
    │   └── Modais: ParcelasHojeModal, PagamentosHojeModal, PagamentosPeriodoModal, ContratosSemanaModal, GastosPeriodoModal, ConfirmModal (liquidação)
    │
    ├── GastoPage
    │   ├── Header (voltar, título)
    │   └── GastoForm (valor, categoria, data, observações)
    │
    ├── OperadorDetail
    │   ├── Header (voltar, nome do operador, badge de role)
    │   ├── E-mail do operador
    │   ├── KPIs "Dados do operador" (total clientes, contratos ativos)
    │   ├── KPIs "Caixa do operador" (caixa base, saldo, lucro, a receber, recebido)
    │   ├── Bloco "Ajustar caixa base do operador" (valor + motivo)
    │   ├── Bloco "Histórico de ajustes"
    │   └── Bloco "Contratos do operador" (list-item → modo admin somente leitura)
```

---

# Mapeamento por Tela
## 1. Central de Operações (Dashboard)
**Header:** PageHeader limpo — ícone suave (`bg-primary-light`) + título (Sora) + subtítulo + **data do dia (eyebrow)** (PLAN-035/038).

**Arquivo:** `frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ [AppLayout · sidebar lateral]    │
├──────────────────────────────────┤
│ Terça, 4 de agosto               │  ← eyebrow (data por idioma)
│ ● Central de Operações (h1 Sora) │  ← PageHeader (ícone suave + título)
│                                  │
│ ┌──────┬──────┬──────┬──────┐   │
│ │A Rec.│Receb.│Result│Client│   │  ← IndicadoresCards (7 KPIs)
│ │ azul │verde │*     │ambar │   │     (aReceberHoje, recebidoHoje, resultadoDoDia,
│ └──────┴──────┴──────┴──────┘   │      clientesParaCobrar, atrasado, aVencer, gastosHoje)
│   ┌──────┬──────┬──────┐         │  ← KPIs restantes (navegam /cobrancas, parcelas-semana, gastos)
│   │Atras.│A Vinc│Gastos│         │
│   └──────┴──────┴──────┘         │
│                                  │
│ Ações rápidas                    │  ← QuickActions (grade de cards-ícone)
│ [Receber] [Rota] [Novo] [Caixa]  │     gated por módulo (PLAN-038)
│                                  │
│ Cobranças do Dia                 │
│ ┌──────────────────────────────┐ │
│ │ ● Nome Cliente               │ │  ← CobrancaCard
│ │   R$ valor · N parcelas      │ │
│ │   [Atrasado] [Nav][WA][Tel]  │ │
│ └──────────────────────────────┘ │
│ ...                              │
└──────────────────────────────────┘
```

**Comportamento:**
- Ordem: **KPIs → Ações rápidas → Cobranças do dia** (estado → ação → fila).
- Ações rápidas: Receber → `/cobrancas` · Minha rota → `/rota` · Novo cliente → `/clientes/novo` · Fechar caixa → `/caixa` — cada uma só se o módulo estiver ativo.
- `RotaCobrancaSection` foi **removida da Central** (a ação "Minha rota" + `/rota` cobrem) — PLAN-038.

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header Navigation | ✅ Não se aplica (dashboard usa AppLayout/sidebar) | |
| Tipografia | ✅ Título em Sora (`font-display`) | |
| Cores semânticas | ✅ KPIs com barra de tom + `value-lg` (PLAN-038) | |
| Cards | ✅ `rounded-xl border bg-card` | |
| Skeleton loading | ✅ `animate-pulse` (sem cor fixa da paleta) | |
| Espaçamento | ✅ `p-4`, `gap-4` conforme escala 8px | |
| Sem header `< Back` | ✅ Dashboard é exceção documentada | |

---

---
## 2. Rota de Cobrança
**Header:** PageHeader — banner em gradiente + ícone `Route` + título + subtítulo; status GPS e fechamento no header (PLAN-035).

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

---
## 2b. Atendidos Hoje
**Header:** PageHeader — banner em gradiente + ícone `CheckCircle2` + título + subtítulo (PLAN-035).

**Arquivo:** `frontend/src/modules/operacoes/pages/AtendidosPage.tsx` · Rota `/atendidos` · Comporta o filtro da lista de cobranças

```
┌──────────────────────────────────┐
│ ← Atendidos Hoje     [Todos][+]  │  ← Filtro: all | visitado | naoLocalizado | promessa | PAGOS
├──────────────────────────────────┤
│ (filtro all)                     │
│ ● Cobrança NÃO paga (card)       │  ← CobrancaList (deduplicada: exclui clientes já pagos)
│ ...                              │
│ Pagos Hoje (bloco)               │  ← renderPagamentos()
│ ┌──────────────────────────────┐ │
│ │ ● Cliente · R$ valor         │ │  ← PagamentoDoDia card
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Comportamento:**

| Filtro | Resultado |
|--------|-----------|
| `all` | Atendimentos não pagos + bloco de pagamentos do dia abaixo. Clientes que já pagaram **não** aparecem duplicados (dedup por `clienteId` contra `pagamentosHoje`) |
| `PAGOS` | Apenas os pagamentos do dia |
| demais | Cobranças com aquele `resultadoOperacional` |

---

---
## 2c. Cobranças (Pendentes do Dia / Saldo em Atraso)
**Header:** PageHeader — banner em gradiente + ícone `ClipboardList` + título dinâmico (Pendentes do Dia / Saldo em Atraso) + subtítulo (PLAN-035).

**Arquivo:** `frontend/src/modules/operacoes/pages/CobrancaListPage.tsx` · Rota `/cobrancas` · Filtro `atrasado`

```
┌──────────────────────────────────┐
│ ← Atrasados                      │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ ⚠ N clientes em atraso ·    │ │  ← Resumo (banner danger)
│ │   R$ TOTAL                   │ │
│ └──────────────────────────────┘ │
│ Nome Cliente · R$ · parcelas     │  ← CobrancaCard
│ ...                              │
└──────────────────────────────────┘
```

**Comportamento:**

- Banner resumo aparece apenas no filtro `atrasado` — contagem distinta de clientes + soma do `totalPendente` (ao vivo, de `GET /api/operacoes/cobrancas`)
- Cliente em atraso clicável → abre o contrato (`/contratos/:id`)
- > **Decisão (PLAN-033, 03/08):** o bloco "Histórico de atrasos" (snapshots `snapshots_atraso` + gráfico de evolução) foi **removido** — dependia de snapshot diário gravado só ao abrir as Cobranças (dado esparso, sem job agendado) e duplicava o banner ao vivo sem utilidade. O endpoint `GET /api/operacoes/historico-atrasos` e o registro do snapshot permanecem no backend (API-UC-022).

---

---
## 3. Lista de Clientes
**Header:** PageHeader — banner em gradiente + ícone `Users` + título + subtítulo; ação "Novo Cliente" no header (PLAN-035).

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

---
## 4. Novo Cliente / 6. Editar Cliente
**Header:** compacto — voltar + título + ação (PLAN-035).

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

---
## 5. Detalhe do Cliente
**Header:** compacto — voltar + título + ação (PLAN-035).

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
│ │ Situação Financeira          │ │  ← SituacaoFinanceira (grade 2×2 KpiCard)
│ │ ┌──────────────┬────────────┐│ │
│ │ │Saldo Devedor │ Em atraso  ││ │  · danger: R$ em atraso
│ │ │R$ VALOR      │ R$ VALOR   ││ │  · subtitle "N parcelas · D dias"
│ │ ├──────────────┼────────────┤│ │
│ │ │Vence hoje    │ Lucro prev.││ │  · info + green (P015)
│ │ │R$ VALOR      │ R$ VALOR   ││ │
│ │ └──────────────┴────────────┘│ │
│ │ Último pagamento: dd/mm · R$ │ │  ← linha discreta (se houver)
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

---
## 7. Lista de Contratos
**Header:** PageHeader — banner em gradiente + ícone `FileText` + título + subtítulo; ação "Novo Contrato" no header (PLAN-035).

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
│ │ ● 4 parcelas em atraso·R$240 │ │  ← linha danger (BR-099), só se atraso
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

---
## 8. Novo Contrato
**Header:** compacto — voltar + título + ação (PLAN-035).

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

---
## 9. Detalhe do Contrato
**Header:** compacto — voltar + título + ação (PLAN-035).

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
| ParcelaList | ✅ Cores por estado (Verde=Paga, Azul=Parcial, Azul=Vence hoje, Amarelo=Pendente futuro, Vermelho=Vencida — inclui Parcial com vencimento passado) | |
| Modais | ✅ PagamentoModal + ConfirmModal com padrão DS | |
| Feedback | ✅ FeedbackOverlay (barra fixa superior z-50) | |

---

---
## 10. Editar Contrato
**Header:** compacto — voltar + título + ação (PLAN-035).

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

---
## 11. Login
**Header:** formulário centralizado (fora do padrão de tela interna).

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

**Pós-login (roteado por perfil, PLAN-021 / BR-081):** `operator` → `/`; `admin` → `/admin`; `super_admin` → `/admin/empresas`.

---

---
## 12. Administração (14 — contexto de empresa)
**Header:** PageHeader — banner em gradiente + ícone `Settings` + título dinâmico (empresa/nome) + subtítulo; badge de papel; voltar quando dentro de empresa (PLAN-035).

**Arquivo:** `frontend/src/modules/admin/pages/AdminPage.tsx`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ <Nome da Empresa>       [Empresa]│  ← Contexto (h1 + StatusBadge info)
├──────────────────────────────────┤
│ ┌── Equipe ────────────────────┐│
│ ┌────────┬────────┐            ││
│ │ Admins │  Opers │            ││  ← KpiCard × 2 (clique → EquipeModal)
│ │    1   │    3   │            ││
│ └────────┴────────┘            ││
│ ┌── Operação ─────────────────┐│
│ ┌────────┬────────┬──────────┐││
│ │Clientes│Contr At│ Recebido │││  ← KpiCard × 3 (totais da equipe — BR-091)
│ │   45   │   12   │   R$     │││     clique → ContribuicaoModal (por operador)
│ └────────┴────────┴──────────┘││
│                                  │
│ Operadores           + Novo Op.  │  ← SectionHeader
│ [🔍 Buscar por nome/email...  ]  │  ← SearchBar
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Admin Joao     Administrador │ │  ← Card.Root list-item
│ │ joao@cobranca.com            │ │     StatusBadge: role
│ │ 15 clientes · 4 contratos    │ │     Card.Indicators: stats
│ │                  [✏️] [🗑️]   │ │     Card.Actions (ocultas no card "Eu")
│ ├──────────────────────────────┤ │
│ │ Maria Op       Operador [Eu] │ │  ← StatusBadge success "Eu"
│ │ maria@cobranca.com           │ │     (usuário logado — sem Editar/Remover)
│ │ 30 clientes · 8 contratos    │ │
│ │                              │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘

Modal EquipeModal (clique em Admins/Operadores):
┌──────────────────────────────────┐
│ Administradores / Operadores     │
├──────────────────────────────────┤
│ [Admin Joao]  [Administrador]    │  ← lista filtrada por role + stats
│   15 clientes · 4 contratos   → │     (clique → OperadorDetail)
│ [Maria Op]    [Operador]         │
│                                  │
│ [Fechar]                         │
└──────────────────────────────────┘

Modal ContribuicaoModal (clique num KPI de Operação):
┌──────────────────────────────────┐
│ Clientes por operador            │  ← ou Contratos/Recebido hoje
├──────────────────────────────────┤
│ Total: 45                        │  ← totais da equipe (BR-091)
│ ┌──────────────────────────────┐ │
│ │ Maria Op   [Operador]    30 →│ │  ← cada operador: quanto geriu
│ │ Admin Joao [Admin]       15 →│ │     (clique → OperadorDetail)
│ └──────────────────────────────┘ │
│ [Fechar]                         │
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
| Header | ✅ Nome da empresa como `<h1>` (padrão OperadorDetail) ou `t("admin.title")` | PLAN-021 |
| Contexto | ✅ Badge "Empresa" (`StatusBadge info`) quando em contexto | |
| Redirect | ✅ super_admin em `/admin` → `/admin/empresas` | BR-081 |
| KPIs | ✅ Reusa `KpiCard` em blocos com `SectionHeader` (Equipe / Operação) | PLAN-021 |
| Contagem | ✅ Admins (role admin) × Operadores (role operator) separados | BR-082 |
| KPIs clicáveis | ✅ Equipe abre `EquipeModal` (com stats + navegação ao operador); KPIs de Operação abrem `ContribuicaoModal` (por operador) | PLAN-024 / PLAN-030 |
| Escopo KPIs Operação | ✅ **Total da equipe** (admins + operadores + próprio), subtítulo "da equipe · N"; dados via `GET /api/admin/equipe` | PLAN-030 / BR-091 |
| Abas | ✅ Equipe (default) / Meus dados (admin) | PLAN-020 |
| Busca | ✅ `SearchBar` com placeholder i18n | |
| Cards | ✅ `Card.Root list-item` com Header (`flex-wrap`)/Body/Actions; admins no topo (role rank + nome) | PLAN-024 |
| Usuário corrente | ✅ Card do próprio usuário com tag "Eu" (`StatusBadge success`), sem Editar/Remover | PLAN-024 |
| Status | ✅ `StatusBadge`: admin=info, operator=neutral, Eu=success | |
| Formulário | ✅ `react-hook-form` + `zod` + `useFeedback().run()` | |
| Modal | ✅ `ConfirmModal` para remoção de operador; `EquipeModal`/`ContribuicaoModal` no padrão `Modal` base | PLAN-026 / PLAN-030 |
| QuickActions | ✅ Variantes `blue`/`green`/`gray`/`warning`/`danger` (vermelho no remover) | PLAN-024 |
| Estados | ✅ `EstadoTela` (loading/empty/error) na lista | |
| Restrições | ✅ Admin não remove a si mesmo; não rebaixa o próprio role | BR-069, BR-070 |
| i18n | ✅ `admin.*` (pt-BR, en, es) | |

---

---
## 13. Super Admin — Gestão de Empresas
**Header:** PageHeader — banner em gradiente + ícone `Building2` + título + subtítulo; ação "Nova Empresa" no header (PLAN-035).

 **Arquivo:** `frontend/src/modules/admin/pages/SuperAdminPage.tsx`

**Rota:** `/admin/empresas` (acesso restrito a `role = super_admin`)

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ [Banner em gradiente: título +   │  ← bg-gradient-accent (PLAN-031)
│  "Gerencie empresas, acessos e   │
│  módulos" + ícone Building2]     │
├──────────────────────────────────┤
│ ┌────────┬────────┬────────┐    │
│ │Empresas│Opers   │Clientes│    │  ← KpiCard × 3 (super admin)
│ │   2    │   5    │   45   │    │
│ └────────┴────────┴────────┘    │
│                                  │
│ Empresas               + Nova   │  ← SectionHeader
│ ┌──────────────────────────────┐ │
│ │ Desenvolvimento              │ │  ← Card.Root list-item
│ │ 3 operadores · 12 clientes  │ │     Card.Body: stats
│ │ 8 contratos ativos          │ │
│ │             [Configurar][→] │ │     Card.Actions: modulos + drill-down
│ └──────────────────────────────┘ │
│                                  │
│ [+ Nova Empresa]  ← Modal base  │  ← EmpresaForm (Modal, não backdrop cru)
└──────────────────────────────────┘

Modal ModulosModal (ação "Configurar"):
┌──────────────────────────────────┐
│ Módulos — <Empresa>              │
├──────────────────────────────────┤
│ Ative/desative módulos da        │
│ empresa (whitelabel, BR-092)     │
│ [✓ Clientes] [✓ Contratos]       │  ← toggles; dependências desabilitadas
│ [✓ Caixa]   [✗ Gastos (desabil.)]│     (gastos requer caixa)
│ [✓ Rota] [✓ Cobranças] [✓ Atend.]│
│                                  │
│ [Cancelar]  [Salvar]             │  ← PATCH /modulos
└──────────────────────────────────┘
```

**Comportamento:**
- Lista todas as empresas com KPIs (totalUsuarios, totalClientes, contratosAtivos) + `modulos` via JOIN com usuários/clientes/contratos
- "Acessar" navega para `/admin/empresas/:id` (AdminPage filtrado por empresa, com contexto do nome da empresa)
- "Configurar" abre o `ModulosModal` (7 módulos, dependências validadas — `gastos⇒caixa`, `rota/cobrancas/atendidos⇒contratos`) e salva via `PATCH /api/admin/empresas/:id/modulos`
- "+ Nova Empresa" abre `EmpresaForm` no **Modal base** (cria empresa + admin inicial em transação atômica)
- KPIs globais somam stats de todas as empresas

---

---
## 15. Detalhe do Operador
**Header:** compacto — voltar + título + ação (PLAN-035).

**Arquivo:** `frontend/src/modules/admin/pages/OperadorDetail.tsx` · Rota `/admin/operadores/:id`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Nome do Operador      [Role]   │  ← Header + StatusBadge (admin=info, operator=neutral)
├──────────────────────────────────┤
│ E-mail: op@empresa.com           │
│                                  │
│ Dados do operador (h2)           │
│ ┌──────────┬──────────┐         │
│ │ Clientes │ Contr.Atv│         │  ← KpiCard totalClientes / contratosAtivos
│ └──────────┴──────────┘         │
│                                  │
│ Caixa do operador (h2)           │
│ ┌──────┬──────┬──────┬──────┐   │
│ │Caixa │Saldo │Lucro │...   │   │  ← KpiCard caixa (via ?usuarioId=)
│ └──────┴──────┴──────┴──────┘   │
│                                  │
│ Ajustar caixa base (h2)          │
│ [R$ valor] [Ajustar]  [motivo]   │  ← grava no operador-alvo (BR-078/088)
│                                  │
│ Histórico de ajustes (h2)         │
│                                  │
│ Contratos do operador (h2)        │
│ Cliente · N/N parcelas  [→]      │  ← Card.Root list-item → /contratos/:id?usuarioId=
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `< Back Nome [badge]` | |
| KPI cards | ✅ `KpiCard` | |
| Contratos | ✅ `Card.Root` list-item com `Card.Actions` | |
| EstadoTela | ✅ Loading/Error/Empty | |
| Feedback | ✅ `useFeedback()` no ajuste | |

**Comportamento:**
- Ajuste de caixa grava no operador-alvo via `?usuarioId=` (BR-078), com `motivo` obrigatório e auditoria (BR-088).
- Contratos abrem em **modo admin somente leitura** (`/contratos/:id?usuarioId=&empresaId=`) — sem editar/excluir/pagar; única ação é **Estornar** pagamento (P013 fatia 1, PLAN-028).

---

---
## 16. Caixa
**Header:** PageHeader — banner em gradiente + ícone `Wallet` + título + subtítulo; ação "Fechar Semana" no header (PLAN-035).

**Arquivo:** `frontend/src/modules/caixa/pages/CaixaPage.tsx` · Rota `/caixa`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Caixa        [Liquidar semana ›]│  ← Header
├──────────────────────────────────┤
│ Hoje (h2)                        │
│ ┌────────┬────────┬────────┐    │
│ │A Rec.  │Receb.  │Cobrado │    │  ← KpiCard: aReceberHoje / recebidoSemana / recebidoHoje (clicáveis)
│ │ Hoje   │Semana  │ Hoje   │    │
│ └────────┴────────┴────────┘    │
│                                  │
│ ‹ Semana ›   DD/MM a DD/MM       │  ← Navegação de semana
│ ┌────────┬────────┬────────┐    │
│ │Vendas  │Gastos  │Result. │    │  ← KpiCard: vendasSemana / gastosSemana / resultadoSemana
│ └────────┴────────┴────────┘    │
│                                  │
│ Caixa (h2)                       │
│ ┌────────┬────────┬────────┐    │
│ │ Lucro  │Saldo   │Caixa   │    │  ← KpiCard: lucro / saldoAtual / caixaBase
│ └────────┴────────┴────────┘    │
│                                  │
│ [Registrar Gasto]                 │  ← Button → /gastos
│                                  │
│ Histórico de ajustes (h2)         │
│ R$ ant → R$ novo · por X · motivo│  ← auditoria_caixa
│                                  │
│ Movimentações (h2)                │
│ + R$ · Pagamento · Cliente        │  ← lista movimentações (origem/badge Estorno/categoria)
│                                  │
│ Ajustar caixa (h2, admin only)    │
│ [R$ valor] [Ajustar]              │
│ [motivo obrigatório]              │
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header `< Back Título [Ação]` | ✅ Back + título + ação "Liquidar semana" | |
| KPI cards | ✅ `KpiCard` (blue/green/yellow/gray) | |
| Modais | ✅ Padrão `Modal` base + `ConfirmModal` na liquidação | |
| Feedback | ✅ `useFeedback().run()` em ajuste/liquidação | |
| Skeleton loading | ✅ `animate-pulse` em todos os blocos | |
| Formatação financeira | ✅ `formatCurrency` / `maskMonetario` | |
| Ajuste exclusivo admin | ✅ `canAdjust` = role admin/super_admin (BR-079) | |

**Comportamento:**
- KPIs "Hoje" e "Semana" abrem modais de composição (ParcelasHojeModal, PagamentosHojeModal, PagamentosPeriodoModal, ContratosSemanaModal, GastosPeriodoModal).
- Navegação de semana (`semanaOffset`) recalcula `dataInicio`/`dataFim` e recarrega os indicadores semanais.
- "Histórico de ajustes" vem de `GET /api/caixa/auditoria` (BR-088) — visível também ao operador (apenas o próprio histórico).
- "Ajustar caixa" só para admin/super_admin; motivo obrigatório.

---

---
## 17. Gastos
**Header:** PageHeader — banner em gradiente + ícone `Receipt` + título + subtítulo (PLAN-035).

**Arquivo:** `frontend/src/modules/gasto/pages/GastoPage.tsx` · Rota `/gastos`

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Gastos                         │  ← Header (sem ação à direita)
├──────────────────────────────────┤
│ Total de gastos hoje (legenda)   │
│                                  │
│ Novo gasto (h2)                  │
│ Valor *      [R$ ____]           │
│ Categoria *  [Selecione ▾]       │  ← GastoForm
│ Data *       [____]              │
│ Observações  [____________]      │
│                                  │
│ [Salvar]  [Cancelar]             │
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `< Back Título` (sem ação - OK para forms) | |
| Formulário | ✅ `GastoForm` com validação por schema (`gasto.schema.ts`) | |
| Categorias | ✅ Ícones por categoria (`CATEGORIA_ICONES`) | |
| Feedback | ✅ `useFeedback()` no salvamento | |
| Navegação | ✅ Salvar → volta (`navigate(-1)`) | |

**Comportamento:**
- Registra gasto → movimentação de saída (origem Gasto) + reduz saldo/lucro (BR-028).
- `GastoList.tsx` (componente de listagem com exclusão) existe mas **não é usado** em nenhuma tela — UC-051 pendente de reativação (backend `DELETE /api/gastos/:id` já existe).

---

---
## 18. Perfil (Meus dados)
**Header:** compacto — voltar + título + ação (PLAN-035).

**Arquivo:** `frontend/src/modules/auth/pages/PerfilPage.tsx` · Rota `/perfil` · Acessível a **todos os perfis** (PLAN-029)

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ ← Meus dados                     │  ← Header
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Nome do Usuário    [Operador]│ │  ← Card + StatusBadge de role
│ │ usuario@empresa.com          │ │
│ └──────────────────────────────┘ │
│                                  │
│ Trocar senha (h2)                │
│ Senha atual *     [___________]  │
│ Nova senha *      [___________]  │
│ Confirmar senha*  [___________]  │
│                                  │
│ [Salvar]                         │
└──────────────────────────────────┘
```

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `< Back Título` | |
| Cards | ✅ `border p-4` sem sombra | |
| Inputs | ✅ Padrão com focus ring + erro `text-red-500` | |
| Feedback | ✅ `useFeedback().run()` no salvamento | |
| Acessibilidade | ✅ `autoComplete` (current/new-password) | |
| i18n | ✅ `perfil.*` (pt-BR, en, es) | |

**Comportamento:**
- Troca de senha via `PATCH /api/auth/senha` (BR-089/090): valida a senha atual (422 se incorreta, sem deslogar), exige nova ≥ 6 caracteres e diferente da atual; sessão atual permanece válida após a troca.
- Acesso pelo menu da engrenagem do Navbar; para o admin, também a partir da aba "Meus dados" do painel (`/admin`).

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

- [ ] Header segue o tipo da tela (PLAN-035): **landing** → `PageHeader` (banner gradiente + ícone + título + subtítulo + ação branca `variant="onDark"`); **novo/editar/detalhe/settings** → compacto `< Back Título [Ação]`
- [ ] Inputs usam `rounded-md border px-3 py-2 text-base`
- [ ] Focus usa `focus:ring-2 focus:ring-primary focus:border-primary` (nunca azul fixo)
- [ ] Cores usam **apenas tokens** — `primary` (brand) e `danger/success/warning` (semânticos); proibido cor fixa da paleta (checado por `npm run audit:styles`)
- [ ] Tipografia segue escala definida
- [ ] Espaçamento usa múltiplos de 8 (evitar `gap-3`)
- [ ] Estados tratados: Loading, Error, Empty, Sucesso
- [ ] Ícones apenas do Lucide React
- [ ] Labels sem `:` no final
- [ ] Cards clicáveis usam `hover:border-primary`
- [ ] Botões usam componente `Button` compartilhado (nunca `<button>` inline)
- [ ] Strings via `t()` do i18n, nunca hardcoded
- [ ] Valores financeiros usam `formatCurrency()`
- [ ] Busca textual segue padrão `Search icon + pl-10`
- [ ] Layout `max-w-2xl mx-auto p-4`
- [ ] Registro: adicionar a tela na **tabela da Visão Geral** (rota + número sequencial) e na seção correspondente do Mapeamento por Tela

# Histórico de Correções

| Data | Versão | Mudança |
|------|--------|---------|
| 02/07/2026 | 1.0 | Mapeamento inicial das 10 telas |
| 02/07/2026 | 1.2 | Roadmap v2.0: fases definidas, status por tela, referências atualizadas |
| 04/07/2026 | 1.3 | Adicionado ClienteCard e ContratoCard na árvore de componentes |
| 04/07/2026 | 1.4 | Removidas pendências de gap-3 e hover, padronização visual concluída |
| 30/07/2026 | 1.6 | Adicionada tela 11 (Login) e 12 (Admin); auth context e protected route; Navbar com admin link condicional |
| 30/07/2026 | 1.7 | Dark mode em LoginPage e Admin Panel (tokens CSS); scroll-to-error em todos os formulários (shouldFocusError + setFocus); field-level errors em ContratoNovo/Edit e GastoForm |
| 31/07/2026 | 1.8 | Adicionada tela 13 (SuperAdminPage); drill-down por empresa no AdminPage; Navbar com link Empresas para super_admin; AuthContext com empresaId/empresaNome |
| 01/08/2026 | 1.9 | PLAN-021: login roteado por role; AdminPage com contexto de empresa e KPIs em blocos (Equipe/Operação, Admins × Operadores); navbar com engrenagem de configurações; operador volta a ajustar a própria base de caixa |
| 01/08/2026 | 1.10 | PLAN-022: AdminPage com header por nível (usuário/empresa + badge de role), KPIs de Operação com legenda "de {nome}", Resultado do Dia em módulo com cor/tooltip; idioma movido da barra pra engrenagem |
| 01/08/2026 | 1.11 | PLAN-024: OperadoresList no padrão Card com admins no topo e tag "Eu"; KPIs clicáveis (EquipeModal, navegação, ResultadoDiaModal); OperadorDetail com ajuste de caixa base do operador; dashboard admin self escopado por usuário (BR-087) |
| 02/08/2026 | 1.12 | PLAN-026: Modal base compartilhado (Escape/backdrop configurável) e modais refatorados; OperadoresList com subseções Administradores/Operadores; auditoria de caixa (P014) |
| 02/08/2026 | 1.13 | PLAN-027: Histórico de ajustes do Caixa Base no OperadorDetail (admin) e no /caixa (operador) — endpoint GET /api/caixa/auditoria |
| 02/08/2026 | 1.14 | PLAN-028: Estorno de pagamento no ContratoDetail (modo admin, somente leitura) + contratos do operador no OperadorDetail |
| 03/08/2026 | 1.15 | Tabela com as 18 telas reais (adicionadas Atendidos 2b, Cobranças 2c, Caixa 14, Gastos 15, OperadorDetail 16); contagem corrigida; seções §14-16 documentadas; árvore de componentes atualizada |
| 03/08/2026 | 1.16 | PLAN-029: tela Perfil (Meus dados) §18 + toggle mostrar/ocultar senha no login (§11) — troca de senha por todos os perfis |
| 03/08/2026 | 1.17 | PLAN-030: KPIs de Operação do admin com **totais da equipe** (BR-091) + `ContribuicaoModal` por operador; `EquipeModal` com stats e navegação ao operador; navbar com links "Administração"/"Empresas" visíveis |
| 03/08/2026 | 1.18 | PLAN-031: 5 temas por usuário com gradientes (engrenagem); módulos por empresa (whitelabel, BR-092/093) com `RequireModule`/navbar/entradas; Super Admin redesenhado (banner gradiente + `ModulosModal` + `EmpresaForm` no Modal base) |
| 03/08/2026 | 1.19 | Navbar por perfil: operator/admin veem as operacionais (module-gated); admin + Administração; super_admin vê só Empresas (sem páginas vazias). UCs 061-063 |
| 03/08/2026 | 1.20 | PLAN-032: papel `socio` (painel escopado à subárvore); navbar inclui sócio nas operacionais + Administração. UCs 064-069 |
| 03/08/2026 | 1.21 | PLAN-033: ClienteDetail com **Situação Financeira** (grade 2×2: Saldo Devedor · Em atraso · Vence hoje · Lucro previsto + Último pagamento, BR-096..098). View de atrasados mantém banner + lista; bloco "Histórico de atrasos" (snapshot/evolução) **removido** por decisão (dado esparso). UC-071 |
| 03/08/2026 | 1.22 | PLAN-034: `ContratoCard` (list-item) mostra **linha de atraso** ("N parcelas em atraso · R$ Y · D dias", BR-099) quando o contrato tem parcelas vencidas. UC-072 |
| 03/08/2026 | 1.23 | **PLAN-038 (identidade "Nexus")**: `Navbar` de topo substituída por **`AppLayout`** (sidebar lateral desktop + drawer mobile) com marca; `LoginPage` redesenhado (logo Nexus + tagline + card); novo **logo Nexus** (`Logo`/`LogoLockup`, favicon) e **tokens de identidade** (OKLCH, gradientes, Sora nos títulos, `--tenant-primary` p/ whitelabel). |
| 03/08/2026 | 1.24 | PLAN-038 refinamentos (essência Lovable): `PageHeader` com **título limpo + ícone suave + data (eyebrow)**; `KpiCard` com **barra de tom + value-lg**; `Card` com `tone`/`interactive`; **Ações rápidas** na Central (grade de ícones, gated por módulo); sidebar com seção **"Administração"** (Painel Admin + Empresas). |
| 03/08/2026 | 1.25 | PLAN-038 ajustes: **overscroll** corrigido (`overscroll-behavior-y: none` + sem `background-attachment: fixed` + `100dvh`); seletor de tema em **bolinhas de gradiente + nome do tema atual** (compacto); botão **claro/escuro só ícone**; `RotaCobrancaSection` **removida da Central**; **marca no topo do drawer** (mark + "NX Gestão" + X na mesma linha); seção **"Administração" visível sem scroll**. |

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
- `product/06-CASOS-DE-USO.md` — casos de uso de validação por fluxo
- `product/07-CASOS-DE-USO-API.md` — casos de uso e cenários de teste da API
- `skills/SKILL-009-documentation-sync.md` — matriz de propagação (mudou tela → atualize este doc)
