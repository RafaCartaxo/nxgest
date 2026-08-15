# Atualizações

Registro resumido das alterações recentes — melhorias e correções, para acompanhamento. Detalhes completos nos PLANs linkados.

## 15/08/2026 — Contrato periódico (PLAN-076) + Performance (PLAN-077) + UI consolidada — **em produção**

- **Contrato com periodicidade diária/semanal (PLAN-076)** — campo `periodicidade` (`diaria` default | `semanal`), vencimento semanal `+7 dias`, `dataInicio` em domingo bloqueado para semanal (BR-040-A), edição regenera parcelas, badge Diária/Semanal no card. Migração idempotente (`ADD COLUMN IF NOT EXISTS`); contratos existentes herdam `diaria`.
- **Performance & escalabilidade (PLAN-077)** — pool PG com `connectionTimeoutMillis: 5000` + `idleTimeoutMillis: 30000` (envs); **auth/módulo sem re-query por request** (`req.authUsuario`/`req.authEmpresa`; rotas de módulo 3→2 queries); `listarCobrancasDoDia` reescrita com **`LATERAL`** (2 subqueries → 1, visitas por range — shape idêntico); N+1 em pagamentos → `IN (ids)`; fix de SQL latente no caixa (filtro por período); frontend com **code-splitting** (`React.lazy` 27 páginas + `manualChunks`) e **GPS throttle** (30m). **Node 20** em todos os ambientes (prod já era `node:20-slim`; dev local migrado).
- **UI consolidada** — Perfil bento grid + banner de pendência de e-mail; OperadorDetail bento + modal "Alterar status"; OperadorForm seções + callout convite; AdminPage KPIs + `useEditarOperador`; contrato periódico no front (form/schema/service); consistência Caixa/KpiCard/Avatar/layout/i18n.
- **Validação** — `npm test` **125/125** · tsc/build/audits/docs verdes · **smoke 267/267 ✅** · CI/CD verdes com **deploy em produção** (prod + staging `db: connected`).

## 14/08/2026 — Cards de status com tone/badge dinâmicos (Perfil, OperadorForm, OperadorDetail)

- **"Dados pessoais" segue o tema** — os cards "Dados pessoais" do Perfil e do OperadorForm saíram do `tone="success"` (verde fixo) para **`tone="info"`** (cor da marca/tema — muda com a paleta escolhida, whitelabel e dark), consistente com o card "Acesso".
- **Perfil — card "Conta":** badge de status ("Ativo"/"Suspenso"/"Convidado") movido para a **linha do título** (à direita) e o **tone do card** agora acompanha o estado (success/danger/warning), como no card "Dados pessoais".
- **OperadorForm — seção "Status da conta":** `tone="warning"` fixo → **dinâmico por status** (danger/warning/success), coerente com a badge.
- **OperadorDetail — card "Contato & Status":** `tone="neutral"` fixo → **dinâmico** + **badge de status sempre visível** (antes só aparecia em estados negativos; operador ativo não tinha badge).

## 14/08/2026 — KPIs: barra de cor acompanha o sinal do valor + unificação blue/info

- **Barra (tone stripe) corrigida em 3 KPIs** — o texto já mudava de cor conforme o sinal (verde/vermelho) mas a barra à esquerda ficava cinza fixa: `CaixaKpis.lucro` · `CaixaPage.resultadoSemana` · `IndicadoresCards.resultadoDoDia` → barra agora `green` (positivo) / `danger` (negativo).
- **`KpiCard` unificado** — removido o alias `variant="blue"` (idêntico ao `info`); usos padronizados para `variant="info"` (~6 locais: CaixaKpis, AjusteCaixaForm, IndicadoresCards, AdminPage, SuperAdminPage).

## 14/08/2026 — Navbar mobile: "Painel Admin" na tab bar (admin/sócio) + Rota fora da bar

- **Perfil: badge de role movido para o topo** — o `StatusBadge` do papel (Administrador/Sócio/Operador) saiu do card "Conta" e foi para a **linha do título "Dados pessoais"** (destaque ao abrir o Perfil). O card "Conta" fica só com o **status da conta** (Ativo/Suspenso/Convidado).

- **AdminPage: tag de role removida do header** — o `StatusBadge` do papel (Administrador/Sócio/Super Admin) saiu do `PageHeader` (informação já implícita na página administrativa; o papel segue no `UserMenu`). `headerBadge` órfão removido.

- **Painel Admin renomeado para "Administrativo"** — `admin.painel` = "Administrativo" (pt/es) e "Admin" (en); reflete na sidebar desktop e na tab bar mobile (ambos usam `t("admin.painel")`).

- **Painel Admin movido para a tab bar** — admin/sócio passam a ver **"Painel Admin"** (`/admin`) na **tab bar inferior mobile** (como Empresas/Leads do super). **Removido do `UserMenu`** (prop `mostrarAdmin` + bloco + import `ShieldCheck` eliminados; `AppLayout` sem a prop). Operador continua sem Painel Admin.
- **Rota fora da bar para admin/sócio** — esses perfis **delegam a rota** aos operadores; a aba **Rota sai da bar** (mobile). Eles continuam acessando a rota pela **Central** ("Minha rota"). Operador mantém a aba Rota. Sidebar desktop **mantém** Rota (decisão — não remover agora).
- Resultado mobile admin/sócio: Central + Clientes + Contratos + Caixa + **Painel Admin** (5 abas).

## 14/08/2026 — Fix: labels "E-mail"/"Telefone" não quebram com valor longo (OperadorDetail)

- **Card "Contato & Status"** (OperadorDetail) — os labels "E-mail:"/"Telefone:" agora têm `shrink-0 whitespace-nowrap` e os valores `min-w-0 truncate`: o **label não quebra** e o **valor trunca** corretamente (e-mail longo não "quebra" o label).
- **Modal "Alterar status"** (OperadorDetail + AdminPage) — a linha "Dados do {role}: {nome}" foi separada em 2 spans (label `shrink-0` + nome `min-w-0 truncate`): o label não quebra e o nome do operador trunca no modal.
- **Fora de escopo:** nome do operador no topo (PageHeader) mantido como está.

## 14/08/2026 — Admin: aba "Meus dados" removida + header do operador sem role badge

- **AdminPage: aba "Meus dados" removida** — o admin/sócio da própria empresa via **sempre a Equipe** (sem Tabs). A aba "Meus dados" era redundante: repetia os 6 KPIs do caixa (já vistos na CaixaPage) + um botão "/perfil" que já existe no UserMenu. Código morto limpo (`tab`/`meuCaixa`/`fetchMeuCaixa`, imports `Tabs`/`User`/`getCaixaStatus`, chaves i18n `tabEquipe`/`tabMeusDados`).
- **OperadorDetail: header libera espaço para o nome** — o `StatusBadge` de role saiu do `action` do PageHeader (o role já aparece no card "Contato & Status" como "Dados do {role}"). O `action` agora tem só avatar + botão Editar — o nome trunca menos. `roleVariant` (órfão) removido do import.

## 14/08/2026 — Perfil: "Alterar senha" como modal + padronização "Alterar/Alteração"

- **"Alterar senha" virou modal** — o card "Segurança" do Perfil não mostra mais o form inline de 3 campos; virou um **gatilho** (`outline` + ícone `Lock`) que abre o **modal "Alterar senha"** no padrão do e-mail (title + descrição + form + rodapé Cancelar/ação). Sucesso fecha o modal + limpa campos.
- **Padronização "Alterar"/"Alteração"** — todas as cópias visíveis de "Trocar/troca" viraram **"Alterar"/"alteração"**: `perfil.trocarEmail`→`alterarEmail`, `trocarSenha`→`alterarSenha`, `cancelarTroca`→`cancelarAlteracao`, `avatar.trocar`→`avatar.alterar`, toasts ("alteração cancelada", "erro ao iniciar a alteração"). Nomes internos da API (`trocarEmail`/`cancelarTrocaEmail`) mantidos.
- **i18n:** chaves renomeadas + novas `perfil.alterarSenhaDescricao` (pt/en/es).

## 14/08/2026 — Operador: edição refinada (títulos dinâmicos, botão status, fixes)

- **Títulos dinâmicos por role** — o modal de edição agora mostra **"Editar Operador/Administrador/Sócio"** (`admin.editarRole`), e o rótulo do nome (modal "Alterar status" + card "Contato & Status") virou **"Dados do operador/administrador/sócio"** (`admin.dadosRole`) no lugar de "Dados de operação".
- **Botão "Alterar status da conta"** — no form de edição, os botões Suspender/Reativar inline foram substituídos por um **botão neutro (`outline`)** que abre o modal "Alterar status" existente (Suspender `danger`/Reativar `primary` dentro). `onAlterarStatus` decidido pelo estado atual (`suspensoEm`).
- **Fix: status re-sincroniza sem reabrir (bug 2)** — após suspender/reativar/revogar, o `AdminPage` recria o `editingOp` via `getOperador` (e o Detail já recria via `fetch`) → o form reflete o novo status imediatamente.
- **Fix: toast acima do modal** — `FeedbackOverlay` subiu de `z-40` para `z-[60]` (acima do Modal `z-50`); o toast de sucesso agora é visível com o modal aberto.
- **"Foto" removido do AvatarField** — o label de texto "Foto" deixou de ser exibido (fallback removido); avatar e botões Adicionar/Trocar/Remover intactos (Perfil, Operador, Cliente).
- **Telefone uniforme** — Perfil/Operador/Lead agora usam label **"Telefone"** + placeholder **`(11) 99999-9999`** (antes: "Opcional" como placeholder). `perfil.telefoneOpcional` → `perfil.telefonePlaceholder`.
- **i18n novas:** `admin.editarRole` · `admin.dadosRole` · `admin.alterarStatusConta` · `perfil.telefonePlaceholder` (pt/en/es).

## 14/08/2026 — Admin: edição de operador unificada + navbar super admin

- **Edição de operador unificada (fim dos 2 forms diferentes)** — o `AdminPage` (lista, lápis ✏️) passava ao `OperadorForm` **sem** os callbacks de conta, então a seção "Status da conta" (Suspender/Reativar/Reenviar/Revogar convite) não aparecia; já no `OperadorDetail` (botão "Editar" no topo) aparecia. Agora o `AdminPage` passa os mesmos callbacks + ganhou `suspenderAcao`/`onSuspensao`/`onRevogarConvite` e o **Modal "Alterar status"** — o form de edição é **idêntico** na lista e no detalhe.
- **Navbar super admin** — abas **Empresas** (`/admin/empresas`) e **Leads** (`/admin/leads`) adicionadas à **tab bar inferior mobile** (`BottomTabBar`), abaixo da Central (super admin passa a ter acesso administrativo na própria bar, como a sidebar desktop). **Removidas do `UserMenu`** (sem duplicação) — ficam só na tab bar.

## 14/08/2026 — OperadorDetail: ações de conta no "Editar" + máscara de telefone

- **Ações de conta movidas para o modal "Editar"** — removido o card "Status da conta" exposto na tela de detalhe do operador. Agora há um **botão "Editar"** no PageHeader do OperadorDetail que abre o `OperadorForm` (modo edição); dentro do form, uma seção **"Status da conta"** concentra Suspender/Reativar e Reenviar/Revogar convite (com `ConfirmModal`). Novo **hook `useEditarOperador`** (`hooks/useEditarOperador.ts`) compartilhado entre `AdminPage` e `OperadorDetail` — fonte única do fluxo de update + reassign guiado (`OPERATOR_HAS_SUBORDINATES`).
- **Máscara de telefone nos campos sem máscara** — `PerfilPage` (Meus dados), `OperadorForm` (editar operador) e `QueroConhecerPage` (lead) agora usam `maskPhone` no input + `unmask` no submit, mesmo padrão do `ClienteForm`.

## 14/08/2026 — OperadorDetail: modal "Alterar status" + KPIs clicáveis

- **Card "Status da conta"** — o card de ações do operador foi renomeado de "Conta —" para **"Status da conta"**: removida a linha "—" (`admin.semConta`) e adicionado **`StatusBadge` do status atual** (Ativo `success` / Suspenso `danger` / Convidado `warning`) junto ao título, antes dos botões de ação. i18n nova: `admin.statusConta` (pt/en/es).
- **Variantes alinhadas** — botão **Reativar** agora usa `primary` tanto no card quanto no modal "Alterar status" (padrão do sistema: ação não-destrutiva = `primary`, como no `ConfirmModal`). Suspender continua `danger` nos dois.
- **Modal "Alterar status"** — o botão **Suspender/Reativar** do operador abre um **`Modal` próprio** no padrão do Perfil (Trocar e-mail): título "Alterar status", descrição contextual, **status atual** do operador (`StatusBadge`) e rodapé Cancelar + ação. Substitui o `ConfirmModal` genérico. i18n nova: `admin.alterarStatus` + `admin.statusAtivo` (pt/en/es).
- **KPIs clicáveis** — no OperadorDetail os KPIs **Clientes/Contratos** agora navegam para as listas do operador (`/clientes?usuarioId=...`, `/contratos?usuarioId=...`), mesmo padrão do painel admin; ficam **lado a lado** (`grid-cols-2 lg:col-span-2`). Removidos os **cards Clientes/Contratos redundantes** do bloco caixa + código morto (`listContratos`/`listClientes`, states, `ArrowRight`).

## 14/08/2026 — Ajustes de consistência pós-port (QA review)

- **OperadoresList** — restaurado o **botão "Acessar" (→)** para o detalhe do operador (`/admin/operadores/:id`, com `empresaId` quando houver) — perdido no port do grid de cards; **sempre visível** (inclusive para o próprio usuário). **a11y:** `aria-label` em todos os botões-ícone (Acessar/Reenviar/Editar/Remover).
- **OperadorForm** — seções em **`Card` tone** (Dados pessoais `success` / Acesso `info` / Permissões `neutral`) com título `font-display` dentro + **avatar em coluna própria** (espelha o Meu Perfil); removido código morto (`onCancel` não usado, `loading` interno sem função — botões no `Modal.footer` usam `savingUpdate` do AdminPage).
- **PerfilPage** — card **Segurança** alinhado ao padrão (`Card` tone `neutral` + título dentro), uniforme com Dados pessoais/Conta.
- **OperadorDetail** — card "Desempenho" sem `KpiCard` aninhado (borda dupla): agora **`KpiCard` irmãos** (Clientes green · Contratos yellow) direto no grid do bento, **mesmo padrão do painel admin** (AdminPage). **KPIs agora são clicáveis** (navegam para as listas de clientes/contratos do operador) e ficam **lado a lado** (`grid-cols-2 lg:col-span-2`). Removidos os **cards Clientes/Contratos redundantes** do bloco caixa (acesso agora pelos KPIs) + código morto (`listContratos`/`listClientes`, states, `ArrowRight`). `CaixaKpis` intocado (compartilhado com CaixaPage).
- **Pendências despriorizadas (consistência futura):** EmpresaForm → `Modal.footer` (B3) e spinner nos botões de Resetar/Recuperar senha (B5).
- **Validado:** tsc · 115 testes · build · audits (UI/styles/docs).

