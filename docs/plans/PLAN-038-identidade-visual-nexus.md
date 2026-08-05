# PLAN-038 — Identidade Visual "Nexus" (port do Lovable) + sidebar lateral

**Status:** Concluído

**Versão:** 1.1

**Início:** 04/08/2026

**Última atualização:** 04/08/2026

**Roadmap:** evolução de marca do NX Gestão (whitelabel-ready)

---

## Objetivo

Substituir o visual "MVP/genérico" por uma **identidade de marca "Nexus"**: cérebro em rede neural (hub central), paleta moderna, tipografia com presença e **navbar lateral**. Fonte de referência: protótipo gerado no **Lovable** (`RafaCartaxo/site-personality-plus`) — o design foi **portado/adaptado** (não copiado): o NX Gestão segue em React Router + Tailwind v3.

## Conceito de marca

- **NX = Nexus** — a central que conecta vários negócios.
- **Logo:** malha de nós conectados formando a silhueta de um **cérebro**, com **hub central** (o Nexus) e o traço do "N" emergindo da rede. Nós de destaque usam o **accent** do tema (`--accent`) → acompanha tema e whitelabel.
- **Tipografia:** **Sora** para títulos (h1-h3, `--font-display`) + **Inter** para corpo.

## Escopo / entregas

| # | Entrega |
|---|---------|
| 1 | **Tokens de identidade** no `index.css` (modelo OKLCH do Lovable): `--brand-1/2/accent/far`, `--primary/accent/success/warning/danger/info` + soft/text, `--sidebar-*`, `--gradient-page/brand/text/mesh`, `--radius`, `--font-display`, `--tenant-primary` (hook whitelabel p/ tema "default"). **Aliases `--color-*` mantidos** para não quebrar componentes |
| 2 | `tailwind.config.js`: novos tokens (accent, muted, card, sidebar, ring, background/foreground) + `fontFamily.display` |
| 3 | **Logo Nexus**: `Logo` (mark, variantes lg/sm/mono) + `LogoLockup` (mark + "NX Gestão") — port do `NexusMark`; `favicon.svg` e `logo-nexus.svg` atualizados |
| 4 | **Sidebar lateral** (`AppLayout`): desktop fixa à esquerda (marca + nav vertical + usuário/configurações) + **drawer mobile** (hamburger); substitui a `Navbar` de topo (removida) |
| 5 | **Login/landing** redesenhado: logo Nexus grande + "NX Gestão" (gradiente) + tagline + card de acesso (i18n) |
| 6 | Polimento via tokens: fundo `--gradient-page`, botão primário em gradiente de marca, `PageHeader` em gradiente, Sora nos títulos |

## Decisões de design

| Decisão | Escolha |
|---------|---------|
| Tailwind | **v3** (adaptação de tokens; sem upgrade arriscado) |
| Fonte | Sora (display) + Inter (corpo) |
| Logo | Adotado o `NexusMark` do Lovable (mesmo conceito do briefing, melhor executado) |
| Sidebar | Desktop fixa `w-64` + mobile drawer (hamburger); conteúdo em `max-w-2xl` |
| Whitelabel | Hook `--tenant-primary` no tema "default" pronto; **backend de branding por empresa fica como próximo passo** (colunas `empresas.*` + `login`/`me` + painel super admin) |
| "Menos branco" | Fundo em gradiente, sidebar com marca, KPI/badges com tons suaves (`*-soft`), botão primário em gradiente — mantendo cor só para estado |

## Implementação

