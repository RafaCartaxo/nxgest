# CHECKLIST — Temas em componentes + Hero headers nos módulos (PLAN-035)

**Status:** Em andamento

**Data:** 03/08/2026

**Plano:** plans/PLAN-035-temas-componentes-e-hero-headers.md

**Roadmap:** product/04-ROADMAP.md §5.2 (evolução visual/whitelabel) — follow-up do PLAN-031

---

## Parte A — Migração de cores fixas para tokens

- [x] `shared/components/Button.tsx`: `variant="onDark"` + danger por tokens
- [x] `shared/components/Card/Card.tsx`: hover `border-primary` + dots por tokens (`primary/danger/success/warning/text-muted`)
- [x] `shared/feedback/FeedbackOverlay.tsx`: toasts por tokens
- [x] `shared/auth/ProtectedRoute.tsx` + `AdminRoute.tsx`: spinner `border-primary`
- [x] `shared/components/ErrorBanner/EstadoTela/SearchBar/SectionHeader`: por tokens
- [x] Formulários (ClienteNovo/Edit, ContratoNovo/Edit, Login, Perfil, OperadorForm, EmpresaForm, GastoForm, RotaPage): foco `focus:ring/border-primary`, erros `text-danger`, obrigatórios `text-danger`, inválido `border-danger`
- [x] Valores financeiros (CaixaPage, GastoList, GastosPeriodoModal): `text-success-text`/`text-danger-text`
- [x] Links/actions brand (ClienteDetail, ClienteNovo/Edit, ContratoNovo/Edit, SectionHeader): `text-primary`
- [x] Modais (EquipeModal, ContribuicaoModal) + ParcelaList: hover `border-primary`
- [x] Avisos (ContratoEdit bloqueio `text-warning-text`, PagamentoModal `text-warning`/`text-danger`)
- [x] `grep` de cores fixas da paleta em `frontend/src` → **LIMPO**

## Parte B — Hero header (PageHeader)

- [x] `shared/components/PageHeader/PageHeader.tsx` (banner gradiente, ícone, título, subtítulo, `action`, `back`)
- [x] Central (`LayoutDashboard`) · Clientes (`Users`, ação Novo Cliente) · Contratos (`FileText`, ação Novo Contrato)
- [x] Caixa (`Wallet`, ação Fechar Semana) · Gastos (`Receipt`)
- [x] Cobranças (`ClipboardList`, título dinâmico, ação Ver na Rota) · Rota (`Route`, status GPS + fechar no header) · Atendidos (`CheckCircle2`)
- [x] Administração (`Settings`, título dinâmico, badge, voltar em empresa) · Empresas (`Building2`, refatorado, ação Nova Empresa)
- [x] i18n subtítulos (pt-BR/en/es)
- [x] Páginas novo/editar/detalhe mantêm header compacto (fora de escopo)

## Parte C — Documentação e registro

- [x] `docs/plans/PLAN-035-temas-componentes-e-hero-headers.md`
- [x] `02-DESIGN-SYSTEM.md`: proibição de cores fixas + padrão de header (PageHeader × compacto)
- [x] `05-TOKEN.md`: foco `focus:ring-primary` + nota de proibição
- [x] `05-MAPEAMENTO-TELAS.md`: seções reordenadas/renumeradas alinhadas à tabela Visão Geral; rótulo `/cobrancas` corrigido; `**Header:**` por tela; Checklist de Novas Telas reescrito
- [x] `UPDATES.md` (entrada PLAN-035)
- [x] Este CHECKLIST + `plans/README.md`

## Parte D — Guarda e validação (UCs 073–078)

- [x] `scripts/audit-styles.mjs` + `npm run audit:styles`
- [x] UCs 073–078 em `06-CASOS-DE-USO.md` (tema em componentes, hero operador, hero gestão, i18n, contraste, regressão)

---

## Resultados de validação

- [x] `npm run audit:styles` → limpo (98 arquivos)
- [x] `npm run build` → OK (tsc + vite build)
- [x] `npm run docs:audit` → limpo (20 rotas front / 20 telas mapeadas)
- [x] **Deploy em produção** (`https://nxgestao.duckdns.org`, commit `dce7ca0`):
  - [x] `git pull` + `./scripts/deploy.sh` no VPS → imagem reconstruída, `nxgest-app-1` recriado
  - [x] Backup pré-deploy validado ("Backup válido (usuarios > 0)") — `gestao-20260803-182652.db`
  - [x] `/api/health` → `{"status":"ok","db":"connected"}`
  - [x] Homepage HTTP 200 servindo bundle novo (`index-r5-ZNT9R.js`)
  - [x] Nota: o deploy levou junto o trabalho de **PLAN-033/034** (atraso), que ainda não estava no VPS

### Validações manuais de UI (pendentes — UCs 073–078)