## 14/08/2026 — Port telas Stitch `stitch_personality_plus_portal` (identidade "Nexus" nas 8 superfícies)

- **Perfil (`PerfilPage`)** — **bento grid** (Dados pessoais + Conta na coluna principal 8col · Segurança na lateral 4col); selo `BadgeCheck` "E-mail verificado" no e-mail; **"Trocar e-mail" movido para dentro do card Conta** (rodapé `border-t`); banner de pendência com ícone `Info` + botão Cancelar.
  - **Ajuste (mesmo dia):** Dados pessoais e Conta refeitos seguindo o protótipo Stitch — cards com `Card` tone (sucesso/info) + título `font-display` **dentro do card**; **avatar em coluna própria** à esquerda (respiro `gap-lg` com os campos, fim do "impressado"); Conta com **sub-cards** `bg-surface-secondary` (E-mail com selo `BadgeCheck` · Empresa) + **badges Status/Role em linha**; corrigido token inválido `bg-surface-container-lowest` (M3) → `bg-surface` no banner.
- **OperadorForm + AdminPage** — callout do convite em **bloco próprio** (seção PERMISSÕES, `bg-primary-light` + `Mail`); botões de ação movidos para o **`Modal.footer`** (padrão canônico; `OperadorForm` expõe `submit()` via ref) — resolve o "submit fixo" do Stitch sem conflitar com o bottom-sheet.
- **OperadorDetail** — **bento 3col** (Contato & Status com badges · Desempenho com KpiCards · Ações de Conta `lg:col-span-3` em linha) + bloco caixa em 2col (CaixaKpis + card Clientes/Contratos + Ajustar + histórico colapsável). Mantém R3 (caixa independente) e `isSelf`.
- **OperadoresList** — **grid de cards** (1/2/3 col) com **tone stripe por role** (admin=info, sócio=success, operador=neutral), badges, e-mail/telefone com ícones, contadores `tabular-nums`; busca nome+e-mail mantida.
- **ContaSuspensaScreen** — card warning com tone stripe + box de aviso (`AlertTriangle`) + Button Sair (`LogOut`); copy atual mantida (sem "violações de termos"/ID fake).
- **AtivarPage** — botão submit com spinner; demais já canônicos.
- **Respeita a arquitetura**: sem token/tema novo (M3 do Stitch mapeado para tokens Nexus), `lucide-react` (sem Material Symbols), sem sidebar mock, sem dados fictícios, sem chave i18n nova.
- **Validado:** tsc · 115 testes · build · audits (UI/styles/docs). `UI-COVERAGE.md` atualizado.

## 14/08/2026 — PLAN-075: fechamento completo (login espelha /me, troca administrativa, suspensão de usuário, limpeza)

- **Login espelha `/me`** — `POST /auth/login` passa a devolver `telefone`, `emailPendente` e `emailVerificado` (shape idêntico ao `GET /auth/me`). Front `AuthContext` já repassava; tipo `UsuarioComum` já os previa.
- **Semântica de convite invalidado (achado 7)** — `AtivarContaUseCase`: convite `EXPIRADO` **dentro** do `expiraEm` = substituído por reenvio → **400 `TOKEN_INVALID`** (mensagem do backend); `TOKEN_EXPIRED` reservado ao **vencimento real**. `marcarExpirado` perde o param `agora` não usado.
- **Suspensão de usuário coberta no smoke** — novos `SUSP-USR-*` (suspender ativo → login 403 `CONTA_SUSPENSA`; token vivo → 403; `/me` → `status: "suspenso"`; reativar → 200; auto-suspensão 403; convidado 409; inexistente 404).
- **Troca administrativa de e-mail no smoke** — `ADM-TROC-CONV` (convidado: troca direta), `ADM-TROC-ATIVO` (`email_pendente` + e-mail atual segue), `ADM-TROC-DUP` (409), `SOC-TROC-SUB`/`SOC-TROC-FORA` (sócio 200/404). **Doc 07:** CT-P-12..15.
- **Fix: reuso de e-mail de operador removido (soft-delete libera o e-mail)** — o smoke `ADM-TROC-REUSE` expôs um **500**: `usuarios.email` tinha unique **hard** (`usuarios_email_key`) enquanto a dedup de aplicação (N1.6) ignora soft-deleted → reutilizar o e-mail de um operador removido passava na validação e estourava no banco. Correção alinhada ao padrão do CPF de clientes: `usuarios.email` virou **índice único parcial** (`idx_usuarios_email ... WHERE "deleted_at" IS NULL`), com `DROP CONSTRAINT IF EXISTS "usuarios_email_key"` no DDL idempotente. **Doc 07:** CT-P-16; **BR-751**.
- **Limpeza de código morto** — `senhaHash` removido de `IAdminRepository.create/update` (nunca era enviado — P-04); i18n morto `adminSenhaCurta/adminSenhaObrigatoria` removido (3 idiomas); `conviteStatusPorUsuario` duplicado no `AdminRepository` delegado ao `ConviteRepository` (fonte única).
- **Collection sem `adminSenha`** — `build-collection.mjs` (criar empresa/operador) sem o campo; `docs/api-collection.json` regenerada; `02-API.md`, `UC-046`, `BR-750` atualizados.
- **Validado:** tsc · 115 testes · build · audits (UI/styles/docs). Smoke completo (**263/263**) na instância isolada — incluindo SUSP-USR-*, ADM-TROC-CONV/ATIVO/DUP/REUSE e SOC-TROC-SUB/FORA.

## 13/08/2026 — Cadastro de cliente: endereço pessoal opcional + fix do número na localização

- **Endereço pessoal opcional (BR-044)** — cliente pode ser cadastrado só com nome, telefone e comércio (foco = comércio). `endereco.logradouro` deixa de ser obrigatório no front (`cliente.schema.ts`), no backend (`CreateClienteInput`) e vira **nullable no banco** (`ALTER COLUMN logradouro DROP NOT NULL` no `runMigrations`). Edição permite limpar o endereço pessoal (`null`).
- **Fix GPS: editar o número não descarta a localização** — o reverse geocode não preenche o campo `número`; digitar o número depois invalidava as coords (regra "editar texto descarta coords"). `numero`/`comercioNumero` saem da lista de campos que descartam (ambos os blocos). Logradouro/bairro/cidade/estado/complemento continuam descartando.
- **Tipos** — `cliente_logradouro` agora `string | null` (COALESCE de comércio×pessoal pode ser NULL quando ambos vazios) em `operacoes.repository` (port + impl + service + `alvo.ts`).
- **Testes** — +2 no `ClienteForm.test.tsx` (editar número mantém `gps.capturada` em ambos os blocos). **Docs:** UC-015/UC-080, API-UC-004/CT-007, `02-API.md`, BR-044, este registro.

## 12/08/2026 — Caixa operacional: ajuste unificado em modal + remoção do "Fechar caixa" da Central

- **Ajuste de caixa = modal único nos 2 lugares** — `OperadorDetail` (admin vendo operador) agora abre o **mesmo `AjustarCaixaModal`** da CaixaPage (form único `AjusteCaixaForm`). `AjusteCaixaCard` (card inline) **removido** — padrão de acesso consistente (era 1 modal + 1 inline).
- **"Fechar caixa" removido da Central** — `FecharCaixaModal` **removido**: repetia os KPIs da Central e só navegava p/ `/caixa` (não gerava dado). O fechamento real (semana, `fechamentos_semanais`) é **exclusivo da CaixaPage** ("Liquidar"). QuickAction da Central limpa.
- **Botões gatilho padronizados (CaixaPage)** — "Ajustar Caixa Total" agora `primary` (era `soft`), em paridade com "Registrar Gasto" (`primary`) — mesma variante/ícone.
- **Docs:** `UI-COVERAGE.md` (AjustarCaixaModal; removidos AjusteCaixaCard/FecharCaixaModal) · `PLAN-069` (status/escopo atualizados) · este registro.

## 13/08/2026 — E-mail: identidade visual NX nos templates (PLAN-071 Fase 1b) — local, aguardando commit

- **`templates.ts`** — layout único reutilizável com identidade NX: marca **"NX Gest"** violeta · título/corpo Arial/Helvetica · **botão CTA** com `min-width` · **rodapé institucional** (pt/en/es) · cores da marca (hex `#0520ae`/`#02116c`, texto `#1f2430`/`#5b626f`, fundo `#f4f8fc`).
- Os 3 templates (convite/reset/lead) usam o mesmo layout — textos atuais preservados. `text` plain mantido (fallback anti-spam).
- **Validado:** tsc · 91 testes · render HTML conferido (marca + rodapé nos 3). Sem commit/push.

## 12/08/2026 — Caixa: DRY (componentes reutilizáveis) + seções colapsáveis + movimentações sem truncate (local, aguardando commit)

- **Componentes reutilizáveis (elimina duplicação entre CaixaPage e OperadorDetail):**
  - **`CaixaKpis`** (`modules/caixa/components`) — 6 KPIs de caixa (Base/Saldo/Lucro/A receber/Recebido semana/Cobrado hoje) com `kpis[]` e `onKpiClick?` (CaixaPage com cliques p/ modais · OperadorDetail sem).
  - **`AjusteHistorico` + `AjusteRow`** — linha do histórico de ajustes (valor `value-lg` + "por **Nome**" + motivo + data) reutilizada nas 2 páginas.
  - **`MovimentacoesList` + `MovimentacaoRow`** — movimentação reorganizada em 2 blocos (valor/origem/badges/data + cliente/descrição) **sem truncate** (`break-words`).
  - **`CollapsibleSection`** (`shared/components`) — seção com header clicável + chevron, colapsada por padrão, `count` no header, limite de itens + "Ver mais" (+8).
- **Aplicado:** CaixaPage (Movimentações + Histórico colapsáveis com `limit=8`; KPIs via `CaixaKpis`) · OperadorDetail (KPIs via `CaixaKpis`; Histórico colapsável). **1 fonte → 2 páginas.**
- **i18n:** `common.verMais`/`common.verMenos` (3 idiomas).
- **Docs:** `UPDATES.md` · `STATUS.md` · `tasks/2026-08-12/CHECKLIST.md` · `UI-COVERAGE.md` (componentes novos).

## 12/08/2026 — Cliente: lucro realizado (KPI) — local, aguardando commit

- **Backend** — `ClienteFinanceiroResumo` ganha `lucroRealizado` (Σ `valorFinal − valorBase` dos contratos `Finalizado`), calculado por helper reutilizado `sumLucroPorEstado(userId, clienteId, estado)` (previsto usa `'Ativo'`, realizado usa `'Finalizado'`) — sem duplicar a query.
- **Frontend** — `SituacaoFinanceira` ganha o KPI **"Lucro realizado"** (verde); layout `grid-cols-2` → `sm:grid-cols-3`; interface `Cliente` + i18n `cliente.lucroRealizado` (3 idiomas).
- **Docs/CTs** — BR-098 (previsto × realizado), `07` API-CT-106 (novo), UC-071 (grade com lucro realizado), smoke `CLI-011` valida `lucroRealizado`.
- **Validação** — tsc · build · 91 testes · audits · docs:audit · smoke 250/250 (local, sem commit/push).

## 12/08/2026 — Caixa: título do ajuste contextual + label do motivo + reordenação das páginas (local, aguardando commit)

- **`AjustarCaixaModal` recebe `title` contextual** — no caixa próprio: "Ajustar Caixa Total" (`caixa.ajustarTituloModal`); no operador: **"Ajustar caixa base do operador"** (nova chave `admin.ajustarTituloOperador`, 3 idiomas). Form único (`AjusteCaixaForm`) mantido.
- **Corrigido label do motivo** — `t("caixa.motivo")` (chave inexistente, renderizava crua) → **`t("caixa.motivoPlaceholder")`** = "Motivo do ajuste".
- **`OperadorDetail` reordenado** — Dados de operação → Caixa do operador → **Clientes do operador** → **Contratos do operador** → **Ajuste de caixa** → **Histórico de ajustes** (Clientes antes de Contratos; Ajuste+Histórico no fim).
- **`CaixaPage` reordenada** — KPIs Hoje → KPIs Semana → Seção Caixa → **Registrar Gasto** → **Movimentações** → **Ajustar Caixa Total** → **Histórico de ajustes** (Ajustar+Histórico no fim, como no OperadorDetail).
- **Docs/CTs** — `06-CASOS-DE-USO.md` UC-025 (título contextual + label motivo) e UC-028/028b (ordem da página) atualizados · `STATUS.md` · `tasks/2026-08-12/CHECKLIST.md`.

## 12/08/2026 — Página do administrador: refinamento com identidade visual canônica (local, aguardando commit)

- **Título da seção de ajuste** — `SectionHeader` passa a usar "Ajuste de caixa" (`admin.ajusteCaixaSecao`); o botão mantém a ação "Ajustar caixa base do operador". Eliminada a repetição do mesmo texto.
- **Histórico de ajustes unificado + destaque** — `CaixaPage` e `OperadorDetail` agora usam o **mesmo layout** (grid 2 colunas: bloco com valor em destaque `value-lg` · "por **{Nome}**" com o autor em `font-semibold` · motivo; data à direita). Corrige a divergência entre as duas páginas e o alinhamento inconsistente.
- **Cards Contratos/Clientes do operador → padrão canônico** — migrados para `Card.Root list-item` + `Card.Body` + **`Card.Indicators`** (contador via `Card.Indicator`) + **`Card.Actions`** ("Acessar" com seta → `navigate`), mesmo padrão da `OperadoresList`.
- **Docs/CTs** — `06-CASOS-DE-USO.md` UC-028/028b atualizados (card canônico, ação "Acessar", CT-CT-01..04 e CT-CL-01..04) · `STATUS.md` · `tasks/2026-08-12/CHECKLIST.md`.

## 12/08/2026 — Página do administrador: hierarquia + histórico em 2 colunas + contadores para listas (local, aguardando commit)

