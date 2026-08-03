# CASOS DE USO — Validação

**Status:** Em uso

**Versão:** 1.1

**Data:** 03/08/2026

**Regras relacionadas:** `02-BUSINESS-RULES.md`

> **Série de validação:** para os casos de uso no nível de **API** (request/response/coerência de retornos), ver `07-CASOS-DE-USO-API.md`. Este documento cobre os **fluxos** (o que o usuário faz na tela).

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

> **"Resultado do dia" (semântica do operador):** é **calculado no front** como `recebidoHoje − aReceberHoje` (`OperacoesDashboard.tsx`), **não** vem da API e **não** é igual ao `resultadoDoDia` do painel admin (que é `entradas − saídas` de movimentações). Diferença documentada; ideia de "bônus" de pagamento a mais → backlog **P021**.

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

### UC-034 — Cliente atendido E pago no mesmo dia

**Ator:** operador

**Ação:** atende um cliente (ex.: visitado) e depois ele paga no mesmo dia.

**O que DEVE acontecer:** no total de "todos os clientes atendidos", esse cliente conta **UMA vez** (atendido + pago = 1 cliente resolvido), não duas.

**Conferências:**
- [ ] "Todos os N clientes foram atendidos" conta o cliente 1x (não 2x)?
- [ ] A mesma regra vale em Rota, Dashboard e Lista de cobranças?

**Regras:** BR-048 a BR-051

---

### UC-035 — Cliente com múltiplos contratos

**Ator:** operador

**Ação:** um cliente tem 2 contratos com cobranças pendentes; o operador vê a rota e o total de atendidos.

**O que DEVE acontecer:** a **rota opera por contrato** (cada contrato é uma cobrança, com sua parcela) — cliente com 2 contratos aparece 2x na rota. Mas o total de "clientes atendidos" conta o cliente **uma vez**.

**Conferências:**
- [ ] Cliente com 2 contratos aparece 2x na rota (2 cobranças, cada uma com sua parcela)?
- [ ] O total de "clientes atendidos" conta o cliente 1x (não 2x)?
- [ ] Atender 1 dos contratos não marca o outro como atendido?

**Regras:** BR-048 a BR-051

---

### UC-036 — Total de atendidos consistente entre telas

**Ator:** operador

**Ação:** finaliza a rota e compara o total mostrado em Rota / Dashboard / Lista de cobranças.

**O que DEVE acontecer:** as 3 telas mostram o **mesmo total** (clientes distintos atendidos hoje), sem duplicar atendidos que pagaram.

**Conferências:**
- [ ] Rota, Dashboard e Lista de cobranças mostram o mesmo número ao finalizar?
- [ ] O número corresponde a clientes distintos (não itens de contrato)?

**Regras:** BR-048 a BR-051

---

### UC-037 — Visitar e depois pagar não sobrescreve o histórico

**Ator:** operador

**Ação:** marca o cliente como visitado e depois registra pagamento.

**O que DEVE acontecer:** o resultado operacional "Visitado" permanece no histórico (o pagamento não altera o histórico de atendimento).

**Conferências:**
- [ ] Após pagar, o cliente continua marcado como "Visitado" em Atendidos?
- [ ] O histórico operacional preserva o tipo `visitado`?

**Regras:** BR-048, BR-049, BR-050

---

### UC-038 — KPI "A vencer" coerente com a lista/modal

**Ator:** operador

**Ação:** confere o KPI "a vencer" no dashboard e o modal que ele abre.

**O que DEVE acontecer:** o KPI e o modal usam a **mesma janela** (parcelas que ainda não venceram, próximos 7 dias excluindo hoje). Parcelas que vencem hoje NÃO entram em "a vencer" (pertencem ao "a receber hoje"/"vence hoje").

**Conferências:**
- [ ] KPI "a vencer" e modal mostram o mesmo conjunto?
- [ ] Parcela que vence hoje não aparece em "a vencer"?
- [ ] Parcela futura (dentro de 7 dias) aparece?

**Regras:** BR-018 a BR-027

---

# ADMIN

## Equipe e operador

### UC-023 — Acessar o painel admin

**Ator:** admin / super_admin

**Ação:** acessa `/admin` (link "Administração" na Navbar — visível para admin/super_admin).

