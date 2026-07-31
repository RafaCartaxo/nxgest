# DATABASE

**Status:** Aprovado

**Versão:** 1.3

**Última atualização:** 31/07/2026

---

# Objetivo

Definir o modelo de persistência do sistema, estabelecendo quais informações deverão ser armazenadas, seus relacionamentos e as regras de integridade dos dados.

Este documento descreve o modelo lógico de persistência, independentemente da tecnologia utilizada pelo banco de dados.

---

# Princípios

A persistência deverá respeitar os seguintes princípios:

* O banco de dados deverá refletir o domínio do sistema.
* Nenhuma informação será armazenada apenas por conveniência da interface.
* Informações derivadas deverão ser calculadas sempre que possível.
* Toda informação histórica deverá permanecer disponível para consulta.
* Toda movimentação financeira deverá possuir rastreabilidade.

---

# Identificadores

Todas as entidades persistidas deverão utilizar UUID v4 como chave primária.

Relacionamentos deverão utilizar chaves estrangeiras correspondentes.

Nenhuma regra de negócio dependerá de IDs sequenciais.

---

# Entidades Persistidas

O sistema deverá persistir as seguintes entidades:

- Cliente
- Contrato
- Parcela
- Pagamento
- Movimentação Financeira
- Caixa
- Gasto
- Fechamento Semanal (corresponde à entidade de domínio FechamentoSemanal)
- Historico Operacional (entidade exclusivamente operacional, sem impacto financeiro)
- Usuario (operador ou administrador do sistema — autenticação e isolamento de dados)
- Empresa (unidade de isolamento multi-tenant; super_admin tem empresaId null)

**Atributos do Usuario:** `id`, `nome`, `email` (único), `senhaHash`, `role` (`super_admin` | `admin` | `operator`), `createdAt`, `deletedAt`, `empresaId` (FK → `empresas.id`, nullable — `null` para super_admin)

**Isolamento por Usuario:** todas as entidades operacionais abaixo recebem a coluna `userId` (FK → `usuarios.id`) para garantir isolamento total de dados entre operadores:

- Cliente, Contrato, Pagamento, Movimentação Financeira, Caixa, Gasto, Fechamento Semanal, Historico Operacional

As entidades Parcela e PagamentoParcela não recebem `userId` diretamente — são acessadas via JOIN com a tabela pai (Contrato e Pagamento, respectivamente), que já possuem o filtro.

Entidades de interface, como Dashboard e Mapa, não deverão possuir persistência própria.

---

# Multi-Tenant (PLAN-019)

O sistema adota o modelo de multi-tenant por empresa. O isolamento de dados é feito via JOIN, sem colunas adicionais nas tabelas operacionais.

## Entidade Empresa

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID v4 | Sim | Chave primária |
| nome | TEXT | Sim | Nome da empresa |
| createdAt | TEXT | Sim | Data de criação |

## Isolamento por empresaId

A coluna `empresaId` (UUID, nullable FK → `empresas.id`) foi adicionada à tabela `usuarios`. O valor `null` indica super_admin (acesso transversal a todas as empresas).

| Papel | empresaId | Escopo de dados |
|-------|-----------|-----------------|
| `super_admin` | `null` | Acessa todas as empresas (drill-down opcional via `?empresaId=`) |
| `admin` | UUID da empresa | Acessa apenas os dados da sua empresa |
| `operator` | UUID da empresa | Acessa apenas os dados da sua empresa |

O isolamento é resolvido por JOIN: `clientes.userId → usuarios.id → usuarios.empresaId`. Nenhuma tabela operacional recebe a coluna `empresaId`.

## Seed inicial

O banco é populado com:

1. `super@nxgestao.com` — `role = super_admin`, `empresaId = null` (credenciais via `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_DEFAULT_PASSWORD`)
2. Empresa "Desenvolvimento" — vinculada ao admin existente (`admin@cobranca.com`)
3. Todos os operadores órfãos (sem empresa) vinculados à empresa "Desenvolvimento" (super_admin nunca é vinculado)

---

# Relacionamentos

## Usuario

