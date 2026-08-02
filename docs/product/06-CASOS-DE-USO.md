# CASOS DE USO — Validação

**Status:** Em uso

**Versão:** 1.0

**Data:** 02/08/2026

**Regras relacionadas:** `02-BUSINESS-RULES.md`

---

## Objetivo

Base de **casos de uso reais de validação** do sistema: o que um usuário faz, o que DEVE acontecer e em **quais superfícies** cada dado gerado precisa refletir (tela, KPI, lista, caixa, auditoria, histórico).

Este documento serve de base para validar o sistema: cada caso pode ser conferido item a item. Todo dado que se gera reflete em algum lugar — se gera movimentação, gera dados; se gera dados, gera caso de validação.

## Princípio de conferência

- Todo dado gerado deve ser **verificável** em pelo menos uma superfície (tela/KPI/lista/relatório).
- Toda ação de escrita gera reflexos: parcelas, pagamentos, movimentações, auditoria, KPIs.
- As telas de **fim de fluxo** (vazio, concluído, bloqueado) devem fazer sentido **no contexto em que aparecem** — não podem repetir estado de outra tela nem surgir fora do lugar.

## Convenções

- **Reflexos de dados** = lista de superfícies onde o dado deve aparecer após a ação.
- **Conferências** = perguntas sim/não para validar o caso.
- Casos marcados como **⚠️ bug conhecido** refletem comportamento hoje incorreto e aguardam correção.

---

# OPERADOR

## Operação do dia

### UC-001 — Abrir o dashboard

**Ator:** operador

**Ação:** acessa a tela inicial (`/`).

**O que DEVE acontecer:** os 7 KPIs são exibidos (a receber hoje, recebido hoje, resultado do dia, clientes para cobrar, atrasado, a vencer, gastos hoje), todos consistentes com as listas que abrem ao clicar.

**Conferências:**
- [ ] Cada KPI corresponde à definição do backend (ex.: "atrasado" = saldo de parcelas vencidas antes de hoje)?
- [ ] Clicar em cada KPI abre a lista/modal coerente com o valor?
- [ ] O KPI "a vencer" usa a mesma janela da lista que abre (atenção: KPI inclui hoje, modal exclui hoje)?

**Regras:** BR-018 a BR-027

---

### UC-002 — Iniciar a rota de cobrança

**Ator:** operador

**Ação:** no dashboard, clica em "Iniciar Rota".

**O que DEVE acontecer:** abre `/rota` com **apenas** clientes pendentes, ordenados (atrasado primeiro, depois distância; com GPS, só distância).

**Conferências:**
- [ ] Só clientes PENDENTE entram na rota (atendidos hoje ficam de fora)?
- [ ] A ordenação respeita a regra (atrasado → distância)?
- [ ] O progresso (RouteProgress) mostra contadores corretos?

**Regras:** BR-048 a BR-051

---

### UC-003 — Marcar cliente como visitado

**Ator:** operador

**Ação:** na rota, clica em "Visitado".

**O que DEVE acontecer:** registra `historico_operacional` (tipo `visitado`), o cliente some da rota, aparece em Atendidos, ganha badge "Visitado" no card da lista. **Nenhum dado financeiro muda.**

**Reflexos de dados:** histórico operacional · rota (some) · Atendidos · badge no card · contador de progresso.

**Conferências:**
- [ ] Cliente sumiu da rota?
- [ ] Aparece em "Atendidos" (aba visitado)?
- [ ] **Saldo devedor e caixa NÃO mudaram** (BR-050)?
- [ ] Badge/cor refletem o resultado?

**Regras:** BR-048, BR-049, BR-050

---

### UC-004 — Marcar cliente como não localizado

**Ator:** operador

**Ação:** na rota, clica em "Não localizado".

**O que DEVE acontecer:** registra tipo `nao_localizado`; cliente some da rota e aparece em Atendidos (aba "não encontrado"); badge warning. Dados financeiros não mudam.

**Conferências:** (mesmas do UC-003, com badge warning)

**Regras:** BR-048, BR-049, BR-050

---

### UC-005 — Marcar promessa de pagamento

**Ator:** operador

**Ação:** na rota, clica em "Promessa", informa a data (default hoje), confirma.

**O que DEVE acontecer:** registra tipo `promessa` com `dataPromessa`; cliente some da rota; badge info; data registrada.

**Reflexos de dados:** histórico operacional (com dataPromessa) · rota · Atendidos · badge.

**Conferências:**
- [ ] Modal pede a data (default hoje)?
- [ ] A data da promessa foi persistida e aparece?
- [ ] Cliente some da rota e aparece em Atendidos (aba promessa)?

