# UI PATTERNS

**Status:** Aprovado

**Versão:** 1.0

**Última atualização:** 01/07/2026

---

# Objetivo

Definir os padrões oficiais de composição das interfaces do sistema.

Este documento estabelece como componentes devem ser organizados para formar telas consistentes, previsíveis e fáceis de utilizar.

Ele complementa:

- DESIGN-SYSTEM.md
- UI-COMPONENTS.md
- COMPONENT-ARCHITECTURE.md
- UX.md

Enquanto o Design System define a aparência e o UI Components define a biblioteca de componentes, este documento define como esses componentes trabalham juntos.

---

# Princípios

Toda interface deverá seguir os seguintes princípios:

- Consistência visual;
- Baixa carga cognitiva;
- Navegação previsível;
- Mínima interação;
- Progressão natural da informação;
- Uma ação principal por tela.

---

# Estrutura Geral das Telas

Toda tela deverá respeitar, preferencialmente, a seguinte hierarquia:

App Bar

↓

Resumo (quando aplicável)

↓

Conteúdo Principal

↓

Conteúdo Secundário

↓

Ações

↓

Feedback Global

Cada nível possui uma responsabilidade específica.

> **Mobile app-first (PLAN-060):** o shell é `AppLayout` — topo fino (marca + `UserMenu`), conteúdo e `BottomTabBar` fixa. Elementos fixos na base (tab bar, bottom-sheets, menus) usam o utilitário **`.pb-safe`** (`padding-bottom: env(safe-area-inset-bottom)`), registrado em `index.css`, para não colidir com a área segura do iPhone.

---

# Hierarquia da Informação

As informações deverão ser organizadas em níveis.

## Nível 1 — Informação Principal

Representa o elemento mais importante da tela.

Exemplos:

- Nome do Cliente;
- Valor da Parcela;
- Valor do Contrato.

---

## Nível 2 — Contexto

Informações que identificam ou contextualizam o conteúdo principal.

Exemplos:

- Contrato #03;
- Parcela 04/12;
- Cobrança prevista para hoje.

---

## Nível 3 — Indicadores

Informações resumidas que auxiliam a tomada de decisão.

Exemplos:

- Status;
- Parcelas pendentes;
- Juros;
- Saldo.

---

## Nível 4 — Metadados

Informações complementares.

Exemplos:

- Data de criação;
- Última atualização;
- Observações.

---

# Template — Dashboard

Objetivo:

Apresentar rapidamente o estado atual da operação.

Estrutura recomendada:

KPIs

↓

Resumo Operacional

↓

Lista Prioritária

↓

Ações Rápidas

Exemplos:

- Central de Operações;
- Dashboard Financeiro.

---

# Template — Listagem

Objetivo:

Permitir localizar rapidamente uma entidade.

Estrutura:

App Bar

↓

Search Bar

↓

Filtros (quando necessário)

↓

Lista de Information Cards

↓

Paginação ou Scroll

↓

Empty State

---

# Template — Detalhe

Objetivo:

Exibir todas as informações relevantes de uma entidade.

Estrutura:

Header

↓

Resumo

↓

Seções

↓

Histórico (quando aplicável)

↓

Ações

---

# Template — Formulário

Objetivo:

Cadastrar ou editar informações.

Estrutura:

Header

↓

Campos

↓

Resumo (quando necessário)

↓

Botão Principal

↓

Feedback Global

---

# Template — Fluxo Operacional

Objetivo:

Executar tarefas repetitivas rapidamente.

Estrutura:

Lista

↓

Selecionar Item

↓

Executar Ação

↓

Feedback

↓

Próximo Item

Exemplo:

Central de Operações.

---

# Cards

Todos os Information Cards deverão seguir a mesma estrutura.

Header

↓

Body

↓

Indicators

↓

Actions

Essa organização deverá permanecer consistente em todos os módulos.

---

# KPIs

Todo indicador deverá possuir:

- título;
- valor principal;
- descrição opcional;
- ação de detalhamento (quando aplicável).

Indicadores nunca deverão ser apenas números isolados.

---

# Busca

Toda listagem deverá seguir o fluxo:

Busca

↓

Filtros

↓

Resultado

↓

Cards

Sempre que houver filtros ativos, o operador deverá conseguir removê-los facilmente.

---

# Estados da Interface

Toda tela deverá prever os seguintes estados:

## Loading

Representado preferencialmente por Skeleton.

---

## Empty

Mensagem objetiva.

Ação principal disponível.

---

## Error

Mensagem simples.

Botão para tentar novamente.

---

## Success

Representado através do Feedback Global.

---

# Navegação

Toda navegação deverá preservar o contexto do operador.

Exemplo:

Clientes

↓

Cliente

↓

Contrato

↓

Pagamento

↓

Retornar ao Contrato

Sempre que possível, evitar reiniciar o fluxo em uma tela inicial.

---

# Feedback

Toda operação deverá seguir o fluxo:

Interação

↓

Feedback Global (Loading)

↓

Success

ou

↓

Error

Nenhuma operação deverá ocorrer silenciosamente.

---

# Progressive Disclosure

As telas deverão apresentar inicialmente apenas as informações essenciais.

Informações detalhadas deverão ser exibidas apenas quando necessárias.

Exemplo:

Listagem:

- Nome;
- Valor;
- Status.

Detalhe:

- Parcelas;
- Histórico;
- Pagamentos;
- Observações.

---

# Mobile First

Toda interface deverá ser projetada inicialmente para dispositivos móveis.

A versão para telas maiores deverá expandir a informação, nunca alterar o fluxo.

---

# Consistência

Componentes semelhantes deverão possuir comportamento semelhante.

Exemplos:

- mesma posição para ações principais;
- mesma hierarquia visual;
- mesmos estados;
- mesmas animações;
- mesmo padrão de feedback.

---

# Anti-Patterns

Não será permitido:

- múltiplas ações principais na mesma tela;
- scroll horizontal;
- modal dentro de modal;
- listas extensas sem busca;
- filtros difíceis de limpar;
- componentes duplicados com responsabilidades iguais;
- feedback diferente para operações equivalentes;
- navegação que faça o operador perder contexto;
- excesso de informações antes da ação principal;
- telas que exijam mais de três decisões consecutivas.

---

# Critérios de Qualidade

Uma interface será considerada consistente quando:

- o operador souber imediatamente onde clicar;
- a informação principal estiver evidente;
- as ações estiverem sempre na mesma posição lógica;
- o comportamento for previsível entre diferentes módulos;
- o fluxo exigir o menor número possível de interações.

---

# Evolução

Novos padrões deverão ser documentados neste arquivo antes de serem utilizados em novos módulos.

Sempre que um padrão existente puder ser reutilizado, sua reutilização deverá ser priorizada.

---

# Referências

- NORTH-STAR.md
- UX.md
- DESIGN-SYSTEM.md
- UI-COMPONENTS.md
- COMPONENT-ARCHITECTURE.md
- TOKEN.md
- MAPEAMENTO-TELAS.md