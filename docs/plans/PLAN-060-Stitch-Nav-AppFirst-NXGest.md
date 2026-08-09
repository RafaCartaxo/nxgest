# PLAN-060 — Navegação app-first: BottomTabBar + UserMenu (Stitch-Nav-AppFirst)

**Status:** Concluído

**Versão:** 1.0

**Início:** 06/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** UX mobile-first — navegação com cara de app nativo

---

## Objetivo

Reorganizar a **arquitetura de navegação e o fluxo de configurações** do NX Gest para mobile-first (app-like), **sem redesenhar a identidade** (tokens/cores/fontes permanecem). Base: briefing `docs/plans/Stitch-Nav-AppFirst-NXGest.md`.

## Decisões confirmadas (travadas no briefing §5)

- **Mobile:** `BottomTabBar` fixa (Central sempre + abas operacionais gated por módulo) + **topo fino** (marca → `/` + `UserMenu`). Sem hamburger/drawer.
- **Desktop:** sidebar lateral intacta, rodapé com `UserMenu` detalhado; sem header superior duplicado.
- **Configurações** (tema/cores/idioma) saem da engrenagem solta → **`UserMenu`** (abre o `PreferenciasModal` existente).
- **`Topbar.tsx` removido**; sidebar ganhou **Rota** (item gated por módulo).
- **super_admin** no mobile vê só a Central (admin fica no menu do usuário).

## Escopo

| # | Entrega |
|---|---------|
| 1 | `BottomTabBar` (novo): 5 abas mobile (Central · Clientes · Contratos · Caixa · Rota) gated por `hasModule`; `NavLink` ativa por prefixo; `min-h-16` + `pb-safe`; `role="navigation"` + `aria-label` |
| 2 | `UserMenu` (novo): avatar → Perfil · Configurações (`PreferenciasModal`) · Sair; admin/sócio/super_admin ganham Painel Admin/Empresas no mobile; bottom-sheet mobile / popover desktop; `role="menu"`, Escape fecha |
| 3 | `AppLayout` refatorado: fim do drawer; topo fino mobile; sidebar desktop sem header duplicado; conteúdo `pb-28 lg:pb-16` |
| 4 | `Topbar.tsx` removido · i18n pt/en/es (`nav.rota`, `nav.perfil`, `nav.rotulo`) · `.pb-safe` em `index.css` |
| 5 | **Fix (code review):** link morto `Marca → Kit de identidade → /design` removido (não havia rota) |

## Validação

- `tsc` (frontend) ✅ · `npm run build` ✅ · Vite ao vivo (transform dos novos módulos sem erro) ✅ · `audit:ui/styles` ✅ · `docs:audit` ✅

## Referências

- `frontend/src/shared/layout/{BottomTabBar,UserMenu}.tsx` · `AppLayout.tsx` · `index.css` (`.pb-safe`)
- `docs/plans/Stitch-Nav-AppFirst-NXGest.md` (briefing) · `04-UI-COMPONENTS.md` · `UI-COVERAGE.md`
- Precedente de padrão de plano: PLAN-056 (port do material Lovable)

## Fora de escopo / próximos passos

- **Acessos mobile a `/cobrancas`, `/atendidos`, `/gastos`:** a tab bar tem 5 abas (Central + 4 operacionais); cobranças/atendidos/gastos seguem alcançáveis pela Central (widgets). Se o produto quiser, avaliar aba dinâmica por whitelabel (limite de 5).
- **Página "Kit de identidade" (`/design`):** link removido por não existir rota; quando a página for planejada, reativar o grupo "Marca" na sidebar.
