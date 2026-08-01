# BUSINESS RULES

**Status:** Aprovado

**Versão:** 1.6

**Última atualização:** 30/07/2026

---

# Objetivo

Definir as regras de negócio que governam o comportamento das entidades do sistema.

Este documento complementa o `DOMAIN.md` e representa a fonte oficial das regras de negócio do projeto.

---

# Clientes

## BR-001

Um cliente pode possuir um ou vários contratos. (Relacionamento definido em DOMAIN.md)

---

## BR-002

Cada contrato pertence obrigatoriamente a um único cliente. (Relacionamento definido em DOMAIN.md)

---

## BR-003

Os dados cadastrais do cliente poderão ser alterados a qualquer momento.

Alterações cadastrais não deverão modificar informações históricas registradas em contratos, parcelas, pagamentos ou movimentações financeiras.

---

# Contratos

## BR-004

Todo contrato deverá possuir obrigatoriamente:

- Cliente associado
- Valor Base
- Percentual de Juros
- Quantidade de Parcelas
- Data de Início

Sem essas informações o contrato não poderá ser criado.

---

## BR-005

O Valor Final do contrato deverá ser calculado automaticamente utilizando o percentual de juros informado.

O sistema deverá manter registrados:

- Valor Base
- Percentual de Juros
- Valor Final

Na visualização do contrato, o Valor Base deverá possuir maior destaque visual, enquanto o percentual de juros e o Valor Final deverão ser apresentados como informações complementares.

O Valor Final será calculado como:

`ValorFinal = ValorBase × (1 + taxaJuros / 100)`

A taxa de juros padrão será de 20%, podendo ser alterada durante a criação do contrato.

---

## BR-006

O percentual de juros e a quantidade de parcelas poderão ser alterados somente durante a criação do contrato ou durante sua edição, desde que nenhum pagamento tenha sido registrado.

Caso existam pagamentos vinculados ao contrato, suas condições financeiras deverão permanecer imutáveis.

---

## BR-007

Cada contrato possui seu próprio ciclo de vida.

Contratos diferentes do mesmo cliente não compartilham parcelas nem pagamentos.

O encerramento de um contrato não deverá afetar os demais contratos do mesmo cliente.

---

# Parcelas

## BR-008

A quantidade de parcelas será definida durante a criação do contrato.

A alteração da quantidade de parcelas somente será permitida enquanto não existir nenhum pagamento registrado para o contrato.

---

## BR-009

Cada parcela poderá assumir apenas um dos seguintes estados:

- Pendente
- Parcial
- Paga

---

## BR-010

Ao registrar um pagamento inferior ao valor previsto da parcela, ela deverá permanecer com status **Parcial**.

---

## BR-012

Quando o saldo pendente de uma parcela atingir zero, seu status deverá ser alterado automaticamente para **Paga**.

---

# Pagamentos

## BR-013

Todo pagamento deverá registrar automaticamente:

- Data
- Hora
- Valor recebido

---

## BR-014

O operador poderá registrar pagamentos a qualquer momento.

---

## BR-015

Um pagamento poderá ser aplicado integral ou parcialmente sobre uma ou mais parcelas do mesmo contrato.

---

## BR-016

O valor aplicado a um contrato nunca poderá exceder seu saldo devedor.

---

## BR-017

Todo pagamento deverá permanecer registrado permanentemente para fins de histórico.

Não será permitida exclusão física do histórico de pagamentos.

---

# Caixa

## BR-018

O Caixa Base representa o capital disponível para concessão de novos contratos.

Seu valor será definido pelo operador e sua alteração deverá ocorrer apenas por meio de uma funcionalidade específica, evitando modificações acidentais durante a operação diária.

Toda alteração do Caixa Base deverá gerar uma Movimentação Financeira correspondente, garantindo rastreabilidade completa da operação.

---

## BR-019

Sempre que um novo contrato for criado, o Valor Base do contrato deverá ser debitado automaticamente do Caixa Base.

Essa operação deverá gerar uma movimentação financeira vinculada ao contrato.