**O que DEVE acontecer:** KPIs de Equipe (Admins × Operadores) e de Operação (Clientes, Contratos Ativos, Recebido Hoje) com **totais da equipe**; cada KPI de Operação abre o **modal de contribuição por operador** (BR-091).

**Conferências:**
- [ ] KPIs de Equipe = contagens por role (BR-082)?
- [ ] KPIs de Operação = **total da equipe** (soma dos operadores, BR-091), com subtítulo "da equipe · N operadores"?
- [ ] Clique em Clientes/Contratos/Recebido hoje abre o modal de contribuição (não navega mais direto)?
- [ ] "Administração" aparece visível na Navbar (não só na engrenagem)?

**Regras:** BR-082, BR-091

---

### UC-024 — Ver a equipe

**Ator:** admin

**Ação:** na página admin, vê a lista de membros.

**O que DEVE acontecer:** subseções **Administradores** e **Operadores**; usuário atual marcado com "(Eu)"; ordenação (admins no topo, depois operadores, alfabético); clique em Admins/Operadores (KPIs de Equipe) abre o modal com stats e leva ao `OperadorDetail`.

**Conferências:**
- [ ] Admins e operadores em subseções separadas?
- [ ] Usuário logado aparece com "(Eu)" e sem editar/remover no próprio card?
- [ ] Modal de equipe mostra stats (clientes/contratos) por membro?
- [ ] Clique no membro no modal → `OperadorDetail` (preservando `?empresaId=`)?

**Regras:** BR-082

---

### UC-053 — Ver a contribuição da equipe por KPI

**Ator:** admin / super_admin

**Ação:** no painel admin, clica num KPI de Operação (Clientes, Contratos Ativos ou Recebido hoje).

**O que DEVE acontecer:** abre o **modal de contribuição**: total no topo + cada operador com **quanto geriu** naquela métrica (clientes/contratos/recebido hoje), ordenado do maior para o menor; clique no operador → `OperadorDetail` (mesmo fluxo dos cards da lista).

**Conferências:**
- [ ] Modal mostra o total da equipe + a lista por operador?
- [ ] Ordenação decrescente por contribuição?
- [ ] Clique no operador leva ao detalhe dele, preservando o contexto (`?empresaId=`)?
- [ ] KPI "Recebido hoje" = Σ recebido dos operadores (BR-091)?

**Regras:** BR-091 · API: `GET /api/admin/equipe` (API-UC-042)

---

### UC-054 — Acessar a administração pela navbar

**Ator:** admin / super_admin

**Ação:** usa o link **"Administração"** (admin) ou **"Empresas"** (super_admin) direto na Navbar — sem depender da engrenagem.

**O que DEVE acontecer:** o admin enxerga a parte administrativa sem "ficar cego"; o link leva a `/admin` (admin) ou `/admin/empresas` (super_admin).

**Conferências:**
- [ ] Link "Administração"/"Empresas" visível na Navbar para o perfil certo?
- [ ] Operador **não** vê esses links?
- [ ] Navegação funciona (e super_admin em `/admin` redireciona para `/admin/empresas`, BR-081)?

**Regras:** BR-081

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
- [ ] Movimentação reversa registrada **e visível** (origem Cancelamento + badge "Estorno" + descrição com motivo + nome do cliente)?
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

**Status:** ✅ **Corrigido** — o "voltar" em modo admin agora navega para `/admin/operadores/:usuarioId` (preservando `?empresaId=`), em vez de `/clientes/:id` sem contexto. O link do contrato no `OperadorDetail` também propaga o `empresaId`.

**Conferências (após correção):**
- [x] Voltar leva ao `OperadorDetail` do operador (não ao detalhe do cliente)?
- [x] O contexto do operador é preservado?
- [x] Nenhum erro de cliente não encontrado aparece?

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

# AUTENTICAÇÃO E ACESSO (todos os atores)

> Estes casos cobrem o ciclo de autenticação (login, sessão, senha, acesso). Os cenários no nível de API estão em `07-CASOS-DE-USO-API.md` (API-UC-001.., API-CT-001..).

### UC-039 — Login com credenciais válidas

**Ator:** operador / admin / super_admin

