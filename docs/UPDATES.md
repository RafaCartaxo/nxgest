# Atualizações

Registro resumido das alterações recentes — melhorias e correções, para acompanhamento. Detalhes completos nos PLANs linkados.

## 03/08/2026 — PLAN-032 · Papéis hierárquicos (sócio)

**Adicionado**
- **Papel `socio`** — mesmas funções do admin em escopo menor (subárvore); login cai no painel escopado (`/admin`).
- **`usuarios.chefeId`** (o "chefe") + migração no boot; hierarquia: admin → sócio → operador (3 níveis, sem sub-sócio no v1).
- **Escopo de dados por nível**: operator = próprio · sócio = subárvore · admin = empresa (recebido hoje, equipe, KPIs, `?usuarioId=`).
- **Sócio cria operador do grupo** (só `operator`, chefe = ele) — BR-095.
- BR-094 (hierarquia/subárvore) + revisão de BR-056/057/066/081; UCs 064-069; CTs API 098-102.

Referência: [PLAN-032](plans/PLAN-032-papeis-hierarquicos-socio.md)

## 03/08/2026 — PLAN-031 · Temas & gradientes + Super Admin whitelabel (módulos por empresa)

**Adicionado**
- **5 temas por usuário** (default, aurora, ocean, grape, sunset) × claro/escuro — seletor com swatches na engrenagem; base para whitelabel.
- **Gradientes modernos** (tokens `--gradient-page/accent/text`): fundo do app, LoginPage, botão primário "brand", navbar ativo.
- **Super Admin como centro de controle**: página redesenhada (banner em gradiente) + **ativar/desativar módulos por empresa** — `PATCH /api/admin/empresas/:id/modulos` (BR-092).
- **7 módulos granulares** (`clientes, contratos, caixa, gastos, rota, cobrancas, atendidos`; `central` sempre on), com **dependências** (`gastos⇒caixa`; `rota/cobrancas/atendidos⇒contratos`) e **"só central"** permitido (BR-093).
- **Gating de UI**: `RequireModule` (rotas), Navbar, Central, Caixa (gastos), ClienteDetail (contratos) — módulo off oculta superfícies.
- `login`/`me`/`empresas` agora retornam `modulos`; `EmpresaForm` migrado para o `Modal` base (fix do backdrop cru).

**Follow-up (P024):** enforcement no backend (403 por módulo desativado) — v1 é gating de UI.

Referência: [PLAN-031](plans/PLAN-031-temas-modulos-whitelabel.md)

## 03/08/2026 — PLAN-030 · Admin: visão da equipe

**Melhorado**
- **KPIs de Operação do painel admin agora mostram o total da equipe** (admins + operadores + próprio), com subtítulo "da equipe · N operadores" — antes mostravam os dados do próprio admin (BR-087 → **BR-091**).
- **Click no KPI → modal de contribuição por operador** ("quanto cada um geriu": clientes, contratos ativos, recebido hoje); click no operador → `OperadorDetail` (preservando `?empresaId=`).
- **Novo endpoint `GET /api/admin/equipe`** (operadores + totais; coerência Σ = agregado da empresa).
- **KPI "Resultado do Dia" virou "Recebido hoje"** (Σ do dia da equipe) — rótulo honesto e decomposto por operador.
- **EquipeModal** com stats + navegação ao operador; `ResultadoDiaModal` removido (sem uso).
- **Navbar**: links **"Administração"** (admin) e **"Empresas"** (super) visíveis — administração deixa de ficar escondida na engrenagem.

Referência: [PLAN-030](plans/PLAN-030-admin-visao-equipe.md)

## 03/08/2026 — Validação da API (smoke 88 cenários)

**Validado** — `scripts/smoke-api.mjs` executou **88 cenários** da base `07-CASOS-DE-USO-API.md` contra instância isolada (seed em `/tmp`, `PORT=3002`): **todos PASS**, incluindo coerência (saldo cai após contrato, `recebidoHoje` sobe após pagamento, auditoria após ajuste, movimentação reversa no estorno, login novo/antigo na troca de senha, empresa + login do admin novo) e as **variações V1–V8** (pagamento que atravessa parcelas, quitar→`Finalizado`, estorno reverte, cliente 2 contratos → 2 linhas, ajuste de caixa absoluto, cross-tenant 404, super admin cross-empresa, token inválido 401).

**Cruzamento fluxos × API:** 06 ↔ 07 mapeados — sem endpoint órfão. Achados de coerência corrigidos: "resultado do dia" do operador é calculado no front (`recebidoHoje − aReceberHoje`, diferente do admin `entradas − saídas`), shape dos indicadores de `cobrancas` (5), 7 KPIs no mapeamento §1, `totalPeriodo` em `GET /gastos`, janela "a vencer" verificada.

**Ajustes decorrentes:**
- `dataPromessa` **obrigatória** quando `tipo=promessa` (422) — `operacoes.controller.ts`.
- **Senha mín. 6** no `POST/PATCH /api/admin/operadores` (400) — não dependia só do front.
- `LOGIN_RATE_LIMIT_MAX` (env, default 10) — elevar limite em teste/smoke.
- `07-CASOS-DE-USO-API.md` corrigida para a realidade do código (204 nos deletes, 403 auto-rebaixar/remover, 400 role/senha, enum `nao_localizado`, `percentualJuros`, escopo `?usuarioId=`) + CTs 078–087; collection regenerada.
- **P021** registrado no backlog (pagamento a mais do total — observação de produto, sem implementação).

