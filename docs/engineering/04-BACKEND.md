# BACKEND

**Status:** Aprovado

**Versão:** 1.2

**Última atualização:** 30/07/2026

---

# Objetivo

Definir os padrões oficiais para desenvolvimento do backend do projeto.

Este documento estabelece a organização do código, responsabilidades das camadas, convenções de implementação e boas práticas que deverão ser seguidas durante todo o ciclo de vida da aplicação.

---

# Tecnologias

O backend será desenvolvido utilizando:

- TypeScript
- Node.js
- Express
- SQLite
- Drizzle ORM (ou tecnologia equivalente)
- Zod para validações
- Vitest para testes
- JWT (jsonwebtoken) para autenticação
- bcryptjs para hash de senhas

A substituição de qualquer tecnologia deverá preservar a arquitetura definida neste projeto.

---

# Setup e Execução

## Instalação

```bash
npm install
```

## Variáveis de ambiente (opcionais)

As variáveis possuem defaults que funcionam sem configuração. Para customizar, copie o `.env.example` para `.env`:

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NODE_ENV` | `development` | Ambiente (development ou production) |
| `PORT` | `3000` | Porta do servidor |
| `DB_PATH` | `gestao.db` | Caminho do banco SQLite |

## Execução

```bash
# Desenvolvimento — sobe backend (tsx watch) + frontend (Vite HMR) em um comando
npm run dev

# Compilar backend + frontend para produção
npm run build

# Produção — Express serve API em /api/* e frontend estático como SPA
npm start
```

O banco de dados é criado automaticamente na primeira execução (`createTables()` em `src/database.ts`).

## Testes

```bash
npm test
```

---

# Estrutura Recomendada dos Módulos

Cada módulo deverá possuir uma estrutura semelhante à seguinte:

```text
cliente/

presentation/
    controllers/
    dtos/

application/
    CreateClient/
        CreateClientUseCase.ts
        CreateClientInput.ts
        CreateClientOutput.ts
    UpdateClient/
    DeleteClient/
    FindClient/

domain/
    entities/
    value-objects/
    services/

infrastructure/
    repositories/
    mappers/
```

A estrutura poderá evoluir conforme a necessidade de cada módulo, desde que mantenha a separação de responsabilidades definida neste documento.

---

# Camada Presentation

Responsável pela comunicação com consumidores da API.

Responsabilidades:

- Controllers;
- DTOs;
- Conversão de dados;
- Respostas HTTP;
- Validações superficiais.

Não deverá conter:

- Regras de negócio;
- Consultas ao banco;
- Cálculos;
- Persistência.

Controllers deverão apenas:

1. Receber a requisição;
2. Validar o formato dos dados;
3. Executar um Caso de Uso;
4. Retornar a resposta.

---

# Camada Application

Responsável pela execução dos Casos de Uso.

Cada Caso de Uso deverá representar uma única operação do sistema.

Exemplos:

- CreateClientUseCase
- UpdateClientUseCase
- CreateContractUseCase
- RegisterPaymentUseCase
- RegisterExpenseUseCase

Responsabilidades:

- Orquestrar entidades;
- Coordenar transações;
- Controlar o fluxo da operação;
- Comunicar-se com recursos externos por meio de Ports.

A camada Application não deverá conter regras de negócio que pertençam ao domínio.

---

# Casos de Uso

Os Casos de Uso deverão seguir os seguintes princípios:

- Responsabilidade única;
- Baixo acoplamento;
- Alta coesão;
- Independência entre si;
- Facilidade de teste.

Cada Caso de Uso deverá possuir implementação própria.

Não será permitido concentrar múltiplas operações em uma única classe genérica.

Casos de Uso não deverão chamar outros Casos de Uso diretamente.

Sempre que houver lógica reutilizável, ela deverá ser movida para o Domain.

---

# Ports e Repositories

A camada Application deverá definir os contratos (Ports) necessários para execução dos Casos de Uso.

Exemplo:

```text
application/

ports/

IContractRepository.ts
```

A camada Infrastructure será responsável por implementar esses contratos.

Exemplo:

```text
infrastructure/

repositories/