**Regras:** BR-048, BR-049, BR-050

---

### UC-006 — Registrar pagamento na rota

**Ator:** operador

**Ação:** na rota, abre o cliente, clica em "Pagar", digita o valor, confirma.

**O que DEVE acontecer:** o valor é distribuído das **parcelas mais antigas para as mais recentes**; parcela(s) quitada(s) viram `Paga`; valor aparece no card; se o cliente quitou, some da rota; KPI "recebido hoje" sobe; gera movimentação de entrada e comprovante.

**Reflexos de dados:** parcelas (valorPago/saldoPendente/estado/dataQuitacao) · pagamentos · pagamento_parcelas · movimentações financeiras (entrada/Pagamento) · KPI recebido hoje · card da rota · comprovante.

**Conferências:**
- [ ] A parcela **mais antiga** foi quitada primeiro (não a mais nova)?
- [ ] Valor pago atualizou no card e no título do contrato?
- [ ] Saldo devedor do cliente diminuiu exatamente o valor?
- [ ] KPI "recebido hoje" refletiu?
- [ ] Movimentação de entrada (origem Pagamento) aparece nas movimentações?
- [ ] Gerou comprovante (compartilhar/WhatsApp)?

**Regras:** BR-044, BR-045, BR-046, BR-047

---

### UC-007 — Pagamento parcial

**Ator:** operador

**Ação:** registra pagamento menor que o saldo da parcela.

**O que DEVE acontecer:** parcela fica `Parcial`, com `saldoPendente` visível e valor parcial aplicado.

**Conferências:**
- [ ] Parcela mostra estado `Parcial` (e não `Paga`)?
- [ ] Saldo restante aparece na parcela?
- [ ] KPI recebido hoje e movimentação refletem o valor pago?

**Regras:** BR-044, BR-047

---

### UC-008 — Quitar o contrato

**Ator:** operador

**Ação:** paga todas as parcelas restantes.

**O que DEVE acontecer:** contrato vira `Finalizado`; badge de status muda; deixa de permitir editar/excluir.

**Conferências:**
- [ ] Contrato mostra `Finalizado`?
- [ ] Editar/Excluir somem do detalhe do contrato?
- [ ] Parcelas todas `Paga` com `dataQuitacao` preenchida?

**Regras:** BR-044, BR-045

---

### UC-009 — Conferir a lista de cobranças (filtros)

**Ator:** operador

**Ação:** abre `/cobrancas` e alterna os filtros (todos / vence hoje / atrasado).

**O que DEVE acontecer:** o filtro mostra o conjunto correto:
- **Atrasado** = existe parcela pendente vencida **antes** de hoje;
- **Vence hoje** = a parcela mais antiga pendente vence hoje;
- O endpoint só devolve vencidas ou vencendo hoje (nunca "a vencer").

**Conferências:**
- [ ] O filtro "todos" mostra todos os pendentes de hoje (vencidos + vence hoje)?
- [ ] "Atrasado" mostra só vencidos antes de hoje?
- [ ] "Vence hoje" mostra só os que vencem hoje?
- [ ] Nenhum cliente "a vencer" (futuro) aparece indevidamente?

**Regras:** BR-086

---

### UC-010 — Conferir Atendidos hoje

**Ator:** operador

**Ação:** abre `/atendidos` e alterna as abas (todos / visitado / não encontrado / promessa / pagos).

**O que DEVE acontecer:** lista os atendidos de hoje (histórico do dia) + os pagamentos de hoje, **sem duplicar** cliente que pagou.

**Conferências:**
- [ ] "Todos" mostra visitado + não encontrado + promessa + pagos?
- [ ] Cliente que atendeu **e** pagou não aparece duplicado?
- [ ] A aba "Pagos" mostra só pagamentos de hoje?
- [ ] Cada aba respeita seu filtro?

**Regras:** BR-048 a BR-051

---

### UC-011 — Registrar gasto

**Ator:** operador

**Ação:** acessa `/gastos`, preenche valor + categoria + data, salva.

**O que DEVE acontecer:** salva o gasto e gera **movimentação de saída** (origem Gasto, categoria visível); reduz saldo e lucro do caixa.

**Reflexos de dados:** gastos · movimentações financeiras (saída/Gasto) · saldo atual · lucro · KPI gastos hoje.

**Conferências:**
- [ ] Movimentação de saída aparece com a categoria?
- [ ] Saldo atual e lucro refletiram a saída?
- [ ] KPI "gastos hoje" refletiu?

**Regras:** BR-028

---

### UC-012 — Liquidar a semana

**Ator:** operador

