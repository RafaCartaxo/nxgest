# MAPEAMENTO DE TELAS

**Status:** Aprovado

**Versão:** 1.28

**Última atualização:** 15/08/2026

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
| 11a | Recuperar Senha | `/recuperar-senha` | auth | Formulário |
| 11b | Redefinir Senha | `/resetar-senha` | auth | Formulário |
| 11c | Ativar Conta | `/ativar` | auth | Formulário |
| 11f | Confirmar E-mail | `/verificar-email` | auth | Fluxo (link) |
| 11d | Quero Conhecer (lead) | `/quero-conhecer` | leads | Formulário |
| 11e | Confirmar Lead | `/quero-conhecer/confirmar` | leads | Formulário |
| 12 | Administração | `/admin` | admin | Dashboard |
| 13 | Super Admin (Empresas) | `/admin/empresas` | admin | Dashboard |
| 14 | Admin em contexto de empresa | `/admin/empresas/:id` | admin | Dashboard |
| 14b | Leads (painel super) | `/admin/leads` | leads | Lista |
| 15 | Detalhe do Operador | `/admin/operadores/:id` | admin | Detalhe |
| 16 | Caixa | `/caixa` | caixa | Dashboard |
| 17 | Gastos | `/gastos` | gasto | Formulário |
| 18 | Perfil (Meus dados) | `/perfil` | auth | Formulário |
| 19 | Conta Suspensa (bloqueio no `ProtectedRoute`) | — (tela cheia) | auth | Estado (bloqueio) |

**Total:** 28 superfícies (27 telas + Conta Suspensa) · 28 rotas (27 + `*` catch-all) | 8 módulos | 65 componentes (24 shared + 2 feedback + 1 auth + 38 módulo)

> **Nota de navegação:** esta tabela é o espelho das rotas de `frontend/src/App.tsx`. Qualquer rota nova (ou removida) exige atualizar esta tabela + a seção correspondente — ver `SKILL-009-documentation-sync.md`.

---

# Árvore de Componentes

