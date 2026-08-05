# PLAN-043 — Polimento final da identidade "Nexus" (pingos nos i)

**Status:** Concluído

**Versão:** 1.0

**Início:** 05/08/2026

**Última atualização:** 05/08/2026

**Roadmap:** identidade visual "Nexus" (follow-up do PLAN-038/039/040) + estabilidade

---

## Objetivo

Fechar a cobertura da identidade "Nexus": migrar as superfícies que ainda usavam o padrão antigo (`rounded-md`, rows `bg-surface`, inputs cru) para o padrão canônico, corrigir o layout do `QuickActions` (botões empilhados), consolidar tema/idioma/claro-escuro na navbar, e corrigir a documentação stale do pré-038.

## Escopo

| # | Entrega |
|---|---------|
| 1 | ANTIGO → novo: `GastoForm`, `GastoList`, `SearchBar`, `SuccessState`, `ErrorBanner` |
| 2 | Inputs → `Field`/canônico + botões → `Button`: Perfil, Login, Caixa (ajuste), OperadorDetail, ContratoDetail (estorno), Rota (data promessa), PagamentoModal, "usar local atual" |
| 3 | Rows/listas → `Card`/`rounded-xl bg-card`: Caixa (histórico de ajustes + movimentações), EquipeModal, ContribuicaoModal, AtendidosPage, ContratoDetail (pagamentos), **CobrancaCard detail (Rota)** |
| 4 | Skeletons `bg-secondary-light` → `bg-surface-hover` (7 arquivos) |
| 5 | **Navbar com 3 dropdowns** (tema claro/escuro + paletas + idioma) no topo mobile+desktop (`Topbar`); controles removidos do rodapé da sidebar |
| 6 | **Fix layout QuickActions**: grade adapta ao nº de ações (3 → lado a lado); auditoria de itens "adicionados depois" com layout quebrado (ex.: badge GPS da Rota com texto branco invisível no PageHeader novo) |
| 7 | Docs stale: MAPEAMENTO (Header notes, §13, Perfil), DS (Header de página, "navbar ativo"), TOKEN, 06-CASOS (UC-019), 07-FORMS-INPUTS |

## Gaps encontrados na execução (corrigidos)

- **Badge GPS da Rota invisível:** o PageHeader novo (fundo claro) recebia o badge GPS com texto branco (`text-white/80`) — estilo do banner antigo. Corrigido para tokens semânticos (`success-light`/`surface-secondary`).
- **`LoginPage` não estava no mapa migrado** — migrado para `Field` (com `right` para mostrar/ocultar senha).

## Decisões de design

| Decisão | Escolha |
|---------|---------|
| Dropdowns da navbar | **3 dropdowns separados** (claro/escuro · paletas · idioma) no topo (mobile + desktop), via `Topbar`; cada um com seu menu |
| Inputs em linha (ajuste de caixa) | inputs canônicos (`min-h-12 rounded-xl border-strong`) + `Button` — mesmo padrão do `Field`, sem o wrapper de label em linhas compactas |
| Rows de listas | `rounded-xl border bg-card` (mesmo token de card) — mantém `hover:border-primary` |
| QuickActions | colunas **adaptativas ao nº de ações visíveis** (1/2/3 → colunas 1/2/3; 4+ → 2×2 mobile / 4 desktop) |

## Validação
- `npm run build` ✅ · `npm run audit:styles` ✅ (100 arquivos) · `npm run docs:audit` ✅ · `smoke:api` ✅

## Referências
- `PLAN-038` (tokens/sidebar) · `PLAN-039` (Field) · `PLAN-040` (admin)
- `engineering/07-FORMS-INPUTS.md` (mapa concluído) · `engineering/design/02-DESIGN-SYSTEM.md` (DS v2)