**Ação:** clica em "Fechar Semana", confirma.

**O que DEVE acontecer:** grava `fechamentos_semanais` (corte); **não altera** caixa base nem movimentações; re-liquidação da mesma semana é bloqueada (409).

**Conferências:**
- [ ] Aparece o registro de fechamento com data e saldo?
- [ ] Caixa base e movimentações **não mudaram**?
- [ ] Tentar liquidar de novo a mesma semana → erro?

**Regras:** BR-022 a BR-027

---

### UC-013 — Ver movimentações do caixa

**Ator:** operador

**Ação:** acessa `/caixa` e vê a lista de movimentações.

**O que DEVE acontecer:** cada linha mostra entrada/saída, valor, origem, cliente (se houver) e categoria (se gasto), por data.

**Conferências:**
- [ ] Entrada/saída com sinal e cor corretos?
- [ ] Origem correta (Pagamento/Gasto/Contrato/Cancelamento/Ajuste)?
- [ ] Nome do cliente aparece quando aplicável?

**Regras:** BR-032

---

### UC-014 — Tentar ajustar a própria base (bloqueio)

**Ator:** operador

**Ação:** acessa `/caixa` procurando o bloco "Ajustar Caixa Total".

**O que DEVE acontecer:** a seção **não aparece** para operador; se chamar a API direto, recebe **403**.

**Conferências:**
- [ ] Operador não vê o campo de ajuste na tela?
- [ ] API `POST /api/caixa/ajuste` com token de operador → 403?

**Regras:** BR-079

---

## Cliente / Contrato

### UC-015 — Cadastrar cliente

**Ator:** operador

**Ação:** acessa `/clientes/novo`, preenche (nome, telefone, comércio, logradouro obrigatórios; CPF opcional), salva.

**O que DEVE acontecer:** valida CPF (dígito verificador; duplicado → 409); salva e navega para o detalhe do cliente; saldo devedor aparece (0).

**Reflexos de dados:** clientes · detalhe do cliente · saldo devedor.

**Conferências:**
- [ ] CPF inválido bloqueado no formulário?
- [ ] CPF duplicado (mesmo operador) → mensagem clara (409)?
- [ ] Navegou para `/clientes/:id` com replace?
- [ ] Saldo devedor inicial = 0 e título correto?

**Regras:** BR-001 a BR-003, BR-036 a BR-038

---

### UC-016 — Cadastrar contrato

**Ator:** operador

**Ação:** acessa `/contratos/novo`, escolhe cliente, valor, juros, parcelas, data, salva.

**O que DEVE acontecer:** valida **saldo do caixa ≥ valor** (senão 422); gera parcelas com juros e **pulando domingo**; gera **movimentação de saída** (origem Contrato); navega para o detalhe.

**Reflexos de dados:** contratos · parcelas · movimentações financeiras (saída/Contrato) · saldo do caixa · detalhe do contrato.

**Conferências:**
- [ ] Caixa insuficiente bloqueia com mensagem clara?
- [ ] Parcelas pulam domingo (não existe vencimento no domingo)?
- [ ] Juros aplicados (valorFinal = valor × (1+juros%))?
- [ ] Movimentação de saída do valor base aparece?
- [ ] Detalhe do contrato coerente (saldo, recebido, parcelas)?

**Regras:** BR-004 a BR-007, BR-039 a BR-042

---

### UC-017 — Detalhe do cliente/contrato

**Ator:** operador

**Ação:** abre o detalhe de um cliente e de um contrato.

**O que DEVE acontecer:** títulos e valores coerentes (saldo devedor, recebido, parcelas pagas, valor da parcela).

**Conferências:**
- [ ] Título do cliente/contrato faz sentido com o que está sendo visto?
- [ ] Saldo devedor = Σ saldoPendente das parcelas?
- [ ] Recebido = Σ valorPago das parcelas?

**Regras:** BR-004 a BR-012

---

## Fim de fluxo

### UC-018 — Finalizar todos os atendimentos da rota

**Ator:** operador

**Ação:** atende o último cliente pendente da rota.

**O que DEVE acontecer:** aparece o `SuccessState` "✓ Todos os N clientes foram atendidos hoje" **no lugar da rota** (que acabou), com link "Ver resumo →" para `/atendidos`.

**Conferências:**
- [ ] O estado "todos atendidos" aparece **só quando não há mais pendentes**?
- [ ] O total N corresponde aos clientes da rota (não inclui pagos indevidamente)?
- [ ] O modal/tela final faz sentido **no contexto da rota** (não repete estado de outra tela)?
- [ ] "Ver resumo →" leva ao `/atendidos`?