ContractRepository.ts
```

Repositories deverão ser responsáveis exclusivamente pelo acesso aos dados.

Não deverão conter regras de negócio.

Não deverão realizar cálculos.

Não deverão conhecer regras do domínio além da persistência.

Responsabilidades:

- Buscar registros;
- Persistir registros;
- Atualizar registros;
- Remover registros (quando permitido).

Repositories nunca deverão:

- Calcular valores;
- Aplicar juros;
- Validar regras de negócio;
- Executar lógica de domínio.

Repositories deverão retornar entidades ou objetos do domínio, nunca estruturas específicas do banco de dados.

---

# Camada Domain

Representa o núcleo do sistema.

Responsabilidades:

- Entidades;
- Value Objects;
- Serviços de Domínio;
- Regras de negócio.

Toda inteligência do sistema deverá existir nesta camada.

O Domain nunca deverá depender de Infrastructure ou Presentation.

---

# Camada Infrastructure

Responsável pelos detalhes técnicos.

Responsabilidades:

- Banco de Dados;
- Repositórios;
- Persistência;
- APIs Externas;
- Sistema de Arquivos.

Nenhuma regra de negócio deverá existir nesta camada.

---

# Validações

As validações deverão ocorrer em diferentes níveis.

Presentation:

- Estrutura dos dados;
- Campos obrigatórios;
- Tipos.

Application:

Exemplos:

- Cliente encontrado;
- Contrato ativo;
- Existência do contrato.

Domain:

- Regras de negócio;
- Estados válidos;
- Integridade da operação.

O frontend nunca será responsável por garantir regras de negócio.

---

# DTOs

DTOs serão utilizados apenas para transporte de dados.

Responsabilidades:

- Validar formato;
- Representar entrada e saída da API;
- Converter dados quando necessário.

DTOs nunca deverão conter regras de negócio.

---

# Tratamento de Erros

Todos os erros deverão possuir estrutura padronizada.

Exemplo:

```json
{
    "code": "CONTRACT_NOT_FOUND",
    "message": "Contrato não encontrado."
}
```

Mensagens internas nunca deverão ser expostas diretamente ao usuário.

---

# Transações

Sempre que uma operação modificar mais de uma entidade persistida, deverá ser utilizada uma transação.

Exemplos:

- Criação de contrato;
- Registro de pagamento;
- Registro de gasto;
- Liquidação semanal.

---

# Código Compartilhado

Código compartilhado deverá existir apenas quando for realmente genérico.

Exemplos permitidos:

- Datas;
- CPF;
- Formatação monetária;
- Utilidades matemáticas genéricas.

Regras de negócio nunca deverão ser movidas para utilitários compartilhados.

---

# Testes

Toda regra de negócio deverá possuir testes.

Prioridades:

1. Domain;
2. Use Cases;
3. Repositories;
4. Controllers.

Os testes deverão ser independentes entre si.

---

# Restrições

Não será permitido:

- Regras de negócio em Controllers;
- Regras de negócio em Repositories;
- Controllers acessando banco de dados;
- Casos de Uso chamando outros Casos de Uso;
- Dependências invertidas entre camadas;
- Objetos genéricos de Service concentrando múltiplas responsabilidades;
- Comunicação direta entre módulos sem passar pela camada Application;
- Duplicação de regras de negócio.

---

# Regras de Implementação

Toda regra de negócio deverá existir exclusivamente na camada Domain ou Application.

Controllers não poderão realizar cálculos.

Repositories não poderão conter regras de negócio.

O frontend nunca será responsável por garantir regras de negócio.

Casos de Uso não deverão compartilhar regras de negócio entre si por meio de classes genéricas de Service.

Quando houver lógica reutilizável, ela deverá ser extraída para o Domain, preservando a responsabilidade única dos Casos de Uso.

Cada Caso de Uso deverá ser desenvolvido e testado de forma independente.

---

# Performance

A otimização de performance nunca deverá comprometer:

- Legibilidade;
- Manutenibilidade;
- Clareza do domínio.

A clareza da implementação possui prioridade sobre micro-otimizações.

---

# Referências

- ARCHITECTURE.md
- DATABASE.md
- DOMAIN.md
- BUSINESS-RULES.md
- ADR-001
- ADR-003
- ADR-001