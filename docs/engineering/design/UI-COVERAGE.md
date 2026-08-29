# UI COVERAGE — Inventário canônico de superfícies (PLAN-044)

**Status:** Ativo — manter atualizado a cada tela/componente novo ou redesign

**Última atualização:** 17/08/2026

**Objetivo:** ser o **mapa único** de cobertura da identidade "Nexus". Evita o débito invisível que o redesign deixou (raiz A do ADR-005): o critério de "está redesenhado" é **todo elemento segue o DS**, não "a página tem PageHeader". Rastreia também itens legado/planejados — nada fica invisível.

> **Como manter:** a cada tela nova/alterada ou componente novo, atualizar as tabelas abaixo + rodar `npm run audit:ui` + `npm run audit:styles` + `npm run docs:audit`.

---

## 1. Padrões → componente canônico

| Padrão | Usar (canônico) | Nunca (legado) |
|---|---|---|
| Input / textarea | `Field` (`shared/components/Field`) | `rounded-md border px-3 py-2` cru |
| Select / date | `Field` ou select `min-h-12 rounded-xl border-border-strong` | `rounded-md` cru |
| Card / row | `Card.Root` ou `rounded-xl border border-border bg-card` | `rounded-md bg-surface`, `border-l-4` |
| Header de landing | `PageHeader` (título limpo + badge de ícone + eyebrow) | banner `bg-gradient-accent` |
| KPI | `KpiCard` | divs cruas |
| Skeleton | `bg-surface-hover` | `bg-secondary-light` |
| Badge | `StatusBadge` | spans crus |
| Ações rápidas | `QuickActions` (grade adaptativa) | grid fixo `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` |
| Botão | `Button` / `ButtonLink` | `<button>` inline com estilo próprio |
| Modal | `Modal` base | overlay custom cru |

## 2. Telas (28) — status de cobertura