**Regras:** BR-048 a BR-051

---

### UC-019 — Rota concluída no dashboard

**Ator:** operador

**Ação:** volta ao dashboard depois de atender todos.

**O que DEVE acontecer:** `RotaCobrancaSection` mostra "Rota concluída" (check verde) em vez de "Iniciar Rota", com contador de clientes = 0.

**Conferências:**
- [ ] Sem clientes pendentes → "Rota concluída" no lugar do botão?
- [ ] Contador de clientes mostra 0?
- [ ] O estado não aparece quando ainda há pendentes?

**Regras:** BR-048 a BR-051

---

### UC-020 — Dashboard sem cobranças do dia

**Ator:** operador

**Ação:** abre o dashboard num dia sem cobranças pendentes.

**O que DEVE acontecer:** "Nenhuma cobrança pendente para hoje" coerente com KPIs (clientes para cobrar = 0).

**Conferências:**
- [ ] KPI "clientes para cobrar" = 0?
- [ ] A rota não está disponível (ou mostra concluída)?

**Regras:** BR-048 a BR-051

---

### UC-021 — Atendidos sem nenhum registro

**Ator:** operador

**Ação:** abre `/atendidos` num dia sem atendimentos/pagamentos.

**O que DEVE acontecer:** cada aba mostra o empty correto ("Nenhum atendimento realizado hoje" / "Nenhuma cobrança").

**Conferências:**
- [ ] Aba "Todos" → "Nenhum atendimento realizado hoje"?
- [ ] Aba "Pagos" → "Nenhuma cobrança"?
- [ ] Nenhum estado vazio aparece na aba errada?

**Regras:** BR-048 a BR-051

---

### UC-022 — Cliente quitado durante a rota

**Ator:** operador

**Ação:** registra pagamento que quita o cliente na rota.

**O que DEVE acontecer:** feedback "Cliente quitado"; o cliente **some da rota** (não fica preso no carrossel).

**Conferências:**
- [ ] Feedback "Cliente quitado" aparece?
- [ ] Cliente não permanece no carrossel da rota?

**Regras:** BR-044 a BR-047

---

# ADMIN

## Equipe e operador

### UC-023 — Acessar o painel admin

**Ator:** admin

**Ação:** acessa `/admin`.

**O que DEVE acontecer:** KPIs de equipe (Admins × Operadores) e de operação coerentes; navegação por KPI abre as listas corretas.

**Conferências:**
- [ ] KPIs de equipe = contagens por role?
- [ ] KPIs de operação batem com `/clientes`, `/contratos` e o caixa (admin self)?

**Regras:** BR-082, BR-087

---

### UC-024 — Ver a equipe

**Ator:** admin

**Ação:** na página admin, vê a lista de membros.

**O que DEVE acontecer:** subseções **Administradores** e **Operadores**; usuário atual marcado com "(Eu)"; ordenação (admins no topo, depois operadores, alfabético).

**Conferências:**
- [ ] Admins e operadores em subseções separadas?
- [ ] Usuário logado aparece com "(Eu)" e sem editar/remover no próprio card?

**Regras:** BR-082

---

### UC-025 — Ajustar caixa base do operador

**Ator:** admin

**Ação:** acessa o operador, preenche novo valor + motivo, salva.

**O que DEVE acontecer:** o valor informado é o **novo valor absoluto** da base (não delta); atualiza `caixa_config` e grava **auditoria_caixa** (anterior/novo/motivo/admin/data).

**Reflexos de dados:** caixa_config · auditoria_caixa · KPIs do operador · histórico de ajustes.

**Conferências:**
- [ ] Digitar 5000 sobre base 2000 → base = 5000 (não 7000)?
- [ ] Auditoria gravada com valores anterior/novo/motivo/admin?
- [ ] Motivo obrigatório (sem motivo → erro)?
- [ ] Histórico de ajustes do operador mostra o registro?

**Regras:** BR-078, BR-088

---

### UC-026 — Ver histórico de ajustes do operador

**Ator:** admin

**Ação:** no detalhe do operador, vê "Histórico de ajustes".

**O que DEVE acontecer:** lista com data, valores (anterior → novo), quem ajustou e motivo.

**Conferências:**
- [ ] Mostra data, valores, admin e motivo?
- [ ] Reflete todos os ajustes feitos (inclusive os do próprio admin)?

**Regras:** BR-088

---

### UC-027 — CRUD de operador

**Ator:** admin

**Ação:** cria/edita/remove operador da equipe.

**O que DEVE acontecer:** validações (não auto-remover, não alterar super_admin); feedback claro; lista atualiza.