- [ ] UC-073: tema muda foco/links/hover/dots/toasts; semânticos fixos
- [ ] UC-074: hero nas 8 telas do operador (ícone+título+subtítulo+ações), mobile ok
- [ ] UC-075: hero na gestão (badge, voltar em empresa, título dinâmico, Nova Empresa)
- [ ] UC-076: subtítulos em PT/EN/ES
- [ ] UC-077: contraste claro/escuro × 5 paletas
- [ ] UC-078: regressão headers compactos (novo/editar/detalhe/perfil/login)

---

# CHECKLIST — Whitelabel: enforcement de módulos no backend (PLAN-036 / P024)

**Data:** 03/08/2026

**Plano:** plans/PLAN-036-whitelabel-enforcement-backend.md

## Backend

- [x] `src/shared/middleware/module.middleware.ts`: `requireModule(id)` — empresa efetiva (token p/ tenant; `?empresaId=` p/ super_admin), lê `empresas.modulos`, 403 `MODULE_DISABLED`; sem `modulos` = todos ativos
- [x] `src/main.ts`: `requireModule` no mount de `clientes`, `contratos`, `caixa`, `gastos`, `pagamentos` (=contratos)
- [x] `operacoes.routes.ts`: `POST /visitas` → rota; `GET /historico-atrasos` → cobrancas

## Frontend

- [x] i18n `errors.MODULE_DISABLED` (pt/en/es)

## Documentação

- [x] `PLAN-036` · `BR-093` (enforcement) · `02-API.md` · `07` (API-CT-106..110) · `06` (UC-079) · `BACKLOG.md` (P024) · `plans/README.md` · `04-ROADMAP.md` · `UPDATES.md`
- [x] Status stale corrigidos: `PLAN-016` e `FEATURE-temp` → Concluído
- [x] Fix `scripts/audit-docs.mjs` (regex de `main.ts` com middleware de parênteses) + fix bug do `--baseUrl` no `smoke-api.mjs`

## Revisão de casos (gap e cenários alternativos)

- [x] `07`: **API-CT-111..116** — sócio gated; `modulos: []` → 403 em todas as rotas operacionais; efeito imediato no backend (mesmo token); sem bypass por `?empresaId=`; pagamentos=contratos; `?empresaId=` inexistente → 404
- [x] `06`: **UC-080** (efeito imediato com sessão ativa) e **UC-081** (Central se adapta — **gap**)
- [x] `smoke`: **MOD-098** (sócio + efeito imediato + sem bypass) e **MOD-099** (só central)
- [x] **Follow-up P025** registrado (`BACKLOG.md`): Central não adapta por módulo (UC-081)

## Validação

- [x] `npm run build` → OK
- [x] `npm run docs:audit` → limpo (43 rotas, 20 telas)
- [x] Teste real isolado (PORT=3002): off → 403 `MODULE_DISABLED`; ativo → 200; compartilhado → 200; super admin sem/com `?empresaId=`
- [x] `smoke:api` → **107/107** (MOD-097/098/099 + OPS-040)
- [x] **Bug de fuso corrigido:** `date(h.createdAt, 'localtime')` no `operacoes.repository.impl.ts` (UTC × local divergia à noite → visita não refletia)

---

# CHECKLIST — Coerência do whitelabel (PLAN-037 / P025)

**Data:** 04/08/2026

**Plano:** plans/PLAN-037-coerencia-whitelabel-central-adapta.md

## Dependências (combos coerentes)

- [x] Backend `modules.ts`: `contratos ⇒ clientes` + `dependenciasFaltantes` (transitivas) no `validateModulos`
- [x] Frontend `modules.ts`: `contratos` com `dependsOn: ["clientes"]` (propaga ao ModulosModal)
- [x] Validado: `["contratos"]` → 422 "requer: clientes"; `["rota"]` → 422 "requer: contratos, clientes" (transitiva); `["clientes","contratos"]` → 200

## Central adapta (P025)

- [x] `OperacoesDashboard`: KPIs financeiros gated por `contratos`; "Pendentes do Dia" + clientes pendentes por `cobrancas`; skip de `listarCobrancasDoDia`/`listarPagamentosHoje` (sem contratos) e `listGastos` (sem gastos); estado vazio `centralVazia`
- [x] `IndicadoresCards`: prop `hideCobrancas`
- [x] i18n `operacoes.centralVazia` (pt/en/es)

## Documentação

- [x] `PLAN-037` · `BR-092` (dependências transitivas) · `07` (API-CT-117/118) · `06` (UC-081 sem gap) · `BACKLOG.md` (P025) · `plans/README.md` · `04-ROADMAP.md` (visão F2-F4 multi-negócio) · `UPDATES.md`

## Validação

- [x] `npm run build` → OK
- [x] `npm run docs:audit` → limpo
- [x] `smoke:api` → **107/107**
- [x] Teste real isolado: 422 dependência + transitiva; combos válidos → 200
