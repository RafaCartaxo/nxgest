# FRONTEND

**Status:** Aprovado

**Versão:** 1.4

**Última atualização:** 31/07/2026

---

# Objetivo

Definir como a camada de frontend do sistema deverá ser implementada, estabelecendo sua organização, responsabilidades, fluxo de dados e boas práticas de desenvolvimento.

Este documento representa a referência oficial para implementação da interface do sistema.

---

# Princípios

O frontend deverá seguir os seguintes princípios:

* Mobile First;
* Separação de responsabilidades;
* Componentização;
* Reutilização de código;
* Simplicidade;
* Baixo acoplamento;
* Alta coesão;
* Consistência visual;
* Facilidade de manutenção.

---

# Responsabilidades

O frontend será responsável exclusivamente por:

* renderização da interface;
* navegação;
* gerenciamento do estado visual;
* comunicação com a API;
* captura das ações do usuário;
* validações de formato;
* feedback visual ao operador.

O frontend não será responsável por:

* regras de negócio;
* cálculos financeiros;
* validações críticas;
* persistência de dados;
* decisões de domínio.

Toda regra de negócio permanecerá sob responsabilidade do backend.

---

# Estrutura da Aplicação

A aplicação será organizada por contextos de negócio.

Estrutura atual:

```text
src/

modules/        ← módulos de negócio (cliente, contrato, pagamento, operacoes, caixa, gasto, auth, admin)
  admin/
    components/  ← EmpresaList, EmpresaForm, OperadoresList, OperadorForm
    pages/       ← AdminPage, SuperAdminPage
    services/    ← admin.service.ts, empresa.service.ts
shared/         ← componentes, feedback, tema, utilitários reutilizáveis
  components/   ← 12 componentes (Button, Card, StatusBadge, ErrorBanner, etc.)
  feedback/     ← FeedbackOverlay, FeedbackProvider, useFeedback
  theme/        ← ThemeProvider, useTheme (dark mode toggle)
  utils/        ← funções utilitárias
assets/
styles/
```

Cada diretório deverá possuir responsabilidade claramente definida.

---

# Organização dos Módulos

Cada módulo deverá possuir estrutura semelhante à seguinte:

```text
cliente/

pages/
components/
schemas/        ← schemas zod para validação de formulários
hooks/
services/
types/
```

Os diretórios `schemas/` e `hooks/` são adicionados conforme a necessidade do módulo.

Novas estruturas poderão ser adicionadas conforme a necessidade do módulo, preservando a separação de responsabilidades.

---

# Camadas do Frontend

Cada funcionalidade deverá seguir o fluxo:

```text
Page

↓

Component

↓

Hook

↓

Service

↓

API
```

Cada camada deverá conhecer apenas a camada imediatamente inferior.

---

# Fluxo de Dados

O fluxo de dados deverá ocorrer da seguinte forma:

```text
Usuário

↓

Interface

↓

Hook

↓

Service

↓

API

↓

Backend

↓

Resposta

↓

Atualização da Interface
```

Toda comunicação deverá ocorrer de forma previsível e rastreável.

---

# Comunicação com a API

Toda comunicação com o backend deverá ocorrer através de uma camada única responsável por:

* requisições HTTP;
* serialização de dados;
* tratamento de erros;
* configuração compartilhada.

Essa camada estará centralizada em `src/shared/api/client.ts`.

Componentes e páginas nunca deverão realizar chamadas HTTP diretamente.

---

# Gerenciamento de Estado

O frontend utilizará três tipos de estado.

### Estado de Tema

O `ThemeProvider` (`shared/theme/`) gerencia o tema claro/escuro via classe `dark`
no `<html>`, com persistência em `localStorage` e detecção de `prefers-color-scheme`.

---

## Estado Local

Responsável exclusivamente pelo comportamento da interface.

Exemplos:

* abertura de modais;
* seleção de itens;
* filtros;
* formulários;
* estados temporários.

---

## Estado Remoto

O TanStack Query será responsável por consultas, cache, sincronização e gerenciamento dos estados de carregamento e erro das requisições à API.

