# MAPEAMENTO DE TELAS

Gerado por `npm run docs:visual`; o CI recusa divergências. Fonte: App.tsx e dependências do frontend. Este mapa descreve o código, não certifica aparência/funcionalidade manual de cada tela.

# Visão Geral

| # | Tela / componente | Rota | Módulo | Acesso | Fonte |
|---|---|---|---|---|---|
| 1 | LoginPage | `/login` | transversal | público | [fonte](../../frontend/src/modules/auth/pages/LoginPage.tsx) |
| 2 | RecuperarSenhaPage | `/recuperar-senha` | transversal | público | [fonte](../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx) |
| 3 | ResetarSenhaPage | `/resetar-senha` | transversal | público | [fonte](../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx) |
| 4 | AtivarPage | `/ativar` | transversal | público | [fonte](../../frontend/src/modules/auth/pages/AtivarPage.tsx) |
| 5 | VerificarEmailPage | `/verificar-email` | transversal | público | [fonte](../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx) |
| 6 | QueroConhecerPage | `/quero-conhecer` | transversal | público | [fonte](../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx) |
| 7 | ConfirmarLeadPage | `/quero-conhecer/confirmar` | transversal | público | [fonte](../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx) |
| 8 | OperacoesDashboard | `/` | transversal | autenticado | [fonte](../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx) |
| 9 | RotaPage | `/rota` | rota | autenticado | [fonte](../../frontend/src/modules/operacoes/pages/RotaPage.tsx) |
| 10 | CobrancaListPage | `/cobrancas` | cobrancas | autenticado | [fonte](../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx) |
| 11 | AtendidosPage | `/atendidos` | atendidos | autenticado | [fonte](../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx) |
| 12 | ClienteList | `/clientes` | clientes | autenticado | [fonte](../../frontend/src/modules/cliente/pages/ClienteList.tsx) |
| 13 | ClienteNovo | `/clientes/novo` | clientes | autenticado | [fonte](../../frontend/src/modules/cliente/pages/ClienteNovo.tsx) |
| 14 | ClienteDetail | `/clientes/:id` | clientes | autenticado | [fonte](../../frontend/src/modules/cliente/pages/ClienteDetail.tsx) |
| 15 | ClienteEdit | `/clientes/:id/editar` | clientes | autenticado | [fonte](../../frontend/src/modules/cliente/pages/ClienteEdit.tsx) |
| 16 | ContratoList | `/contratos` | contratos | autenticado | [fonte](../../frontend/src/modules/contrato/pages/ContratoList.tsx) |
| 17 | ContratoNovo | `/contratos/novo` | contratos | autenticado | [fonte](../../frontend/src/modules/contrato/pages/ContratoNovo.tsx) |
| 18 | ContratoDetail | `/contratos/:id` | contratos | autenticado | [fonte](../../frontend/src/modules/contrato/pages/ContratoDetail.tsx) |
| 19 | ContratoEdit | `/contratos/:id/editar` | contratos | autenticado | [fonte](../../frontend/src/modules/contrato/pages/ContratoEdit.tsx) |
| 20 | CaixaPage | `/caixa` | caixa | autenticado | [fonte](../../frontend/src/modules/caixa/pages/CaixaPage.tsx) |
| 21 | GastoPage | `/gastos` | gastos | autenticado | [fonte](../../frontend/src/modules/gasto/pages/GastoPage.tsx) |
| 22 | InsightsPage | `/insights` | insights | autenticado | [fonte](../../frontend/src/modules/insights/pages/InsightsPage.tsx) |
| 23 | PerfilPage | `/perfil` | transversal | autenticado | [fonte](../../frontend/src/modules/auth/pages/PerfilPage.tsx) |
| 24 | DevBoardPage | `/devboard` | transversal | super_admin | [fonte](../../frontend/src/modules/devboard/pages/DevBoardPage.tsx) |
| 25 | AdminPage | `/admin` | transversal | admin/sócio | [fonte](../../frontend/src/modules/admin/pages/AdminPage.tsx) |
| 26 | OperadorDetail | `/admin/operadores/:id` | transversal | admin/sócio | [fonte](../../frontend/src/modules/admin/pages/OperadorDetail.tsx) |
| 27 | SuperAdminPage | `/admin/empresas` | transversal | super_admin | [fonte](../../frontend/src/modules/admin/pages/SuperAdminPage.tsx) |
| 28 | AdminPage | `/admin/empresas/:id` | transversal | super_admin | [fonte](../../frontend/src/modules/admin/pages/AdminPage.tsx) |
| 29 | LeadsAdminPage | `/admin/leads` | transversal | super_admin | [fonte](../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx) |

