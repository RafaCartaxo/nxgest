# CHECKLIST — Fix switch + engrenagem + coerência do grafo (PLAN-046)

**Data:** 05/08/2026

- [x] Switch do ModulosModal: `overflow-hidden` + `left-0` (bolinha não sai do pill)
- [x] Topbar → engrenagem única (`Settings`): Tema (alterna direto) · Cores (5 paletas) · Idioma (PT/EN/ES, selecionado visível no trigger) · `rounded-xl`/tokens
- [x] CT-118 corrigido (`rota ⇒ cobrancas`) · CT-119 novo (`atendidos ⇒ cobrancas`)
- [x] UC-055 atualizado (grafo refinado)
- [x] Smoke MOD-100/101 (422 novas deps) — **smoke 109/109**
- [x] `npm run build` · `audit:ui` · `audit:styles` · `audit:modules` · `docs:audit`

---

# CHECKLIST — Modularização pro whitelabel real (PLAN-045)

**Data:** 05/08/2026

## Module Manifest

- [x] Backend `modules.ts`: `MODULE_MANIFEST` (labelKey/surfaces/dados/widgets/capacidades/dependsOn/ucs); ALL_MODULES + DEFAULT_MODULOS + MODULE_DEPENDENCIES derivados; grafo refinado (`rota/atendidos ⇒ cobrancas`)
- [x] Frontend `modules.ts`: `MODULE_WIDGETS` + `isWidgetActive` + ícones + `dependsOn`
- [x] `npm run audit:modules` (7 módulos, grafo ok, 13 widgets) — gate no deploy

## Central composável

- [x] `OperacoesDashboard`: KPIs/ações/pendentes/atendidos via `isWidgetActive` (fim do gating manual por `hasModule`)
- [x] Fix dead-end: `SuccessState` "Ver resumo → /atendidos" só com `atendidos` ativo (link opcional no componente)

## Docs

- [x] `08-UC-MODULOS.md` (matriz UC/CT × módulo) · `ADR-006` (manifest) · BR-092/093 · DS (Central composável) · UI-COVERAGE (template de novo módulo) · PLAN-045 · UPDATES · INDEX

## Validação

- [x] `npm run build` · `audit:ui` · `audit:styles` · `audit:modules` · `docs:audit` · `smoke`

---

# CHECKLIST — Governança de UI / Anti-drift (PLAN-044)

**Data:** 05/08/2026

## Guardrails

- [x] `scripts/audit-ui.mjs` + `npm run audit:ui` (falha em padrões legado) — gate no `deploy.sh`
- [x] `scripts/consumers.mjs` (lista consumidores de componente compartilhado)
- [x] Protocolo de shared-component no DS + AGENTS.md
- [x] `UI-COVERAGE.md` (inventário canônico: 19 telas, componentes, padrões, legado)
- [x] Checklist para Novas Telas corrigida (raiz B — `rounded-md` → `Field`/canônico)
- [x] ADR-005 (5 raízes do débito + guardrails)
- [x] Template de PLAN de UI/módulo novo (DS — critérios de conclusão)

## Correções imediatas

- [x] RotaPage modal comprovante (`rounded-xl bg-card`)
- [x] UC-074 (banner em gradiente → PageHeader limpo)
- [x] `04-UI-COMPONENTS.md` (componentes canônicos + Field/Topbar)
- [x] `AGENTS.md` (audit:ui/audit:styles + protocolo)

## Validação

- [x] `npm run audit:ui` (100 arquivos, 0 legado) · `npm run audit:styles` · `npm run docs:audit` · `npm run build` · `smoke`

---

# CHECKLIST — Polimento final da identidade "Nexus" (PLAN-043)

**Data:** 05/08/2026

## Frontend (padrão canônico)

