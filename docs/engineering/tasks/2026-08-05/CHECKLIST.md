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
- [x] `docs/plans/Lovable-Avatar-NXGestao.md` — briefing (padrão do `Lovable-Admin-NXGestao.md`)
- [x] `docs/plans/Lovable-Anexos-NXGestao.md` — briefing
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
- [ ] **Backup**: `/opt/scripts/backup-nxgestao.sh` + `deploy.sh` incluem `/data/uploads` · `06-PRODUCAO.md`