**Conferências:**
- [ ] Não permite auto-remover nem auto-rebaixar?
- [ ] Não permite alterar super_admin?
- [ ] Lista reflete a mudança?

**Regras:** BR-069, BR-070

---

### UC-028 — Acessar o contexto do operador

**Ator:** admin

**Ação:** no detalhe do operador, vê a lista de contratos do operador e abre um contrato.

**O que DEVE acontecer:** lista os contratos do operador (escopo `?usuarioId=`); abre o contrato em modo admin.

**Conferências:**
- [ ] Contratos listados são do operador (não do admin)?
- [ ] Abrir o contrato mostra os dados do operador corretamente?

**Regras:** BR-078, BR-080

---

### UC-029 — Contrato do operador em modo admin (somente leitura)

**Ator:** admin

**Ação:** abre um contrato do operador via contexto.

**O que DEVE acontecer:** **somente leitura** — sem editar/excluir/pagar; única ação é **Estornar** um pagamento.

**Conferências:**
- [ ] Editar/Excluir não aparecem?
- [ ] Parcelas não clicáveis para pagamento?
- [ ] Só aparece o botão "Estornar" nos pagamentos?

**Regras:** BR-078

---

### UC-030 — Estornar pagamento

**Ator:** admin

**Ação:** no contrato do operador (modo admin), clica em "Estornar" num pagamento, informa o motivo, confirma.

**O que DEVE acontecer:** reverte cada parcela (estado/saldo/dataQuitacao), contrato volta a `Ativo` se estava `Finalizado`, cria **movimentação reversa** (saída/Cancelamento), marca o pagamento estornado, grava **auditoria_estornos**.

**Reflexos de dados:** parcelas · contratos (estado) · pagamentos (estornadoEm/Por/Motivo) · movimentações financeiras (saída/Cancelamento) · auditoria_estornos · selo "Estornado" na UI.

**Conferências:**
- [ ] Parcelas revertidas (estado/saldo/dataQuitacao)?
- [ ] Contrato `Finalizado` volta a `Ativo`?
- [ ] Movimentação reversa registrada?
- [ ] Selo "Estornado" aparece no pagamento?
- [ ] Auditoria de estorno gravada (quem/quando/motivo)?
- [ ] **Duplo estorno bloqueado** (409)?
- [ ] Operador tentando estornar → 403?

**Regras:** BR-029, BR-044

---

### UC-031 — Voltar do contrato do operador

**Ator:** admin

**Ação:** no contrato do operador (modo admin), clica no botão "voltar" do header.

**O que DEVE acontecer:** volta ao **contexto** de onde veio (o `OperadorDetail`), preservando o escopo do operador.

**Status:** ⚠️ **BUG CONHECIDO** — hoje o "voltar" navega para `/clientes/:id` **sem** `?usuarioId=`, tentando abrir o cliente como o próprio admin → cliente não encontrado / erro de autenticação. Correção planejada: em modo admin, o voltar deve ir para `/admin/operadores/:operadorId` (com `?empresaId=` se presente).

**Conferências (após correção):**
- [ ] Voltar leva ao `OperadorDetail` do operador (não ao detalhe do cliente)?
- [ ] O contexto do operador é preservado?
- [ ] Nenhum erro de cliente não encontrado aparece?

**Regras:** — (navegação)

---

# SUPER ADMIN

### UC-032 — Ver empresas e acessar uma empresa

**Ator:** super_admin

**Ação:** acessa `/admin/empresas`, vê a lista, entra numa empresa.

**O que DEVE acontecer:** lista de empresas com KPIs e admin da empresa; ao entrar, breadcrumb/voltar para a lista + contexto da empresa.

**Conferências:**
- [ ] Lista mostra KPIs e admin da empresa?
- [ ] Breadcrumb/voltar funciona?
- [ ] KPIs de operação = agregado da empresa?

**Regras:** BR-081, BR-083

---

### UC-033 — Estornar pagamento de qualquer empresa

**Ator:** super_admin

**Ação:** acessa um operador de qualquer empresa via contexto e estorna um pagamento.

**O que DEVE acontecer:** o escopo permite estornar de qualquer empresa (`?usuarioId=` + `?empresaId=`); auditoria registra o admin responsável.

**Conferências:**
- [ ] Super admin estorna pagamento de operador de outra empresa?
- [ ] Auditoria registra o super admin como responsável?

**Regras:** BR-078, BR-029

---

# Referências

- `02-BUSINESS-RULES.md` — regras de negócio numeradas (BR)
- `04-ROADMAP.md` — fases do produto
- PLANs de implementação (PLAN-020 a PLAN-028) — origem das funcionalidades
