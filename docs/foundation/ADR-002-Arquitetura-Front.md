# ADR-002 — Arquitetura do Frontend

**Status:** Aprovado

**Versão:** 1.2

**Última atualização:** 30/07/2026

---

# Contexto

O sistema será utilizado principalmente em dispositivos móveis, por operadores autenticados, com suporte a múltiplos usuários e perfil de administrador, possuindo uma interface focada em produtividade, simplicidade e facilidade de manutenção.

O backend concentra toda a lógica de negócio do sistema.

O frontend possui como objetivo apresentar informações, capturar ações do usuário e comunicar-se com a API.

A arquitetura adotada deve favorecer:

- simplicidade;
- baixo acoplamento;
- rápida evolução;
- alta legibilidade;
- facilidade de manutenção;
- integração eficiente com ferramentas de IA.

---

# Decisão

O frontend adotará uma arquitetura baseada em:

- React
- TypeScript
- Vite

A interface será organizada por módulos de negócio, mantendo alinhamento com a arquitetura adotada pelo backend.

O frontend será responsável exclusivamente pela camada de apresentação, navegação, comunicação com a API e gerenciamento do estado da interface.

Toda regra de negócio permanecerá sob responsabilidade do backend.

---

# Organização

A aplicação será organizada por módulos.

Exemplos:

- Cliente
- Contrato
- Parcela
- Pagamento
- Caixa
- Dashboard
- Mapa
- Auth
- Admin

Cada módulo poderá conter seus próprios componentes, páginas, hooks, serviços e tipos, preservando o isolamento entre contextos.

---

# Navegação

A aplicação adotará arquitetura **Single Page Application (SPA)**.

A navegação será realizada através de um roteador dedicado.

---

# Gerenciamento de Estado

O frontend utilizará dois tipos distintos de estado.

## Estado Local

Responsável exclusivamente pelo comportamento da interface.

Exemplos:

- abertura de modais;
- item selecionado;
- filtros;
- formulários;
- estados visuais.

---

## Estado Remoto

Os dados provenientes da API serão gerenciados por uma biblioteca especializada em sincronização de dados.

Não será utilizada Store Global para gerenciamento de dados de domínio.

---

# Comunicação

Toda comunicação com o backend ocorrerá através de uma camada única responsável por:

- requisições HTTP;
- tratamento de erros;
- serialização;
- configuração comum das chamadas.

Nenhum componente realizará chamadas HTTP diretamente.

---

# Componentização

A interface será construída utilizando componentes reutilizáveis.

Os componentes deverão possuir responsabilidade única e alto nível de reutilização.

Sempre que possível, novos componentes deverão ser compostos a partir de componentes já existentes.

---

# Sistema de Design

A estilização utilizará Tailwind CSS com abordagem Utility-First.

Componentes reutilizáveis de interface serão implementados manualmente com Tailwind, sem dependência de bibliotecas externas de componentes.

A identidade visual permanecerá exclusiva do projeto.

---

# Formulários

Os formulários utilizarão bibliotecas especializadas para gerenciamento de estado e validação.

As validações executadas no frontend possuirão caráter exclusivamente visual.

Toda validação crítica continuará sendo responsabilidade do backend.

---

# Responsabilidades

O frontend será responsável por:

- renderização da interface;
- navegação;
- gerenciamento do estado visual;
- comunicação com a API;
- feedback ao usuário.

Não será responsável por:

- regras de negócio;
- cálculos financeiros;
- validações críticas;
- persistência de dados.

---

# Consequências

A arquitetura adotada proporciona:

- organização por módulos;
- baixo acoplamento;
- facilidade de manutenção;
- alta produtividade;
- excelente integração com ferramentas de IA;
- evolução incremental da interface;
- alinhamento arquitetural com o backend.

---

# Tecnologias Adotadas

A implementação inicial utilizará:

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- Componentização manual com Tailwind

A substituição futura de qualquer tecnologia não deverá exigir alterações na arquitetura definida neste documento.

---

# Impacto

Este ADR substitui as decisões referentes à arquitetura do frontend anteriormente descritas no ADR-001.

A partir desta decisão, o frontend passa a utilizar React como biblioteca para construção da interface, mantendo os princípios arquiteturais definidos para o projeto.

---

# Referências

- NORTH-STAR.md
- PROJECT.md
- ARCHITECTURE.md
- BACKEND.md
- API.md
- ADR-001
- ADR-003