```
App
├── AppLayout (sidebar lateral desktop + BottomTabBar mobile + UserMenu; PLAN-060)
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
    │   ├── Botão Entrar + feedback de erro
    │   └── Link "Esqueci minha senha" → /recuperar-senha [PLAN-065]
    │
    ├── RecuperarSenhaPage · ResetarSenhaPage · AtivarPage · VerificarEmailPage (públicas, `PublicPageShell`) [PLAN-065/075]
    │   └── Fluxo de conta: e-mail → link → definir senha
    │
    ├── QueroConhecerPage · ConfirmarLeadPage (públicas, shell do login) [PLAN-064]
    │   └── Lead comercial: interesse → confirmação de e-mail
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
    ├── LeadsAdminPage (/admin/leads — SuperAdminRoute) [PLAN-064]
    │   └── Filtro por status + cards (ações: onboarding/converter/descartar)
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
**Header:** PageHeader limpo — ícone suave + `Route` + título + subtítulo; status GPS e fechamento no header (PLAN-035).

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
**Header:** PageHeader limpo — ícone suave + `CheckCircle2` + título + subtítulo (PLAN-035).

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
**Header:** PageHeader limpo — ícone suave + `ClipboardList` + título dinâmico (Pendentes do Dia / Saldo em Atraso) + subtítulo (PLAN-035).

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
**Header:** PageHeader limpo — ícone suave + `Users` + título + subtítulo; ação "Novo Cliente" no header (PLAN-035).

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
**Header:** PageHeader limpo — ícone suave + `FileText` + título + subtítulo; ação "Novo Contrato" no header (PLAN-035).

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

**Link "Esqueci minha senha"** (PLAN-065) → `/recuperar-senha`. Erro de login via `ApiError.message` (traduzido — ex.: `ACCOUNT_PENDING` do convidado).

---

## 11a. Recuperar Senha / 11b. Redefinir Senha / 11c. Ativar Conta
**Formulários públicos** (fora do `ProtectedRoute`), mesmo shell visual do Login (`PublicPageShell`: gradient-page + mesh + card centralizado) (PLAN-065).

**Arquivos:** `frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx`, `ResetarSenhaPage.tsx`, `AtivarPage.tsx` · componente `PublicPageShell.tsx`

**Comportamento:**
- **Recuperar (`/recuperar-senha`):** e-mail → `POST /auth/forgot` — resposta **sempre genérica** (não revela existência da conta); sucesso mostra `SuccessState` "verifique seu e-mail".
- **Redefinir (`/resetar-senha?token=`):** nova senha + confirmação (mín. 6, iguais) → `POST /auth/reset`; `TOKEN_EXPIRED`/`TOKEN_INVALID` → erro + link "solicitar novo link" → `/recuperar-senha`.
- **Ativar (`/ativar?token=`):** define a senha do convidado → `POST /auth/ativar`; token expirado/inválido → erro + orientação de reenviar convite.
- Sem `token` na URL → `ErrorBanner` "link inválido ou incompleto".

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | — | Tela isolada pré-auth (sem Navbar), como o Login |
| Inputs | ✅ `Field` padrão (`rounded-md`, focus ring) | senha com toggle mostrar/ocultar |
| Feedback | ✅ `ErrorBanner` (erros de token/validação) + `SuccessState` (sucesso) | |
| Botões | ✅ `Button` primário + link para o login | |
| Acessibilidade | ✅ `type="email"`/`type="password"`, `autoComplete`, labels | |
| i18n | ✅ `auth.*` (pt-BR, en, es) + `errors.ACCOUNT_PENDING`/`TOKEN_INVALID` | |

---

## 11f. Confirmar E-mail (PLAN-075 F4)
**Destino do link** de confirmação de troca de e-mail (`/verificar-email?token=`, gerado por `TrocarEmailUseCase`/admin). Página **pública** (`PublicPageShell`), fora do `ProtectedRoute`.

**Arquivo:** `frontend/src/modules/auth/pages/VerificarEmailPage.tsx` · rota `/verificar-email`

**Comportamento:**
- Sem `token` na URL → `ErrorBanner` "link inválido ou incompleto".
- **Sem sessão** (link aberto no navegador sem login): redireciona pro `/login` com `state.from` apontando pra cá → após login, `LoginPage` respeita `state.from` e retorna → confirma no load.
- Com sessão: chama `POST /auth/me/email/verificar` no load (uma vez) → sucesso: `refreshUser` + `SuccessState` "E-mail confirmado" + "Ir para Meus dados" (`/perfil`); `TOKEN_EXPIRED`/`TOKEN_INVALID` → `ErrorBanner` + botão "Ir para Meus dados".
- @demanda: exige sessão porque o token pertence ao usuário logado (aceita por `authMiddleware`).

**Aderência:** mesmo padrão do §11a–11c (`Field`/`Button`/`ErrorBanner`/`SuccessState`, i18n `auth.verificar*`).

---
**Formulários públicos** de aquisição comercial (fora do `ProtectedRoute`), shell no estilo do login.

**Arquivos:** `frontend/src/modules/leads/pages/QueroConhecerPage.tsx`, `ConfirmarLeadPage.tsx`

**Comportamento:**
- **`/quero-conhecer`:** Nome · Empresa · E-mail · Telefone (opcional) → `POST /api/leads` (zod). Dedup → mensagem amigável "já existe solicitação"; e-mail já usuário → 409 tratado; sucesso → `SuccessState` + "Não recebeu? Reenviar".
- **`/quero-conhecer/confirmar?token=`:** confirma no load → `SuccessState`; `TOKEN_EXPIRED`/`TOKEN_INVALID` → erro + form de reenviar (e-mail).

**Aderência:** mesmo padrão do §11a–11c (Field, Button, ErrorBanner, SuccessState, i18n `lead.*`).

---

## 14b. Leads — painel do super admin (PLAN-064)
**Lista** protegida por `SuperAdminRoute`; acesso exclusivo do super admin (não-super → redirect).

**Arquivo:** `frontend/src/modules/leads/pages/LeadsAdminPage.tsx`

**Comportamento:**
- Filtro por status (`FieldSelect`: Todos + NOVO/EMAIL_CONFIRMADO/EM_ONBOARDING/CONVERTIDO/DESCARTADO).
- `Card.Root list-item`: responsável · empresa · e-mail/telefone · badges origem/status · ações gated por estado:
  - **Iniciar onboarding** (NOVO/EMAIL_CONFIRMADO) → `EM_ONBOARDING`
  - **Converter** (EMAIL_CONFIRMADO/EM_ONBOARDING) → `ConfirmModal` → empresa + convite + auditoria
  - **Descartar** (≠ CONVERTIDO) → `Modal` com motivo obrigatório → `DESCARTADO` + LGPD
- Nav: sidebar desktop + `UserMenu` mobile do super admin ganharam "Leads".

---

---

## 12. Administração (14 — contexto de empresa)
**Header:** PageHeader limpo — ícone suave + `Settings` + título dinâmico (empresa/nome) + subtítulo; badge de papel; voltar quando dentro de empresa (PLAN-035).

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
│ Novo Operador / Editar Operador  │  ← título dinâmico por role (Editar Administrador/Sócio/Operador)
├──────────────────────────────────┤
│ DADOS PESSOAIS  (Card tone info) │
│ (avatar)  Nome *                 │
│           Telefone               │
│ ACESSO      (Card tone info)     │
│ E-mail *    [_____________]      │
│ PERMISSÕES  (Card tone neutral)  │
│ Papel *     [admin ▾]            │  ← admin/operator/socio (sócio: travado)
│ Chefe       [selecione ▾]        │  ← só p/ operator/socio
│ ℹ convite por e-mail (se novo)   │  ← callout convite (P-04)
│ STATUS DA CONTA (Card tone por status, se edição)
│ [status] [Alterar status da conta] · Reenviar/Revogar convite
│                                  │
│ [Cancelar]        [Salvar]       │  ← Modal.footer
└──────────────────────────────────┘
```

