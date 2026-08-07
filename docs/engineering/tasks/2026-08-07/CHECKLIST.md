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