- [x] ANTIGO → novo: `GastoForm` (Field + select + Button), `GastoList` (Card + Trash2), `SearchBar`, `SuccessState`, `ErrorBanner`
- [x] Inputs → Field/canônico: Perfil, Login, Caixa (ajuste), OperadorDetail, ContratoDetail (estorno), Rota (date promessa), PagamentoModal; botões → Button (incl. "usar local atual" em ClienteNovo/Edit)
- [x] Rows → Card/rounded-xl bg-card: Caixa (auditoria + movimentações), EquipeModal, ContribuicaoModal, AtendidosPage, ContratoDetail (pagamentos), CobrancaCard detail (Rota)
- [x] Skeletons `bg-secondary-light` → `bg-surface-hover` (7 arquivos)
- [x] **Navbar 3 dropdowns** (`Topbar`): tema claro/escuro + paletas + idioma (mobile+desktop); removidos do rodapé da sidebar
- [x] **QuickActions grid adaptativo** (3 ações lado a lado) + fix badge GPS da Rota (texto branco invisível)

## Docs stale

- [x] `05-MAPEAMENTO`: Header notes → PageHeader limpo (sem "banner em gradiente"); §13 SuperAdmin; Perfil (sidebar, sem Navbar)
- [x] `02-DESIGN-SYSTEM`: seção "Header de página" reescrita; "navbar ativo" → sidebar
- [x] `05-TOKEN`: `--gradient-accent` sem navbar/banner
- [x] `06-CASOS`: UC-019 (RotaCobrancaSection removida)
- [x] `07-FORMS-INPUTS`: mapa **concluído**

## Validação

- [x] `npm run build` · `npm run audit:styles` (100 arquivos) · `npm run docs:audit` · `smoke:api`

---

# CHECKLIST — Estabilidade (fix BR-091 + hardening middleware + anti-flakiness)

**Data:** 05/08/2026

## Fixes

- [x] **BR-091 (regressão PLAN-032):** `admin.controller.ts` — dashboard de admin self agregava só o próprio (`req.userId!`); corrigido para agregar a **equipe** por empresa. Verificado: admin self → totalClientes=50/contratos=50 (equipe) no seed.
- [x] **`equipe` recebidoHoje por operador (bug novo):** `admin.repository.impl.ts` usava `and(...userIds.map(eq))` (sempre falso com >1 usuário) → per-operador sempre 0; corrigido para `inArray`.
- [x] **`requireModule` try/catch:** `module.middleware.ts` — erro de DB → `next(err)` (Express 4 não captura rejeição async; antes deixava request pendurado/unhandled rejection).
- [x] **Smoke MOD-097/098/099:** restore de `modulos` em `try/finally`.
- [x] **Smoke EQ-088:** asserções de regressão BR-091 (admin self = equipe agregada; recebidoHoje com tolerância de float).

## Registro

- [x] BACKLOG P024: observações de design (enforcement parcial cobranças/atendidos; super admin `?usuarioId=` sem `?empresaId=`).

## Validação

- [x] `npm run build` · `npm run docs:audit` · `smoke:api` **107/107**

---

# CHECKLIST — Planos de identidade visual (PLAN-041/042) + briefings Lovable

**Data:** 05/08/2026

**Status:** Planejamento (documentação criada; implementação pendente)

## Entregáveis

- [x] `docs/plans/PLAN-041-avatar-foto.md` — Avatar com foto (usuário/operador/cliente): componente `Avatar`, `processarImagem` (data URL ≤200px), `usuarios.foto`/`clientes.foto`, `PATCH /api/auth/foto`, mapa de superfícies, nota do `CobrancaCard` (fora de escopo)
- [x] `docs/plans/PLAN-042-anexos-cliente.md` — Anexos do cliente: tabela `anexos`, `/data/uploads`, `multer` + limites (imagem ≤1MB / PDF ≤5MB / 413 global), endpoints escopados, **backup inclui uploads**
- [x] `docs/plans/Lovable-Avatar-NXGest.md` — briefing (padrão do `Lovable-Admin-NXGest.md`)
- [x] `docs/plans/Lovable-Anexos-NXGest.md` — briefing
- [x] `docs/plans/README.md` — PLAN-038/039/040/041/042 no registro (status: 038 Concluído · 039 Em andamento · 040 Concluído · 041/042 Planejado)
- [x] `docs/UPDATES.md` — entrada de registro