**Total:** 29 rotas concretas; 28 arquivos de página; um catch-all/shell autenticado; ContaSuspensaScreen condicional sem URL própria. 118 arquivos com JSX, 135 declarações com JSX, 1872 elementos. Arquivos e componentes não são a mesma contagem.

# Árvore de Componentes

A árvore completa e seus consumidores são derivados dos imports/reexports, incluindo componentes locais, em [UI-INVENTORY](design/UI-INVENTORY.md). O [JSON](design/ui-inventory.json) fornece cada elemento com linha, props/atributos, textos/traduções, condições e contratos. A alcançabilidade estática pode incluir composições condicionais e não significa renderização simultânea.

# Mapeamento por Tela

## LoginPage — /login

Fonte: [frontend/src/modules/auth/pages/LoginPage.tsx](../../frontend/src/modules/auth/pages/LoginPage.tsx). Acesso: público; módulo: transversal.

Composição direta: `ArrowRight`, `Button`, `ErrorBanner`, `Eye`, `EyeOff`, `Field`, `Link`, `Logo`, `ShieldCheck`, `button`, `div`, `form`, `h1`, `h2`, `p`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## RecuperarSenhaPage — /recuperar-senha

Fonte: [frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx). Acesso: público; módulo: transversal.

Composição direta: `ArrowLeft`, `ArrowRight`, `Button`, `ErrorBanner`, `Field`, `Link`, `PublicPageShell`, `SuccessState`, `form`, `h2`, `p`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## ResetarSenhaPage — /resetar-senha

Fonte: [frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx). Acesso: público; módulo: transversal.

Composição direta: `ArrowRight`, `Button`, `ErrorBanner`, `Eye`, `EyeOff`, `Field`, `Link`, `PublicPageShell`, `SuccessState`, `button`, `div`, `form`, `h2`, `p`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## AtivarPage — /ativar

Fonte: [frontend/src/modules/auth/pages/AtivarPage.tsx](../../frontend/src/modules/auth/pages/AtivarPage.tsx). Acesso: público; módulo: transversal.

Composição direta: `ArrowRight`, `Button`, `ErrorBanner`, `Eye`, `EyeOff`, `Field`, `PublicPageShell`, `SuccessState`, `button`, `div`, `form`, `h2`, `p`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## VerificarEmailPage — /verificar-email

Fonte: [frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx). Acesso: público; módulo: transversal.

Composição direta: `ArrowRight`, `Button`, `ErrorBanner`, `PublicPageShell`, `SuccessState`, `div`, `h2`, `p`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## QueroConhecerPage — /quero-conhecer

Fonte: [frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx). Acesso: público; módulo: transversal.

Composição direta: `ArrowLeft`, `ArrowRight`, `Button`, `ErrorBanner`, `Field`, `Link`, `Logo`, `ShieldCheck`, `SuccessState`, `button`, `div`, `form`, `h2`, `p`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## ConfirmarLeadPage — /quero-conhecer/confirmar

Fonte: [frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx). Acesso: público; módulo: transversal.

Composição direta: `Button`, `ErrorBanner`, `Field`, `PublicPageShell`, `SuccessState`, `div`, `form`, `h2`, `p`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## OperacoesDashboard — /

Fonte: [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx). Acesso: autenticado; módulo: transversal.

Composição direta: `Carousel`, `CobrancaCard`, `ErrorBanner`, `GastosPeriodoModal`, `IndicadoresCards`, `PagamentosHojeModal`, `PageHeader`, `ParcelasHojeModal`, `QuickActions`, `SuccessState`, `button`, `div`, `h2`, `p`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## RotaPage — /rota

Fonte: [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../frontend/src/modules/operacoes/pages/RotaPage.tsx). Acesso: autenticado; módulo: rota.

Composição direta: `Button`, `CalendarClock`, `Card.Root`, `Carousel`, `CobrancaCard`, `EstadoTela`, `Field`, `Loader2`, `MapPinOff`, `MessageCircle`, `Modal`, `PagamentoModal`, `PageHeader`, `QuickActions`, `RouteProgress`, `Share2`, `StatusBadge`, `SuccessState`, `UserCheck`, `canvas`, `div`, `p`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## CobrancaListPage — /cobrancas

Fonte: [frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx). Acesso: autenticado; módulo: cobrancas.

Composição direta: `Button`, `ChevronRight`, `CobrancaList`, `ErrorBanner`, `PageHeader`, `SuccessState`, `button`, `div`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## AtendidosPage — /atendidos

Fonte: [frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx). Acesso: autenticado; módulo: atendidos.

Composição direta: `CobrancaList`, `ErrorBanner`, `PagamentoCard`, `PageHeader`, `button`, `div`, `p`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## ClienteList — /clientes