Um Usuario possui todos os dados operacionais do sistema. As seguintes entidades referenciam diretamente um Usuario através da coluna `userId`:

- Cliente
- Contrato
- Pagamento
- Movimentação Financeira
- Caixa
- Gasto
- Fechamento Semanal
- Historico Operacional

O isolamento de dados é garantido pelo filtro `WHERE userId = ?` em todas as queries operacionais.

---

## Cliente

Um Cliente poderá possuir vários Contratos.

---

## Contrato

Um Contrato pertence a um único Cliente.

Um Contrato possui várias Parcelas.

Um Contrato possui vários Pagamentos.

Um Contrato poderá gerar uma ou mais Movimentações Financeiras.

---

## Parcela

Cada Parcela pertence exclusivamente a um Contrato.

---

## Pagamento

Cada Pagamento pertence a um Contrato.

Um Pagamento poderá ser distribuído entre uma ou mais Parcelas.

Todo Pagamento deverá gerar uma Movimentação Financeira.

---

## Gasto

Todo Gasto deverá gerar uma Movimentação Financeira.

---

## Caixa

O Caixa não possuirá informações financeiras próprias além de sua configuração operacional.

Seu saldo deverá ser obtido exclusivamente a partir das Movimentações Financeiras registradas.

Todos os seus indicadores deverão ser calculados automaticamente a partir dessas movimentações.

---

# Integridade

A persistência deverá garantir as seguintes regras:

- Um Usuario não poderá ser removido fisicamente (soft-delete via `deletedAt`).
- Um Cliente não poderá possuir Contratos órfãos.
- Uma Parcela nunca poderá existir sem um Contrato.
- Um Pagamento nunca poderá existir sem um Contrato.
- Toda Movimentação Financeira deverá possuir obrigatoriamente uma entidade de origem.
- A origem deverá ser identificável durante toda a vida útil do registro.
- Nenhum histórico financeiro poderá ser removido fisicamente.

---

# Exclusão

A exclusão física deverá ser evitada sempre que houver necessidade de preservação histórica.

Entidades financeiras (Movimentação Financeira, Pagamento, Parcela) não poderão ser removidas fisicamente.

Demais entidades (Cliente, Contrato) poderão utilizar exclusão lógica quando necessário, desde que não violem regras de integridade.

---

# Histórico

Os seguintes registros deverão permanecer permanentemente armazenados:

* Contratos
* Parcelas
* Pagamentos
* Movimentações Financeiras
* Liquidações Semanais

Alterações deverão preservar o histórico da operação.

Correções deverão ocorrer por meio de novas movimentações ou mecanismos específicos de retificação, nunca pela remoção do histórico.

---

# Auditoria

Toda entidade persistida deverá possuir, quando aplicável, informações mínimas de auditoria.

Essas informações incluem:

- Data de criação
- Data da última atualização

Todos os registros persistidos deverão utilizar UTC.

No futuro, poderão ser adicionadas informações de autoria sem necessidade de alteração do modelo conceitual.

---

# Dados Derivados

Os seguintes valores deverão ser calculados a partir das informações persistidas, evitando redundância:

- Saldo devedor do contrato
- Total pago
- Valor pendente
- Indicadores do Caixa
- Estimado para cobrança do dia
- Cobrado no dia
- Cobrado na semana
- Gastos da semana
- Resultado semanal

Esses valores poderão ser materializados futuramente para fins de performance, desde que sua origem permaneça sendo os registros persistidos.

Esses valores não deverão ser considerados fonte oficial de informação.

A fonte oficial será sempre o conjunto de registros persistidos.

---

# Evolução

O modelo de persistência deverá permitir:

* inclusão de novas entidades;
* inclusão de novos relacionamentos;
* migração para outro banco de dados;
* crescimento do volume de dados sem alterações estruturais significativas.

---

# Responsabilidades

O acesso aos dados deverá ocorrer exclusivamente através da camada Infrastructure, por meio de Repositories que implementam os Ports definidos pela camada Application.

Nenhuma outra camada poderá acessar diretamente o mecanismo de persistência.

---

# Referências

* DOMAIN.md
* BUSINESS-RULES.md
* ARCHITECTURE.md
* ADR-001