**Ação:** acessa `/login`, informa e-mail + senha corretos e clica em Entrar.

**O que DEVE acontecer:** autentica e **roteia por perfil** (BR-081): `operator` → `/`, `admin` → `/admin`, `super_admin` → `/admin/empresas`.

**Conferências:**
- [ ] Cada perfil cai na rota certa após o login?
- [ ] Token armazenado e sessão restaurada em recarga (sem re-login imediato)?
- [ ] Navbar mostra o nome/engrenagem do usuário logado?

**Regras:** BR-055, BR-058, BR-081

---

### UC-040 — Login com credenciais inválidas

**Ator:** qualquer

**Ação:** informa e-mail ou senha incorretos.

**O que DEVE acontecer:** erro "E-mail ou senha inválidos." (401) sem expor qual campo falhou; após **10 tentativas no mesmo IP/15min**, retorna 429 "Muitas tentativas" (BR-077).

**Conferências:**
- [ ] Mensagem genérica (não diz se é e-mail ou senha)?
- [ ] Usuário inexistente e senha errada retornam o mesmo erro?
- [ ] 11ª tentativa → 429?
- [ ] Erro de conexão (backend fora) mostra mensagem própria, não "inválidos"?

**Regras:** BR-055, BR-077

---

### UC-041 — Mostrar/ocultar a senha no login

**Ator:** operador / admin / super_admin

**Ação:** no campo senha do login, clica no ícone de olho.

**O que DEVE acontecer:** alterna o campo entre `type=password` e `type=text`, permitindo conferir a senha digitada.

**Status:** ✅ **Implementado** (PLAN-029) — toggle Eye/EyeOff no campo senha do login.

**Conferências:**
- [ ] Ícone de olho no campo senha (login)?
- [ ] Alternar mostra/oculta sem perder o valor digitado?
- [ ] i18n nos 3 idiomas?

**Regras:** — (UX)

---

### UC-042 — Trocar a própria senha

**Ator:** operador / admin / super_admin

**Ação:** na seção "Meus dados" (perfil), informa a senha atual + a nova e salva.

**O que DEVE acontecer:** valida a senha atual (errada → erro), exige nova com mín. 6 caracteres, grava o novo hash (bcrypt) e mantém a sessão atual válida (BR-089/090).

**Status:** ✅ **Implementado** (PLAN-029) — página Perfil (`/perfil`, todos os perfis) via `PATCH /api/auth/senha`.

**Conferências:**
- [ ] Senha atual errada → 422 (mensagem clara, sem deslogar)?
- [ ] Senha nova < 6 caracteres → bloqueada?
- [ ] Após trocar, login com a nova senha funciona e com a antiga falha?
- [ ] Sessão atual continua válida após a troca (BR-090)?
- [ ] Admin/operador/super_admin todos têm acesso à seção?

**Regras:** BR-089, BR-090

---

### UC-043 — Logout

**Ator:** operador / admin / super_admin

**Ação:** abre a engrenagem do Navbar e clica em "Sair".

**O que DEVE acontecer:** limpa o token, volta para `/login`; rotas protegidas ficam inacessíveis sem novo login.

**Conferências:**
- [ ] Token removido do localStorage?
- [ ] Volta para `/login`?
- [ ] Tentar acessar uma rota protegida depois → redireciona ao login?

**Regras:** BR-058

---

### UC-044 — Sessão expirada

**Ator:** operador / admin / super_admin

**Ação:** deixa o token expirar (7 dias, BR-058) e faz uma requisição protegida.

**O que DEVE acontecer:** a API responde 401; o frontend limpa o token e redireciona para `/login` (com aviso de sessão expirada se existir).

**Conferências:**
- [ ] 401 em token expirado/inválido?
- [ ] Redireciona para `/login` sem tela quebrada?
- [ ] Token soft-deleted (usuário removido) também é rejeitado?

**Regras:** BR-058, BR-071

---

### UC-045 — Acesso negado (permissão)

**Ator:** operador

**Ação:** tenta acessar `/admin` ou chamar endpoint administrativo.

**O que DEVE acontecer:** rota frontend protegida (`AdminRoute`) bloqueia/redireciona; qualquer endpoint `admin`/`caixa/ajuste`/`estornar` responde **403** para operador (BR-067, BR-079).