Fonte: [frontend/src/modules/cliente/pages/ClienteList.tsx](../../frontend/src/modules/cliente/pages/ClienteList.tsx). Acesso: autenticado; módulo: clientes.

Composição direta: `ButtonLink`, `ClienteCard`, `EstadoTela`, `Link`, `PageHeader`, `Plus`, `SearchBar`, `div`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## ClienteNovo — /clientes/novo

Fonte: [frontend/src/modules/cliente/pages/ClienteNovo.tsx](../../frontend/src/modules/cliente/pages/ClienteNovo.tsx). Acesso: autenticado; módulo: clientes.

Composição direta: `ClienteForm`, `PageHeader`, `div`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## ClienteDetail — /clientes/:id

Fonte: [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../frontend/src/modules/cliente/pages/ClienteDetail.tsx). Acesso: autenticado; módulo: clientes.

Composição direta: `AnexosSection`, `ButtonLink`, `Card.Body`, `Card.Header`, `Card.Root`, `Card.Title`, `ChevronRight`, `ClienteInfo`, `EstadoTela`, `PageHeader`, `Pencil`, `Plus`, `QuickActions`, `SituacaoFinanceira`, `div`, `p`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## ClienteEdit — /clientes/:id/editar

Fonte: [frontend/src/modules/cliente/pages/ClienteEdit.tsx](../../frontend/src/modules/cliente/pages/ClienteEdit.tsx). Acesso: autenticado; módulo: clientes.

Composição direta: `ClienteForm`, `PageHeader`, `div`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## ContratoList — /contratos

Fonte: [frontend/src/modules/contrato/pages/ContratoList.tsx](../../frontend/src/modules/contrato/pages/ContratoList.tsx). Acesso: autenticado; módulo: contratos.

Composição direta: `Button`, `ButtonLink`, `ChevronDown`, `ContratoCard`, `EstadoTela`, `Link`, `PageHeader`, `Plus`, `X`, `button`, `div`, `input`, `p`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## ContratoNovo — /contratos/novo

Fonte: [frontend/src/modules/contrato/pages/ContratoNovo.tsx](../../frontend/src/modules/contrato/pages/ContratoNovo.tsx). Acesso: autenticado; módulo: contratos.

Composição direta: `ContratoForm`, `PageHeader`, `div`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## ContratoDetail — /contratos/:id

Fonte: [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../frontend/src/modules/contrato/pages/ContratoDetail.tsx). Acesso: autenticado; módulo: contratos.

Composição direta: `Button`, `ButtonLink`, `ConfirmModal`, `ContratoInfo`, `EstadoTela`, `MessageCircle`, `Modal`, `PagamentoModal`, `PageHeader`, `ParcelaList`, `Pencil`, `RotateCcw`, `SectionHeader`, `Share2`, `button`, `canvas`, `div`, `input`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## ContratoEdit — /contratos/:id/editar

Fonte: [frontend/src/modules/contrato/pages/ContratoEdit.tsx](../../frontend/src/modules/contrato/pages/ContratoEdit.tsx). Acesso: autenticado; módulo: contratos.

Composição direta: `ContratoForm`, `EstadoTela`, `PageHeader`, `div`, `p`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## CaixaPage — /caixa

Fonte: [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../frontend/src/modules/caixa/pages/CaixaPage.tsx). Acesso: autenticado; módulo: caixa.

Composição direta: `AjustarCaixaModal`, `AjusteRow`, `Button`, `CaixaKpis`, `ChevronLeft`, `ChevronRight`, `CollapsibleSection`, `ConfirmModal`, `ContratosSemanaModal`, `ErrorBanner`, `GastosPeriodoModal`, `KpiCard`, `MovimentacaoRow`, `PagamentosHojeModal`, `PagamentosPeriodoModal`, `PageHeader`, `ParcelasHojeModal`, `Receipt`, `SectionHeader`, `Wallet`, `button`, `div`, `h2`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## GastoPage — /gastos

Fonte: [frontend/src/modules/gasto/pages/GastoPage.tsx](../../frontend/src/modules/gasto/pages/GastoPage.tsx). Acesso: autenticado; módulo: gastos.

Composição direta: `GastoForm`, `PageHeader`, `SectionHeader`, `div`, `p`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## InsightsPage — /insights

Fonte: [frontend/src/modules/insights/pages/InsightsPage.tsx](../../frontend/src/modules/insights/pages/InsightsPage.tsx). Acesso: autenticado; módulo: insights.