---

## BR-020

Sempre que um pagamento for registrado, o valor efetivamente recebido deverá ser incorporado automaticamente ao Caixa Base, independentemente de o pagamento quitar total ou parcialmente uma parcela.

Essa operação deverá gerar uma movimentação financeira vinculada ao pagamento.

---

## BR-021

Sempre que um gasto for registrado, seu valor deverá ser debitado automaticamente do Caixa Base.

Essa operação deverá gerar uma movimentação financeira vinculada ao gasto.

---

## BR-022

Toda movimentação financeira deverá possuir uma origem claramente identificável.

Exemplos:

- Contrato
- Pagamento
- Gasto
- Ajuste Manual (caso implementado futuramente)

---

## BR-023

O Caixa nunca criará valores próprios.

Todos os indicadores financeiros deverão ser calculados exclusivamente a partir das movimentações financeiras registradas.

---

## BR-024

O valor estimado para cobrança do dia deverá ser calculado automaticamente considerando todas as parcelas previstas para a data atual.

Esse indicador possui caráter exclusivamente informativo e não gera movimentações financeiras.

---

## BR-025

O total cobrado do dia deverá considerar exclusivamente pagamentos registrados na data atual.

Ao selecionar esse indicador, o sistema deverá apresentar todas as movimentações que compõem seu valor, permitindo identificar o cliente, contrato e pagamento correspondente.

---

## BR-026

Os indicadores semanais deverão considerar exclusivamente movimentações ocorridas dentro do período semanal vigente.

Ao selecionar qualquer indicador semanal, o sistema deverá apresentar as movimentações que originaram seu valor.

---

## BR-027

A liquidação semanal deverá ocorrer automaticamente a cada sete dias.

A liquidação reiniciará apenas os indicadores semanais.

Nenhuma movimentação financeira poderá ser removida durante esse processo.

Todo o histórico deverá permanecer disponível para consulta.

---

# Gastos

## BR-028

Todo gasto deverá possuir obrigatoriamente:

- Valor
- Categoria
- Data

Opcionalmente poderá conter observações.

Todo gasto deverá impactar automaticamente o Caixa Base e os indicadores financeiros correspondentes.

---

# Autenticação

## BR-055

Cada operador do sistema possui credenciais próprias (email + senha).

O acesso ao sistema é restrito a operadores autenticados. Nenhuma operação poderá ser realizada sem autenticação válida.

---

## BR-056

Os dados são isolados por operador.

Um operador autenticado visualiza e manipula exclusivamente seus próprios registros — clientes, contratos, pagamentos, gastos, caixa e histórico operacional. Nenhum operador poderá acessar dados de outro operador em hipótese alguma.

---

## BR-057

Apenas o administrador do sistema pode criar novos operadores.

O registro de novos operadores é realizado exclusivamente por um operador com permissão de administrador, através de endpoint protegido.

---

## BR-058

O token de autenticação (JWT) possui validade de 7 dias.

Ao expirar, o operador é redirecionado para a tela de login. Nenhuma operação poderá ser realizada com token expirado.

---

# Administração

## BR-066

Todo usuário do sistema possui um papel (`role`): `super_admin`, `admin` ou `operator`.

O papel determina o nível de acesso:

- **super_admin** — Acesso irrestrito a todas as empresas e dados. Gerencia empresas (criar, listar). Pode fazer drill-down em qualquer empresa.
- **admin** — Acesso a todos os dados da sua empresa. Gerencia operadores da sua empresa.
- **operator** — Acesso restrito aos próprios dados dentro da sua empresa.

---

## BR-067

Apenas administradores (`role = 'admin'` ou `role = 'super_admin'`) podem listar, criar, editar e remover operadores.

Qualquer tentativa de um operador comum acessar endpoints de gestão de usuários deve resultar em erro 403 (proibido).

---

## BR-068

O administrador pode visualizar um dashboard consolidado com KPIs agregados de todos os operadores (total de clientes, contratos ativos, resultado do dia).