**Conferências:**
- [ ] Operador em `/admin` não vê conteúdo admin?
- [ ] `GET /api/admin/operadores` com token de operador → 403?
- [ ] `POST /api/caixa/ajuste` com operador → 403 (mesmo com `?usuarioId=`)?
- [ ] `POST /api/pagamentos/:id/estornar` com operador → 403?

**Regras:** BR-067, BR-069, BR-079

---

### UC-046 — Admin redefine a senha de um operador

**Ator:** admin / super_admin

**Ação:** edita um operador e preenche uma nova senha no campo (opcional na edição).

**O que DEVE acontecer:** o novo hash é gravado (`PATCH /api/admin/operadores/:id`); a senha antiga deixa de funcionar; campo em branco mantém a senha atual.

**Conferências:**
- [ ] Campo senha é opcional na edição (em branco mantém)?
- [ ] Nova senha ≥ 6 caracteres validada?
- [ ] Operador logado não pode alterar a própria senha aqui (bloqueado/fora do escopo)?
- [ ] Sessões ativas do operador-alvo? (decisão: token atual continua válido até expirar — registrar)

**Regras:** BR-057, BR-067

---

# CASOS BÁSICOS COMPLEMENTARES (CRUD)

> Cenários de edição/exclusão que complementam os casos de criação (UC-015/016) e o fluxo operacional. O nível de API de cada um está em `07-CASOS-DE-USO-API.md`.

### UC-047 — Editar cliente

**Ator:** operador

**Ação:** abre `/clientes/:id/editar`, altera dados e salva.

**O que DEVE acontecer:** valida CPF (duplicado **excluindo o próprio** → 409); dados históricos de contratos/pagamentos **não** mudam (BR-003).

**Conferências:**
- [ ] CPF duplicado de outro cliente → 409 com mensagem clara?
- [ ] CPF próprio (sem alterar) não acusa duplicação?
- [ ] Dados de contratos/pagamentos existentes intactos após edição?
- [ ] Saldo/nome atualizam nas listas?

**Regras:** BR-003, BR-036, BR-037, BR-043

---

### UC-048 — Excluir cliente

**Ator:** operador

**Ação:** tenta excluir um cliente.

**O que DEVE acontecer:** cliente **com contratos ativos** é bloqueado (não exclui); sem contratos, é removido (soft delete) e some das listas.

**Status:** ⚠️ **Backend existe** (`DELETE /api/clientes/:id`, `ClienteHasActiveContractsError`), **UI pendente** no `ClienteDetail` — reativar no PLAN-029/backlog.

**Conferências (após implementar):**
- [ ] Cliente com contrato ativo → bloqueio com mensagem?
- [ ] Cliente sem contrato → excluído e some das listas?
- [ ] Confirmação antes de excluir (ConfirmModal)?

**Regras:** BR-017, BR-071

---

### UC-049 — Editar contrato (antes de pagamentos) / bloqueio

**Ator:** operador

**Ação:** abre `/contratos/:id/editar`.

**O que DEVE acontecer:** sem pagamentos, pode alterar condições (juros, parcelas, valor, data) — parcelas antigas substituídas preservando histórico (BR-041); **com pagamentos**, tela de bloqueio (BR-006/BR-008).

**Conferências:**
- [ ] Sem pagamentos → edição liberada, parcelas recalculadas?
- [ ] Com pagamentos → tela de bloqueio (aviso amarelo), sem formulário?
- [ ] Histórico de parcelas antigas preservado (soft delete)?

**Regras:** BR-006, BR-008, BR-041

---

### UC-050 — Excluir contrato

**Ator:** operador

**Ação:** no detalhe do contrato, clica em "Excluir" e confirma.

**O que DEVE acontecer:** contrato **com pagamentos** é bloqueado; sem pagamentos, remove contrato + parcelas (soft delete) e gera **movimentação de entrada** (origem Cancelamento) devolvendo o `valorBase` ao caixa.

**Reflexos de dados:** contratos (deletedAt) · parcelas (deletedAt) · movimentações (entrada/Cancelamento) · saldo do caixa.

