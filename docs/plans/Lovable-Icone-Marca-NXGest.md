# Lovable — Ícone e Marca: "N" limpo, centralizado e preenchido

**Versão:** 1.2

**Data:** 08/08/2026

**Status:** ✅ Portado (10/08, v1.1 + v1.2) — geometria nova no app real: `frontend/src/shared/components/Logo.tsx` (+ prop `boxed`) · `frontend/src/shared/theme/favicon.ts` · `frontend/public/favicon.svg` + PNGs PWA + `favicon.ico` · **variante `sm` (a LOGO: N + malha + hub)**.

**Fonte (protótipo):** `RafaCartaxo/site-personality-plus` commit `f5a8156` (10/08) — `src/components/brand/NexusMark.tsx` + `public/favicon.svg` (usado como **referência visual**; port mantém API `Logo`/`LogoLockup` do app real).

> Refinar o ícone/marca Nexus. **Regra de ouro:** estado-alvo (como deve ficar), mantendo a identidade Nexus (malha de nós + hub + "N"). Referência atual: `frontend/src/shared/components/Logo.tsx` · `frontend/src/shared/theme/favicon.ts` · `frontend/public/favicon.svg` + ícones PWA.

## Problemas atuais (confirmados 08/08)
1. Favicon (dinâmico `favicon.ts` **e** estático `favicon.svg`): fundo com cantos arredondados (`rx=26`) → no navegador os **cantos ficam transparentes** (não é full-bleed).
2. O "N" fica **abaixo do centro** (embutido na malha, y≈46–84 num box de 124; a haste do tronco desce até a base).
3. Em 16–32px a malha cheia é **indecifrável** — não se lê o "N".

## Estado-alvo
- **Ícone (favicon/app icon):** um **"N" limpo e legível**, **centralizado**, dentro de um **quadrado preenchido** com cantos levemente arredondados (~22% do lado, estilo app icon) — **sem cantos transparentes** (full-bleed).
  - Fundo: `--color-primary` · N/traço: `--color-primary-foreground` · nós quentes/hub: `--color-accent`.
  - Manter a identidade Nexus (nós conectados + hub), mas **simplificada** para legibilidade a 16px (poucos nós, N evidente).
- **Logo transparente** (login/sidebar): o "N" **centralizado e balanceado** (sem a haste deslocada), visível sobre o gradiente da página.
- **Funciona em:** 16px (favicon) · 32px · 57px (app icon) · tamanhos grandes (login). Dark + 5 paletas + whitelabel.

## Regras
- Só tokens (sem cor fixa da paleta) · mesma geometria reutilizada entre ícone e logo · a11y (`aria-label`).
## Entregáveis

- O desenho do ícone (N centralizado + fundo full-bleed) **e** a geometria (nós/arestas) para portar nos 3 lugares: `Logo.tsx` · `favicon.ts` · `favicon.svg` (+ regenerar PNGs PWA: icon-192/512/maskable/apple-touch).
- Variações: 16px · 32px · 57px · logo transparente · dark · 5 paletas.

## Port-back (10/08) — no jeito do app real

- **`Logo.tsx`**: geometria nova (viewBox `0 0 64 64`, "N" primário + malha decorativa + hub accent) mantendo a API `Logo`/`LogoLockup` (`variant: lg|sm|mono`) — consumidores intactos (`LoginPage`, `PublicPageShell`, `QueroConhecerPage`, `AppLayout`). Nova prop `boxed` (fundo `--color-primary` full-bleed + `rx=14`, app icon). Title padrão **"NX Gest"** (marca atual).
- **`favicon.ts`**: geometria nova theme-aware (dark + 5 paletas + whitelabel), **full-bleed sem `rx`** — resolve os cantos transparentes.
- **`favicon.svg`** (estático): quadrado full-bleed, cores literais da paleta default (`#1D3F9E`/`#F3F6FF`/`#2DD4BF`).
- **PNGs PWA**: regenerados do favicon novo via ImageMagick (192/512/maskable 512/180).
- **Não portado** (fora de escopo): correção `admin.index.tsx` do protótipo (`schema.catch` — AdminPage real não usa zod-adapter) e página `/design` (rota inexistente no app).

## Port-back v1.2 (10/08) — a LOGO, não o "N" isolado

**Problema (relatado em validação):** os ícones usavam a variante **`mono`** (só o "N" + hub, sem malha) → no atalho da tela inicial o ícone parecia "N genérico/letra inicial" e pequeno.

**Correção:**
- **Ícones agora usam a variante `sm`** — a **LOGO** (N + 3 nós de malha `[9,27][55,25][32,57]` + 4 arestas + hub), ocupando ~83% da largura (antes ~54%). Aplicada em `favicon.ts`, `favicon.svg`, `favicon.ico` e todos os PNGs (icon-192/512, maskable, apple-touch).
- **`favicon.ts`**: seletor corrigido para `link[rel="icon"][type="image/svg+xml"]` (o `.ico` estático fica intocado como fallback do atalho — antes sobrescrevia o primeiro link, caindo na "letra inicial" no Android).
- **Cores resolvidas para `rgb()`** via probe element (o rasterizador de ícone do Android/shortcut não aceita `oklch()`/`var()` no SVG — precedente: "N solto com fundo branco").
- **`favicon.ico`** criado (256/64/48/32/16) + link no `index.html`.
- **Service worker mínimo** (`public/sw.js`, registro no `main.tsx`): torna o site PWA instalável no Android → o atalho usa o manifest (ícone correto de vez). iOS não requer SW (usa `apple-touch-icon` como web clip).
- **`manifest.webmanifest`**: adicionado `"id": "/"`.
- **Service worker só em produção** (refinamento 10/08): `main.tsx` registra `sw.js` apenas com `import.meta.env.PROD` — em dev (cert auto-assinado/IP local) o SW não registra, voltando os testes locais a limpo; bump `CACHE` `nxgest-v1`→`nxgest-v2` invalida o cache antigo já gravado no browser.
- **Cobertura**: iOS via `apple-touch-icon` (logo `sm`) ✅ · Android via manifest + SW + favicon corrigido ✅ · desktop via favicon.ico/svg ✅.