---

# Componentização

Os componentes deverão possuir responsabilidade única.

Sempre que possível, deverão ser reutilizados entre diferentes módulos.

Componentes excessivamente específicos deverão permanecer dentro do módulo correspondente.

---

# Sistema de Design

Novos componentes deverão respeitar o Design System do projeto.

A estilização utilizará Tailwind CSS com abordagem Utility-First. Componentes reutilizáveis de interface serão implementados manualmente com Tailwind, sem dependência de bibliotecas externas de componentes.

---

# Formulários

Os formulários utilizarão React Hook Form para gerenciamento de estado e Zod para validação dos campos (com @hookform/resolvers), reaproveitando os schemas definidos no backend sempre que possível.

As validações executadas no frontend terão caráter exclusivamente visual.

As regras de negócio continuarão sendo responsabilidade do backend.

---

# Navegação

O roteamento é implementado com React Router, navegação SPA sem recarregamento de página. A arquitetura é **app-first** (PLAN-060):

- **`AppLayout`** = shell único: **sidebar lateral desktop** + **topo fino mobile** (marca → `/` + `UserMenu`) + conteúdo (`pb-28 lg:pb-16`).
- **`BottomTabBar`** (mobile, `shared/layout/BottomTabBar.tsx`): abas fixas gated por módulo (`central` sempre; operacionais via `hasModule`) — Central · Clientes · Contratos · Caixa · Rota.
- **`UserMenu`** (avatar): Perfil · Configurações (`PreferenciasModal`) · Sair; admin/sócio/super_admin no mobile. Mobile = bottom-sheet, desktop = popover.
- **Sem hamburger/drawer** (`Topbar.tsx` removido) — a config vive no menu do usuário, não em engrenagem solta.

Sempre que possível, a navegação preserva o contexto do operador.

---

# Feedback ao Usuário

Toda operação deverá fornecer retorno visual adequado.

O sistema utiliza o **Feedback Global** (`shared/feedback/`) para comunicar o andamento de operações:

* **FeedbackOverlay** → barra fixa no topo (z-50), exibe loading/success/error/warning/info
* **FeedbackProvider** → contexto React que gerencia estado e temporizadores
* **useFeedback** → hook com 3 métodos: `run()`, `show()`, `dismiss()`

Sempre que aplicável, deverão existir estados para:

* carregamento;
* sucesso;
* erro;
* ausência de dados.

Erros não capturados pelo fluxo normal são tratados pelo `<ErrorBoundary>` em `shared/components/`.

As mensagens deverão ser objetivas e direcionadas ao operador.

---

# Estados da Interface

Toda tela deverá prever, quando aplicável:

* Loading;
* Empty State;
* Error State;
* Success State.

A interface nunca deverá permanecer sem resposta durante operações assíncronas.

---

# Performance

A aplicação deverá priorizar simplicidade antes de otimizações.

Quando necessário, poderão ser adotadas técnicas como:

* carregamento sob demanda;
* cache de consultas;
* reutilização de componentes;
* redução de renderizações desnecessárias.

---

# Acessibilidade

A interface deverá seguir princípios básicos de acessibilidade.

Sempre que possível, deverão ser utilizados:

* elementos semânticos;
* identificação adequada dos campos;
* navegação consistente;
* contraste adequado.

---

# Regras de Implementação

O frontend não deverá conter regras de negócio.

Componentes não deverão acessar diretamente a API.

Páginas não deverão concentrar lógica de processamento.

Regras compartilhadas deverão ser extraídas para estruturas reutilizáveis.

Toda implementação deverá priorizar legibilidade e facilidade de manutenção.

---

# Evolução

A arquitetura deverá permitir:

* inclusão de novos módulos;
* criação de novos componentes;
* evolução da interface;
* alteração de tecnologias de implementação sem impacto significativo na organização da aplicação.

---

# Referências

* PROJECT.md
* ARCHITECTURE.md
* BACKEND.md
* ADR-002
* ADR-003
* API.md
* ADR-002