**Conferências:**
- [ ] Com pagamentos → bloqueio?
- [ ] Sem pagamentos → excluído e some da lista?
- [ ] Movimentação de entrada (Cancelamento) aparece no caixa?
- [ ] Saldo do caixa aumentou no valorBase?

**Regras:** BR-019, BR-029

---

### UC-051 — Excluir gasto

**Ator:** operador

**Ação:** exclui um gasto registrado por engano.

**O que DEVE acontecer:** remove o gasto (soft delete). **Nota:** não gera movimentação reversa — o caixa **não** é creditado de volta (comportamento atual a validar com Produto).

**Status:** ⚠️ **Backend existe** (`DELETE /api/gastos/:id`), componente `GastoList` com `onDelete` **órfão** (nenhuma tela usa) — reativar no PLAN-029/backlog.

**Conferências (após implementar):**
- [ ] Gasto some da lista?
- [ ] Movimentação original permanece no histórico (BR-032)?
- [ ] Caixa/lucro não são alterados pela exclusão (decisão registrada)?

**Regras:** BR-032

---

### UC-052 — Criar empresa (super admin)

**Ator:** super_admin

**Ação:** na lista de empresas (`/admin/empresas`), clica em "+ Nova Empresa", preenche nome + admin inicial e salva.

**O que DEVE acontecer:** cria empresa **e** admin vinculado de forma **atômica** (BR-072); a nova empresa aparece na lista com o admin; duplicação de e-mail → 409.

**Conferências:**
- [ ] Empresa + admin criados juntos (ou nada)?
- [ ] Nova empresa aparece na lista com stats zerados?
- [ ] Login do novo admin funciona?
- [ ] E-mail duplicado → 409?

**Regras:** BR-072, BR-076

---

# WHITELABEL E TEMAS (PLAN-031)

### UC-055 — Super admin combina módulos da empresa

**Ator:** super_admin

**Ação:** em `/admin/empresas`, abre "Configurar" de uma empresa e alterna os módulos (clientes, contratos, caixa, gastos, rota, cobrancas, atendidos).

**O que DEVE acontecer:** toggles refletem o estado atual (todos on por padrão); dependências bloqueadas com aviso (gastos requer caixa; rota/cobrancas/atendidos requerem contratos); salvar → PATCH → 200 e card atualiza.

**Conferências:**
- [ ] Toggles mostram o estado atual (todos on por padrão)?
- [ ] Ligar `gastos` com `caixa` off → bloqueado com aviso?
- [ ] Salvar persiste e o card/badge reflete?
- [ ] `central` não aparece (sempre on)?

**Regras:** BR-092, BR-093

---

### UC-056 — Usuário vê apenas as superfícies dos módulos ativos

**Ator:** operador/admin da empresa com módulos parciais

**Ação:** loga na empresa.

**O que DEVE acontecer:** Navbar mostra só os módulos ativos; rota de módulo off → redireciona para `/`; entradas do Central (rota, pendentes, atendidos, gastos) ocultas; blocos de dados em outras telas ocultos (gastos no Caixa, contratos no ClienteDetail).

**Conferências:**
- [ ] Navbar sem links de módulo off?
- [ ] Acessar rota de módulo off → `/`?
- [ ] Central sem as entradas dos módulos off?
- [ ] Caixa sem blocos de gastos quando `gastos` off?
- [ ] ClienteDetail sem card de contratos quando `contratos` off?

**Regras:** BR-093

---

### UC-057 — Usuário escolhe o tema

**Ator:** qualquer usuário logado

**Ação:** engrenagem → seletor de tema (default/aurora/ocean/grape/sunset) + claro/escuro.

**O que DEVE acontecer:** aplica `data-theme` + dark em toda a app (CSS vars); persiste por usuário (localStorage); gradientes coerentes com o tema.

**Conferências:**
- [ ] Seletor com os 5 temas (swatches)?
- [ ] Aplica globalmente (fundo, botões, navbar)?
- [ ] Persiste entre sessões?
- [ ] Light/dark funcionam em cada tema?

**Regras:** — (UX/DS)

---

### UC-058 — Tenant com subconjunto de módulos (ex.: só clientes)

**Ator:** super_admin + usuário da empresa