Este dashboard é acessível exclusivamente pela rota `/admin`.

O super_admin pode visualizar o dashboard de qualquer empresa via drill-down (`?empresaId=X`) ou o agregado global.

---

## BR-069

Nenhum usuário pode alterar o próprio `role`. Esta proteção se aplica a `super_admin`, `admin` e `operator`.

---

## BR-070

Nenhum usuário pode remover a si mesmo. Esta proteção se aplica a todos os papéis.

---

## BR-071

Ao remover um operador, seus dados operacionais (clientes, contratos, pagamentos, caixa, gastos, histórico) permanecem íntegros no banco de dados.

A remoção é lógica (`deletedAt`) e apenas bloqueia o login do operador. Nenhum dado operacional é excluído em cascata.

---

## BR-072

Apenas o `super_admin` pode criar e listar empresas. Cada empresa possui um nome e um admin vinculado criado simultaneamente. A criação é atômica: ou ambos (empresa + admin) são criados, ou nada é criado.

---

## BR-073

Os dados de cada empresa são completamente isolados. Um admin da Empresa A não pode acessar, visualizar ou modificar dados da Empresa B, nem gerenciar operadores de outra empresa. O `super_admin` é a única exceção — possui acesso irrestrito a todas as empresas via drill-down.

---

## BR-074

O dashboard do admin (`GET /api/admin/dashboard`) exibe KPIs agregados apenas dos operadores da sua empresa. O `super_admin` pode visualizar o dashboard de qualquer empresa via query param `?empresaId=X`, ou o agregado global quando omitido.

---

## BR-075

Ao criar um operador, o `empresaId` é herdado automaticamente do admin que realiza a criação. O admin não pode criar operadores em outra empresa.

---

## BR-076

Apenas o seed inicial pode criar usuários com `role = 'super_admin'`. O endpoint `POST /api/admin/operadores` aceita apenas `role = 'admin' | 'operator'`.

---

## BR-077

O endpoint `POST /api/auth/login` possui limite de 10 tentativas por IP a cada 15 minutos. Excedido o limite, retorna erro 429.

---

## BR-078

O admin define o Caixa Base de um operador via `POST /api/caixa/ajuste?usuarioId=`, validando que o alvo pertence à própria empresa. O `super_admin` pode ajustar o caixa de operadores de qualquer empresa.

---

## BR-079

~~Operador não pode ajustar o Caixa Base próprio (403).~~ **Revogado pelo PLAN-021** — ver BR-084.

---

## BR-080

O admin visualiza os KPIs do caixa de um operador via `GET /api/caixa?usuarioId=`, validado dentro da empresa. O `super_admin` visualiza caixas de qualquer empresa.

---

## BR-081

Login roteado por perfil: `operator` → `/`, `admin` → `/admin`, `super_admin` → `/admin/empresas`. O `/admin` para `super_admin` redireciona para `/admin/empresas` (não tem empresa própria para gerenciar).

---

## BR-082

O dashboard do admin (`GET /api/admin/dashboard`) separa a contagem por papel: `totalAdmins` conta apenas usuários com `role = 'admin'` e `totalOperadores` apenas `role = 'operator'`. Os KPIs são agrupados em `Equipe` (Admins × Operadores) e `Operação` (Clientes, Contratos, Resultado do dia).

---

## BR-083

O card de empresa (super admin) exibe `totalUsuarios`, que soma `admin` + `operator` da empresa — não apenas operadores.

---

## BR-084

O operador pode ajustar o próprio Caixa Base (`POST /api/caixa/ajuste`). O query `?usuarioId=` é sempre ignorado para `operator` — o alvo é o `req.userId` (segurança preservada).

---

## BR-085

Contratos "ativos" (KPIs do painel admin e do card de empresa) são contados apenas quando `estado = 'Ativo'`. Contratos `Finalizado` (quitação total) ou `Cancelado` não entram na contagem — o filtro considera o campo `estado`, não apenas `deletedAt IS NULL`.

---

## BR-086