> **PLAN-075:** operador `convidado` (sem senha) ganha badge **"Convite pendente"** + ações **reenviar/revogar convite**; **senha nunca é definida por admin** (P-04) — cadastro nasce convidado. Ações de conta (Suspender/Reativar/convite) ficam na seção **"Status da conta"** (idêntica no Perfil de edição da lista e do Detalhe — edição unificada).

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ Nome da empresa como `<h1>` (padrão OperadorDetail) ou `t("admin.title")` | PLAN-021 |
| Contexto | ✅ Badge "Empresa" (`StatusBadge info`) quando em contexto | |
| Redirect | ✅ super_admin em `/admin` → `/admin/empresas` | BR-081 |
| KPIs | ✅ Reusa `KpiCard` em blocos com `SectionHeader` (Equipe / Operação) | PLAN-021 |
| Contagem | ✅ Admins × Sócios × Operadores separados | BR-082 |
| KPIs clicáveis | ✅ Equipe abre `EquipeModal`; KPIs de Operação abrem `ContribuicaoModal` | PLAN-024 / PLAN-030 |
| Escopo KPIs Operação | ✅ **Total da equipe** (admins + sócios + operadores + próprio), subtítulo "da equipe · N" | PLAN-030 / BR-091 |
| Navegação | ✅ **Sem abas** (antes "Equipe/Meus dados"); admin/sócio veem **sempre a Equipe** — "Meus dados" era redundante (KPIs do caixa já na CaixaPage), removida 14/08 | |
| Busca | ✅ `SearchBar` com placeholder i18n (nome + e-mail) | |
| Cards | ✅ `Card.Root` grid de cards (1/2/3 col) com tone por role + contadores tabular-nums; admins no topo | PLAN-024 |
| Usuário corrente | ✅ Card do próprio usuário com tag "Eu", sem Editar/Remover | PLAN-024 |
| Status | ✅ `StatusBadge`: admin=info, sócio=success, operator=neutral, Eu=success | |
| Formulário | ✅ `OperadorForm` em `Card` tone + `Modal.footer`; botões Cancelar/Salvar no footer do Modal | |
| Modal | ✅ `ConfirmModal` remoção; `Modal` com `footer` p/ form; `ReassignModal` p/ rebaixar com subordinados | PLAN-026 / PLAN-030 |
| Estados | ✅ `EstadoTela` (loading/empty/error) na lista | |
| Restrições | ✅ Admin não remove a si mesmo; não rebaixa o próprio role | BR-069, BR-070 |
| i18n | ✅ `admin.*` (pt-BR, en, es) | |


---

---
## 13. Super Admin — Gestão de Empresas
**Header:** PageHeader limpo — ícone suave + `Building2` + título + subtítulo; ação "Nova Empresa" no header (PLAN-035).

 **Arquivo:** `frontend/src/modules/admin/pages/SuperAdminPage.tsx`

**Rota:** `/admin/empresas` (acesso restrito a `role = super_admin`)

