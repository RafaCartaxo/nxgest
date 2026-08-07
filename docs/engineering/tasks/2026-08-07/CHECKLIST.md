# CHECKLIST — Navegação "app-first": bottom tab bar + menu do usuário (Stitch-Nav-AppFirst)

**Data:** 07/08/2026

> Implementação no app real do briefing `docs/plans/Stitch-Nav-AppFirst-NXGestao.md` (decisões travadas §5, regras §6).

## Entregue

- [x] **`BottomTabBar`** (novo `shared/layout/BottomTabBar.tsx`): 5 abas mobile — Central `/` · Clientes · Contratos · Caixa · Rota — gated por `hasModule` (`central` sempre; super_admin vê só a Central); aba ativa por prefixo via `NavLink`; `min-h-16` + `pb-safe` (safe-area); `role="navigation"` + `aria-label`
- [x] **`UserMenu`** (novo `shared/layout/UserMenu.tsx`): avatar → Perfil · Configurações (abre o `PreferenciasModal` existente) · Sair; admin/sócio/super_admin ganham Painel Admin/Empresas no mobile; mobile = bottom-sheet, desktop = popover; `role="menu"`, Escape fecha
- [x] **`AppLayout`** refatorado: hamburger/drawer **removidos**; topo fino mobile (marca → `/` + `UserMenu`); sidebar desktop sem header superior duplicado, rodapé com `UserMenu` detalhado; conteúdo `pb-28 lg:pb-16`
- [x] **Sidebar ganhou Rota** (item entre os 5, gated) — decisão "incluir Rota no desktop"
- [x] **`Topbar.tsx` removido** (config não fica mais em engrenagem solta)
- [x] **i18n** (pt/en/es): `nav.rota`, `nav.perfil`, `nav.rotulo`, `nav.grupoMarca`, `nav.kit`
- [x] **`.pb-safe`** utilitário em `index.css` (env safe-area)

## Validação

- [x] `tsc` (frontend) limpo
- [x] `npm run build` verde
- [x] `audit:ui` · `audit:styles` · `audit:modules` verdes
- [x] `npm test` — 29 testes verdes
- [x] `npm run docs:audit` — sem divergência

## Observações

- Corrigido bug de build pré-existente (trabalho em aberto): `ClienteDetail.tsx` passava `variant: string` ao `QuickActions` — `QuickAction` agora é exportada e `acoesCliente` tipado.
- Hide-on-scroll da tab bar (protótipo) **não** implementado — fora do escopo do briefing (decisão 07/08).

---

# FIX — Menu do usuário coberto pela tab bar (Sair inacessível)

**Data:** 07/08/2026

## Bug
No mobile, ao abrir o menu do usuário (avatar no topo fino), a linha **Sair** ficava coberta pela tab bar → impossível sair da conta (mesmo efeito no `PreferenciasModal` aberto pelo menu).

## Causa raiz
O header mobile (`AppLayout.tsx`) é `sticky top-0 z-40` → **stacking context**. O overlay do `UserMenu` e o `Modal` (via `PreferenciasModal`), sendo filhos desse header, ficavam presos no z-40 do header; a `BottomTabBar` (fixed `z-40` no raiz, posterior no DOM) pintava por cima da base do bottom-sheet.

## Correção (portal no body)
- [x] `shared/components/Modal/Modal.tsx`: render via `createPortal(..., document.body)` — o modal escapa de qualquer stacking context do ancestor (20 consumidores — mudança transparente)
- [x] `shared/layout/UserMenu.tsx`: bottom-sheet mobile via `createPortal` no body (z-50 raiz, acima da tab bar); popover desktop permanece in-place (cresce da sidebar, nada o cobre); conteúdo do menu extraído em `conteudoMenu`/`cabecalho`

## Validação
- [x] `tsc` · `npm run build` · `audit:ui` · `audit:styles` · `audit:modules` · `npm test` (29/29) · `node scripts/consumers.mjs Modal` (20 consumidores, sem quebra)

---

# CHECKLIST — PLAN-061: card empresa, suspensão por `ativa`, rebaixamento com reassign

**Data:** 07/08/2026

- [x] Card empresa: botão Recursos (abre CapacidadesModal) + badge de capacidades + botão Editar
- [x] Editar empresa: `EmpresaForm` com `initial` (esconde admin no edit) + modal + confirm de suspensão (nº usuários)
- [x] BR-106: `authMiddleware` + login/me → 403 EMPRESA_INATIVA · frontend desloga na suspensão · auditoria `tipo:"empresa"`
- [x] Rebaixamento: `OPERATOR_HAS_SUBORDINATES` + count · `reatribuirParaChefeId` (reassign atômico na transação) · `ReassignModal`
- [x] `SuperAdminRoute` (só super em /admin/empresas*) · `maxLength={200}` motivo · auditoria idempotente · `apiRequest` interpolação `{{n}}`
- [x] Smoke **189 → 203/203** (SUSP-1..4 · SUP-1..6 · ORF-1..3 · REAS-1 · POS-1 · IMP-003/004 · MOD-G-14 · TR-123/127 atualizados)
- [x] Docs: PLAN-061 · plans/README · UPDATES · 02-API (EMPRESA_INATIVA/OPERATOR_HAS_SUBORDINATES/reatribuirParaChefeId) · 07 CTs · BR-106 + BR-103 · UI-COVERAGE · MAPEAMENTO

