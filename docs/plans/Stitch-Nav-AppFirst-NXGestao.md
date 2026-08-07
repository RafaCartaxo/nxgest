# NX Gestão — Navegação "app-first" (Bottom Nav mobile + Sidebar desktop + Configurações) — briefing para IA/Stitch

**Versão:** 1.0 · **Data:** 06/08/2026

> Briefing para gerar o redesign da **navegação e das configurações** do NX Gestão com cara de **app nativo**.
> Regra de ouro: **não redesenhar a identidade** (ela fica como está — tokens/cores/fontes) — apenas reorganizar a **arquitetura de navegação e o fluxo de configurações** para ficarem coerentes, leves e mobile-first. Referência de identidade: `docs/engineering/design/02-DESIGN-SYSTEM.md`.

---

## 1. Contexto do produto

- **NX Gestão ("Nexus Gestão")** — plataforma **mobile-first** de gestão de cobranças em campo (microcrédito popular). O **operador** vai até o cliente cobrar parcelas **pelo celular, em pé, na rua** — toque com polegar, uma mão.
- **Perfis:** Operador de campo (celular) · Admin/Sócio (back-office desktop) · Super Admin (multi-empresa whitelabel).
- **Frontend:** React + Tailwind v3, identidade 100% dirigida por **CSS variables** (tokens OKLCH). Fonte **Sora** (títulos, `font-display`) + **Inter** (corpo).
- **Tokens principais em uso:** `--color-primary` (+`hover/light/text/foreground`) · `--color-accent` · `--color-card` · `--color-surface`(+`secondary/hover`) · `--color-text-primary/secondary/muted` · `--color-border`(+`strong/light`) · `--color-success/warning/danger/info` · `--color-sidebar`(+`foreground/muted/active/border`) · gradientes `--gradient-page/brand/text`.
- **Modo:** light/dark/system (classe `.dark` no `<html>`) + **5 paletas** de usuário (default · aurora · ocean · grape · sunset) + **whitelabel** (hook `--tenant-primary` pronto).
- **Componentes canônicos:** `PageHeader` (ícone `size-11 rounded-xl` + título Sora 28px) · `Card` (`rounded-xl bg-card`) · `Button` (variantes) · `Modal` (base, bottom-sheet no mobile) · `Avatar` (foto/iniciais, com lightbox) · `StatusBadge` · `Field`/`FieldSelect` · `Tabs` · `Switch` · `PreferenciasModal`.

---

## 2. Problema atual (por que está ruim)

1. **Navegação "adaptada", não app:** no mobile, os itens ficam **escondidos num hamburger → drawer lateral** (padrão de desktop). O operador na rua precisa abrir um menu pra navegar — trava no fluxo.
2. **Header redundante no desktop:** no desktop existem **sidebar E header superior** (logo + engrenagem) + ainda o `PageHeader` da página = **3 camadas** de navegação. Peso visual desnecessário.
3. **Configurações "coladas":** tema/idioma ficam numa **engrenagem solta no topo direito**, desconectada do fluxo — parece apêndice.
4. **Navegação incompleta:** **Rota, Cobranças, Atendidos e Gastos NÃO estão no menu** — são acessados só pelos widgets da Central. Falta o atalho da **Rota** (a ação diária mais importante do operador).
5. **Sensação geral:** o app parece uma "tela web adaptada ao celular", sem a fluidez de um app nativo.

---

## 3. Estado atual mapeado

| Área | Hoje | Arquivo |
|---|---|---|
| **Header** | `sticky top-0` sempre (mobile + desktop): hamburger (só mobile) + logo "NX Gestão" + engrenagem de config | `shared/layout/AppLayout.tsx` |
| **Nav mobile** | hamburger → drawer `w-72` com `SidebarContent` | `AppLayout.tsx` |
| **Nav desktop** | sidebar fixa `w-64` (`lg:flex`) · conteúdo `lg:pl-64` | `AppLayout.tsx` |
| **Itens (tenant)** | Central `/` (sempre) · Clientes · Contratos · Caixa — **gated por módulo** (`hasModule`) | `useNavItems()` |
| **Itens (admin)** | Painel Admin `/admin` (admin/sócio) · Empresas `/admin/empresas` (super_admin) — seção "Administração" | `useAdminNavItems()` |
| **Rodapé sidebar** | Avatar+nome+role · botões **Perfil** e **Sair** | `SidebarContent` |
| **Config** | engrenagem → `PreferenciasModal` (Modo Tabs claro/escuro/sistema · 5 paletas · idioma PT/EN/ES) | `Topbar.tsx` + `shared/theme/PreferenciasModal.tsx` |

**Ícones (lucide) atuais:** Central `LayoutDashboard` · Clientes `Users` · Contratos `FileText` · Caixa `Wallet` · Painel `ShieldCheck` · Empresas `Building2` · Rota `Route` (usado no PageHeader da Rota).

**Módulos (whitelabel):** `central` (sempre) · `clientes` · `contratos` · `caixa` · `gastos` · `rota` · `cobrancas` · `atendidos`.

**Regra de gating:** `hasModule(modulos, id)` — módulo desativado = item some do nav (e da Central).

---

## 4. Estado-alvo

### 4.1 Mobile — Bottom Tab Bar (app de verdade)

- **Tab bar fixa na base da tela**, sempre visível, com **5 abas**:
  - **Central** (`/`) · **Clientes** (`/clientes`) · **Contratos** (`/contratos`) · **Caixa** (`/caixa`) · **Rota** (`/rota`)
  - Ícones: `LayoutDashboard` · `Users` · `FileText` · `Wallet` · `Route`.