Composição direta: `CarteiraChart`, `ChartCard`, `ContribuicaoChart`, `EstadoTela`, `GastosCategoriaChart`, `PageHeader`, `PrevistoRecebidoChart`, `SegmentedControl`, `TendenciaChart`, `div`, `h2`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## PerfilPage — /perfil

Fonte: [frontend/src/modules/auth/pages/PerfilPage.tsx](../../frontend/src/modules/auth/pages/PerfilPage.tsx). Acesso: autenticado; módulo: transversal.

Composição direta: `AvatarField`, `BadgeCheck`, `Button`, `Card.Root`, `Check`, `Field`, `Info`, `Lock`, `Mail`, `Modal`, `PageHeader`, `Save`, `StatusBadge`, `Undo2`, `div`, `form`, `h2`, `p`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## DevBoardPage — /devboard

Fonte: [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../frontend/src/modules/devboard/pages/DevBoardPage.tsx). Acesso: super_admin; módulo: transversal.

Composição direta: `DependabotList`, `KpiCard`, `PRsList`, `PageHeader`, `RunsList`, `SectionHeader`, `div`, `section`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## AdminPage — /admin

Fonte: [frontend/src/modules/admin/pages/AdminPage.tsx](../../frontend/src/modules/admin/pages/AdminPage.tsx). Acesso: admin/sócio; módulo: transversal.

Composição direta: `Ban`, `Button`, `ConfirmModal`, `ContribuicaoModal`, `EquipeModal`, `EstadoTela`, `KpiCard`, `Modal`, `Navigate`, `OperadorForm`, `OperadoresList`, `PageHeader`, `ReassignModal`, `RefreshCw`, `SearchBar`, `SectionHeader`, `StatusBadge`, `div`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## OperadorDetail — /admin/operadores/:id

Fonte: [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../frontend/src/modules/admin/pages/OperadorDetail.tsx). Acesso: admin/sócio; módulo: transversal.

Composição direta: `AjustarCaixaModal`, `AjusteRow`, `Avatar`, `Ban`, `Button`, `CaixaKpis`, `Card.Root`, `CollapsibleSection`, `Edit3`, `EstadoTela`, `KpiCard`, `Modal`, `OperadorForm`, `PageHeader`, `ReassignModal`, `RefreshCw`, `SectionHeader`, `StatusBadge`, `Wallet`, `div`, `p`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## SuperAdminPage — /admin/empresas

Fonte: [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../frontend/src/modules/admin/pages/SuperAdminPage.tsx). Acesso: super_admin; módulo: transversal.

Composição direta: `Building2`, `Button`, `CapacidadesModal`, `EmpresaForm`, `EmpresaList`, `EstadoTela`, `ImpactConfirmModal`, `KpiCard`, `Modal`, `ModulosModal`, `PageHeader`, `SectionHeader`, `div`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## AdminPage — /admin/empresas/:id

Fonte: [frontend/src/modules/admin/pages/AdminPage.tsx](../../frontend/src/modules/admin/pages/AdminPage.tsx). Acesso: super_admin; módulo: transversal.

Composição direta: `Ban`, `Button`, `ConfirmModal`, `ContribuicaoModal`, `EquipeModal`, `EstadoTela`, `KpiCard`, `Modal`, `Navigate`, `OperadorForm`, `OperadoresList`, `PageHeader`, `ReassignModal`, `RefreshCw`, `SearchBar`, `SectionHeader`, `StatusBadge`, `div`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

## LeadsAdminPage — /admin/leads

Fonte: [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx). Acesso: super_admin; módulo: transversal.

Composição direta: `Button`, `Card.Actions`, `Card.Body`, `Card.Header`, `Card.Indicator`, `Card.Indicators`, `Card.Root`, `ConfirmModal`, `EstadoTela`, `FieldSelect`, `FieldTextarea`, `Modal`, `PageHeader`, `SearchBar`, `StatusBadge`, `div`, `p`, `span`.

Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).

# Superfícies globais e condicionais

ContaSuspensaScreen, Suspense, ErrorBoundary, FeedbackProvider, navegação, preferências, confirmações, modais e lightboxes também estão no inventário. Estilos, assets, favicon/PWA e traduções são recursos versionados no JSON. Elementos dinâmicos e bibliotecas externas precisam ser observados no navegador.

# Referências

[Componentes](design/04-UI-COMPONENTS.md) · [Cobertura](design/UI-COVERAGE.md) · [Fluxos de uso](../product/06-CASOS-DE-USO.md) · [Registro anterior no Git](https://github.com/RafaCartaxo/nxgest/blob/e929d1ce32c550361c369491d45eaf04eb2bf9ea/docs/engineering/05-MAPEAMENTO-TELAS.md).

[Matriz de estados e evidências](design/UI-STATES.md).