O histórico diário de atrasos (`GET /api/operacoes/historico-atrasos`) é alimentado por um snapshot registrado automaticamente a cada listagem de cobranças do dia (`GET /api/operacoes/cobrancas`) — um upsert por operador e data. Não há job agendado: se o operador não abriu as cobranças naquele dia, não há snapshot para o dia. Apenas parcelas vencidas (`dataVencimento` anterior à data atual) com saldo pendente > 0 entram na contagem, sempre com clientes e contratos contados de forma distinta (`DISTINCT`).

---

# Histórico

## BR-029

Nenhum pagamento registrado poderá ser removido fisicamente.

---



## BR-032

Toda movimentação financeira deverá permanecer disponível para consulta histórica.

Os indicadores apresentados pelo sistema deverão permitir navegar até as movimentações que compõem seus valores.

---

# Operações / Atendimento

## BR-048

Todo cliente inicia automaticamente com Resultado Operacional = PENDENTE.

Esse é o estado padrão de qualquer cobrança antes do primeiro atendimento ser realizado.

---

## BR-049

O sistema reconhece exatamente quatro Resultados Operacionais:

- **PENDENTE** — Nenhum atendimento foi realizado. Estado inicial.
- **VISITADO** — O operador realizou atendimento presencial.
- **NAO_ENCONTRADO** — Foi realizada tentativa de atendimento, mas o cliente não foi localizado.
- **PROMESSA** — O cliente informou que realizará o pagamento posteriormente.

---

## BR-050

Registrar um atendimento (VISITADO, NAO_ENCONTRADO ou PROMESSA) altera exclusivamente o Resultado Operacional do cliente.

Nenhuma informação financeira — parcelas, pagamentos, saldo devedor ou Caixa Base — poderá ser modificada automaticamente em decorrência de um atendimento.

---

## BR-051

Pagamento e Atendimento são fluxos independentes.

O registro de pagamento continua sendo realizado exclusivamente pelo fluxo de Pagamentos. Nenhum atendimento poderá quitar parcelas, alterar saldo devedor ou modificar qualquer informação financeira do contrato.

---

## BR-052

O Resultado Operacional armazena apenas o último atendimento realizado.

Nesta versão do sistema não existe histórico de atendimentos. Registrar um novo atendimento sobrescreve o resultado anterior.

---

## BR-053

As listas operacionais (Rota de Cobrança, Dashboard e Cobranças do Dia) exibem exclusivamente clientes com Resultado Operacional = PENDENTE.

Ao registrar qualquer atendimento (VISITADO, NAO_ENCONTRADO ou PROMESSA), o cliente é automaticamente removido da fila operacional ativa. Clientes atendidos permanecem acessíveis via tela "Atendidos Hoje" para consulta e reengajamento.

---

## BR-054

Toda alteração de Resultado Operacional deve ser propagada automaticamente para todas as telas operacionais ativas (Rota, Dashboard, Cobranças do Dia) via EventBus interno, garantindo que a fila operacional reflita o estado real sem necessidade de recarregamento manual.

---

# Integridade

## BR-033

Toda regra de negócio deverá ser implementada no backend.

O frontend poderá realizar validações de usabilidade, porém nunca será responsável por garantir a integridade das regras de negócio.

---

## BR-034

Toda alteração nas regras de negócio deverá ser registrada neste documento antes da implementação correspondente.

---

## BR-035

Todo indicador financeiro apresentado pelo sistema deverá permitir rastrear as movimentações que originaram seu valor.

Essa rastreabilidade deverá permitir identificar, quando aplicável:

- Cliente
- Contrato
- Parcela
- Pagamento
- Gasto

---

# Clientes

## BR-036

O CPF do cliente é opcional no cadastro.

Quando informado, deverá conter exatamente 11 dígitos numéricos e será armazenado sem formatação.

A validação do CPF será realizada no backend, utilizando código compartilhado.

---

## BR-037

O nome do comércio é obrigatório no cadastro do cliente.

---

## BR-038