- **Gating:** cada aba some se o módulo está off (`hasModule`). `central` sempre presente.
- **Estado ativo:** destaque com `--color-primary` (ícone + label) e/ou o padrão `sidebar-active`; inativos em `text-text-muted`.
- **Formato:** ícone (20px) + label (10-11px) por aba; altura de toque ≥ `min-h-16`; alvo ≥ 48px.
- **Segurança de área:** `padding-bottom: env(safe-area-inset-bottom)` (iPhone home indicator).
- **Sem hamburger/drawer no mobile** — a tab bar substitui.
- **Topo fino no mobile:** logo pequeno (28px, `text-primary`) à esquerda + **Avatar** à direita → abre o **menu do usuário** (4.3). Sem engrenagem solta.
- **Conteúdo:** `padding-bottom` na página para o conteúdo não ficar atrás da tab bar.

### 4.2 Desktop — Sidebar coesa (sem header duplicado)

- Manter a **sidebar fixa `w-64`** (como hoje), com a mesma lista: Central · Clientes · Contratos · Caixa + seção "Administração" (Painel Admin / Empresas por papel).
- **Remover o header superior duplicado** no desktop: a configuração passa a morar no **rodapé da sidebar** (menu do usuário / engrenagem ao lado de Perfil/Sair).
- Conteúdo `lg:pl-64`, páginas já têm seu `PageHeader`.

### 4.3 Configurações — um único fluxo (menu do usuário)

- **Avatar** (mobile: topo fino · desktop: rodapé da sidebar) abre um **menu do usuário**:
  - **Perfil** (`User` → `/perfil`)
  - **Configurações** (`Settings` → abre o `PreferenciasModal`)
  - **Sair** (`LogOut`)
- **`PreferenciasModal` mantém o conteúdo atual** (Modo: Claro/Escuro/Sistema · Cor: 5 paletas com swatches · Idioma: PT/EN/ES) — só muda o **ponto de acesso** (do avatar, não da engrenagem solta).
- **Formato do menu:** mobile = bottom-sheet (padrão do `Modal`); desktop = popover/dropdown ao lado do avatar.

### 4.4 Navegação e fluxos (decisões de produto)

- **Rota** entra na tab bar (ação diária). **Cobranças / Atendidos / Gastos** continuam acessíveis pela Central (widgets) — registrado como decisão, não implementar agora.
- **Admin/Super no mobile:** o acesso a **Painel Admin** (admin/sócio) e **Empresas** (super_admin) fica no **menu do usuário** — a tab bar fica limpa (5 abas operacionais).
- **Admin/Super no desktop:** itens de admin permanecem na sidebar (seção "Administração").
- **Nav labels i18n:** `nav.central/clientes/contratos/caixa` já existem; criar `nav.rota` em pt/en/es. Sem "→" em labels; ícones lucide.

---

## 5. Decisões de produto (travadas — não alterar)

- Bottom nav mobile = **5 abas** (Central · Clientes · Contratos · Caixa · Rota), gated por módulo.
- Desktop = **sidebar fixa, sem header superior duplicado**.
- Config = **menu do usuário** (avatar), mantendo o `PreferenciasModal`.
- Identidade visual **inalterada** (tokens/cores/fontes/componentes) — reorganizar navegação, não redesenhar a marca.
- Melhoria de identidade = **fora de escopo** (futuro).

---

## 6. Regras obrigatórias (não pode faltar)

- **Tokens apenas:** `bg-card`, `bg-surface`, `text-text-muted`, `text-primary`, `bg-primary`, `bg-sidebar`, `text-sidebar-foreground`, `border-border` etc. — **nunca** cor hardcoded da paleta (`bg-blue-500` etc.).
- **Dark mode + 5 paletas:** tudo deve reagir ao `.dark` e às paletas via tokens.
- **Whitelabel:** onde usar `--color-primary`, o tenant futuro herdará (`--tenant-primary`) — não fixar cor.
- **Mobile-first:** alvos de toque `min-h-11`+/`min-h-16` na tab bar; grids colapsam.
- **i18n:** rótulos em **pt-BR, en, es** (arquivos `frontend/src/i18n/locales/*.json`).
- **Acessibilidade:** `aria-*` na tab bar, `role="navigation"`, `aria-current` na aba ativa, foco visível.
- **Ícones:** lucide-react.
- **Gating:** `hasModule` para todas as abas/entradas.
- **safe-area:** `env(safe-area-inset-bottom)` na tab bar (mobile).
- **Não regredir UI:** sem padrão legado (`rounded-md` em módulos, selects crus, cor fixa) — `npm run audit:ui` e `audit:styles` devem continuar passando.

---

## 7. Entregáveis esperados do Stitch

Desenhar (design + variações) no padrão Nexus, reutilizando os componentes/tokens existentes:

1. **Bottom Tab Bar (mobile)** — 5 abas, estados ativo/inativo, safe-area, exemplo com 5 e com 3-4 módulos ativos (gating).
2. **Topo fino mobile** — logo + avatar (menu do usuário).
3. **Sidebar desktop** — como hoje, **sem header duplicado**; rodapé com avatar + menu do usuário + Perfil/Sair/Configurações.
4. **Menu do usuário** — bottom-sheet (mobile) / popover (desktop): Perfil · Configurações · Sair.
5. **Fluxo das configurações** — como o `PreferenciasModal` (Modo/Cor/Idioma) fica acessado e integrado (não redesenhar o modal — só o ponto de acesso e a hierarquia).
6. **Observação de fluxo** — como a Rota entra na tab bar e como Cobranças/Atendidos/Gastos ficam visíveis na Central (sem nova tela).

> Referência visual: prints do app atual (navegação mobile/desktop e configurações) anexados pelo usuário.
