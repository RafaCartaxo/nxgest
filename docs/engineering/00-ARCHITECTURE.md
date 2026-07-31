# ARCHITECTURE

**Status:** Aprovado

**Versão:** 1.2

**Última atualização:** 31/07/2026

---

# Objetivo

Definir a arquitetura oficial do projeto, estabelecendo sua organização, os princípios arquiteturais, a relação entre as camadas e as responsabilidades de cada uma delas.

Este documento representa a referência arquitetural do sistema.

---

# Arquitetura Adotada

O sistema adotará uma arquitetura baseada em:

- Modular Monolith
- DDD Lite
- Clean Layers
- Use Case Driven Application
- Ports & Adapters

Essa combinação busca equilibrar simplicidade, organização e facilidade de evolução, evitando complexidade desnecessária.

Cada funcionalidade do sistema deverá ser implementada como um Caso de Uso (Use Case) independente, preservando o princípio da responsabilidade única e facilitando testes, manutenção e evolução da aplicação.

---

# Princípios Arquiteturais

A arquitetura deverá seguir os seguintes princípios:

- Separação de responsabilidades;
- Alta coesão;
- Baixo acoplamento;
- Código orientado ao domínio;
- Evolução incremental;
- Simplicidade antes de abstração;
- Facilidade de manutenção.

---

# Organização do Projeto

O projeto será organizado por módulos de negócio.

Cada módulo deverá ser responsável exclusivamente pelo seu próprio contexto.

Exemplos:

- Cliente
- Contrato
- Parcela
- Pagamento
- Caixa
- Gasto
- Dashboard
- Mapa
- Admin (gestão de operadores, isolamento multi-tenant)
- Empresa (gestão de empresas, acessível apenas por super_admin)

Novos módulos poderão ser adicionados sem impactar os existentes.

---

# Estrutura em Camadas

Cada módulo deverá seguir a seguinte organização lógica:

```text
Presentation
      │
      ▼
Application
   ┌──┴──────────┐
   ▼             ▼
Domain         Ports
                 │
                 ▼
         Infrastructure
```

A camada Presentation comunica-se exclusivamente com a Application.

A camada Application executa os Casos de Uso, utiliza o Domain para aplicar as regras de negócio e comunica-se com dependências externas por meio de Ports.

A camada Infrastructure implementa os Ports definidos pela Application.

O Domain permanece independente das demais camadas.

---

# Fluxo Arquitetural

```text
HTTP Request
      │
      ▼
Presentation
      │
      ▼
Application
   ┌──┴──────────┐
   ▼             ▼
Domain         Ports
                 │
                 ▼
         Infrastructure
```

---

# Responsabilidades das Camadas

## Presentation

Responsável pela comunicação entre o sistema e seus consumidores.

Responsabilidades:

- Controllers;
- DTOs de entrada e saída;
- Validação superficial;
- Conversão de dados.

Esta camada não poderá conter regras de negócio.

---

## Application

Responsável pela execução dos Casos de Uso do sistema.

A camada Application coordena a execução das operações de negócio, utilizando o Domain e comunicando-se com dependências externas exclusivamente por meio de Ports.

Cada Caso de Uso deverá representar uma única operação de negócio.

---

# Ports (Contratos)

A camada Application define os contratos (Ports) necessários para execução dos Casos de Uso.

Esses contratos representam abstrações para comunicação com recursos externos, como persistência de dados ou serviços de terceiros.

As implementações desses contratos pertencem à camada Infrastructure.

Essa separação mantém a Application desacoplada dos detalhes técnicos e preserva a independência do Domain.

---

## Domain

Representa o núcleo do sistema.

Responsabilidades:

- Entidades;
- Value Objects;
- Serviços de Domínio;
- Regras de Negócio.

O Domain não deverá depender de nenhuma outra camada.

---

## Infrastructure

Responsável pelos detalhes técnicos.

Responsabilidades:

- Persistência;
- Repositórios;
- Banco de Dados;
- APIs Externas;
- Sistema de Arquivos;
- Serviços Externos.

Nenhuma regra de negócio deverá existir nesta camada.

---

# Dependências

A camada Presentation depende da Application.

A camada Application depende apenas do Domain e define os contratos (Ports) utilizados para comunicação com recursos externos.

A camada Infrastructure implementa os Ports definidos pela Application.

O Domain não possui dependência de nenhuma outra camada.

---

# Escalabilidade

A arquitetura deverá permitir:

- inclusão de novos módulos;
- substituição do banco de dados;
- criação futura de autenticação;
- suporte a múltiplos usuários;
- integração com APIs externas;
- substituição de componentes da Infrastructure.

Essas evoluções deverão ocorrer sem necessidade de reestruturação significativa.

---

# Referências

- NORTH-STAR.md
- PROJECT.md
- DOMAIN.md
- BUSINESS-RULES.md
- ADR-001
- BACKEND.md

