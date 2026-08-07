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
