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
  - [x] `git pull` + `./scripts/deploy.sh` no VPS → imagem reconstruída, `nxgestao-app-1` recriado
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