- **Limite do motivo do ajuste de caixa reduzido para 100 caracteres** (era 200) — form (com hint "máx 100" + `maxLength`) e backend alinhados; i18n 3 idiomas.
- **Histórico de ajustes em 2 colunas** — `OperadorDetail`: bloco à esquerda (valor anterior→novo · "por {Nome}" · motivo) e data à direita; **alinhamento consistente** entre linhas (corrige a quebra que desalinhava "por NX Gest" e a descrição).
- **Hierarquia/espaçamento** — botão "Ajustar caixa base do operador" separado dos KPIs (seção própria com respiro), mantendo o acesso por modal.
- **Contratos e Clientes do operador → contador + botão "Ver"** — a página não lista mais tudo inline (ficava gigante); card com contador + botão navega para a lista escopada.
- **Listas em visão do operador** — `ContratoList` e `ClienteList` leem `?usuarioId=` da URL, filtram pelo operador e o header indica "Contratos/Clientes do operador" (visão somente leitura; sem "Novo cliente" na visão de operador).
- **CTs documentados** no `06-CASOS-DE-USO.md`: UC-025 (hierarquia admin/sócio/super, CT-AJ-01..05), UC-026 (2 colunas, CT-HI-01..03), UC-028 (contador→lista, CT-CT-01..04), **UC-028b** (clientes, CT-CL-01..04).
- **Docs:** `UPDATES.md` · `STATUS.md` · `tasks/2026-08-12/CHECKLIST.md`.

## 12/08/2026 — Validações manuais concluídas em produção + fix do teclado na edição de endereço

- **Fix teclado (commit `7d6060e`)** — editar o endereço de um cliente com **localização salva** descartava as coords (regra PLAN-055 correta), mas **fechava o teclado no celular** (remontagem dos inputs ao invalidar o GPS). Correção: `EnderecoFields`/`blocoComercio` movidos para o **nível de módulo** + `memo` (referência estável → React não remonta os inputs → foco/teclado preservados). Nenhuma regra de negócio alterada.
- **Regressão automatizada** — novo `ClienteForm.test.tsx` (2 testes): editar endereço com localização → coords descartadas + foco mantido. **Prova:** sem o fix, o teste falha em `toHaveFocus()`.
- **CT no UC-080** (`06-CASOS-DE-USO.md`) — conferência "teclado do celular permanece aberto" registrada.
- **Validações manuais em produção (12/08)** — **todas concluídas**: GPS/localização (CT-GEO-01/02) · edição com teclado (UC-080) · PWA ícone/nome/theme (CT-PWA-01) · anexos imagem + PDF (CT-ANX-02) · rota + contadores (CT-ROT-02).
- **Docs alinhados** — `STATUS.md` (pendências de QA zeradas; 80 testes) · `qa/09-CHECKLISTS.md` (seção D atualizada) · `06-PRODUCAO.md` (nota APP_URL duckdns corrigida) · `tasks/2026-08-12/CHECKLIST.md`.
- **Pendências futuras (não executadas)** — Cloudflare SSL Full (strict) · e-mail no staging (mantido `console`) · PLAN-070/069/067/066 · vulns dev-only (`vite`/`vitest`).

## 11/08/2026 — Pipeline CI/CD completo + staging de homologação (CI verde pela 1ª vez)

- **CI verde (16 runs vermelhas → verde)**: causas raiz corrigidas — (1) deps do frontend nunca instaladas (`frontend/` virou **npm workspace**, node_modules unificada com React hoisted — eliminou a dupla cópia que quebrava os testes de UI); (2) smoke com `EADDRINUSE` (duplo-boot) → novo `scripts/create-schema.mjs` (schema sem boot); (3) `JWT_SECRET`/rate limits ausentes no runner → definidos no job (250/250 cenários).
- **Staging de homologação**: `nxgestao.duckdns.org` (ex-transitório de prod) vira QA — `docker-compose.staging.yml` (serviço `staging-app:8081`, volume/DB próprios, rede compartilhada `nxgestao_net`) + `Caddyfile` em 2 blocos + `scripts/deploy-staging.sh` (wait boot → seed 1ª vez → caddy reload → health). Deploy **automático** no merge à main (job no CI, SSH).
- **CD para produção**: `.github/workflows/cd.yml` — dispara por `workflow_run` (CI concluído em main) ou manual (`workflow_dispatch` + input `ref` p/ rollback). Gate de promoção: **prod só passa se staging saudável**. `deploy-prod` usa environment `production` + `scripts/deploy.sh` + health pós-deploy.
- **Hardening**: `permissions: contents: read` · `concurrency` cancel-in-progress · `timeout-minutes` · coverage no CI (artifact) · dependabot (npm + actions) · `react-router` 7.18.2 (fix GHSA-337j/CVE-2025-68470 — runtime prod 0 vulns).
- **Secrets no repo**: `VPS_HOST` · `VPS_USER` · `VPS_SSH_KEY`.
- Docs: `06-PRODUCAO` (§1.1 pipeline) · `TESTES.md` (CI/CD) · `AGENTS.md`.

## 11/08/2026 — Ajuste de Caixa Total em modal + form compartilhado + liberação do sócio

- **`AjusteCaixaForm`** (novo, caixa): formulário reutilizável com **react-hook-form + zod** (padrão do `GastoForm`) — KPIs (Base do Caixa/Saldo Atual), valor com máscara, motivo obrigatório (máx 200, espelha o backend), `useFeedback` + mapeamento de 422.
- **`AjustarCaixaModal`** (novo): `CaixaPage` agora tem **botão "Ajustar Caixa Total" → modal → salvar** (era um bloco inline com inputs crus).
- **`AjusteCaixaCard`** (OperadorDetail): **refatorado** para usar o mesmo `AjusteCaixaForm` — eliminada a duplicação de lógica de ajuste (antes 2 implementações divergentes).
- **Sócio liberado no ajuste**: `canAdjust` inclui `socio` (BR-325: mesmas funções do admin na subárvore) — alinha o front com o backend (`adminMiddleware` + `resolveUsuarioAlvo` já aceitavam). **Docs sincronizadas:** BR-079, `02-API`, `07-CASOS` (API-UC-025 auth + CT 045b). **Smoke:** `SC-006b` (sócio ajusta caixa da subárvore → 201) + `SC-006c` (fora → 404) — validados.
- i18n: `caixa.ajustarTituloModal` + `caixa.motivoMaximo` (pt/en/es).

Referência: `docs/engineering/tasks/2026-08-10/CHECKLIST.md`

## 11/08/2026 — Pendentes do dia: contadores dos filtros corrigidos + performance (índices por userId)

- **Bug dos chips** (`CobrancaListPage`): `countFor` retornava **0** no modo normal de pendentes — os contadores de `situacao` (Todos/Vence hoje/Atrasado) nunca existiam; só `atrasadosCounts` (para `?filter=atrasado`) estava implementado. Criados `situacaoCounts` (clientes distintos por situação, coerente com `clientesParaCobrar`/`AtendidosPage`).
- **Performance (P028)**: o isolamento multi-tenant filtra `userId = ?` em toda consulta, mas nenhuma tabela operacional tinha índice → table scan sistêmico (clientes/contratos/cobranças/caixa/gastos). Adicionados **8 índices** (`CREATE INDEX IF NOT EXISTS`, criam no boot) em `clientes/contratos/parcelas/pagamentos/historico_operacional/gastos/movimentacoes/fechamentos`. Validado em DB isolado.
- **Follow-up registrado** (ROADMAP 5.10 + BACKLOG P028): reescrita da query `listarCobrancasDoDia` (subqueries correlacionadas por linha).

Referência: `docs/engineering/tasks/2026-08-10/CHECKLIST.md` · `docs/plans/BACKLOG.md` (P028) · `docs/product/04-ROADMAP.md` (§5.10)

## 11/08/2026 — Fix anexos: imagem (upload bloqueado pela CSP) + PDF no mobile

- **Imagem não anexava** (computador + celular, todos navegadores): `processarAnexo` gerava um **data URL** (`canvas.toDataURL`) e o upload fazia `fetch(dataUrl)` — **bloqueado pela CSP** (`connectSrc` sem `data:`), então o POST nunca chegava ao servidor. **Fix:** imagem agora é convertida via **`canvas.toBlob`** e o `File` é montado direto do Blob (sem `fetch`). Limite de 1MB mantido via `blob.size`.
- **PDF sem visualização no celular**: navegadores móveis não renderizam PDF em `<iframe>` (limitação do navegador). **Fix:** desktop mantém o modal com `<iframe>`; **mobile** (`pointer: coarse`) mostra **botão "Baixar PDF"** (download via `<a download>` real). **Não** foi reutilizada a abertura em nova guia com blob — precedente `f9a9000`: blob em aba nova **trava o scroll no Chrome**.
- i18n: `anexos.baixarPdf` + `anexos.previewMobile` (pt/en/es).
- Backend intocado (multer/magic bytes/limites) — smoke ANE-089..094 inalterado.

Referência: `docs/engineering/tasks/2026-08-10/CHECKLIST.md`

## 11/08/2026 — Deploy em produção: lote ícone/logo v2 + docs sync + ajuste caixa

- **VPS atualizado** para `79c132b` (`git pull && ./scripts/deploy.sh`): sobe docs sync + ícone v1 (N full-bleed) + maskable + favicon rgb/`.ico` + **ícone v2 (a LOGO sm)** + **service worker PWA** + ajuste de caixa base (layout do fechar caixa) + config sem preview.
- **Pós-deploy validado:** `https://nxgest.com.br/api/health` ok · `favicon.ico`/`favicon.svg`/`icon-192/512`/`maskable`/`apple-touch-icon`/`manifest`/`sw.js` → **200** · SW servindo `CACHE = "nxgest-v2"` · manifest com `id: /`.
- **Pendente (validação manual):** ícone na tela inicial — Android (PWA via manifest) · iOS (apple-touch-icon) · desktop. **Regra:** com HTTPS válido o Android agora instala como PWA e usa o manifest; em dev (cert auto-assinado) esse comportamento nunca valida.

Referência: `docs/engineering/tasks/2026-08-10/CHECKLIST.md` · `docs/STATUS.md`

## 10/08/2026 — SW prod-only + Ajuste de Caixa Base (layout do fechar caixa) + Config limpo

- **Service worker só em produção** (`main.tsx` com `import.meta.env.PROD`): em dev o SW não registra/cacheia — volta a testar limpo no local (cert auto-assinado de qualquer forma não instala PWA). Bump `sw.js` `nxgest-v1` → `nxgest-v2` (invalida cache antigo do browser). Criado `frontend/src/vite-env.d.ts` (types do Vite).
- **`AjusteCaixaCard`** (ajuste de caixa base do operador): mini-KPIs manuais → **`KpiCard`** (Caixa base blue · Saldo atual gray), mesmo padrão visual do `FecharCaixaModal`; valor novo flui via `fetch()` pós-ajuste; removido ternário morto.
- **`PreferenciasModal`**: **`PreviewAoVivo` removido** (era um mock "Fechar caixa"/R$ 4.820,50 que confundia — não faz sentido em Configurações) + chaves `prefs.preview*` removidas de pt-BR/en/es.

Referência: `docs/engineering/tasks/2026-08-10/CHECKLIST.md`

## 10/08/2026 — Ícone/marca NX v2: a LOGO nos ícones + service worker (PWA instalável)

- **Ícones agora usam a variante `sm`** (a **LOGO**: N + malha de nós + hub) em vez do "N" isolado (`mono`) — ocupa ~83% da largura (antes ~54%). Aplicada em `favicon.ts`/`favicon.svg`/`favicon.ico`/PNGs (icon-192/512, maskable, apple-touch).
- **`favicon.ts`**: seletor corrigido (`link[rel="icon"][type="image/svg+xml"]` — antes sobrescrevia o primeiro link, o `.ico`, fazendo o atalho Android cair na "letra inicial") + cores resolvidas para `rgb()` (probe element; `oklch()` quebrava no rasterizador de ícone do Android).
- **Service worker mínimo** (`frontend/public/sw.js` + registro no `main.tsx`): torna o site **PWA instalável no Android** → o atalho usa o manifest (ícone correto de vez). iOS não requer SW (usa `apple-touch-icon`).
- **`favicon.ico`** (256/64/48/32/16) + `manifest.webmanifest` com `"id": "/"`.
- Validado: tsc · build · audits · 78 testes · docs:audit 0 · dev servindo sw/ico/svg/PNGs 200.

Referência: `plans/Lovable-Icone-Marca-NXGest.md` (§ v1.2) · `docs/engineering/tasks/2026-08-10/CHECKLIST.md`

## 10/08/2026 — Ícone/marca NX: identidade nova portada (N limpo + full-bleed)

- **`Logo.tsx`**: geometria nova do protótipo (commit `f5a8156`) — viewBox quadrado `0 0 64 64`, "N" primário centralizado + malha decorativa + hub accent. API `Logo`/`LogoLockup` mantida (consumidores intactos); nova prop `boxed` (fundo `--color-primary` full-bleed + `rx=14`, app icon). Title padrão "NX Gest".
- **`favicon.ts`** (theme-aware) e **`favicon.svg`** (estático): full-bleed **sem `rx`** — resolve os cantos transparentes do favicon (16/32px agora com o "N" legível).
- **PNGs PWA regenerados** (icon-192/512 · maskable com safe-zone · apple-touch 180) via ImageMagick.
- Protótipo usado **só como referência visual**; correção do `admin.index.tsx` do protótipo (`schema.catch`) não se aplica ao AdminPage real.

Referência: `plans/Lovable-Icone-Marca-NXGest.md` · `docs/engineering/tasks/2026-08-10/CHECKLIST.md`

## 10/08/2026 — Sincronização de documentação + organização

**Sem mudança de código** — rodada de organização do acervo de docs (pós-handoff 09/08):

- **Infra paths corrigidos** (realidade confirmada no VPS): `AGENTS.md` · `06-PRODUCAO.md` · `.opencode/agents/{ops-runner,docs-sync}.md` · `ADR-004` · `PLAN-018` · `PLAN-068` → `/opt/nxgestao` · `~/.config/nxgestao/` · volume `nxgestao_nxgestao_data`; ops-runner URL → `nxgest.com.br`.
- **Índices/READMEs sincronizados**: `INDEX.md` (+TESTES/SEGURANCA/07-FORMS/UI-COVERAGE/STATUS) · `product/README` (BR-106, roadmap v2.7, 06/07/08) · `engineering/README` · `ADR-INDEX` + `foundation` (ADR-004/005/006 órfãs) · `tasks/README` (histórico até 10/08) · `templates/README.md` criado.
- **Planos**: `plans/README.md` reestruturado (seção "Backlog e briefings auxiliares"); briefs Lovable históricos marcados (Admin→040, Avatar→041, Anexos→042, Cadastro-Rota→055/056/062, NXGest→superseded, Stitch-Nav→060); **rename `Lovable-Icone-Marca-NXGestao.md` → `NXGest`**; duplicata `PLAN-005-padronização-cliente-card.md` → `plans/arquivo/…-HISTORICO.md`; `BACKLOG.md` sem referência obsoleta.
- **ROADMAP**: 5.5/5.8 → 248 cenários + 78 testes/CI; 5.6 → Concluído (PLAN-055/056); 5.4 PWA parcial; entregas PLAN-066/068/069; marcos M8/M9.
- **Novidades de rotina**: `docs/templates/CHECKLIST.template.md` (estrutura fixa + catálogo de status ✅/🔵/⏳/🚨/❌/🐛/🔁) · **`docs/STATUS.md`** (hub de relance: prod, planos em aberto, pendências, backlog, métricas).