A cidade no endereço do cliente é opcional.

---

## BR-043

O CPF do cliente, quando informado, deve ser único por operador.

Não é permitido cadastrar dois clientes com o mesmo CPF para o mesmo operador. Operadores diferentes podem cadastrar clientes com o mesmo CPF — o índice único composto `(cpf, userId)` garante essa regra no banco.

Na criação, o sistema deve verificar se o CPF já existe para aquele operador antes de salvar.

Na edição, o sistema deve verificar se o CPF já existe para aquele operador, excluindo o próprio cliente da consulta.

A validação só deve ser aplicada quando o CPF for informado (campo opcional).

> **BR-043-A (futuro):** Tornar o CPF único globalmente no sistema. Ao tentar cadastrar um CPF já existente (de outro operador), informar "CPF já cadastrado no sistema" sem expor os dados do cliente. Feature depende de mecanismo de transferência de cliente entre operadores (admin).

---

# Contratos

## BR-039

As parcelas de um contrato serão geradas com vencimentos diários consecutivos.

A primeira parcela vence no dia seguinte à data de início do contrato.

---

## BR-040

A periodicidade das parcelas poderá ser alterada futuramente por meio de configuração no contrato, sem impacto retroativo nas parcelas já existentes.

---

## BR-041

Na edição do contrato antes da existência de pagamentos, as parcelas existentes devem ser substituídas pelas novas (soft delete das antigas + criação das novas), preservando o histórico.

---

## BR-042

As parcelas de um contrato não devem ter vencimento em domingo.

Se o cálculo do vencimento cair em um domingo, a data deve ser ajustada automaticamente para a segunda-feira seguinte.

Exemplo:
Contrato com início em 01/07/2026 (quarta-feira):
- Parcela 1 → 02/07 (quinta ✅)
- Parcela 4 → 05/07 (domingo ❌ → ajusta para 06/07, segunda-feira)

---

## BR-042-A

A data final do contrato (dataFinal) será calculada automaticamente como `dataInicio + quantidadeParcelas` dias, ajustando para segunda-feira se o cálculo recair em um domingo.

---

# Pagamentos

## BR-044

Os pagamentos devem ser distribuídos entre as parcelas do contrato em ordem crescente de número (parcela mais antiga primeiro).

---

## BR-045

Se o valor do pagamento exceder o saldo pendente da parcela atual, o excedente deve ser automaticamente aplicado à próxima parcela pendente, respeitando o saldo devedor total do contrato.

O valor total aplicado a um contrato nunca poderá exceder seu saldo devedor (BR-016).

---

## BR-046

O contrato deve ter seu estado alterado automaticamente para **Finalizado** quando todas as suas parcelas atingirem o estado **Paga**.

---

## BR-047

Todo pagamento deve ser registrado na tabela `pagamentos`, com sua distribuição detalhada registrada na tabela `pagamento_parcelas`, garantindo rastreabilidade completa de qual valor foi aplicado em cada parcela.

---

## BR-087

No painel admin, quando o administrador acessa o próprio painel (admin self, sem `?empresaId=`), os KPIs de Operação — `totalClientes`, `contratosAtivos`, `recebidoHoje` e `resultadoDoDia` — são escopados aos dados do **próprio usuário logado**, coincidindo com as telas de navegação (`/clientes`, `/contratos` e o caixa).

O super admin (ou um admin visualizando uma empresa via `?empresaId=`) mantém a visão **agregada da empresa**. Nesse modo, os KPIs de Operação não são clicáveis (a navegação por `/clientes` e `/contratos` filtra por `req.userId` e divergiria do agregado).

Os KPIs de Equipe (`totalAdmins`, `totalOperadores`) permanecem sempre por empresa.

---

# Referências

- NORTH-STAR.md
- PROJECT.md
- DOMAIN.md
- ARCHITECTURE.md
- CONVENTIONS.md
- ADR-001
- PLAN-009-conceito-atendimento.md
- PLAN-015-autenticacao.md
- PLAN-017-admin-panel.md