---

# CHECKLIST — Handoff de execução (planos prontos)

**Data:** 07/08/2026

> Planos fechados e prontos para execução pelo próximo chat/agente. Regras do repo em `AGENTS.md`.

## PLAN-062 — Rota do dia (Lovable)

- [ ] `docs/plans/PLAN-062-rota-dia-lovable.md` criado
- [ ] `docs/engineering/tasks/2026-08-07/ROTA-REGRESSAO-CT.md` criado (~50 CTs, Grupos A–G)
- [ ] Aguardando execução (progresso Lovable · card de ações · "Parada X de Y" · modais 3→2 · alça Modal · html lang · FAB)

## PLAN-063 — Contexto do operador (clientes)

- [ ] `docs/plans/PLAN-063-contexto-operador-clientes.md` criado (fecha P13: `resolveUsuarioAlvo` na lista de clientes + front)
- [ ] Aguardando execução

## Backlog

- [ ] P016 marcado ✅ (PLAN-055/056 + decisão navegação única)
- [ ] P13 marcado ✅ (PLAN-063)
- [ ] P20 re-escopado (convite + esqueci senha + e-mail) — aguardando decisões de produto

---

# CHECKLIST — PLAN-062 (Rota Lovable) implementado

**Data:** 07/08/2026

- [x] i18n rota (progresso/paradaDe/registrarPagamento/abrirContrato/progresso.*)
- [x] RouteProgress Lovable (% + aria + grid 4) · contador "Parada X de Y"
- [x] Card de ações (4 ícones gated + Registrar pagamento + 3 outline grid-cols-3; barra do topo removida)
- [x] Modais 3→2: PagamentoModal.sucessoContent (comprovante integrado, gating comprovante_whatsapp preservado) · refetch no fechar
- [x] Extras: alça Modal · html lang dinâmico · FAB (FabContext + ClienteList/ContratoList)
- [x] Gates: build · vitest 36 · audit:ui/styles/modules · docs:audit
- [ ] Regressão ROT-CTs em DEV (Grupos A–G) — pendente de validação manual

---

# CHECKLIST — Planos de conta e aquisição (handoff)

**Data:** 07/08/2026

> Prontos para execução pelo próximo chat/agente (regras em `AGENTS.md`). Ordem de dependência: **PLAN-065 primeiro, depois PLAN-064**.

## PLAN-065 — Fluxo de conta (P020)

- [ ] `docs/plans/PLAN-065-fluxo-de-conta.md` criado (convite/ativação + esqueci senha + Resend) + CTs (AC/ES/SE/EM/UI)
- [ ] Aguardando execução (infra e-mail → convite → esqueci senha → telas → CTs)

## PLAN-064 — Onboarding comercial (P026)

- [ ] `docs/plans/PLAN-064-onboarding-comercial-leads.md` criado (Lead → confirmação → painel super → converter) + CTs (LD-*)
- [ ] Aguardando execução (depende do PLAN-065)

## Backlog / docs

- [ ] BACKLOG: P020 → PLAN-065 · novo epic P026 → PLAN-064
- [ ] ROADMAP · UPDATES · plans/README atualizados

---

# CHECKLIST — PLAN-065 backend (Checkpoint 1) implementado

**Data:** 07/08/2026

- [x] Infra e-mail: mailer port + Resend/console + templates pt/en/es + env MAIL_*/RESEND/APP_URL
- [x] Migração: usuarios.senhaHash nullable (usuarios_new corrigido) + tabela auth_tokens (migracao:test ✅)
- [x] Convite/ativação: createOperador senha opcional · reenviar-convite · /auth/ativar · login convidado 403 ACCOUNT_PENDING · /me status · createEmpresa adminSenha opcional
- [x] forgot/reset (resposta genérica + rate limit e-mail+IP) + rotas públicas
- [x] Fix leak: OperadorRow status + strip senhaHash
- [x] Smoke 213 → 235/235 (AC/ES/SE/SM) · vitest 36 · docs:audit · collection 55
- [ ] Frontend (Checkpoint 2): páginas públicas, login link, AuthContext status, OperadorForm/EmpresaForm senha opcional, badge convite
