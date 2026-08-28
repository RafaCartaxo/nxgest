# DOMAIN

**Status:** Aprovado

**Versão:** 1.4

**Última atualização:** 30/07/2026

---

# Objetivo

Definir as entidades que compõem o domínio do sistema e suas responsabilidades.

Este documento representa o modelo conceitual do negócio e define as entidades, seus relacionamentos e responsabilidades.

As regras de negócio são detalhadas em `BUSINESS-RULES.md`.

---

# Entidades do Domínio

## Cliente

Representa uma pessoa cadastrada no sistema, apta a possuir um ou mais contratos de crediário.

### Responsabilidades

* Armazenar dados pessoais.
* Armazenar CPF (opcional).
* Armazenar nome do comércio (obrigatório).
* Armazenar informações de contato.
* Armazenar endereço residencial.
* Armazenar localização do comércio.
* Permitir atualização cadastral.
* Manter a relação com seus contratos.
---

## Contrato

Representa um acordo financeiro firmado entre o operador e um cliente.

Cada contrato possui suas próprias condições, sendo independente dos demais contratos do mesmo cliente.

### Responsabilidades

* Registrar o valor base.
* Registrar o percentual de juros.
* Representar as condições financeiras do acordo.
* Definir quantidade de parcelas.
* Definir a periodicidade das parcelas (`diaria` padrão, `semanal` ou `alternada` — ver BR-039/BR-107).
* Calcular automaticamente a data de término (dataFinal) como dataInicio + quantidadeParcelas × intervalo (1, 2 ou 7 dias), com ajuste de domingo (BR-108).
* Gerenciar seu próprio estado.
* Manter a relação com suas parcelas.
* Manter a relação com seus pagamentos.

---

## Parcela

Representa uma obrigação financeira prevista dentro de um contrato.

Cada parcela possui um valor esperado, podendo ser quitada integralmente ou parcialmente.

### Responsabilidades

* Registrar o valor previsto.
* Registrar o valor efetivamente pago.
* Controlar saldo pendente.
* Gerenciar seu estado (Pendente, Parcial ou Paga).
* Registrar data de vencimento.
* Registrar data de quitação.

---

## Pagamento

Representa um pagamento realizado pelo cliente.

Um pagamento pode quitar uma ou mais parcelas, total ou parcialmente.

### Responsabilidades

* Registrar valor recebido.
* Registrar data e hora.
* Registrar observações.
* Relacionar-se às parcelas quitadas.
* Manter histórico permanente.
* Controlar estado.

---

## Movimentação Financeira

Representa qualquer movimentação monetária registrada pelo sistema.

Toda entrada ou saída financeira deverá possuir uma movimentação correspondente, permitindo rastreabilidade completa da operação.

Esta é uma entidade interna do sistema e não possui interface própria para o usuário.

### Responsabilidades

- Registrar entradas e saídas financeiras.
- Identificar a origem da movimentação.
- Armazenar o valor movimentado.
- Registrar data e hora da operação.
- Servir como base para os indicadores do Caixa.
- Permitir rastreabilidade financeira completa.

---

## Caixa

Representa a consolidação financeira da operação.

O Caixa não cria movimentações financeiras, apenas consolida as movimentações registradas pelo sistema para geração dos indicadores operacionais.

### Responsabilidades

- Manter o Caixa Base.
- Consolidar Movimentações Financeiras.
- Gerar indicadores operacionais.
- Consolidar informações para a liquidação semanal.
---

## Gasto

Representa uma saída financeira realizada pelo operador.

### Responsabilidades

* Registrar valor.
* Registrar categoria.
* Registrar data.
* Registrar observações.

---

## Historico Operacional

Representa o registro de atendimento em campo, sem impacto financeiro.

O Histórico Operacional registra cada visita realizada pelo operador a um cliente, armazenando o tipo de atendimento e, quando aplicável, a data de promessa de pagamento. É uma entidade exclusivamente operacional — não gera movimentações financeiras.

### Responsabilidades

* Registrar o cliente e contrato visitados.
* Registrar o tipo de atendimento (visitado, não localizado, promessa).
* Armazenar data de promessa quando aplicável.
* Servir como registro histórico das operações em campo.
* Permitir filtro por data para consulta de atendimentos do dia.

---

## FechamentoSemanal

Representa o registro de consolidação financeira de um período semanal.

O FechamentoSemanal é gerado automaticamente a cada sete dias e não pode ser editado manualmente. Seu objetivo é armazenar o consolidado semanal para consulta histórica.

### Responsabilidades

* Registrar o período (data de início e data de fim).
* Armazenar total recebido no período.
* Armazenar total gasto no período.
* Armazenar resultado do período.
* Servir como registro histórico dos fechamentos.
* Não pode ser editado nem removido.

## Usuario

Representa um operador ou administrador com acesso ao sistema.

Cada Usuario possui credenciais próprias e um papel que determina seu nível de acesso. Todos os dados operacionais (clientes, contratos, pagamentos, movimentações financeiras, caixa, gastos, histórico operacional e fechamentos semanais) pertencem a um Usuario e são isolados por ele.

### Responsabilidades

* Armazenar credenciais de acesso (email e senha).
* Definir o papel do usuário (admin ou operator).
* Servir como escopo de isolamento para todos os dados operacionais.
* Permitir que o administrador gerencie outros operadores.
* Manter rastreabilidade de qual operador realizou cada operação.

### Papéis (role)

* **admin** — Acesso irrestrito. Visualiza e gerencia dados de todos os operadores. Único papel capaz de criar, editar e remover outros usuários.
* **operator** — Acesso restrito aos próprios dados. Realiza operações do dia a dia (clientes, contratos, pagamentos, caixa, gastos).

---

# Relacionamentos

Um Usuario possui todos os dados operacionais do sistema (Clientes, Contratos, Pagamentos, Movimentações Financeiras, Caixa, Gastos, Histórico Operacional, Fechamentos Semanais).

Um Cliente pode possuir vários Contratos.

Um Contrato pertence a apenas um Cliente.

Um Contrato possui várias Parcelas.

Um Contrato possui vários Pagamentos.

Um Pagamento pode ser distribuído entre uma ou mais Parcelas.

Uma Parcela pertence a apenas um Contrato.

Todo Contrato gera uma ou mais Movimentações Financeiras.

Todo Pagamento gera uma Movimentação Financeira.

Todo Gasto gera uma Movimentação Financeira.

Toda alteração do Caixa Base gera uma Movimentação Financeira.

O Caixa consolida exclusivamente as Movimentações Financeiras registradas pelo sistema.

---

# Estados do Sistema

## Contrato

* Ativo
* Finalizado
* Cancelado

---

## Parcela

* Pendente
* Parcial
* Paga

---

## Usuario

* admin
* operator



# Responsabilidades Gerais

Cada entidade deve possuir apenas responsabilidades relacionadas ao seu próprio domínio.

Nenhuma entidade deve assumir responsabilidades pertencentes a outra entidade.

As regras de negócio que envolvem múltiplas entidades deverão ser definidas em `BUSINESS-RULES.md` e executadas pelos Casos de Uso da camada Application.

---

# Referências

* NORTH-STAR.md
* ADR-001
* ADR-003
* PROJECT.md
* BUSINESS-RULES.md