**Ação:** empresa configurada só com `clientes`; usuário loga.

**O que DEVE acontecer:** a empresa opera só clientes — Central se adapta (sem rota/pendentes/atendidos/gastos); cadastro/edição de cliente funciona; contratos/caixa/rota ocultos e com rota bloqueada.

**Conferências:**
- [ ] Login cai na Central (sempre on) e ela se adapta?
- [ ] Só as telas de clientes acessíveis?
- [ ] Cadastro de cliente OK; contrato/caixa/rota bloqueados?

**Regras:** BR-093

---

### UC-059 — Dependência gastos ⇒ caixa

**Ator:** super_admin

**Ação:** ativa `gastos` numa empresa com `caixa` desativado.

**O que DEVE acontecer:** toggle bloqueado + aviso ("gastos requer caixa"); com `caixa` ativo, permite.

**Conferências:**
- [ ] Bloqueado quando `caixa` off?
- [ ] Aviso claro?
- [ ] Libera quando `caixa` on?

**Regras:** BR-092

---

### UC-060 — Mudança de módulos com sessão ativa

**Ator:** super_admin + usuário logado

**Ação:** super admin altera módulos da empresa durante uma sessão ativa do usuário.

**O que DEVE acontecer:** o usuário reflete a mudança apenas no próximo carregamento (novo `/me`); a sessão atual não quebra nem mostra estado inconsistente.

**Conferências:**
- [ ] Sessão atual segue sem erro?
- [ ] Após refresh, os novos módulos valem?

**Regras:** BR-093

---

### UC-061 — Landing por perfil

**Ator:** operador / admin / super_admin

**Ação:** faz login.

**O que DEVE acontecer:** cada perfil cai na 1ª tela que faz sentido (BR-081):
- `operator` → `/` (Central de Operações — operações do dia);
- `admin` → `/admin` (painel da equipe — "check da manhã"); Central a 1 clique na Navbar;
- `super_admin` → `/admin/empresas` (gestão de empresas).

**Conferências:**
- [ ] Operator cai na Central com as operações do dia?
- [ ] Admin cai no painel (Equipe/Operação) e consegue navegar pra Central?
- [ ] Super admin cai em Empresas?

**Regras:** BR-081

---

### UC-062 — Navbar por perfil

**Ator:** operador / admin / super_admin

**Ação:** observa a Navbar após o login.

**O que DEVE acontecer:** conteúdo e ordem por perfil:
- **operator** — Central · Clientes · Contratos · Caixa (module-gated — BR-093);
- **admin** — mesma base + **Administração** (no fim: operação primeiro, gestão depois);
- **super_admin** — **apenas Empresas** (sem páginas operacionais próprias).

**Conferências:**
- [ ] Operator não vê Administração/Empresas?
- [ ] Admin vê Administração (e não Empresas)?
- [ ] Super admin vê só Empresas (sem Central/Clientes/Contratos/Caixa vazios)?
- [ ] Ordem: operacional antes da gestão?

**Regras:** BR-081, BR-093

---

### UC-063 — Super admin sem páginas operacionais vazias

**Ator:** super_admin

**Ação:** loga e navega pela Navbar.

**O que DEVE acontecer:** o super admin **não** tem dados operacionais próprios (empresaId null) — portanto **não vê** Central/Clientes/Contratos/Caixa na Navbar, evitando telas vazias sem sentido. Acesso operacional é feito via drill-down por empresa (`/admin/empresas/:id`).

**Conferências:**
- [ ] Super admin não vê os links operacionais?
- [ ] Acesso às operações de uma empresa é via "Empresas → Acessar"?
- [ ] Tentar abrir `/clientes` diretamente como super → tela vazia/redirect coerente (sem quebra)?

**Regras:** BR-081

---

# Referências

- `02-BUSINESS-RULES.md` — regras de negócio numeradas (BR)
- `04-ROADMAP.md` — fases do produto
- `07-CASOS-DE-USO-API.md` — casos de uso e cenários de teste da API (nível request/response)
- PLANs de implementação (PLAN-020 a PLAN-028) — origem das funcionalidades
- PLAN-029 — mostrar/ocultar senha, troca de senha e "Meus dados" (UC-041, UC-042)