| Arquivo | Mudança |
|---------|---------|
| `frontend/src/index.css` | reescrito no modelo de tokens (OKLCH) + aliases legados + utilitários (`bg-brand-gradient`, `bg-mesh`, `text-brand-gradient`, `title-accent`, `value-lg`, `tabular`) |
| `frontend/tailwind.config.js` | novos tokens de cor + `fontFamily.display` |
| `frontend/index.html` | fonte Sora + Inter |
| `frontend/src/shared/components/Logo.tsx` | `Logo` (mark Nexus) + `LogoLockup` |
| `frontend/public/favicon.svg`, `logo-nexus.svg` | marca Nexus (duas cores) |
| `frontend/src/shared/layout/AppLayout.tsx` | **novo** — sidebar + drawer |
| `frontend/src/App.tsx` | `Navbar` → `AppLayout` |
| `frontend/src/shared/components/Navbar.tsx` | **removido** (substituído) |
| `frontend/src/modules/auth/pages/LoginPage.tsx` | login redesenhado com a marca |
| i18n (pt/en/es) | `auth.tagline`, `auth.loginCardSubtitle`, `auth.acessoEmpresa` |
| docs | `05-MAPEAMENTO-TELAS.md` v1.23 · UPDATES · este PLAN |

## Próximo passo (documentado)
**Branding por empresa (whitelabel)** — `--tenant-primary` já injetável; falta: colunas de branding em `empresas`, `login`/`me` devolvendo o branding, painel do super admin e aplicação no login/sidebar. (BR nova quando entrar.)

## Refinamentos pós-port (essência do mockup Lovable)
- **`PageHeader`** deixou de ser banner gradiente → **título limpo** (Sora 24-28px) + **badge de ícone suave** (`bg-primary-light`) + **eyebrow** opcional (Central mostra a data por idioma) + action/voltar. Aplica-se às 10 landings de uma vez.
- **`Card`** harmonizado: `rounded-xl border bg-card text-card-foreground` + prop `tone` (barra de tom à esquerda) e `interactive` (hover). Usos atuais inalterados (sem `tone`).
- **`KpiCard`** no estilo Lovable: Card com barra de tom + `label` (muted) + **`value-lg`** (Sora/tabular) + `hint` (subtitle); variants → tons (blue/info, green/success, yellow/warning, red/danger, gray/neutral); mantém `onClick`.
- **`QuickActions`**: novo layout **`grid`** (grade de cards com ícone em quadrado suave) + `vertical` alinhado; `horizontal` (pills) mantido.
- **Central**: seção **"Ações rápidas"** (Receber → `/cobrancas`, Minha rota → `/rota`, Novo cliente → `/clientes/novo`, Fechar caixa → `/caixa`), gated por módulo; `ClienteDetail` passa a usar o grid.
- **Sidebar**: seção **"Administração"** (label `admin.title`) agrupando **Painel Admin** (`admin.painel`) e **Empresas**, por papel.
- **Overscroll corrigido**: `overscroll-behavior-y: none` no `html/body` (não arrasta além da tela) + remoção do `background-attachment: fixed` (gradiente acompanha o conteúdo; quebra no iOS) + alturas em `100dvh` (login/layout).
- **Tema**: seletor em **bolinhas de gradiente + nome do tema atual** (linha compacta — alvo de toque grande) e o botão **claro/escuro ficou só com o ícone** (Sun/Moon).
- **Rota do dia**: `RotaCobrancaSection` **removida da Central** (a ação rápida "Minha rota" cobre a navegação); componente excluído.
- **Sidebar/drawer**: **marca no topo** (Logo + "NX Gestão" + X na mesma linha no drawer; barra mobile fina `py-2`) e seção **"Administração" visível sem scroll** (rodapé compacto + itens `min-h-10`).
- **Central com nova hierarquia**: **KPIs → Ações rápidas → Cobranças do dia** (estado → ação → fila). UC-001 e mapeamento §1 atualizados.

## Validação
- `npm run build` ✅ · `audit:styles` ✅ · `docs:audit` ✅ (sem endpoints novos) · manual no dev (login, sidebar desktop/mobile, temas, dark, whitelabel hook, Central com ações rápidas)

## Referências
- Protótipo de referência: `RafaCartaxo/site-personality-plus` (Lovable)
- `engineering/05-MAPEAMENTO-TELAS.md` v1.23
- Segue o PLAN-035 (identidade + branding) e os PLANs 033/034 (exposição de atraso)
