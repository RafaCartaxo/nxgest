# Atualizações

Registro resumido das alterações recentes — melhorias e correções, para acompanhamento. Detalhes completos nos PLANs linkados.

## 02/08/2026 — PLAN-027 · Histórico de ajustes do Caixa Base

**Adicionado**
- **Histórico de ajustes visível** — o registro de ajuste do Caixa Base (gravado pelo PLAN-026, BR-088) agora é consultável e exibido: novo endpoint `GET /api/caixa/auditoria` (paginação + `adminNome` via JOIN) e bloco "Histórico de ajustes" no detalhe do operador (admin) e na página de caixa (operador). Ambos os papéis enxergam data, `R$ anterior → R$ novo`, quem ajustou e o motivo.
- **Segurança mantida** — operador só vê o próprio histórico (ignora `?usuarioId=`); admin consulta operadores da própria empresa; super admin qualquer.

Referência: [PLAN-027](plans/PLAN-027-exibicao-historico-caixa.md)

## 02/08/2026 — PLAN-026 · Sprint 1 do backlog (Auditoria + Modais + Nomenclatura)

**Adicionado**
- **Auditoria de Caixa (P014)** — todo ajuste do Caixa Base agora grava um registro em `auditoria_caixa` (operador-alvo, admin responsável, valor anterior/novo, motivo e data). O campo `motivo` é **obrigatório** no `POST /api/caixa/ajuste` (tabela separada — não gera movimentação financeira, preservando o saldo). Nova BR-088.
- **Componente `Modal` base compartilhado** (`shared/components/Modal/Modal.tsx`) — mecânica uniforme (Escape, backdrop configurável, `overflow` oculto, `role=dialog`). Refatorados `ConfirmModal`, `EquipeModal`, `ResultadoDiaModal`, `PagamentoModal` e o modal do `OperadorForm` (que ganhou o fechamento por Escape).
- **Nomenclatura da equipe (P012)** — a lista admin agora separa em subseções "Administradores" e "Operadores" (antes "Operadores" como rótulo genérico).

Referência: [PLAN-026](plans/PLAN-026-auditoria-modais-nomencleatura-admin.md)

## 01/08/2026 — PLAN-025 · Ajuste do Caixa Base exclusivo de admin

**Corrigido**
- **Regressão de permissão no ajuste do Caixa Base** — o PLAN-021 havia liberado o operador a ajustar a própria base (BR-084). Reverteu: o ajuste é **regra exclusiva de `admin`/`super_admin`** (rota com `adminMiddleware`, operador recebe 403 e a seção "Ajustar Caixa Total" some da tela). BR-079 reativada, BR-084 revogada.

**Melhorado**
- **Contexto para o super admin** — ao entrar numa empresa (`/admin/empresas/:id`), breadcrumb/voltar para a lista + linha "Administrador da empresa"; o card de empresa na lista mostra o admin (nome/email).

Referência: [PLAN-025](plans/PLAN-025-regra-exclusiva-ajuste-caixa.md)

## 01/08/2026 — PLAN-024 · Página do Administrador

**Corrigido**
- **Ajuste de saldo não refletia no operador** — o admin só conseguia ajustar o próprio Caixa Base (`CaixaPage` grava no `req.userId`). Agora a página do operador (`OperadorDetail`) tem o bloco "Ajustar caixa base do operador", que grava no operador certo via `?usuarioId=`.
- **Cards de operadores quebrados em telas estreitas** (badge por cima do nome, ícones espaçados) — lista reescrita no padrão `Card`/`Card.Actions` do sistema, com `flex-wrap`.
- **Feedback do ajuste de caixa:** valor zerado/vazio era descartado silenciosamente; agora avisa "Informe um valor maior que zero." e a falha de ajuste mostra mensagem própria ("Erro ao ajustar caixa.") em vez do erro genérico de carregamento.
- **Remover com destaque de perigo:** o botão de remover operador voltou a ficar vermelho (nova variante `danger` em `QuickActions`/`Card.Actions`).

**Melhorado**
- **KPIs clicáveis:** Equipe (Admins/Operadores) abre modal com a lista; Clientes e Contratos navegam para as telas (admin); Resultado do Dia abre modal com entradas/saídas do dia.
- **KPIs de Operação escopados por usuário (admin self)** — agora batem com `/clientes`, `/contratos` e o caixa ao navegar (antes agregavam a empresa inteira). Super admin mantém visão agregada por empresa — BR-087.
- **Equipe reordenada:** administradores no topo, depois operadores, ambos em ordem alfabética; o usuário logado aparece na lista com a tag "Eu" (sem editar/remover no próprio card).

Referência: [PLAN-024](plans/PLAN-024-admin-organizacao-kpis.md)

## 01/08/2026 — PLAN-023 · Ajustes pós-validação

**Corrigido**
- **Tela em branco na Rota de Cobrança** ao visitar o último cliente pendente — o índice de navegação usava `items.length` (não encolhe ao visitar) em vez de `sortedItems.length` (só pendentes). Adicionado fallback visual de carregamento no lugar do render vazio.
- **Parcela que vence hoje sem destaque** — agora tem estilo próprio "Vence Hoje" (precedência: vencida > vence hoje > pendente) e contador separado no resumo.

**Melhorado**
- **Filtro "Todos" dos atendidos** passa a incluir os pagamentos do dia, deduplicados (cliente que pagou não aparece duas vezes).
- **Lista de atrasados** ganhou resumo (clientes distintos + valor total) e **histórico de 30 dias** — snapshot diário automático a cada abertura das cobranças, com endpoint `GET /api/operacoes/historico-atrasos` e BR-086.

Referência: [PLAN-023](plans/PLAN-023-ajustes-pos-validacao.md)

## 01/08/2026 — PLAN-021/022 · Painel admin

**Melhorado**
- Painel admin com contexto de empresa, KPIs por seção, Admins × Operadores, login por role e engrenagem na navbar.
- "Contratos Ativos" agora conta só `estado = 'Ativo'` (Finalizado/Cancelado excluídos) — BR-085.
- Resultado do Dia em módulo com cor verde/vermelha + tooltip de composição; header indica o nível (admin/empresa + badge); idioma movido para a engrenagem.

Referência: [PLAN-021](plans/PLAN-021-admin-contexto-kpis.md) · [PLAN-022](plans/PLAN-022-admin-kpis-ajuste.md)