## Coerência (verificar quando implementar)

- [ ] DS v2: seção **Avatar** + nota de Anexos
- [ ] `05-MAPEAMENTO-TELAS.md`: foto na Sidebar/ClienteCard/ClienteDetail + seção Anexos no §5
- [ ] `02-API.md` + `07-CASOS-DE-USO-API.md`: `PATCH /api/auth/foto`, `foto` em operadores/clientes, endpoints de anexos (limites 413/422, escopo cross-tenant)
- [ ] `06-CASOS-DE-USO.md`: UC de foto + UC do operador anexando comprovante
- [ ] `02-BUSINESS-RULES.md`: BR-101 (foto) e BR-102 (anexos)
- [ ] `npm run build` · `npm run audit:styles` · `npm run docs:audit` ao implementar

## Pendências operacionais (PLAN-042)

- [ ] `multer` no `package.json` · `Dockerfile` cria `/data/uploads`
- [ ] **Backup**: `/opt/scripts/backup-nxgest.sh` + `deploy.sh` incluem `/data/uploads` · `06-PRODUCAO.md`

---

# CHECKLIST — Identidade visual "Nexus" (PLAN-047 consolidado — antigos 047/048/049)

**Data:** 05/08/2026

## Card de cobrança (referência Lovable)
- [x] `CobrancaCard` display: tone bar + nome + `bairro · Parcela X de Y` + `StatusBadge` + "N dias de atraso" + `value-lg` + chevron (interativo só com `onClick`); **sem avatar**
- [x] Fila/Central: display + clique → rota (ações só na Rota — decisão de produto)
- [x] i18n `operacoes.parcelaDe` + `operacoes.diasAtraso_*` (pt/en/es)
- [x] Backend `diasEmAtraso` no `CobrancaItem` (subquery julianday) + CT OPS-018 estendido

## Switch / ModulosModal v2 / Admin
- [x] `Switch` canônico (`shared/components/Switch`) — track h-7 w-12, knob centralizado, inativo bg-muted
- [x] ModulosModal: `descricaoKey` por módulo · linha Central sempre ativa (badge) · **auto-completar deps na abertura** · **cascata-off** no toggle off
- [x] `OperadorDetail` → `ContratoCard list-item` navegável (`?usuarioId=&empresaId=`)

## Modal (assinatura Lovable + bottom-sheet) e componentes
- [x] `Modal`: `title`/`descricao`/`footer` + bottom-sheet mobile (`items-end sm:items-center`, `rounded-t-xl sm:rounded-xl`, `max-h-[90vh]`) + keyframe `slideInFromBottom`
- [x] **Sweep de 14 consumidores** (header/footer inline → props do Modal)
- [x] `ConfirmModal` e estorno ganham X de fechar padrão (comportamento novo)
- [x] `FieldSelect` + `FieldTextarea` (fieldControl compartilhado) · migrados 3 `<select>` (OperadorForm, GastoForm)
- [x] `Tabs` compartilhado · migradas pills do AdminPage
- [x] `EstadoTela` unificado (loading spinner card; erro/vazio com ícone em círculo)
- [x] `PageHeader` (icon size-11 rounded-xl, título 28px) · `SectionHeader` (font-display 22px)
- [x] `StatusBadge` com dot (pill rounded-md) · `ParcelaList` usa StatusBadge (Vencida/Vence hoje/Paga/Parcial/Pendente)

## Anti-drift e docs
- [x] `audit:ui` estendido: `<select>`/`<textarea>` cru · header inline de modal · `role="tab"` fora do Tabs · `<Modal>` sem `title`
- [x] Fix de revisão: `Card.Root` da Rota voltou a `variant="collection"` (padding duplo com `p-4` do default)
- [x] `AGENTS.md` (descrição do audit + convenção de UI)
- [x] `04-UI-COMPONENTS.md` v1.7 · `06-PRODUCAO.md` (gates) · `Lovable-NXGest.md` superseded · `UI-COVERAGE.md`
- [x] `npm run audit:ui` limpo (105 arquivos)