Referência: `docs/engineering/tasks/2026-08-10/CHECKLIST.md` · `docs/STATUS.md`

## 07/08/2026 — Polimento de UI: protótipo aprovado + PLAN-069 pronto

- **Protótipo Lovable aprovado** (commit `42f1adcb`): 100% do briefing entregue (Config com preview ao vivo · Fechar caixa na Central · Ajuste de caixa do operador · Admin com KPIs/filtro/convite). i18n 3/3.
- **PLAN-069-polimento-ui-app.md** → ✅ pronto p/ execução, com seção **"Verificação do protótipo — adaptações e correções"**: dead codes (Skeleton/moeda/etapa erro) + inconsistências (Receber→/caixa, filtro duplicado, Meus dados mock, Desfazer sem ação) + adaptações de stack (sonner→useFeedback, moeda→masks, APIs reais).
- Execução: fora deste chat, seguindo o protótipo como referência.

Referência: `plans/PLAN-069-polimento-ui-app.md` · `plans/Lovable-Polimento-UI-NXGest.md`

## 07/08/2026 — Polimento de UI (handoff Lovable)

- **Briefing:** `plans/Lovable-Polimento-UI-NXGest.md` — estado-alvo app-feel de 4 superfícies: Configurações (preview ao vivo/modo segmentado/paleta com anel/idioma), Fechar caixa na Central (modal com resumo do dia), Ajuste de caixa base do operador (Card + Field/validação inline), Página Admin (hierarquia de KPIs, avatar+badge+status de convite).
- **PLAN-069-polimento-ui-app.md** — port-back do protótipo Lovable aprovado (aguardando protótipo).
- Fluxo: **briefing → Lovable → protótipo aprovado → PLAN-069 executa** (fora deste chat).

Referência: `plans/Lovable-Polimento-UI-NXGest.md` · `plans/PLAN-069-polimento-ui-app.md`

## 07/08/2026 — Migração de URL + e-mail em produção (handoff)

- **PLAN-068-migracao-url-email-producao.md** — app em `https://nxgest.com.br` (oficial) + e-mail transacional em produção (Resend **verified ✅**).
- Inclui: fix do `docker-compose.prod.yml` (passar `APP_URL`/`MAIL_*`), Caddyfile com www→apex + **duckdns transitório**, sequência do `APP_URL`, SSL mode **Full (strict)**, e **coordenação com o PLAN-066** (`CF-Connecting-IP` p/ rate limit com Cloudflare).
- **Ponto de atenção futuro:** caixa corporativa (`rafael@nxgest.com.br`) — hoje MX nulo na raiz; contratar provedor quando quiser.
- Docs atualizados: `06-PRODUCAO.md` (URL/env/e-mail), `AGENTS.md` (URL produção), `.env.production.example` (exemplos p/ `nxgest.com.br`), `PLAN-066` (nota `CF-Connecting-IP`).

Referência: `plans/PLAN-068-migracao-url-email-producao.md` · `engineering/06-PRODUCAO.md`

## 07/08/2026 — Testes: estratégia integrada (handoff)