Referência: [07-CASOS-DE-USO-API](product/07-CASOS-DE-USO-API.md) · [PLAN-029](plans/PLAN-029-senha-perfil.md)

## 03/08/2026 — PLAN-029 · Senha e Perfil do Usuário

**Adicionado**
- **Mostrar/ocultar senha no login** — toggle Eye/EyeOff no campo senha (UC-041).
- **Troca da própria senha** — novo endpoint `PATCH /api/auth/senha` (BR-089/090): valida a senha atual (incorreta → 422, sem deslogar), exige nova ≥ 6 caracteres; o token atual permanece válido.
- **Página "Meus dados" (`/perfil`)** para todos os perfis — dados do usuário + troca de senha; acesso pela engrenagem do Navbar e pela aba "Meus dados" do painel admin.

**Fora de escopo:** "esqueci minha senha" → backlog P020 (sem infra de e-mail; admin redefine via `PATCH /api/admin/operadores/:id`).

Referência: [PLAN-029](plans/PLAN-029-senha-perfil.md)

## 03/08/2026 — Documentação alinhada + SKILL-009 (Documentation Sync)

**Alinhado**
- `05-MAPEAMENTO-TELAS.md` v1.15: telas Caixa, Gastos, OperadorDetail, Atendidos, Cobranças adicionadas; contagem corrigida (19 telas).
- `06-CASOS-DE-USO.md` v1.1: UCs 039-052 (auth + CRUDs básicos).
- `02-BUSINESS-RULES.md` v1.7: BR-089/090.
- `02-API.md`: `parcelas-hoje`, `parcelas-semana`, `health` documentados.
- **Novo** `07-CASOS-DE-USO-API.md`: base de casos de uso e cenários de teste da API (UCs + CTs por endpoint).
- **`api-collection.json` reconstruída**: 40 → 41 requests espelhando a 07 (gerada por `scripts/build-collection.mjs`).

**Mecanismo novo**
- **SKILL-009** (`docs/skills/SKILL-009-documentation-sync.md`): fonte única de verdade + matriz de propagação.
- `scripts/audit-docs.mjs`: auditoria de consistência (código ↔ 02-API ↔ 07 ↔ collection ↔ mapeamento).
- Agente `.opencode/agents/docs-sync.md` + comandos `audita-docs` / `atualiza-docs`.

## 02/08/2026 — PLAN-028 · Estorno de Pagamento pelo Admin

**Adicionado**
- **Estorno de pagamento** (fatia 1 do P013 — Contexto do Operador): admin/super_admin pode **reverter por completo** um pagamento registrado por engano. O operador registra o valor correto novamente se precisar.
- **Como funciona**: reverter cada parcela (volta estado/saldo/dataQuitacao), movimentação reversa (`saida`/`Cancelamento`), contrato volta a `Ativo` se estava finalizado; pagamento original **nunca é deletado** (BR-029), marcado com `estornadoEm`/`estornadoPor`/`estornoMotivo` + registro em `auditoria_estornos`.
- **Níveis de acesso**: operator → 403; admin estorna dentro da própria empresa; super_admin qualquer (via `resolveUsuarioAlvo`).
- **Contexto do operador**: admin vê os **contratos do operador** no `OperadorDetail` e abre o contrato em modo **somente leitura** (sem editar/excluir/pagar), com botão "Estornar" + modal de motivo.
- **Escopo `?usuarioId=`** estendido para leitura de contrato, pagamento e cliente (padrão do caixa).

Referência: [PLAN-028](plans/PLAN-028-estorno-pagamento.md)

## 02/08/2026 — Correção do backup de produção (WAL)

**Corrigido (crítico)**
- **Backups automáticos estavam inúteis** — o banco roda em WAL mode (dados vivos no `.db-wal` ~1MB), e o script copiava só `gestao.db` cru → arquivos de 4KB **vazios** (validado: "no such table: usuarios").
- **Script corrigido** (`/opt/scripts/backup-nxgestao.sh`): `wal_checkpoint(TRUNCATE)` antes do `cp` + **validação embutida** (`SELECT COUNT(*) FROM usuarios` > 0; backup vazio vira `.invalid`).
- **Backup pré-deploy**: `scripts/deploy.sh` agora chama o backup **antes** do build — todo deploy gera snapshot do estado anterior.
- **Cópia off-site corrigida**: `~/.config/nxgestao/backups/backup-offsite-gestao.db` estava vazia (4KB) → substituída pelo backup consistente (241KB, dados reais).
- Backup validado: `gestao-20260802-115822.db` (236KB, 5 usuários, 7 clientes).

## 02/08/2026 — Deploy no VPS (PLAN-023 → PLAN-027)

**Deploy do código atual em produção** (`https://nxgestao.duckdns.org`):
- Produção passou de PLAN-022 para o topo local (PLAN-023/024/025/026/027) — commit `dc435dc`.
- Migração aplicada no boot: tabela `auditoria_caixa` criada; dados reais preservados (5 usuários, 1 empresa).
- **Gap encontrado e corrigido**: os backups automáticos copiavam só `gestao.db` (4096 bytes, WAL não incluído) — **incompletos**. Feito checkpoint + backup manual correto (`/opt/backups/gestao-manual-20260802-112054.db`, 204KB). Ajuste do script de backup é pendência.
- Validado: health OK, login admin OK, `GET /api/caixa/auditoria` 200, frontend novo servido.

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