**Estrutura Visual:**
```
┌──────────────────────────────────┐
│ [PageHeader limpo: ícone suave +  │  ← PageHeader (PLAN-038)
│  "Empresas" + subtítulo + ação    │
│  "Nova Empresa"]                  │
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
│ │             [Configurar][Recursos][Editar][→] │ │     Card.Actions: módulos + capacidades + editar + drill-down (PLAN-061)
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

**Estrutura Visual (bento 3col — Stitch 14/08):**
```
┌──────────────────────────────────────────────────────┐
│ ← Nome do Operador        [avatar] [Editar]           │  ← Header (sem badge de role — vai no card)
├──────────────┬──────────────┬─────────────────────────┤
│ Contato &    │ Clientes     │ Contratos ativos        │  ← tone/badge por status
│ Status (tone)│ (KPI clicável)│ (KPI clicável)          │     (Dados do {role} · E-mail · Telefone)
├──────────────┴──────────────┴─────────────────────────┤
│ Caixa do operador                                     │
│ ┌──────┬──────┬──────┬──────┐  [Ajustar caixa]        │  ← CaixaKpis + AjustarCaixaModal
│ └──────┴──────┴──────┴──────┘                         │
│ Histórico de ajustes (colapsável)                     │
└──────────────────────────────────────────────────────┘
```
- **Contato & Status** (`Card` tone sucesso/suspenso/convidado): título "Dados do {role}", E-mail/Telefone (truncate), badge de status sempre visível + complementos (verificação pendente/convite).
- **KPIs** Clientes/Contratos **clicáveis** → `/clientes?usuarioId=` / `/contratos?usuarioId=`.
- **Editar** (PageHeader) → abre `OperadorForm` em modal com seção **"Status da conta"** (Alterar status · Reenviar/Revogar convite) + `Modal.footer` (Salvar). Ações de conta não aparecem para o próprio usuário (`isSelf`).
- **Modal "Alterar status"** — Suspender (danger) / Reativar (primary) com confirmação; edição/reassign via hook `useEditarOperador`.

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `< Back Nome [avatar] [Editar]` | sem badge de role |
| KPI cards | ✅ `KpiCard` clicáveis | |
| Cards | ✅ `Card.Root` tone + título | |
| Modais | ✅ `Modal` com `footer` + `ConfirmModal` | |
| EstadoTela | ✅ Loading/Error/Empty | |
| Feedback | ✅ `useFeedback()` | |

**Comportamento:**
- KPIs Clientes/Contratos navegam para as listas do operador (`?usuarioId=`).
- Ajuste de caixa grava no operador-alvo via `?usuarioId=` (BR-078), com `motivo` obrigatório e auditoria (BR-088).
- Editar reabre com `getOperador` (re-sincroniza status após suspender/reativar — fix bug).

---

---
## 16. Caixa
**Header:** PageHeader limpo — ícone suave + `Wallet` + título + subtítulo; ação "Fechar Semana" no header (PLAN-035).

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
**Header:** PageHeader limpo — ícone suave + `Receipt` + título + subtítulo (PLAN-035).

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

**Estrutura Visual (bento grid — Stitch 14/08):**
```
┌──────────────────────────────────────────────┐
│ ← Meus dados                                 │  ← Header
├──────────────────────┬───────────────────────┤
│ Dados pessoais  [Role]│ Segurança             │  ← coluna principal (8) × lateral (4)
│ (avatar)  Nome        │ [🔒 Alterar senha]    │     (Segurança = gatilho → Modal)
│          Telefone     │                       │
│ [Salvar]              │                       │
│                       │                       │
│ Conta            [Ativo]│                     │  ← Conta: tone/badge dinâmico por status
│ (sub-cards: E-mail ✓ · Empresa)               │
│ [✉ Alterar e-mail]     │                      │  ← rodapé do card Conta
└──────────────────────┴───────────────────────┘
```
- **Dados pessoais** (`Card` tone info/tema): `AvatarField` em coluna + Nome + Telefone (máscara `(11) 99999-9999`).
- **Conta** (`Card` tone sucesso/suspenso/convidado): sub-cards E-mail (com selo `✓ verificado`/`⚠ pendente`) e Empresa; badge de **status** na linha do título (Ativo verde / Suspenso vermelho / Convidado amarelo).
- **Segurança** (`Card` tone neutral): botão gatilho **"Alterar senha"** (`outline` + `Lock`) → abre **Modal** (senha atual/nova/confirmar + rodapé Cancelar/Alterar).

**Aderência ao Design System:**

| Regra | Status | Observação |
|-------|--------|------------|
| Header | ✅ `< Back Título` | |
| Cards | ✅ `Card.Root` tone + título dentro do card | |
| Inputs | ✅ Padrão com focus ring + erro `text-red-500` | |
| Feedback | ✅ `useFeedback().run()` no salvamento | |
| Acessibilidade | ✅ `autoComplete` (current/new-password) | |
| i18n | ✅ `perfil.*` (pt-BR, en, es) | |

**Comportamento:**
- Alterar senha via Modal → `PATCH /api/auth/senha` (BR-089/090): valida a senha atual (422 se incorreta, sem deslogar), exige nova ≥ 6 caracteres e diferente da atual; sessão atual permanece válida após a troca.
- Alterar e-mail via Modal → `POST /api/auth/me/email` (PLAN-075 F4): novo e-mail + senha atual → `email_pendente` + link de verificação; banner de pendência no topo com "Cancelar alteração".
- Acesso pela sidebar (item "Meus dados") e pelo `UserMenu` (Perfil).

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

Ao implementar uma nova tela, verificar (PLAN-038/039/043/044):

- [ ] Header segue o tipo da tela (PLAN-038): **landing** → `PageHeader` (título limpo em Sora + ícone em badge suave `bg-primary-light` + subtítulo + `eyebrow` + ação/voltar); **novo/editar/detalhe/settings** → compacto `< Back Título [Ação]`
- [ ] Inputs usam **`Field`** (`rounded-xl border-strong min-h-12`) ou o padrão canônico — **nunca** `rounded-md border px-3 py-2` cru
- [ ] Selects/dates com `min-h-12 rounded-xl border-border-strong` (padrão canônico)
- [ ] Rows/listas usam `Card.Root` ou `rounded-xl border border-border bg-card` (nunca `rounded-md bg-surface`)
- [ ] Badges usam `StatusBadge` · botões usam `Button`/`ButtonLink` · ações rápidas usam `QuickActions`
- [ ] Modais usam o componente `Modal` base (nunca overlay custom cru)
- [ ] Skeletons usam `bg-surface-hover` (nunca `bg-secondary-light`)
- [ ] Focus usa `focus:ring-2 focus:ring-primary focus:border-primary` (nunca azul fixo)
- [ ] Cores usam **apenas tokens** — `primary` (brand) e `danger/success/warning` (semânticos); proibido cor fixa da paleta (checado por `npm run audit:styles`)
- [ ] Tipografia segue escala definida
- [ ] Espaçamento usa múltiplos de 8 (evitar `gap-3`)
- [ ] Estados tratados: Loading, Error, Empty, Sucesso
- [ ] Ícones apenas do Lucide React
- [ ] Labels sem `:` no final
- [ ] Strings via `t()` do i18n, nunca hardcoded
- [ ] Valores financeiros usam `formatCurrency()`
- [ ] Layout `max-w-2xl mx-auto p-4`
- [ ] **Gate (PLAN-044):** `npm run audit:ui` + `npm run audit:styles` limpos
- [ ] **Registro:** adicionar a tela na **tabela da Visão Geral** (rota + número sequencial), na seção correspondente do Mapeamento por Tela e no **inventário `UI-COVERAGE.md`**

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
| 03/08/2026 | 1.25 | PLAN-038 ajustes: **overscroll** corrigido (`overscroll-behavior-y: none` + sem `background-attachment: fixed` + `100dvh`); seletor de tema em **bolinhas de gradiente + nome do tema atual** (compacto); botão **claro/escuro só ícone**; `RotaCobrancaSection` **removida da Central**; **marca no topo do drawer** (mark + "NX Gest" + X na mesma linha); seção **"Administração" visível sem scroll**. |
| 07/08/2026 | 1.26 | PLAN-065: telas públicas **Recuperar Senha (§11a) · Redefinir Senha (§11b) · Ativar Conta (§11c)** (`PublicPageShell`, estilo do login) + link "Esqueci minha senha" no login + badge "Convite pendente"/reenviar no admin. |
| 07/08/2026 | 1.27 | PLAN-064: telas públicas **Quero Conhecer (§11d) · Confirmar Lead (§11e)** + painel super **Leads (§14b)** (`/admin/leads`) + nav "Leads" no super (sidebar + UserMenu). |

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