- **Assessment:** base atual 7 arquivos/40 testes vitest · 2/50 use-cases · 0 UI · smoke 248/248 · sem CI/coverage.
- **Plano:** `PLAN-067-testes.md` — F0 (vitest/jsdom/RTL/coverage/**CI GitHub Actions**) · F1 (use-cases prioritários + shared/segurança: `resolveUsuarioAlvo`, `jwt`, `foto`, middlewares) · F2 (utils/schemas/AuthContext/ThemeProvider/api-client) · F3 (**P022** destravado + RotaPage/PagamentoModal/leads) · F4 coverage 50% gradual · F5 docs.
- `docs/engineering/TESTES.md` — estratégia/rotina/convenções. Backlog P022 saiu de "adiado" (07/08).

Referência: `plans/PLAN-067-testes.md` · `engineering/TESTES.md` · `plans/BACKLOG.md`

## 07/08/2026 — Segurança: assessment + plano de hardening (handoff)

- **Assessment:** `docs/engineering/SEGURANCA.md` — postura de segurança viva (o que já está bom, gaps, processos, responsabilidades).
- **Plano:** `PLAN-066-hardening-seguranca.md` — P0 (trust proxy · helmet/CSP · CORS fail-closed) · P1 (npm audit/drizzle · firewall/fail2ban · rate limit por usuário · backup cripto · timeouts Caddy) · P2 (JWT/revogação · Cloudflare WAF · 2FA · senha 8+) + ~22 CTs novos (T/A/I/D/P).
- Backlog: novo epic P027 (segurança). `plans/README` atualizado.

Referência: `plans/PLAN-066-hardening-seguranca.md` · `engineering/SEGURANCA.md` · `plans/BACKLOG.md`

## 07/08/2026 — PLAN-064: onboarding comercial — Leads (público + painel super)

**Implementado (backend + frontend)**
- **Tabela `leads`** (domínio comercial isolado do operacional): nomeResponsavel · empresa · email **unique** (dedup) · telefone? · origem (default `Site`) · status `NOVO→EMAIL_CONFIRMADO→EM_ONBOARDING→CONVERTIDO/DESCARTADO` + auditoria de conversão/descarte.
- **Público (sem auth):** `POST /api/leads` (rate limit, zod) — **não cria empresa/usuário**; dedup por e-mail (`200 jaExistia`) e e-mail já usuário (`409 LEAD_EMAIL_JA_USUARIO`) · `POST /api/leads/confirmar` (token `lead` 24h, **single-use**) · `POST /api/leads/reconfirmar` (resposta genérica).
- **Super admin (auth + guard):** `GET /api/admin/leads?status=` · `POST .../:id/onboarding` · `POST .../:id/converter` (reusa `createEmpresa` + **convite** ao admin + auditoria quem/quando) · `POST .../:id/descartar` (motivo obrigatório + **LGPD**: dados anonimizados).
- **Frontend:** `QueroConhecerPage` (`/quero-conhecer`) + `ConfirmarLeadPage` (`/quero-conhecer/confirmar`) públicas · `LeadsAdminPage` (`/admin/leads`, `SuperAdminRoute`, filtro por status, ações gated) · nav do super (sidebar + UserMenu) ganhou "Leads" · i18n pt/en/es (`lead.*`).
- **QA:** smoke 235 → **248/248** (LD-01..13, LD-15) · vitest · tsc · build · audits · docs:audit (62 rotas = 62 telas).

Referência: [PLAN-064](plans/PLAN-064-onboarding-comercial-leads.md) · `05-MAPEAMENTO-TELAS.md` (§11d/11e/14b) · `02-API` · `07-CASOS-DE-USO-API`

## 07/08/2026 — PLAN-065 frontend (Checkpoint 2): telas de conta + convite no admin

**Implementado (frontend — fecha o PLAN-065)**
- **Páginas públicas** (fora do `ProtectedRoute`, shell `PublicPageShell` no estilo do Login): `/recuperar-senha` (resposta genérica + `SuccessState`) · `/resetar-senha?token=` · `/ativar?token=` (senha + confirmação mín. 6; `TOKEN_EXPIRED`/`TOKEN_INVALID` → erro + ação de refazer/reenviar).
- **Login:** link **"Esqueci minha senha"** → `/recuperar-senha`; erro agora vem do `ApiError.message` (traduzido — ex.: `ACCOUNT_PENDING` do convidado).
- **Admin:** `OperadorForm` senha **opcional** (sem senha = convite por e-mail) · `OperadoresList` badge **"Convite pendente"** + ação **reenviar convite** (`PATCH /admin/operadores/:id/reenviar-convite`) · `AdminPage` sem o guard de senha vazia.
- **Super:** `EmpresaForm` `adminSenha` **opcional** (convite pro admin) + hint.
- **Tipos:** `status` (`convidado`/`ativo`) em `MeResponse`/`LoginResponse`/`AuthUser`; serviços `ativarConta`/`esquecerSenha`/`redefinirSenha`/`reenviarConvite`.
- **i18n** pt/en/es: `errors.ACCOUNT_PENDING`/`TOKEN_INVALID` + chaves `auth.*` (recuperar/resetar/ativar/convite).

**QA:** tsc · build · audit:ui/styles/modules · vitest 36 · docs:audit (22 telas mapeadas).

Referência: [PLAN-065](plans/PLAN-065-fluxo-de-conta.md) · `05-MAPEAMENTO-TELAS.md` (§11a–11c) · `UI-COVERAGE.md` (20–22)

## 07/08/2026 — PLAN-065 backend: fluxo de conta (convite/ativação + forgot/reset + Resend)

**Implementado (backend — Checkpoint 1)**
- **Infra e-mail:** `mailer.port` + impl (Resend via REST + **console em dev**) + templates pt/en/es (convite/reset/lead) + env `MAIL_*`/`RESEND_API_KEY`/`APP_URL`.
- **Migração:** `usuarios.senhaHash` → **nullable** (convidado sem senha) — `usuarios_new` corrigido (senhaHash TEXT sem NOT NULL; dados preservados, `migracao:test` ✅) · tabela **`auth_tokens`** (hash SHA-256, single-use, expiração por tipo, reenvio invalida anterior).
- **Convite/ativação:** `POST /admin/operadores` senha **opcional** → convidado + convite · `reenviar-convite` · `POST /auth/ativar` · login de convidado → **403 ACCOUNT_PENDING** · `/me` devolve `status` · `createEmpresa` adminSenha opcional → convite.
- **Esqueci a senha:** `POST /auth/forgot` (resposta genérica, rate limit e-mail+IP) · `POST /auth/reset`.
- **Segurança:** `OperadorRow` ganhou `status` e **parou de vazar `senhaHash`** (fix de leak pré-existente no `findById`).

**QA:** smoke 213 → **235/235** (AC-13..20 · ES-02..11 · SE-01/04 · SM-1/2) · vitest 36 · build · audits · docs:audit · migracao:test.

Referência: [PLAN-065](plans/PLAN-065-fluxo-de-conta.md) · frontend implementado (seção acima)

## 07/08/2026 — Planos de conta e aquisição (handoff)

- **PLAN-065-fluxo-de-conta.md** — fluxo de conta (P020): convite/ativação + esqueci a senha + infra de e-mail (**Resend**, `no-reply@nxgest.com.br`). Pré-requisito de produção: domínio `nxgest.com.br` + DNS (SPF/DKIM/DMARC); dev sem bloqueio (modo console).
- **PLAN-064-onboarding-comercial-leads.md** — aquisição de empresas (P026): `/quero-conhecer` (lead + confirmação de e-mail) + painel `/admin/leads` (onboarding, converter — reusa `createEmpresa` + convite, descartar). Empresa nunca nasce automática; separação comercial × operacional.
- Backlog/roadmap atualizados (P020 → PLAN-065 · P026 → PLAN-064).

Referência: `plans/PLAN-065-fluxo-de-conta.md` · `plans/PLAN-064-onboarding-comercial-leads.md` · `plans/BACKLOG.md`

## 07/08/2026 — PLAN-062: Rota do dia (Lovable) — progresso, card de ações, modais 3→2, FAB

**Implementado (Rota `/rota`)**
- **`RouteProgress`** novo layout: "Progresso" + % (tabular) + `role="progressbar"` (aria) + grid 4 (Pagos · Promessas · Visitados · Pendentes).
- **Contador "Parada X de Y"** acima do carrossel (quando há pendentes).
- **Card de ações:** 4 ícones (Navegar/WhatsApp/Ligar/Abrir contrato — gating de capacidade preservado) · **"Registrar pagamento"** success block com spinner "Processando…" · 3 outline (Promessa · Visitado · Não encontrado) em `grid-cols-3`; barra de progresso do topo do card removida.
- **Modais 3 → 2:** `PagamentoModal.sucessoContent` mantém o modal aberto no passo **comprovante** (canvas + Compartilhar + WhatsApp com gating `pagamento:comprovante_whatsapp` + Fechar); refetch no fechar. 3º modal de comprovante removido.
- **Extras:** alça no `Modal` (bottom-sheet mobile) · `<html lang>` dinâmico · **FAB** (`FabContext`+slot no `AppLayout`) em ClienteList ("Novo cliente") e ContratoList ("Novo contrato").

**QA:** build · vitest 36 · audit:ui/styles/modules · docs:audit · regressão `ROTA-REGRESSAO-CT.md` em DEV (Grupos A–G).

Referência: [PLAN-062](plans/PLAN-062-rota-dia-lovable.md) · `tasks/2026-08-07/ROTA-REGRESSAO-CT.md`

## 07/08/2026 — P13 (contexto do operador): lista de clientes com `?usuarioId=` (PLAN-063)

**Implementado (fecha P13)**
- **Backend:** `GET /api/clientes` (lista) usa `resolveUsuarioAlvo` → admin/socio/super resolvem o operador-alvo via `?usuarioId=` (+ `?empresaId=` p/ super); operator vê os próprios (ignora override). Sócio fora da subárvore → **404**.
- **Frontend:** `listClientes` aceita `usuarioId` · `OperadorDetail` ganha seção **"Clientes do operador"** · `ClienteDetail` com `?usuarioId=` (voltar → `/admin/operadores/:id`, links de contrato preservam o contexto). **Decisão:** no drill-down, o gating de capacidades usa as capacidades do admin (quem está operando).
- **Smoke `P13-1..5`** (admin · sócio fora da subárvore 404 · operator ignora override · admin self · super com `?empresaId=`).

**QA:** smoke 208 → **213/213** · build · vitest 36 · audits · docs:audit.

Referência: [PLAN-063](plans/PLAN-063-contexto-operador-clientes.md) · `07-CASOS-DE-USO-API.md` (P13-CT-1..5)

## 07/08/2026 — Persistência de desativar/ativar módulos e recursos (full cycle)

**Corrigido (fluxo de ativar/desativar)**
- **A — Modais empilhados:** ao abrir o `ImpactConfirmModal`, o `ModulosModal` agora **fecha** (um modal por vez). O `impactoState` carrega `empresaId` (o force não depende mais do modal de trás).
- **B — Erro no force:** `handleConfirmImpacto` **limpa os modais** no erro (o toast explica, ex.: caixa nunca força).
- **C — Ligar módulo completa dependências:** `alternar(id,true)` usa `completarDependencias` (extraído p/ `shared/modules/modules.ts`, com bug do grafo corrigido — não puxa mais clientes/contratos/cobrancas sem necessidade).
- **D — Capacidades com dono off:** `CapacidadesModal.save()` filtra via `capacidadesAplicaveis` (o backend rejeitava 422).

**CTs de persistência (smoke `PERS-1..5`):** force desativa `clientes` → `GET/:id`+`/me`+403 · reativa → 200 · `cliente:anexos` off → 403 · reativa → 200 · idempotência real.

**QA:** vitest 29 → **36** · smoke 203 → **208/208** · build · audits · docs:audit.

Referência: PLAN-061 · `07-CASOS-DE-USO-API.md` (PERS-CT-1..5)

## 07/08/2026 — Planejamento de execução (handoff) + P13/P16 fechados

**Backlog organizado (linha cronológica)**
- **P16 — Endereços ✅** (PLAN-055/056): GPS nos 2 endereços + editar descarta coords + navegação única (decisão). Sem código novo.
- **P13 — Contexto do Operador ✅** (fecha gap): plano `PLAN-063-contexto-operador-clientes.md` — lista de clientes do operador via `resolveUsuarioAlvo` no `GET /api/clientes` + seção no `OperadorDetail` + `ClienteDetail` com `?usuarioId=`.
- **P20 — Fluxo de conta** re-escopado (convite por e-mail + esqueci a senha + infra de e-mail) — aguardando decisões de produto.
- **PLAN-062-rota-dia-lovable.md** — plano completo da Rota (progresso Lovable, card de ações, "Parada X de Y", modais 3→2, FAB) + suíte de regressão `tasks/2026-08-07/ROTA-REGRESSAO-CT.md`.

Referência: `plans/PLAN-062-rota-dia-lovable.md` · `plans/PLAN-063-contexto-operador-clientes.md` · `plans/BACKLOG.md`

## 06/08/2026 — PLAN-061: card da empresa, suspensão por `ativa` e rebaixamento com reassign

**Adicionado / Corrigido**
- **Card da empresa:** botão **"Recursos"** (abre `CapacidadesModal` direto) + **badge de estado das capacidades** + botão **"Editar"** (modal reusando `EmpresaForm` — nome, fantasia, documento, situação). **Confirm na suspensão** (ativa→inativa mostra nº de usuários afetados).
- **Suspensão (BR-106):** `empresa.ativa=false` agora **bloqueia acesso** — **403 `EMPRESA_INATIVA`** no login, `/me` e em toda rota autenticada (`authMiddleware`). Super admin intacto. Frontend **desloga** na suspensão. Auditoria `tipo:"empresa"`.
- **Rebaixamento:** o erro de chefe órfão ganhou **`OPERATOR_HAS_SUBORDINATES` + contagem** (antes era "Dados inválidos." genérico) e **reassign atômico** — campo `reatribuirParaChefeId` no `PATCH /admin/operadores/:id` move os subordinados no mesmo ato + UI guiada (`ReassignModal`).
- **Fixes:** `SuperAdminRoute` (só super acessa `/admin/empresas*`) · `maxLength={200}` no motivo · auditoria idempotente (sem mudança = sem registro) · `apiRequest` interpola `{{n}}` nas mensagens de erro.

**QA:** smoke **189 → 203/203** (SUSP-1..4 · SUP-1..6 matriz super · ORF-1..3 variações de órfão · REAS-1/POS-1 reassign · IMP-003/004 · MOD-G-14 · TR-123/127 atualizados) · build · audits · vitest 29 · docs:audit.

Referência: [PLAN-061](plans/PLAN-061-empresa-card-suspensao-rebaixamento.md) · BR-106

## 06/08/2026 — Navegação app-first (Stitch): BottomTabBar + UserMenu, fim do drawer/Topbar

**Adicionado / Reorganizado**
- **Mobile:** `BottomTabBar` fixa (Central + abas operacionais gated por módulo — Clientes · Contratos · Caixa · Rota) + **topo fino** (marca → `/` + `UserMenu`). O hamburger/drawer **foram removidos**.
- **`UserMenu`** (avatar → Perfil · Configurações · Sair): as **configurações** (tema/cores/idioma) saíram da engrenagem solta e agora abrem pelo menu do usuário (mesmo `PreferenciasModal`). Mobile = bottom-sheet, desktop = popover no rodapé da sidebar.
- **Desktop:** sidebar intacta (rodapé com `UserMenu` detalhado), **sem header superior duplicado**; sidebar ganhou **Rota** (gated por módulo).
- **`Topbar.tsx` removido** · utilitário `.pb-safe` (`index.css`, safe-area do iPhone).
- **Fix:** link morto "Marca → Kit de identidade → `/design`" removido (não havia rota).

**QA:** `tsc` + `build` + Vite ao vivo (módulos novos transformam sem erro) · audit:ui/styles · docs:audit.

Referência: [PLAN-060](plans/PLAN-060-Stitch-Nav-AppFirst-NXGest.md) · briefing `plans/Stitch-Nav-AppFirst-NXGest.md`

## 06/08/2026 — Modularização fina: capacidades (BR-104) + guard de desativação (BR-105)

**Adicionado — Capacidades (recursos finos por empresa)**
- `PATCH /api/admin/empresas/:id/capacidades` (só super admin): ativa/desativa recursos individuais de um módulo — `cliente:whatsapp/ligar/navegar/anexos`, `rota:whatsapp/ligar/navegar`, `pagamento:comprovante_whatsapp`. `null` = todas ativas; `[]` = nenhuma; dono off ⇒ inativa. `login`/`me` devolvem `capacidades`.
- `CapacidadesModal` (via ModulosModal → "Recursos") + gating `hasCapability` nas telas (ClienteDetail, Rota, ContratoDetail, Anexos). Enforcement real em `cliente:anexos` (403 `CAPABILITY_DISABLED`).
- `audit:modules` valida o capability manifest (espelho backend↔frontend + dono válido).

**Corrigido — Guard de desativação (o "nada ocorre" virou proteção)**
- `PATCH /modulos` agora **calcula o impacto** e bloqueia com **409 `MODULE_HAS_ACTIVE_DATA`** quando há dado financeiro em aberto (parcelas, pendências, caixa). **Caixa aberto nunca é forcável**; `force:true` + **motivo obrigatório (≤200)** só super admin sobrepõe os demais.
- `GET /admin/empresas/:id/impacto?modulos=<JSON>` = prévia sem persistir (usada pela UI).
- **Auditoria:** toda mudança de módulos/capacidades em `auditoria_modulos` (quem, antes/depois, force, motivo).

**Arquitetura (PLAN-059)**
- Presentation parou de tocar `infrastructure`: orquestração movida para use-cases (`AtualizarModulos`, `AtualizarCapacidades`, `CalcularImpacto`) com ports (`IImpactoDesativacaoQuery`, `IAuditoriaModulosWriter`) e errors de domínio (409/422) — `00-ARCHITECTURE.md` respeitado.

**QA:** smoke **156 → 184/184** (CAP-100..110 · MOD-G-1..13 · IMP-001/002) · vitest 29 · `migracao:test` (ALTER em banco legado) · gates verdes (build · audit:ui/styles/modules · docs:audit).

Referência: [PLAN-059](plans/PLAN-059-modularizacao-fina-capacidades-guard.md) · BR-104/105

## 07/08/2026 — Fix: menu do usuário coberto pela tab bar (Sair inacessível no mobile)

**Corrigido**
- **Causa:** header mobile `sticky top-0 z-40` criava *stacking context*; o bottom-sheet do `UserMenu` e o `PreferenciasModal` ficavam presos nele e a tab bar (`z-40` raiz) cobria a base — o **Sair** não era clicável.
- **Correção:** `Modal` compartilhado agora renderiza via **portal no `document.body`** (escapa de qualquer stacking context; transparente pros 20 consumidores) e o bottom-sheet do `UserMenu` também — acima da tab bar. Popover desktop mantido in-place.
- Gate: `build` · `audit:ui/styles/modules` · `test` 29/29 · `tsc`.

## 07/08/2026 — Navegação "app-first": bottom tab bar + menu do usuário (Stitch-Nav-AppFirst)

**Redesenhado (identidade intacta — tokens/cores/fontes)**
- **Mobile:** hamburger/drawer substituídos por **bottom tab bar** com 5 abas (Central · Clientes · Contratos · Caixa · Rota), gated por módulo (whitelabel), aba ativa por prefixo, `safe-area`; **topo fino** com marca + avatar.
- **Desktop:** sidebar `w-64` sem o header superior duplicado; rodapé da sidebar agora tem o **menu do usuário** (avatar).
- **Configurações** saíram da engrenagem solta e entram no **menu do usuário** (Perfil · Configurações · Sair; admin/super no mobile) — mesmo `PreferenciasModal` (Modo/Cor/Idioma).
- **Rota** entrou na navegação principal (tab bar mobile + sidebar desktop) — a ação diária do operador não fica mais escondida.
- Removido `Topbar.tsx`; adicionados `BottomTabBar.tsx` e `UserMenu.tsx`.

Referência: [Stitch-Nav-AppFirst-NXGest](plans/Stitch-Nav-AppFirst-NXGest.md) · `AppLayout.tsx` · `BottomTabBar.tsx` · `UserMenu.tsx`

## 06/08/2026 — P11: empresa aceita CPF ou CNPJ · P10: viewer de anexos in-app + modal iOS

**Corrigido**
- **P10a — Anexos abrindo em nova guia bugavam no Chrome:** o viewer nativo do Chromium com `blob:` em aba prende o scroll (topo some). "Abrir" agora abre um **viewer in-app** (`Modal`): imagem via `<img>`, PDF via `<iframe>` — scroll controlado por nós, funciona em qualquer browser (Chrome, Safari, Android) e o Blob URL é **revogado no fechamento** (fim do risco dos 60s).
- **P10b — Modal com topo oculto no iOS:** `max-h-[90vh]` → **`max-h-[90dvh]`** (viewport dinâmica, se adapta à toolbar) + `min-h-0`/`overscroll-contain` no corpo — scroll interno do modal correto no iOS.

**Adicionado (P11)**
- Empresa cadastra com **CPF ou CNPJ** (auto-máscara `maskCpfCnpj`): novo validador `src/shared/validators/cnpj.ts`, `validarDocumento` no controller (create/update) — documento validado com check-digit (11/14), armazenado em dígitos, inválido → **422**; campo continua **opcional**. Card da empresa formata o documento.

**QA:** smoke **156/156** (EMP-073 com CNPJ válido · EMP-096/097/098 CPF/CNPJ/inválido) · gates verdes.

## 06/08/2026 — Favicon theme-aware + fix do token `primary-foreground`

**Corrigido (gap do PLAN-056)**
- `text-primary-foreground` (usado no `Button` variante `primary`) era uma classe **inexistente**: `--color-primary-foreground` não estava no CSS nem no tailwind (só `success`/`danger` tinham `foreground`). O texto do botão primary herdava a cor do contexto → contraste ruim em light/dark. Criado `--color-primary-foreground: var(--primary-foreground)` + `foreground` no `primary` do tailwind.

**Adicionado**
- **Favicon theme-aware:** novo `shared/theme/favicon.ts` (`atualizarFavicon`) re-renderiza a marca Nexus no ícone do site com as cores **efetivas** do tema (`--color-primary` fundo · `--color-primary-foreground` traço/nós · `--color-accent` nós quentes) via data URL — reage a dark/light, 5 paletas e whitelabel. Pluga no `ThemeProvider` (efeito do `applyTheme`). Fallback: `favicon.svg` estático até o JS rodar. Sem CSP no app, data URL não é bloqueado.
- Removido `logo-nexus.svg` (órfão — não referenciado; o Logo é componente TSX).

Referência: [PLAN-058](plans/PLAN-058-foto-qualidade-lightbox.md) · `Button.tsx` · `ThemeProvider.tsx`

## 06/08/2026 — PLAN-058: foto com qualidade (640px) + lightbox + segurança do upload

**Adicionado / Melhorado**
- **Resolução:** `processarImagem` 200px → **640px (JPEG q0.8)** — foto de avatar passa de ~20KB para ~80-150KB, nítida em qualquer superfície e com resolução real pra ampliar.
- **Lightbox:** `Avatar` ganha prop `ampliar` (com foto → clica e abre `Modal` com a imagem `max-h-[75vh]`). Ativo em `ClienteCard` (lista + detalhe), `OperadorDetail`, `AppLayout` (sidebar) e `AvatarField` (Perfil/Forms).
- **Segurança by-design do upload:** novo `src/shared/utils/foto.ts` (`validarFoto`) — **allowlist de MIME** (`jpeg/png/webp/gif`, **`svg` excluído** — vetor de XSS armazenado), **magic bytes** do base64 (impede conteúdo mascarado) e teto **≤1MB decodificados**. Aplicado em **4 pontos** (create/update cliente, `PATCH /auth/foto`, `PATCH /admin/operadores/:id`) — uma fonte, coerência.
- **Docs:** `PLAN-058` · `02-API` (caps/MIME) · `BR-101` · `UI-COVERAGE` (corrige `⏳` stale de Avatar/Anexos + registra lightbox e `AnexosSection`).

**QA:** smoke com CTs de foto — clientes CLI-E6..E9 (grande válida 200 · svg 422 · mascarada 422 · >1MB 422) · auth FOT-004..007 (mesmos cenários + FOTO_LIMITE/FOTO_TIPO). Gates verdes.

Referência: [PLAN-058](plans/PLAN-058-foto-qualidade-lightbox.md)

## 06/08/2026 — P7: GPS na edição do cliente · P8: "dados inválidos" ao editar cliente

**Corrigido**
- **P7 — GPS sempre "não capturada" na edição:** o `useEffect` de edição do `ClienteForm` carregava as coords salvas no form, mas **não sincronizava** o estado do `GpsControl` (controlado) — os blocos de localização ficavam sempre `vazio`. Novo helper puro `estadoGpsInicial(localizacao)` (com coords → `capturada`; sem → `vazio`) sincronizado no reset de edição + **vitest** em `geo/estadoGps.test.ts`.
- **P8 — "Dados inválidos" ao editar cliente sem foto:** o form envia `foto: null` (limpar) no edit, mas o schema `updateClienteSchema` (`z.string().max(50000).optional()`) **rejeitava `null`** → 422. Agora `foto` é `optional().nullable()` e ainda **valida `data:image/...`** (paridade com `/auth/foto`, coerência create × update). Entity `Cliente.foto` tipada `string | null`.

**QA:** smoke com CTs de edição de cliente — CLI-E0..E5 (edição sem foto/GPS → 200, foto salva/refletida/removida, endereço+coords, foto não-dataURL → 422) + vitest do P7. Gates verdes.

## 06/08/2026 — WS7: transições de papel blindadas + fixes de UI (date, dropdown, labels)

**Corrigido (segurança/consistência)**
- **Sócio promovendo via `PATCH`:** o `create` já bloqueava (403) sócio criando admin/sócio, mas o `update` não — um sócio podia promover operadores da subárvore a `admin`/`socio` pela API. Guard espelhado no `update` (`role` ≠ `operator` → 403).
- **Chefe órfão no rebaixamento:** rebaixar `admin→operator`/`sócio→operator` (ou `admin→sócio` com subordinado sócio) deixava subordinados com chefe inválido (`validarChefe` proíbe). Agora **bloqueado (422)** com contagem de subordinados ativos dentro da mesma transação (`NaoPodeRebaixarComSubordinadosError`).
- **Higiene de chefe:** ao virar `admin`, `chefeId` é zerado (admin não tem chefe).

**UI (pontos de verificação)**
- **P4 — date fields:** `input[type="date"]` normalizado com `appearance: none` + `min-width: 0` (ContratoForm/GastoForm/Rota) — o campo respeita `width: 100%` e não estoura para a direita; ícone de calendário restaurado via `::-webkit-calendar-picker-indicator`.
- **P5 — dropdown ClienteSelect:** posicionamento `absolute` era **cortado pelo `overflow-hidden` do `Card`** (novo contrato); agora `position: fixed` calculado do trigger (escapa do clip) + fecha em scroll/resize.
- **P6 — labels de contrato:** "Quantidade de Parcelas"/"Number of Installments" quebravam o label no grid 2 col em pt/en (es curto alinhava). Labels encurtados: pt "Parcelas" · en "Installments" · es "Cuotas".

**QA:** smoke ~**140** (CTs de transição 120-131 + regressões) · gates verdes (build, audits, docs, vitest).

Referência: [07-CASOS-DE-USO-API](product/07-CASOS-DE-USO-API.md) (matriz de transições) · BR-103

## 06/08/2026 — Roles (sócio) + foto do usuário + Anexos + Empresa + ContratoForm/Rota

Lote de fechamento de material pendente (identidade "Nexus" + PLAN-041/042 + Lovable):

**Corrigido**
- **Rótulo de papel incompleto:** operador promovido a **sócio** continuava com a tag "Operador" em `OperadorDetail`, `PerfilPage`, `ContribuicaoModal`, `EquipeModal` (sócios fora dos modais) e `AdminPage` (badge "Super Admin" para sócio). Consolidado num helper único `shared/utils/role.ts`; `EquipeModal` aceita `socio`; novo KPI **Sócios** (`totalSocios` no dashboard).
- **Sessão stale pós-promoção:** o middleware usava a claim de `role` do JWT (7 dias); agora resolve `role`/`empresaId` do **banco** a cada request — corrige 403 pós-promoção e acesso indevido pós-rebaixamento sem relogin.

**Adicionado / Melhorado**
- **Foto do usuário/operador (PLAN-041 completo):** `PATCH /api/auth/foto` (self) + `foto` em `login`/`me`/`operadores` + `PATCH /admin/operadores/:id` aceita `foto`; PerfilPage (AvatarField), OperadorForm, Avatares em OperadoresList/EquipeModal/ContribuicaoModal/OperadorDetail/sidebar. BR-101.
- **Anexos do cliente (PLAN-042):** tabela `anexos`, 4 endpoints escopados (`POST/GET/file/DELETE /api/clientes/:id/anexos*`), `multer` (guarda 5MB → 413), validação de **MIME real** (magic bytes) + limites (imagem ≤1MB · PDF ≤5MB), storage `UPLOADS_DIR` (Docker `/data/uploads` · dev `./uploads`), `AnexosSection` na ficha do cliente. **Backup inclui `/data/uploads`** (06-PRODUCAO). BR-102.
- **Empresa (super admin, Lovable):** `EmpresaCard` no padrão (tone ativa/inativa, Avatar, documento, contagem de operadores, badges de módulos, botão "Módulos (X/Y)") + `EmpresaForm` com Nome fantasia/CNPJ/Situação — todos **opcionais** (não impedem cadastro). `PATCH /api/admin/empresas/:id`.
- **ContratoForm compartilhado:** seletor de cliente buscável (`ClienteSelect` wireado), Cards Condições/Resumo vivo, edit bloqueado com parcela paga — fim do combobox artesanal.
- **Rota no padrão:** GPS como `StatusBadge`, sem botão X redundante, comprovante via `Modal` base, promessa com `Field`, `RouteProgress` em `Card`, estados via `EstadoTela`.
- **Anti-drift:** `audit-docs` passa a varrer **sub-routers** montados via `router.use` (anexos) — sem rota invisível à auditoria.

**QA:** smoke **128/128** (FOT-001..004, ANE-089..093, EMP-095/095b, etc.) · gates verdes (build, audits, docs, vitest).

Referência: [PLAN-041](plans/PLAN-041-avatar-foto.md) · [PLAN-042](plans/PLAN-042-anexos-cliente.md)

## 06/08/2026 — PLAN-047 · Identidade visual "Nexus" — card de cobrança + componentes + anti-drift (consolidado)

> **Plano único** — absorve os antigos **PLAN-048..054** (arquivos removidos; histórico mapeado a commits no plano). Escopo completo e rastreabilidade em [PLAN-047](plans/PLAN-047-card-cobranca-dia-lovable-badges-modais.md).

**Adicionado / Melhorado**
- **Card de cobrança do dia** (Central, `/cobrancas`, `/atendidos` e Rota): display no padrão Lovable (tone bar, `StatusBadge`, `value-lg`), **sem avatar**, ações só na Rota. `diasEmAtraso` no backend (`CobrancaItem`, subquery `julianday`) + **CT OPS-018** no smoke.
- **Evolução do card (iterações):** fix da parcela (`proximoNumeroParcela` — antes mostrava saldo em R$ → "Parcela 30 de 20"), **altura uniforme** (4 linhas fixas), bairro/parcela em linhas próprias, linhas full-width (fim do truncamento no carousel/mobile) e "N dias de atraso" **alinhado ao fim do valor** (antes do ">").
- **Componentes compartilhados:** `Modal` com assinatura Lovable (`title`/`descricao`/`footer`) + **bottom-sheet mobile** (sweep dos 14 consumidores) · `FieldSelect`/`FieldTextarea` (migrados 3 `<select>`) · `Tabs` · `EstadoTela` unificado · `PageHeader`/`SectionHeader` (icon `size-11 rounded-xl`, título 28px/22px) · `StatusBadge` com **dot** · `Switch` canônico · `ParcelaList` com badges.
- **Admin:** `ModulosModal` v2 (descrição por módulo, Central sempre ativa, auto-completar deps, cascata-off) · `OperadorDetail` com `ContratoCard list-item`.
- **Anti-drift:** `npm run audit:ui` estendido (select/textarea cru, header inline de modal, `role="tab"` fora do Tabs, `<Modal>` sem `title`) — gate no deploy.
- **Docs:** `04-UI-COMPONENTS` v1.7 · `06-PRODUCAO` (gates) · `Lovable-NXGest` superseded · `UI-COVERAGE` · índice de planos.

**Por quê:** fechar a identidade "Nexus" ponta a ponta (referência `site-personality-plus`), padronizar componentes e travar o padrão contra regressão — em um único plano rastreável.

Referência: [PLAN-047](plans/PLAN-047-card-cobranca-dia-lovable-badges-modais.md)

## 05/08/2026 — PLAN-046 · Fix do switch de módulos + engrenagem de configurações + coerência do grafo

**Corrigido**
- **Switch de ativar/desativar módulos:** a bolinha branca "saía" do pill (`rounded-full`) por falta de `overflow-hidden`/`left-0` — corrigido (`ModulosModal`).
- **Coerência do grafo refinado (PLAN-045):** CT-118 corrigido (`rota ⇒ cobrancas, contratos, clientes`) · CT-119 novo (`atendidos ⇒ cobrancas`) · UC-055 atualizado · **smoke MOD-100/101** (422 das novas deps).

**Melhorado**
- **Engrenagem única no topo** (`Topbar`): tema (clica e alterna claro/escuro), cores (5 paletas) e idioma (PT/EN/ES) num só dropdown — com o **idioma selecionado visível** no trigger (no lugar do nome do tema). Consistência visual (`rounded-xl` + tokens).

Referência: [PLAN-046](plans/PLAN-046-fix-switch-modulos-engrenagem-coerencia-grafo.md)

## 05/08/2026 — PLAN-045 · Modularização para o whitelabel real (Module Manifest + Central composável)

**Adicionado**
- **Module Manifest** (`src/modules/admin/domain/modules.ts`): cada módulo declara `labelKey, surfaces, dados, widgets, capacidades, dependsOn, ucs`; `ALL_MODULES`/`DEFAULT_MODULOS`/dependências **derivados** dele. Espelho frontend com `MODULE_WIDGETS` + `isWidgetActive` + ícones.
- **Grafo refinado:** `rota ⇒ cobrancas` e `atendidos ⇒ cobrancas` (agregadores da fila de cobrança); `pagamentos` = capacidade de `contratos`; `caixa` com 2 formas (isolada × integrada).
- **Central composável:** o dashboard renderiza os **widgets dos módulos ativos** (KPIs, ações rápidas, pendentes, atendidos) — fim do gating manual por `hasModule`. **Fix do dead-end:** "Ver resumo → /atendidos" só aparece com `atendidos` ativo.
- **`npm run audit:modules`** — valida o manifest (IDs, deps espelhadas, grafo sem ciclo, widget com 1 dono) — **gate no deploy**.
- **`docs/product/08-UC-MODULOS.md`** — matriz UC/CT × módulo (validação on/off) · **ADR-006** (manifest) · template de novo módulo (UI-COVERAGE).
- BR-092/093 atualizadas (grafo + Central composável).

**Por quê:** o whitelabel real (novos negócios plugáveis) precisa de uma **fonte única** do que cada módulo é/expõe. Novo módulo = entrada no manifest + superfícies + widgets + UCs — sem rework.

Referência: [PLAN-045](plans/PLAN-045-modularizacao-whitelabel.md) · [ADR-006](foundation/ADR-006-Module-Manifest.md) · [08-UC-MODULOS](product/08-UC-MODULOS.md)

## 05/08/2026 — PLAN-044 · Governança de UI / Anti-drift

**Adicionado**
- **`npm run audit:ui`** (novo script): falha se padrão legado do pré-"Nexus" voltar (`rounded-md` em módulos, `bg-secondary-light`, `border-l-*`, `variant="onDark"`, `RotaCobrancaSection`, `bg-gradient-accent` fora do Button, grid fixo). **Gate no deploy** (impede subir legado).
- **`UI-COVERAGE.md`** — inventário canônico (19 telas × shell+superfícies; componentes+consumidores; padrões→canônico; legado rastreado).
- **`scripts/consumers.mjs`** + protocolo: **componente compartilhado mudou → varre consumidores no mesmo PR**.
- **Checklist para Novas Telas corrigida** — antes ensinava `rounded-md` (padrão antigo); agora `Field`/canônico + rows/badges/skeletons/modais + gate `audit:ui`.
- **ADR-005** "Por que o redesign deixou débito" (5 raízes + guardrails).
- **Correções:** RotaPage modal comprovante (`rounded-xl bg-card`) · UC-074 (banner → PageHeader) · `04-UI-COMPONENTS` (canônicos) · `AGENTS.md` (audit:ui + protocolo).

**Por quê:** o redesign deixou débito invisível por falta de inventário, auditoria só de cor, checklist stale e sem protocolo de shared-component. Com guardrails mecânicas, o whitelabel granular não acumula drift.

Referência: [PLAN-044](plans/PLAN-044-governanca-ui-anti-drift.md) · [ADR-005](foundation/ADR-005-UI-Governance.md)

## 05/08/2026 — PLAN-043 · Polimento final da identidade "Nexus"

**Concluído**
- **Superfícies ANTIGO → padrão canônico:** `GastoForm`/`GastoList` (fluxo de gastos), `SearchBar`, `SuccessState`, `ErrorBanner`.
- **Inputs → `Field`/canônico + botões → `Button`:** Perfil, Login (com mostrar/ocultar senha), Caixa (ajuste), OperadorDetail, ContratoDetail (estorno), Rota (data promessa), PagamentoModal, "usar local atual".
- **Rows/listas → `Card`/`rounded-xl bg-card`:** Caixa (histórico de ajustes + movimentações), EquipeModal, ContribuicaoModal, AtendidosPage, ContratoDetail (pagamentos), **CobrancaCard detail (Rota do dia)** — saiu o `border-l-4`.
- **Skeletons** `bg-secondary-light` → `bg-surface-hover` (7 arquivos).
- **Navbar com 3 dropdowns** (`Topbar`): **tema claro/escuro** + **paletas (cores)** + **idioma**, no topo mobile e desktop; removidos do rodapé da sidebar.
- **Fix layout QuickActions:** grade adapta ao nº de ações — os 3 botões (navegar/whatsapp/ligar) do perfil do cliente voltam **lado a lado**.
- **Gap encontrado e corrigido:** badge **GPS da Rota invisível** (texto branco no PageHeader claro — estilo do banner antigo) → tokens semânticos.
- **Docs stale corrigidos:** MAPEAMENTO (Header notes, §13 SuperAdmin, Perfil), DS (Header de página — sem banner; "navbar ativo"), TOKEN, 06 (UC-019), `07-FORMS-INPUTS` (mapa **concluído**).

Referência: [PLAN-043](plans/PLAN-043-polimento-final-identidade-nexus.md)

## 05/08/2026 — Estabilidade: fix BR-091 (admin × movimentação) + hardening do middleware

**Corrigido**
- **BR-091 (regressão do PLAN-032):** o dashboard de **admin self** agregava **só os dados do próprio admin** (`admin.controller.ts` passava `req.userId!`) — operador registrava pagamento e o "Recebido Hoje"/Total Clientes/Contratos Ativos do admin **não refletiam**. Corrigido: admin/super agregam a **equipe** por empresa (sócio mantém subárvore). Asserção de regressão no smoke (`EQ-088`).
- **`equipe` por operador sempre 0 (novo bug encontrado na asserção):** a query do `recebidoHoje` da equipe usava `and(...userIds.map(eq))` → `userId = A AND userId = B AND ...` (sempre falso com >1 usuário) → o breakdown "da equipe · N operadores" e o `EquipeModal` mostravam **R$ 0** para qualquer operador. Corrigido para `inArray(pagamentos.userId, userIds)` (`admin.repository.impl.ts`). É a outra metade do "movimentação não reflete no admin".
- **`requireModule` sem try/catch:** middleware async do enforcement podia deixar request pendurado + unhandled rejection no Express 4 se a query de `empresas` falhasse. Agora `next(err)` (padrão do `authMiddleware`).
- **Smoke MOD-097/098/099:** restore dos `modulos` agora em `try/finally` — falha de asserção não deixa a empresa de teste com módulos parciais (anti-flakiness).

**Registrado (BACKLOG P024 — observações de design):** enforcement parcial de `cobrancas`/`atendidos` (dado via endpoint compartilhado permanece aberto) e super admin com `?usuarioId=` sem `?empresaId=` ignora o gating (by design).

**Validação:** `npm run build` ✅ · `smoke:api` **107/107** (inclui novas asserções BR-091 e equipe) · `docs:audit` ✅

## 05/08/2026 — Planos de identidade visual (038–042) + briefings Lovable

**Registrado**
- **PLAN-041 — Avatar com foto** (usuário/operador/cliente): componente `Avatar` + `processarImagem` (data URL ≤200px) + `usuarios.foto`/`clientes.foto`; self-service + admin define; foto normalizada na entrada.
- **PLAN-042 — Anexos do cliente** (comprovante de residência): foto ou PDF, limites rígidos (imagem ≤1MB / PDF ≤5MB / `multer` 5MB → 413), `/data/uploads` no volume, endpoints autenticados/escopados (LGPD), **backup passa a incluir uploads**.
- **Briefings Lovable** no padrão do `Lovable-Admin-NXGest.md`: `Lovable-Avatar-NXGest.md` (041) e `Lovable-Anexos-NXGest.md` (042).
- `docs/plans/README.md`: PLAN-038/039/040/041/042 adicionados ao registro (estavam ausentes).

**Status dos planos de identidade:** PLAN-038 Concluído · PLAN-039 Em andamento · PLAN-040 Concluído · PLAN-041/042 Planejado.

Referência: [PLAN-041](plans/PLAN-041-avatar-foto.md) · [PLAN-042](plans/PLAN-042-anexos-cliente.md)

## 05/08/2026 — PLAN-040 · Painel Admin (identidade + UX de módulos/empresas)

**Adicionado / Corrigido**
- **Forms do admin** (`OperadorForm`, `EmpresaForm`) → componente **`Field`** (inputs canônicos `rounded-xl min-h-12 border-strong`; selects no mesmo padrão).
- **`ModulosModal` v2**: cada módulo vira linha com **switch (toggle)**, **hint de dependência** ("Requer: X", BR-092/093 — bloqueia toggle quando dependência off) e **agrupamento** (Base · Financeiro · Cobrança em campo). Estilo `rounded-xl bg-card`.
- **`AdminPage`**: abas em **pills da identidade** (`rounded-xl`, ativa `bg-primary-light`) + caixas `rounded-xl`.
- **`EmpresaList`**: **avatar de iniciais** + badge de módulos ("Todos ativos" / "N módulos").
- `Field` virou `forwardRef` (suporta `ref` p/ scroll/foco em erro).
- i18n pt/en/es (grupos de módulos, "Requer", "Todos ativos", contagem).
- **Deploy em prod** do acúmulo (PLAN-038/039 + admin) — `git push` + `deploy.sh` no VPS.

Referência: [PLAN-040](plans/PLAN-040-admin-identidade.md) · [Lovable-Admin-NXGest](plans/Lovable-Admin-NXGest.md)

## 04/08/2026 — PLAN-039 · Padronização de Forms & Inputs (FOCO) + mapa

**Adicionado / Corrigido**
- **`Field`** compartilhado (`shared/components/Field/Field.tsx`) — input canônico da identidade: `rounded-xl min-h-12 border-strong` + label + erro.
- Token **`--border-strong`** (index.css + tailwind `border.strong`).
- **`ClienteNovo`/`ClienteEdit`** → `PageHeader` + `Field` (dados + endereços).
- **`ContratoNovo`/`ContratoEdit`** → `PageHeader` + `Field` (+ select de cliente e date em `rounded-xl`).
- **`ClienteCard`** (lista/detalhe) com **avatar de iniciais** + ícones (prepara a futura **foto do cliente**).
- **Documentação**: `docs/engineering/07-FORMS-INPUTS.md` (mapa completo dos 16 arquivos de forms) e **DS v2** (seção Inputs + tabela Bordas).
- **Follow-up mapeado (FU):** OperadorForm, EmpresaForm, GastoForm, PerfilPage, CaixaPage, OperadorDetail, LoginPage, RotaPage, PagamentoModal, ContratoDetail, ContratoList, SearchBar.

Referência: [PLAN-039](plans/PLAN-039-padronizacao-forms-inputs.md) · [07-FORMS-INPUTS](engineering/07-FORMS-INPUTS.md)

## 04/08/2026 — Padronização pós-PLAN-038 (mapa de pendências)

**Corrigido / Padronizado**
- **Botões `onDark` → `primary`** (5: Novo Cliente, Novo Contrato, Ver na Rota, Liquidar, Nova Empresa) — herança do banner gradiente antigo; variante `onDark` **removida** do `Button`.
- **Modais de KPI/semana** (`PagamentosHoje`, `PagamentosPeriodo`, `ParcelasHoje`, `GastosPeriodo`, `ContratosSemana`) e o **modal de promessa da Rota** passaram a usar o **`Modal` base** (remove duplicação de overlay/Escape/scroll); cards internos em `rounded-xl bg-card`.
- **`Modal` base** atualizado para `rounded-xl bg-card` (alinha todos os modais).
- **`ParcelaList`** no estilo do Lovable: lista `divide-y` com **dot de status** + número/vencimento + valor (tabular) + rótulos Vencida/Vence hoje (mantém clique p/ pagar).
- **`CobrancaCard`** com **barra de tom** (compact via `tone`, detail via `border-l`).
- **Detalhes → `PageHeader`**: ClienteDetail, ContratoDetail, OperadorDetail e PerfilPage (título limpo + voltar + ação).
- Banner de atrasados da CobrançaListPage em `rounded-xl`.

## 04/08/2026 — PLAN-038 · Refinamentos de identidade (essência do mockup Lovable)

**Adicionado / Corrigido**
- **`PageHeader`**: sai o banner gradiente → **título limpo** (Sora) + **badge de ícone suave** + **data no topo** (eyebrow, na Central) — vale para as 10 landings.
- **`KpiCard`** no estilo Lovable: **barra de tom** à esquerda + `label` + **`value-lg`** (Sora/tabular) + hint; variants → tons.
- **`Card`**: `rounded-xl bg-card` + props `tone` (barra lateral) e `interactive`.
- **Ações rápidas na Central**: grade de **cards-ícone** (Receber, Minha rota, Novo cliente, Fechar caixa — gated por módulo); `ClienteDetail` com o mesmo estilo em grade.
- **Sidebar com seção "Administração"** agrupando **Painel Admin** + **Empresas** (por papel).
- **Overscroll corrigido**: não arrasta além da tela (`overscroll-behavior-y: none`), gradiente sem `background-attachment: fixed` (quebra no iOS) e alturas em `100dvh`.
- **Seletor de tema** em **bolinhas de gradiente + nome do tema atual** (compacto, alvo de toque grande) e botão **claro/escuro só com ícone**.
- **`RotaCobrancaSection` removida da Central** (a ação rápida "Minha rota" cobre a navegação).
- **Marca no topo do drawer** (Logo + "NX Gest" + botão X na mesma linha) e barra mobile mais fina; seção **"Administração" visível sem scroll** na sidebar.
- **Central com nova hierarquia**: **KPIs → Ações rápidas → Cobranças do dia** (estado → ação → fila, alinhado ao mockup). UC-001 e mapeamento §1 atualizados.
- i18n pt/en/es (`admin.painel`, `operacoes.acoesRapidas` + rótulos).

Referência: [PLAN-038](plans/PLAN-038-identidade-visual-nexus.md)

## 04/08/2026 — PLAN-038 · Identidade Visual "Nexus" + sidebar lateral

**Adicionado**
- **Logo Nexus** (cérebro em rede neural com hub central): componente `Logo`/`LogoLockup` (variantes lg/sm/mono), `favicon.svg` e `logo-nexus.svg`.
- **Tokens de identidade** no `index.css` (modelo OKLCH, port do Lovable): brand/accent, estados semânticos soft/text, `--sidebar-*`, gradientes page/brand/text/mesh, `--font-display` (Sora), e o hook **`--tenant-primary`** para whitelabel no tema "default". Aliases `--color-*` mantidos (nada quebra).
- **Sidebar lateral** (`AppLayout`) substituindo a navbar de topo: **desktop fixa à esquerda** (marca + navegação vertical + usuário/tema/idioma/sair) e **drawer mobile** (hamburger).
- **Login redesenhado**: logo Nexus grande + "NX Gest" (texto em gradiente) + tagline "Gestão centralizada para o seu negócio" + card de acesso.
- Tipografia **Sora** nos títulos (h1-h3) + Inter no corpo; fundo em gradiente de marca; botão primário em gradiente.
- **Removido:** `Navbar.tsx` (substituído pelo `AppLayout`).

Referência: [PLAN-038](plans/PLAN-038-identidade-visual-nexus.md) · protótipo de referência [site-personality-plus](https://github.com/RafaCartaxo/site-personality-plus)

## 04/08/2026 — PLAN-037 · Coerência do whitelabel (P025): combos validados + Central adapta

**Adicionado**
- **`contratos ⇒ clientes`** no grafo de dependências (backend + frontend) e **validação transitiva** de combos — `PATCH modulos ["rota"]` → 422 "requer: contratos, clientes". Combos órfãos são impossíveis (BR-092).
- **Central se adapta por módulo (P025/UC-081):** KPIs financeiros gated por `contratos`, "Pendentes do Dia"/clientes pendentes por `cobrancas`; skip de fetches de módulos off; estado vazio coerente ("Nenhum módulo operacional ativo"). Princípio-base do multi-negócio: **dado de módulo off nunca aparece**.
- **CTs API-CT-117/118** (dependência + transitiva) · **UC-081** sem gap · **smoke 107/107**.

**Visão registrada (roadmap 5.10):** evolução para **um app, vários negócios** — F2 branding por tenant (`empresa.tema`), F3 URL por tenant (resolução por Host + Caddy multi-domínio), F4 templates de negócio (`tipo_negocio`).

Referência: [PLAN-037](plans/PLAN-037-coerencia-whitelabel-central-adapta.md)

## 03/08/2026 — PLAN-036 · Whitelabel: enforcement de módulos no backend (P024)

**Adicionado**
- **403 por módulo desativado** — o v1 do whitelabel (PLAN-031) era só gating de UI; agora a API bloqueia módulos off com `MODULE_DISABLED`.
- **Middleware `requireModule('<id>')`** (`src/shared/middleware/module.middleware.ts`): lê `empresas.modulos` por request (o JWT não carrega módulos) e devolve **403** quando o módulo está off.
- **Aplicado** no mount de `clientes`, `contratos`, `caixa`, `gastos`, `pagamentos` (=contratos) e por endpoint em `/operacoes`: `POST /visitas` (rota), `GET /historico-atrasos` (cobrancas).
- **Super admin:** sem `?empresaId=` → gestão global (não bloqueado); com `?empresaId=` → respeita os módulos da empresa-alvo (mesma regra do `resolveUsuarioAlvo`).
- **Fallback (BR-093):** empresa sem `modulos` = todos ativos.
- **Limite do v1:** endpoints compartilhados com a Central (`/operacoes/cobrancas`, `pagamentos-hoje`, `parcelas-hoje`, `parcelas-semana`) seguem abertos — gating por módulo único quebraria Rota/Atendidos/Cobranças.
- **Frontend:** `errors.MODULE_DISABLED` traduzido (PT/EN/ES).
- **Validação:** teste real em instância isolada (módulo off → 403; ativo → 200; compartilhado → 200; super admin com/sem `?empresaId=`); CTs API-CT-106..110; UC-079; BR-093 ampliada.

**Registro corrigido:** PLAN-016 e FEATURE-temp (prévia de pagamento) marcados como **Concluído** — estavam com status stale apesar de implementados.

**Bug encontrado e corrigido na validação (fuso horário):** a query de cobranças comparava `date(h.createdAt)` (UTC) com `hoje` (data local) — em determinados horários do dia (UTC já no dia seguinte vs local) a visita registrada não refletia na lista. Corrigido para `date(h.createdAt, 'localtime')` (`operacoes.repository.impl.ts`). O `smoke` voltou a passar **105/105**.

**Casos de teste ampliados** — `07`: API-CT-111..116 (sócio gated, só central → 403 em todas as rotas operacionais, efeito imediato no backend, sem bypass por `?empresaId=`, pagamentos=contratos, empresa inexistente → 404); `06`: UC-080 (efeito imediato) e UC-081; `smoke`: MOD-098/099.

**Gap registrado (follow-up P025):** a **Central não se adapta por módulo** — exibe "Pendentes do Dia" e KPIs de caixa mesmo com `cobrancas`/`caixa` off (UC-081/BR-093); registrar como pendência no backlog.

Referência: [PLAN-036](plans/PLAN-036-whitelabel-enforcement-backend.md)

## 03/08/2026 — PLAN-035 · Temas em componentes + Hero headers nos módulos

**Adicionado**
- **Tema agora "pega" em todos os componentes** — eliminadas ~150 classes fixas da paleta (`blue/red/green/yellow/gray-*`) que contornavam os tokens do PLAN-031: foco de input (`focus:ring/border-primary`), links, hover de cards, dots de status, spinners de loading, toasts do `FeedbackOverlay` e botão danger passaram a usar os tokens. O que é brand segue a paleta; o que é semântico (`danger/success/warning`) permanece fixo.
- **Header hero nos módulos** — novo componente `PageHeader` (banner em gradiente + ícone + título + subtítulo + ação + voltar), replicando o padrão do Super Admin nas landings: Central, Clientes, Contratos, Caixa, Gastos, Cobranças, Rota, Atendidos, Administração e Empresas. Ações principais (Novo Cliente/Contrato, Fechar Semana, Ver na Rota, Nova Empresa) no header como botão branco (`Button variant="onDark"`). Páginas de novo/editar/detalhe mantêm o header compacto.
- **i18n** — subtítulos novos nas 3 línguas (PT/EN/ES).
- **Guarda de regressão** — `npm run audit:styles` falha se surgir cor fixa da paleta em `frontend/src`.
- **Registro corrigido** — `05-MAPEAMENTO-TELAS.md` reordenado e renumerado (seções alinhadas à tabela Visão Geral; rótulo de `/cobrancas` corrigido) + "Checklist para Novas Telas" atualizado com as novas convenções.
- **Validação** — UCs 073–078 em `06-CASOS-DE-USO.md` (tema em componentes, hero operador/gestão, i18n, contraste, regressão).

Referência: [PLAN-035](plans/PLAN-035-temas-componentes-e-hero-headers.md)

## 03/08/2026 — PLAN-034 · Atraso no card do contrato (lista)

**Adicionado**
- `GET /api/contratos` devolve por contrato `emAtraso` (Σ saldo vencido), `parcelasEmAtraso` e `diasEmAtraso` (BR-099) — estendendo o agregado que já calculava `saldoPendente`/`parcelasPagas`.
- `ContratoCard` (list-item) mostra a linha vermelha **"N parcelas em atraso · R$ Y · D dias"** (pontinho danger) quando há parcelas vencidas.
- UC-072 · API-CT-105 · mapeamento v1.22.
- A **lista de clientes** permanece enxuta — espaço reservado para a futura **foto do cliente**.

Referência: [PLAN-034](plans/PLAN-034-atraso-card-contrato.md)

## 03/08/2026 — PLAN-033 · Situação Financeira do cliente (P015)

**Adicionado**
- `GET /api/clientes/:id` devolve a **situação financeira** do cliente: `valorEmAtraso`, `parcelasEmAtraso`, `diasEmAtraso`, `valorVenceHoje`, `ultimoPagamento` (não estornado) e `lucroPrevisto` (BR-096..098).
- **ClienteDetail** com grade 2×2 de KPIs (`SituacaoFinanceira`): Saldo Devedor · Em atraso · Vence hoje · Lucro previsto + linha "Último pagamento". `SaldoInfo` removido.
- **P015 concluído** (lucro previsto) — BACKLOG marcado.
- **Removido**: o bloco "Histórico de atrasos" da view de atrasados (gráfico de evolução + tabela de `snapshots_atraso`) — o snapshot só era gravado ao abrir as Cobranças (sem job diário) → dado esparso; o dado ao vivo (banner) e o detalhe do cliente cobrem a necessidade. O endpoint `historico-atrasos` permanece no backend (API-UC-022).
- UC-071 · API-CT-103/104 · mapeamento v1.21.

Referência: [PLAN-033](plans/PLAN-033-atrasos-cliente-historico.md)

## 03/08/2026 — Correção: parcela `Parcial` vencida na ParcelaList

**Corrigido**
- `ParcelaList` só marcava como **Vencida** (vermelha) parcelas `Pendente` — uma parcela **`Parcial` com vencimento passado** aparecia **azul** (como "vence hoje"), confundindo o estado. Agora **qualquer** parcela com saldo pendente e vencimento no passado fica vermelha/"Vencida" (inclusive `Parcial`), e os contadores não contam as vencidas como "pendentes".
- `PagamentoModal` passou a exibir a regra de distribuição ("Aplicado das parcelas mais antigas para as mais recentes", BR-044) que já existia na i18n mas não era renderizada.

## 03/08/2026 — UX: estorno visível + terminologia "Atendidos × Visitados" + i18n

**Corrigido**
- **Estorno visível no detalhe do contrato**: `findByContratoId` passou a retornar `estornadoEm/Por/Motivo` — o pagamento estornado agora aparece **riscado** + badge "Estornado" + motivo (antes o campo não vinha da listagem e o estorno "nada ocorria" na tela).
- **Terminologia padronizada (UC-070)**: "Atendido" é o guarda-chuva (visitado + não encontrado + promessa + pagos); "Visitado" é só o subtipo. **Contadores nos filtros** (Atendidos/Cobranças) e **breakdown nos banners** ("1 visitado · 2 não encontrados · 3 promessas") — resolve a confusão de banner com 6 atendidos e filtro "Visitado" zerado.
- **i18n do banner de atrasados**: `atrasadosResumo` usava chaves simples `{clientes}`/`{total}` (não interpoladas) — corrigido para `{{...}}`; varredura confirma 0 chaves simples restantes.

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

## 03/08/2026 — Validação da API (smoke 104 cenários)

**Validado** — `scripts/smoke-api.mjs` executou **104 cenários** da base `07-CASOS-DE-USO-API.md` contra instância isolada (seed em `/tmp`, `PORT=3002`): **todos PASS**, incluindo coerência (saldo cai após contrato, `recebidoHoje` sobe após pagamento, auditoria após ajuste, movimentação reversa no estorno, login novo/antigo na troca de senha, empresa + login do admin novo), as **variações V1–V8**, os testes de **módulos/whitelabel** (MOD-091..096) e de **hierarquia/sócio** (SC-001..006 — subárvore, escopo por nível, acesso fora da subárvore → 404).

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
- **Script corrigido** (`/opt/scripts/backup-nxgest.sh`): `wal_checkpoint(TRUNCATE)` antes do `cp` + **validação embutida** (`SELECT COUNT(*) FROM usuarios` > 0; backup vazio vira `.invalid`).
- **Backup pré-deploy**: `scripts/deploy.sh` agora chama o backup **antes** do build — todo deploy gera snapshot do estado anterior.
- **Cópia off-site corrigida**: `~/.config/nxgest/backups/backup-offsite-gestao.db` estava vazia (4KB) → substituída pelo backup consistente (241KB, dados reais).
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

## 06/08/2026 — PLAN-055 · Módulo de localização/navegação + fix do endereço

**Corrigido**
- **Bug de navegação (endereço × GPS):** editar o texto do endereço (comércio OU principal) **não descartava** as coordenadas capturadas → o "Navegar" abria o mapa no ponto antigo. Agora o form **descarta as coords ao editar o texto** (indicador "Localização não capturada" + botão **Recapturar**) e o navegador passa a usar o endereço novo.

**Adicionado / Melhorado**
- **Módulo `shared/geo/`** (modulação do GPS/navegar, sem quebrar a rota): `montarAlvo` (coords > texto, sem misturar endereços) · `resolveAlvoCliente` (alvo = **comércio padrão** → principal fallback) · `alvoNavegavel` · `buildMapsUrl` (regra idêntica) · `useGeolocation` (captura + reverse geocode, cooldown) · `CapturaLocalizacao` (3 estados). **18 testes unitários** (N1–N12).
- **GPS no endereço principal** (colunas `lat`/`lng` que eram mortas): backend `localizacao` (Create/Update + repo) + botão no form do cliente.
- **`ClienteForm` compartilhado** (extrai ClienteNovo/ClienteEdit duplicados) com o fix embutido.
- **Smoke +7 CTs (GEO-001..007, total 116/116)** · UC-080 (06) · API-CT-100..105 (07).

**Por quê:** correção de dado (navegador ia pro endereço errado) + camada de base para o redesign visual dos cadastros (briefing `Lovable-Cadastro-Rota-NXGest.md`).

Referência: [PLAN-055](plans/PLAN-055-modulo-localizacao-navegacao-fix-endereco.md)

## 06/08/2026 — PLAN-056 · Port do material Lovable (botões + GPS + form + Preferências)

**Adicionado / Melhorado**
- **`Button`/`ButtonLink` com variantes completas** (`soft`/`outline`/`success` + sizes `sm/md/lg/block`, base `rounded-xl min-h-11`) — o verde de "Registrar pagamento" agora usa `variant="success"` (sem classe crua).
- **`GpsControl`** (port do Lovable): controle de GPS com 3 estados (Capturar · Capturada+Recapturar · Não capturada/invalidada), acessível, usado no form do cliente (comércio + residencial).
- **`ClienteForm` em 4 Cards** (Identificação · Comércio · Localização do comércio · Endereço residencial) com UF como select — sobre a lógica do PLAN-055 (fix do endereço preservado).
- **Vocabulário único de botões**: sem setas "→" literais; "Ver rota" → `ghost sm` + `ChevronRight`; `ClienteDetail` sem `<Link>` cru.
- **`ClienteSelect`** (seletor de cliente buscável) — pronto para o `ContratoForm`.
- **Preferências em modal** (substitui os dropdowns da Topbar): Modo (claro/escuro/**sistema**) · Cores (paletas) · Idioma. `ThemeProvider` ganhou `mode` persistido (compat com chaves antigas).

**Pendente do Lovable:** `ContratoForm` · tela de Rota (`/rota`) · wiring das telas (`central`/`clientes` usarem o vocabulário novo).

**Por quê:** aplicar o material da rodada nova do Lovable (identidade) sobre a camada geo pronta (PLAN-055).

Referência: [PLAN-056](plans/PLAN-056-port-material-lovable-botoes-gps-form-preferencias.md)

## 07/08/2026 — Tratamento de falha de e-mail (503 EMAIL_UNAVAILABLE) + PLAN-066 P0 (hardening)

**E-mail tratado (fim do "verde mentiroso")**
- `EmailEnvioFalhouError` + `ResendMailer` lança o tipo; `forgot`/`reconfirmar`: e-mail inexistente → 200 genérico (anti-enumeração mantida); **envio real falhou → 503 EMAIL_UNAVAILABLE** (mensagem tratada).
- **`POST /leads` com rollback**: falha no e-mail de confirmação remove lead + token (retry limpo, sem dedup preso) — corrige o bug latente de lead/operador/empresa criados sem e-mail e retry bloqueado.
- Convite (operador/empresa/reenviar/converter): entidade permanece + 503 com orientação de reenviar.
- i18n `errors.EMAIL_UNAVAILABLE` ×3 · `npm run mail:test` (teste de envio) · 06-PRODUCAO §9 (503 enquanto o Resend não estiver verificado).
- vitest 36 → **40/40** (rollback CriarLead + rethrow EsquecerSenha) · smoke **248/248**.

**PLAN-066 · P0 (hardening)**
- `trust proxy` (rate limit real por IP) · `helmet` + **CSP** (Google Fonts liberadas; testado no build) · **CORS fail-closed** em produção · **HSTS** no Caddyfile (validado).
- CTs H-CT-01..08 + EM-503-01..03 em `07`. P1 pendente (npm audit/drizzle · firewall/fail2ban · rate limit por usuário · backup cripto · **timeouts do Caddy** — syntax a validar).

Referência: `plans/PLAN-066-hardening-seguranca.md` · `engineering/SEGURANCA.md` · `plans/BACKLOG.md` (P027)

## 08/08/2026 — PLAN-068: migração de URL para `nxgest.com.br` + e-mail em produção

- **Código**: `docker-compose.prod.yml` passa `APP_URL`/`MAIL_*`/`RATE_LIMIT_*` · Caddyfile serve 3 hostnames (duckdns transitório + `nxgest.com.br` + **www→apex 301**) · `.env.production.example` com DOMAIN/CORS/APP_URL do domínio novo.
- **VPS**: `.env` → `DOMAIN=nxgest.com.br` · `CORS_ORIGIN=https://nxgest.com.br` · `MAIL_PROVIDER=resend` · `RESEND_API_KEY` · `MAIL_FROM=no-reply@nxgest.com.br` · `APP_URL=https://nxgest.com.br` → `compose up -d`.
- **Validado**: `https://nxgest.com.br` **200** · `www` → **301** → apex · duckdns **vivo** (transitório) · **e-mail real enviando** (`forgot` de e-mail existente → 200 via Resend; fail-closed 503 se falhar).
- **Pendências**: F5 (aposentar duckdns após confirmação) · Cloudflare SSL Full (strict) recomendado (site já funcionando).

Referência: `plans/PLAN-068-migracao-url-email-producao.md` · `06-PRODUCAO.md` §9

## 08/08/2026 — PLAN-067: testes integrados (unit + UI + CI) — destrava P022

- **F0 infra**: `vitest.config.ts` (node default + `@vitest-environment jsdom` + coverage v8 report-only) · `frontend/src/test/setup.ts` (jest-dom + stub canvas) · scripts `test:watch`/`test:coverage` · **CI** (`.github/workflows/ci.yml`: job `test` + job `smoke` isolado).
- **F1 unit**: Login (inválido/convidado/sucesso) · Convidar (SE-04 reenvio) · ConfirmarLead (single-use/expirado) · DescartarLead (LGPD) · shared/segurança: `scope` (resolveUsuarioAlvo), `foto` (magic bytes/sem SVG), `jwt` (fail-closed), `clientIp`.
- **F3-P022**: `LoginPage.test.tsx` (toggle senha UC-041 + submit chama login) — destrava o backlog P022.
- **QA**: vitest 43 → **74 testes** (17 arquivos) · `test:coverage` report-only (meta sobe gradual).
- **Fix infra**: root alinhado ao **React 18.3.1** + `dedupe` (removida cópia aninhada do frontend — quebrava hooks no jsdom).

Referência: `plans/PLAN-067-testes.md` · `engineering/TESTES.md`

## 08/08/2026 — PLAN-069: polimento de UI (port-back do Lovable) — parte 1

- **Configurações**: `PreferenciasModal` reescrito — **preview ao vivo** (reflete o tema global), **`SegmentedControl`** (novo shared) p/ modo claro/escuro/sistema com ícones, **swatches circulares com anel** de seleção, lista de **idioma com sigla+nome** (PT/EN/ES). Port de `preferencias.tsx`.
- **Ajuste de caixa do operador**: novo **`AjusteCaixaCard`** (contexto base+saldo + validação inline + feedback no lugar) substituindo os inputs crus no `OperadorDetail` — ligado à API real `ajustarCaixaBase`.
- **Fechar caixa na Central**: novo **`FecharCaixaModal`** (resumo do dia: resultado/recebido/gastos + confirmar) ligado à QuickAction "Fechar caixa" → confirma e vai pro fluxo real (`/caixa`). Correção do protótipo aplicada: "Receber" → `/cobrancas`.
- i18n: chaves `prefs.*` (preview/concluido/lang*) · `admin.*` (novoValor/valorInvalido/ajusteSalvo/salvarAjuste) · `caixa.*` (confirmarDesc/resumoDia/fechado/semMovimento/gastosHoje) · `common.confirm`.
- QA: tsc · build · audit:ui/styles/modules (147 arquivos, 0 legado) · docs:audit.
- **Admin (superfície 4)**: KPIs/badges de role + convite já presentes (PLAN-061/065) — redesign completo fica como follow-up.

Referência: `plans/PLAN-069-polimento-ui-app.md` · protótipo `site-personality-plus@42f1adcb`