| # | Tela | Shell (PageHeader/layout) | Superfícies internas | Status |
|---|---|---|---|---|
| 1 | Central (`OperacoesDashboard`) | ✅ | KPIs, Ações rápidas, Pendentes (CobrancaCard compact), modais KPI, skeleton | ✅ Canônico |
| 2 | Rota (`RotaPage`) | ✅ | Card detail (tone), GPS badge, date promessa, comprovante modal | ✅ Canônico |
| 3 | Cobranças (`CobrancaListPage`) | ✅ | CobrancaList, banner atrasados (tokens) | ✅ Canônico |
| 4 | Atendidos (`AtendidosPage`) | ✅ | CobrancaList, rows de pagamentos | ✅ Canônico |
| 5 | Clientes (`ClienteList`) | ✅ | ClienteCard list-item, SearchBar | ✅ Canônico |
| 6 | Novo Cliente | ✅ | Field em todos os campos; GPS via Button | ✅ Canônico |
| 7 | Editar Cliente | ✅ | Field; skeleton | ✅ Canônico |
| 8 | Detalhe do Cliente | ✅ | ClienteInfo, card Contratos, SituaçãoFinanceira (KpiCard), QuickActions | ✅ Canônico *(reformulação visual planejada com o Lovable — PLAN-041/042)* |
| 9 | Contratos (`ContratoList`) | ✅ | ContratoCard, filtro dropdown | ✅ Canônico |
| 10 | Novo Contrato | ✅ | Field + select cliente custom | ✅ Canônico |
| 11 | Editar Contrato | ✅ | Field | ✅ Canônico |
| 12 | Detalhe do Contrato | ✅ | ParcelaList, pagamentos (Card), estorno, comprovante | ✅ Canônico |
| 13 | Caixa (`CaixaPage`) | ✅ | KpiCard, auditoria + movimentações (Card), ajuste (input canônico + Button) | ✅ Canônico |
| 14 | Gastos (`GastoPage`) | ✅ | GastoForm (Field) + GastoList (Card) | ✅ Canônico |
| 15 | Administração (`AdminPage`) | ✅ | Equipe/Operação (KpiCard), EquipeModal, OperadoresList (**grid de cards** com tone por role + badges + contadores tabular-nums + **botão Acessar → detail**, sempre visível — Stitch 14/08), **OperadorForm no `Modal.footer`** + callout convite + **seção "Status da conta"** (idêntica ao Detail — edição unificada); edição/reassign via **hook `useEditarOperador`**; **sem aba "Meus dados"** (só Equipe — KPI do caixa ficam na CaixaPage, 14/08) | ✅ Canônico |
| 16 | Detalhe do Operador | ✅ | **bento 3col** (Contato&Status / **KpiCard irmãos clicáveis** Clientes+Contratos — navegam para as listas do operador / —) + bloco caixa 2col (CaixaKpis + Ajustar modal + histórico); **header sem role badge** (avatar + Editar; role no card "Dados do {role}") + **botão "Editar"** abre `OperadorForm` com seção **"Status da conta"** — Stitch 14/08 | ✅ Canônico |
| 17 | Empresas (`SuperAdminPage`) | ✅ | EmpresaList, EmpresaForm (Field), ModulosModal | ✅ Canônico |
| 18 | Perfil (`PerfilPage`) | ✅ | **bento grid** (Dados pessoais + Conta 8col · Segurança 4col) com `Card` tone (sucesso/info/**neutral**) + título dentro do card; Dados pessoais com avatar em coluna própria; Conta com **sub-cards** (E-mail/Empresa, `bg-surface-secondary`) + badges Status/Role + **"Alterar e-mail"** no rodapé; **Segurança = gatilho → modal "Alterar senha"**; selo `BadgeCheck` — Stitch 14/08 | ✅ Canônico |
| 19 | Login | ✅ (redesenhado) | Field (email/senha + mostrar) · link "Esqueci minha senha" → `/recuperar-senha` (PLAN-065) | ✅ Canônico |
| 20 | Recuperar Senha (`/recuperar-senha`) | ✅ (novo, PLAN-065) | PublicPageShell + Field email + SuccessState (resposta genérica) | ✅ Canônico |
| 21 | Redefinir Senha (`/resetar-senha?token=`) | ✅ (novo, PLAN-065) | PublicPageShell + Field (senha+confirmar) + ErrorBanner token | ✅ Canônico |
| 22 | Ativar Conta (`/ativar?token=`) | ✅ (novo, PLAN-065) | PublicPageShell + Field (senha+confirmar, toggle eye) + ErrorBanner token + botão com spinner | ✅ Canônico |
| 23 | Quero Conhecer (`/quero-conhecer`) | ✅ (novo, PLAN-064) | Shell login + Field (zod) + SuccessState dedup/reenviar | ✅ Canônico |
| 24 | Confirmar Lead (`/quero-conhecer/confirmar`) | ✅ (novo, PLAN-064) | PublicPageShell + SuccessState/ErrorBanner + reenviar | ✅ Canônico |
| 25 | Leads Super (`/admin/leads`) | ✅ (novo, PLAN-064) | PageHeader + FieldSelect filtro + Card list-item + badges status + modais (Confirm/descarte) | ✅ Canônico |
| 26 | Confirmar E-mail (`/verificar-email?token=`) | ✅ (novo, PLAN-075) | PublicPageShell + SuccessState/ErrorBanner + Button "Ir para Meus dados" | ✅ Canônico |
| 27 | Conta Suspensa (bloqueio no `ProtectedRoute`) | ✅ (novo, PLAN-075) | Shell login + Logo público + card warning com tone stripe + box de aviso (`AlertTriangle`) + Button Sair (`LogOut`) — Stitch 14/08 | ✅ Canônico |
| 28 | Board Dev (`/devboard`) | ✅ (novo, PLAN-078) | PageHeader (Activity) + 4 `KpiCard` + `SectionHeader` + `Card.Root` (list-item) + `StatusBadge` + `EstadoTela` — proxy `GET /api/devboard/*`, exclusivo super_admin | ✅ Canônico |

## 3. Componentes compartilhados

| Componente | Status | Consumidores |
|---|---|---|
| `PageHeader` | ✅ | 19 telas (`node scripts/consumers.mjs PageHeader`) |
| `Card` | ✅ | listas/cards/rows |
| `KpiCard` | ✅ | dashboards/relatórios |
| `Field` · `FieldSelect` · `FieldTextarea` | ✅ | forms/inputs/selects (16+; `node scripts/consumers.mjs Field`) |
| `Modal` | ✅ | modais (KPI, admin, estorno...) — assinatura Lovable + bottom-sheet (PLAN-047) |
| `Switch` | ✅ | ModulosModal (módulos) |
| `Tabs` | ✅ | AdminPage (equipe/meus dados), PreferenciasModal (modo) |
| `QuickActions` | ✅ | Central, ClienteDetail, Rota, cards |
| `Button` / `ButtonLink` | ✅ | global — variantes `primary/secondary/soft/outline/ghost/danger/success` + sizes `sm/md/lg/block` (PLAN-056) |
| `GpsControl` | ✅ | ClienteForm (comércio + residencial) — port Lovable, 3 estados (PLAN-056) |
| `PreferenciasModal` | ✅ | `UserMenu` (avatar) — tema light/dark/system + paletas + idioma (PLAN-056; nav app-first 07/08) |
| `ClienteSelect` | ✅ | `ContratoForm` (novo) — seletor de cliente buscável (PLAN-056) |
| `StatusBadge` (pill com dot) · `SectionHeader` · `EstadoTela` · `SuccessState` · `ErrorBanner` · `SearchBar` · `Carousel` | ✅ | — |
| `Logo` | ✅ | Login, PublicPageShell, QueroConhecer, AppLayout (sidebar/topo) — geometria nova (10/08): "N" primário 64×64, malha + hub, prop `boxed` (app icon); favicon.svg/favicon.ts/PWA PNGs sync |
| `BottomTabBar` | ✅ | `AppLayout` (mobile) — abas gated por módulo; **admin/sócio: Painel Admin na bar, Rota sai** (14/08); **super admin: Empresas/Leads**; `role="navigation"`, `aria-current`, `pb-safe` (nav app-first) |
| `UserMenu` | ✅ | `AppLayout` (topo fino mobile + rodapé da sidebar) — Perfil · Configurações (`PreferenciasModal`) · Sair (sem Painel Admin/Empresas/Leads — todos na tab bar, 14/08) |
| `Avatar` / `AvatarField` | ✅ | ClienteCard (list-item/detail), ClienteForm, EmpresaList, AppLayout (sidebar), OperadorDetail, OperadoresList, modais — foto data URL **≤640px** + **lightbox** (`ampliar`: ClienteCard, OperadorDetail, sidebar, AvatarField) (PLAN-057/058) |
| `AnexosSection` / `AnexoRow` | ✅ | ClienteDetail — upload foto/PDF do cliente (PLAN-042) |
| `CapacidadesModal` | ✅ | SuperAdminPage (via ModulosModal "Recursos" ou botão do card) — toggles de capacidades por empresa, agrupado por módulo dono (modularização fina) |
| `ImpactConfirmModal` | ✅ | SuperAdminPage — confirmação/forçar de desativação com contagens do impacto (BR-105) |
| `ReassignModal` | ✅ | AdminPage — reassign guiado ao rebaixar com subordinados (OPERATOR_HAS_SUBORDINATES, PLAN-061) |
| `SuperAdminRoute` | ✅ | `shared/auth` — guard de rota exclusivo do super admin (`/admin/empresas*`, PLAN-061) |
| `Fab` / `FabContext` | ✅ | `shared/fab` — FAB mobile acima da tab bar; registrado em ClienteList ("Novo cliente") e ContratoList ("Novo contrato") via useEffect (PLAN-062) |
| `SegmentedControl` | ✅ | `shared/components/SegmentedControl` — pills segmentadas (modo do tema; port Lovable, PLAN-069) |
| `AjustarCaixaModal` | ✅ | `modules/caixa/components` — ajuste da caixa (base) em modal, form único compartilhado; usado na CaixaPage e no OperadorDetail (PLAN-069 · fix 12/08: `AjusteCaixaCard` inline substituído pelo modal) |
| `CollapsibleSection` | ✅ | `shared/components/CollapsibleSection` — seção com header clicável + chevron, colapsada por padrão, count no header e limite de itens ("Ver mais"); usado na CaixaPage (movimentações/histórico) e OperadorDetail (histórico) |
| `ChartCard` | ✅ | `shared/components/ChartCard` — card canônico de gráfico (Card + título), chrome apenas; conteúdo decide estado (`EstadoTela`) ou gráfico Recharts (PLAN-080/082) |
| `CaixaKpis` | ✅ | `modules/caixa/components` — 6 KPIs de caixa (Base/Saldo/Lucro/A receber/Recebido semana/Cobrado hoje) com `kpis[]` e `onKpiClick?`; reutilizado na CaixaPage (cliques) e OperadorDetail |
| `AjusteHistorico` / `AjusteRow` | ✅ | `modules/caixa/components` — histórico de ajustes (valor `value-lg` + "por **Nome**" + motivo + data) reutilizado na CaixaPage e OperadorDetail |
| `MovimentacoesList` / `MovimentacaoRow` | ✅ | `modules/caixa/components` — movimentações do caixa em 2 blocos (valor/origem/badges/data + cliente/descrição sem truncate) |

## 4. Legado conhecido / planejado (rastreado)

| Item | Tipo | Plano | Status |
|---|---|---|---|
| Foto no `CobrancaCard` | variante futura | PLAN-041 | ⏳ planejado (nota no 041) |
| Padrão legado ativo | — | `npm run audit:ui` | ✅ **0 ocorrências** |

## 5. Gate de conclusão (tela/módulo novo ou redesign)

- [ ] Usa **apenas** componentes compartilhados (tabela 1)
- [ ] `npm run audit:ui` limpo (sem padrão legado)
- [ ] `npm run audit:styles` limpo (sem cor fixa da paleta)
- [ ] Tabela 2/3 deste inventário atualizada
- [ ] `npm run docs:audit` limpo (mapeamento/rotas coerentes)

## Referências

- `ADR-005` ("Por que o redesign deixou débito") · `02-DESIGN-SYSTEM.md` (DS v2) · `07-FORMS-INPUTS.md`
- `scripts/audit-ui.mjs` · `scripts/consumers.mjs` · `AGENTS.md`

---

## Como adicionar um módulo (whitelabel — PLAN-045)

Novo módulo de negócio (ex.: `agenda`, `vendas`) segue o **Module Manifest**:

1. **Backend** `src/modules/admin/domain/modules.ts`: entrada em `MODULE_MANIFEST` — `labelKey`, `surfaces`, `dados` (endpoints p/ `requireModule`), `widgets` (dono na Central), `capacidades`, `dependsOn`, `ucs`.
2. **Frontend** `frontend/src/shared/modules/modules.ts`: espelho (`id`, `dependsOn`, `icon`) + `MODULE_WIDGETS` (widgets que contribui à Central).
3. **Superfícies**: rotas em `App.tsx` com `RequireModule` + `requireModule` no backend (403) + navbar/sidebar (gated).
4. **Central composável**: os widgets entram automaticamente (composição por módulo ativo) — sem editar a lógica do dashboard.
5. **UCs/CTs**: criar em 06/07 com etiqueta de módulo + adicionar à matriz `08-UC-MODULOS.md`.
6. **Validação**: `npm run audit:modules` + `npm run audit:ui` + `npm run audit:styles` + `docs:audit` — gate do deploy.
