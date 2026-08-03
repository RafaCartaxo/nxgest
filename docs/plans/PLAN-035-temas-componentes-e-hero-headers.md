# PLAN-035 — Temas em componentes + Hero headers nos módulos

**Status:** Concluído

**Versão:** 1.0

**Início:** 03/08/2026

**Última atualização:** 03/08/2026

**Roadmap:** product/04-ROADMAP.md §5.2 (evolução visual/whitelabel) + follow-up do PLAN-031

---

## Objetivo

1. **Fazer o tema "pegar" nos componentes** — eliminar as cores fixas da paleta (`blue/red/green/yellow/gray-*`) que contornavam os tokens do PLAN-031 e deixavam o tema mudar pouco.
2. **Replicar o banner hero do Super Admin nos títulos dos módulos** — header em gradiente com ícone + título + subtítulo nas landings de operador e gestão.

## Escopo

| # | Entrega |
|---|---------|
| 1 | Migrar ~150 classes fixas da paleta para tokens (`primary`/`danger`/`success`/`warning`/`text-muted`) em `frontend/src` |
| 2 | Semânticos fixos (regra de ouro); `primary`/gradientes passam a variar por paleta além do botão e navbar |
| 3 | Componente `PageHeader` (banner gradiente: ícone + título + subtítulo + ação + voltar) extraído do padrão do Super Admin |
| 4 | Aplicar nas 10 landings (Central, Clientes, Contratos, Caixa, Gastos, Cobranças, Rota, Atendidos, Administração, Empresas) |
| 5 | Botão `variant="onDark"` (branco sobre gradiente) para ações no header |
| 6 | Subtítulos i18n novos (PT/EN/ES) |
| 7 | Guarda automatizada `scripts/audit-styles.mjs` + `npm run audit:styles` — falha se surgir cor fixa da paleta |
| 8 | UCs 073–078 de validação em `06-CASOS-DE-USO.md` |

**Fora de escopo:** páginas de novo/editar/detalhe (header compacto preservado); tint semântico por paleta (decisão registrada: manter fixo); backend/API.

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Cores brand | `blue-*` → `primary` (foco, links, hovers, dots, spinners, toasts) | Passam a seguir a paleta — é o que faz o tema "mudar" |
| Cores semânticas | `red/green/yellow-*` → `danger/success/warning` (fixos) | Regra de ouro do design-system; consistência de erro/sucesso entre paletas |
| Header dos módulos | Banner `bg-gradient-accent` compartilhado (`PageHeader`) | Mesmo padrão do Super Admin (PLAN-031), que era o único com destaque |
| Ações no header | `Button variant="onDark"` (branco) | Contraste sobre o gradiente nos 2 modos × 5 paletas |
| Guarda de regressão | `audit-styles.mjs` (grep) | Invariante barato, no padrão do `audit-docs.mjs` (SKILL-009) |
| Páginas de novo/editar/detalhe | Header compacto (`< Back Título [Ação]`) | Evita "glitter" por tudo e preserva navegação de voltar |

## Implementação

### Frontend
| Arquivo | Mudança |
|---------|---------|
| `shared/components/PageHeader/PageHeader.tsx` | Novo componente (banner gradiente, ícone, título, subtítulo, `action`, `back`) |
| `shared/components/Button.tsx` | `variant="onDark"` + danger via tokens |
| `shared/components/Card/Card.tsx` | Hover `border-primary` + dots por tokens |
| `shared/feedback/FeedbackOverlay.tsx` | Toasts por tokens (`primary/success/danger/warning/info`) |
| `shared/auth/*Route.tsx`, `shared/components/*` | Spinners/links/erros por tokens |
| 10 landings (`OperacoesDashboard`, `ClienteList`, `ContratoList`, `CaixaPage`, `GastoPage`, `CobrancaListPage`, `RotaPage`, `AtendidosPage`, `AdminPage`, `SuperAdminPage`) | Usam `PageHeader` |
| Formulários e modais | Foco `focus:ring/border-primary`; validação `text-danger`; valores `text-danger-text`/`text-success-text` |
| i18n (pt-BR/en/es) | Chaves `*.subtitle` novas |

### Scripts
| Arquivo | Mudança |
|---------|---------|
| `scripts/audit-styles.mjs` | Novo — falha se houver classe fixa da paleta em `frontend/src` |
| `package.json` | `npm run audit:styles` |

## Regras de negócio
| BR | Descrição |
|----|-----------|
| (UX) | Nenhuma cor fixa da paleta em componentes — `blue→primary`, `red→danger`, `green→success`, `yellow→warning`, `gray→text-muted` |
| (UX) | Header de landing = `PageHeader` (banner gradiente); header de novo/editar/detalhe = compacto |
| (UX) | Semânticos fixos entre paletas; apenas `primary` e gradientes variam |

## UCs de validação
`product/06-CASOS-DE-USO.md` UC-073..078 (tema em componentes, hero operador, hero gestão, i18n, contraste, regressão).

## Documentação atualizada (matriz SKILL-009)
- `02-DESIGN-SYSTEM.md` (regra de cores fixas + padrão de header em banner)
- `05-TOKEN.md` (uso do primary em foco) · `05-MAPEAMENTO-TELAS.md` (headers por tela + reindexação + checklist de novas telas)
- `06-CASOS-DE-USO.md` (UC-073..078) · `UPDATES.md` · `plans/README.md`

## Validação
- `npm run audit:styles` ✅ · `npm run build` ✅ · `npm run docs:audit` limpo (alvo)

## Referências
- `engineering/design/02-DESIGN-SYSTEM.md`, `05-TOKEN.md`, `06-UI-PATTERNS.md`
- `plans/PLAN-031-temas-modulos-whitelabel.md` (origem dos tokens e do banner)
- `product/06-CASOS-DE-USO.md` UC-073..078
