# BACKLOG — Refinamentos do Produto

**Status:** Em andamento — Sprint 1 concluído (PLAN-026)

**Versão:** 2.0

**Objetivo**

Organizar os próximos refinamentos do sistema em pequenas entregas independentes, priorizando correções funcionais, padronização visual e evolução da experiência operacional, evitando retrabalho e mantendo a arquitetura atual.

---

# EPIC 1 — Administração

## P011 — Correção de saldo do Operador

> **Resolvido** pela cadeia PLAN-020 → PLAN-025 (ajuste via `?usuarioId=` + `resolveUsuarioAlvo` + regra exclusiva de admin). Todo ajuste agora passa a gerar auditoria (P014).

### Problema

Ao acessar um operador pela área administrativa e realizar um ajuste de saldo, o valor não está sendo persistido corretamente no operador correspondente.

O saldo alterado pelo administrador também não está refletindo corretamente na visão do operador.

### Objetivos

- Corrigir a associação do operador durante o ajuste.
- Garantir persistência correta.
- Garantir atualização imediata após salvar.
- Validar Admin → Operador → Caixa.

---

## P012 — Padronização da página Administrativa

> **Concluído** (PLAN-026): `OperadoresList` agrupa a equipe em subseções "Administradores" e "Operadores", evitando "Operadores" como rótulo genérico. Espaçamentos/badges já normalizados (PLAN-024).

### Problemas

Atualmente existem inconsistências visuais:

- badges sobrepondo o nome;
- espaçamentos excessivos;
- KPIs com padrões diferentes do restante do sistema;
- ausência do usuário atual na equipe;
- nomenclaturas inconsistentes.

### Melhorias

### Cards

- corrigir espaçamentos;
- corrigir alinhamentos;
- manter padrão visual do restante do sistema.

### KPIs

Transformar todos os KPIs em elementos clicáveis, seguindo o padrão já utilizado em outras telas.

### Equipe

Adicionar o usuário atual na lista de membros.

Exemplo:

```
Administrador
(Eu)
```

Mantendo ordenação alfabética.

### Papéis

Padronizar os conceitos utilizados.

Exemplo:

```
Equipe

Administradores

Operadores
```

Evitando utilizar "Operadores" como nome genérico para todos.

---

## P013 — Contexto do Operador

> **Fatia 1 em planejamento** — Estorno de Pagamento pelo Admin (PLAN-028): corrige o caso de uso "corrigir pagamentos registrados incorretamente". Admin vê os contratos do operador no `OperadorDetail` e estorna um pagamento (modal de motivo + auditoria dedicada). Demais casos de uso (consultar clientes/contratos/pagamentos completos, caixa) seguem pendentes.

### Objetivo

Permitir que um administrador consiga acessar o contexto operacional de qualquer operador da equipe sem necessidade de trocar de login.

### Casos de uso

- consultar clientes;
- consultar contratos;
- consultar pagamentos;
- corrigir pagamentos registrados incorretamente;
- acompanhar o caixa do operador.

A implementação deve preservar toda a rastreabilidade das ações realizadas pelo administrador.

---

## P014 — Auditoria de Caixa

> **Concluído** (PLAN-026 + PLAN-027): tabela `auditoria_caixa` — operador, admin responsável, valor anterior, valor novo, motivo (obrigatório) e data. `POST /api/caixa/ajuste` exige `motivo`. Histórico **exibido** para admin (detalhe do operador) e operador (página de caixa) via `GET /api/caixa/auditoria`.

### Objetivo

Todo ajuste manual realizado pelo administrador deve gerar um registro financeiro.

Cada operação deverá armazenar:

- operador;
- administrador responsável;
- valor anterior;
- valor novo;
- motivo;
- data/hora.

Nenhuma alteração manual deverá ocorrer sem histórico.

---

# EPIC 2 — Clientes

## P015 — Indicadores Financeiros do Cliente

### Situação atual

Hoje o cliente apresenta:

- saldo devedor.

### Melhoria

Adicionar também:

- lucro previsto dos contratos.

O valor deverá ser calculado a partir dos contratos vinculados ao cliente.

---

## P016 — Padronização dos Endereços

### Problema

Durante a edição do cliente a captura automática e a edição manual acabam conflitando.

Além disso muitos campos aparecem sem necessidade.

### Proposta

Durante o cadastro:

```
Capturar localização
```

Após salvar:

```
Endereço residencial

Rua...
Cidade...

[Navegar]

----------------------

Endereço da cobrança

Rua...
Cidade...

[Navegar]
```

### Objetivos

- simplificar edição;
- preservar geolocalização existente;
- reduzir erros de endereço;
- manter integração com navegação.

---

# EPIC 3 — Cobrança

## P017 — Mensagens Inteligentes do WhatsApp

### Situação atual

A mensagem considera apenas o valor total devido.

### Melhoria

Utilizar as informações reais do cliente.

Exemplo:

```
Olá João.

Identificamos:

• 3 parcelas em atraso

Contrato Casa
R$ 120

Contrato Loja
R$ 90

Contrato Moto
R$ 140

Total pendente:
R$ 350
```

### Objetivos

- mensagem mais clara;
- facilitar negociação;
- reduzir dúvidas do cliente.

---

## P018 — Padronização dos Modais

> **Concluído** (PLAN-026): componente `Modal` base configurável (Escape/backdrop/overflow/`role=dialog`), modais refatorados preservando a semântica de fechamento de cada tela.

### Problema

Alguns modais não fecham corretamente ao cancelar.

### Objetivo

Todos os modais devem possuir comportamento consistente.

Cancelar deverá sempre:

- fechar o modal;
- cancelar a operação;
- limpar estados temporários quando necessário.

Também revisar os demais fluxos para evitar inconsistências semelhantes.

---

# EPIC 4 — Operação

> **Observação:** O conceito de Status Financeiro × Status Operacional já foi implementado e não faz parte deste backlog.

Este epic contempla apenas refinamentos da experiência operacional.

---

## P019 — Refinamentos Operacionais

Itens de melhoria identificados durante os testes da operação diária.

Novos refinamentos deverão ser adicionados aqui conforme evolução do produto.

---

# Prioridade sugerida

## Sprint 1 — Concluído (PLAN-026)

- P011 — Correção de saldo do operador (resolvido em PLAN-020→025; regressão)
- P018 — Padronização dos modais ✅
- P012 — Padronização da página Administrativa ✅
- P014 — Auditoria de Caixa ✅

---

## Sprint 2

- P014 — Auditoria de Caixa (concluído)
- P013 — Contexto do Operador

---

## Sprint 3

- P015 — Indicadores Financeiros do Cliente
- P016 — Padronização dos Endereços

---

## Sprint 4

- P017 — Mensagens Inteligentes do WhatsApp
- P019 — Refinamentos Operacionais

---

# Observações

Este backlog reúne apenas melhorias identificadas após a implementação das funcionalidades principais.

Cada item deverá evoluir posteriormente para um **PLAN** próprio, contendo:

- objetivo;
- escopo;
- critérios de aceite;
- ordem de implementação;
- checklist;
- impacto arquitetural.

Dessa forma o backlog permanece enxuto, enquanto cada entrega pode ser planejada de forma independente e incremental.