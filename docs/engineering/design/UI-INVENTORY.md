# Inventário visual derivado do código

Gerado por `npm run docs:visual`. Não editar manualmente. `npm run docs:audit` recusa inventário divergente. Não é atestado de revisão visual, responsividade ou acessibilidade.

**Escopo:** 29 rotas concretas + catch-all autenticado; 28 arquivos de página; 118 arquivos com JSX; 135 declarações de componentes; 1872 ocorrências JSX.

O [JSON](ui-inventory.json) contém cada elemento com arquivo/linha, atributos, condições de renderização, textos, interfaces/types, receitas de variantes e imports. Componentes locais, HTML, SVG, ícones e portais estão incluídos; nomes dinâmicos/estados em runtime exigem inspeção visual.

## Rotas e superfícies

| Rota | Página / shell | Acesso | Módulo | Fonte |
|---|---|---|---|---|
| `/login` | LoginPage | público | — | [frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx) |
| `/recuperar-senha` | RecuperarSenhaPage | público | — | [frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx) |
| `/resetar-senha` | ResetarSenhaPage | público | — | [frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx) |
| `/ativar` | AtivarPage | público | — | [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx) |
| `/verificar-email` | VerificarEmailPage | público | — | [frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx) |
| `/quero-conhecer` | QueroConhecerPage | público | — | [frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx) |
| `/quero-conhecer/confirmar` | ConfirmarLeadPage | público | — | [frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx) |
| `*` | ProtectedRoute / AppLayout / ErrorBoundary | shell autenticado | — | [frontend/src/App.tsx](../../../frontend/src/App.tsx) |
| `/` | OperacoesDashboard | autenticado | — | [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx) |
| `/rota` | RotaPage | autenticado | rota | [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx) |
| `/cobrancas` | CobrancaListPage | autenticado | cobrancas | [frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx) |
| `/atendidos` | AtendidosPage | autenticado | atendidos | [frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx) |
| `/clientes` | ClienteList | autenticado | clientes | [frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx) |
| `/clientes/novo` | ClienteNovo | autenticado | clientes | [frontend/src/modules/cliente/pages/ClienteNovo.tsx](../../../frontend/src/modules/cliente/pages/ClienteNovo.tsx) |
| `/clientes/:id` | ClienteDetail | autenticado | clientes | [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx) |
| `/clientes/:id/editar` | ClienteEdit | autenticado | clientes | [frontend/src/modules/cliente/pages/ClienteEdit.tsx](../../../frontend/src/modules/cliente/pages/ClienteEdit.tsx) |
| `/contratos` | ContratoList | autenticado | contratos | [frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx) |
| `/contratos/novo` | ContratoNovo | autenticado | contratos | [frontend/src/modules/contrato/pages/ContratoNovo.tsx](../../../frontend/src/modules/contrato/pages/ContratoNovo.tsx) |
| `/contratos/:id` | ContratoDetail | autenticado | contratos | [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx) |
| `/contratos/:id/editar` | ContratoEdit | autenticado | contratos | [frontend/src/modules/contrato/pages/ContratoEdit.tsx](../../../frontend/src/modules/contrato/pages/ContratoEdit.tsx) |
| `/caixa` | CaixaPage | autenticado | caixa | [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx) |
| `/gastos` | GastoPage | autenticado | gastos | [frontend/src/modules/gasto/pages/GastoPage.tsx](../../../frontend/src/modules/gasto/pages/GastoPage.tsx) |
| `/insights` | InsightsPage | autenticado | insights | [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx) |
| `/perfil` | PerfilPage | autenticado | — | [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx) |
| `/devboard` | DevBoardPage | super_admin | — | [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx) |
| `/admin` | AdminPage | admin/sócio | — | [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx) |
| `/admin/operadores/:id` | OperadorDetail | admin/sócio | — | [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx) |
| `/admin/empresas` | SuperAdminPage | super_admin | — | [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx) |
| `/admin/empresas/:id` | AdminPage | super_admin | — | [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx) |
| `/admin/leads` | LeadsAdminPage | super_admin | — | [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx) |

ContaSuspensaScreen é superfície condicional de ProtectedRoute, sem URL própria. AdminPage é reutilizada em duas rotas. O catch-all é um shell, não uma página de negócio adicional.

## Entradas de navegação

O JSON registra referências literais e dinâmicas de links, configurações e navigate(). Rotas sem entrada literal podem depender de token, URL direta ou parâmetros; não inferir ausência de acesso apenas desse dado.

- `/resetar-senha`: sem entrada literal detectada; conferir fluxo/contexto e App.tsx.
- `/ativar`: sem entrada literal detectada; conferir fluxo/contexto e App.tsx.
- `/verificar-email`: sem entrada literal detectada; conferir fluxo/contexto e App.tsx.
- `/quero-conhecer/confirmar`: sem entrada literal detectada; conferir fluxo/contexto e App.tsx.
- `/clientes/:id`: sem entrada literal detectada; conferir fluxo/contexto e App.tsx.
- `/clientes/:id/editar`: sem entrada literal detectada; conferir fluxo/contexto e App.tsx.
- `/contratos/:id`: sem entrada literal detectada; conferir fluxo/contexto e App.tsx.
- `/contratos/:id/editar`: sem entrada literal detectada; conferir fluxo/contexto e App.tsx.
- `/insights`: sem entrada literal detectada; conferir fluxo/contexto e App.tsx.
- `/admin/operadores/:id`: sem entrada literal detectada; conferir fluxo/contexto e App.tsx.
- `/admin/empresas/:id`: sem entrada literal detectada; conferir fluxo/contexto e App.tsx.

## Arquivos, componentes e consumidores

| Fonte | Componentes declarados (inclui locais) | Consumidores diretos | Rotas que alcançam o arquivo | Elementos JSX |
|---|---|---|---|---|
| [frontend/src/App.tsx](../../../frontend/src/App.tsx) | App | [frontend/src/main.tsx](../../../frontend/src/main.tsx) | entrada global do aplicativo | 91 |
| [frontend/src/main.tsx](../../../frontend/src/main.tsx) | composição JSX | sem import direto | entrada global do aplicativo | 5 |
| [frontend/src/modules/admin/components/CapacidadesModal.tsx](../../../frontend/src/modules/admin/components/CapacidadesModal.tsx) | CapacidadesModal | [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx) | `/admin/empresas` | 18 |
| [frontend/src/modules/admin/components/ContribuicaoModal.tsx](../../../frontend/src/modules/admin/components/ContribuicaoModal.tsx) | ContribuicaoModal | [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx) | `/admin`, `/admin/empresas/:id` | 16 |
| [frontend/src/modules/admin/components/EmpresaForm.tsx](../../../frontend/src/modules/admin/components/EmpresaForm.tsx) | EmpresaForm | [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx) | `/admin/empresas` | 12 |
| [frontend/src/modules/admin/components/EmpresaList.tsx](../../../frontend/src/modules/admin/components/EmpresaList.tsx) | EmpresaList | [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx) | `/admin/empresas` | 24 |
| [frontend/src/modules/admin/components/EquipeModal.tsx](../../../frontend/src/modules/admin/components/EquipeModal.tsx) | EquipeModal | [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx) | `/admin`, `/admin/empresas/:id` | 12 |
| [frontend/src/modules/admin/components/ImpactConfirmModal.tsx](../../../frontend/src/modules/admin/components/ImpactConfirmModal.tsx) | ImpactConfirmModal | [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx) | `/admin/empresas` | 22 |
| [frontend/src/modules/admin/components/ModulosModal.tsx](../../../frontend/src/modules/admin/components/ModulosModal.tsx) | ModulosModal | [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx) | `/admin/empresas` | 26 |
| [frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx) | OperadorForm | [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx) | `/admin`, `/admin/operadores/:id`, `/admin/empresas/:id` | 35 |
| [frontend/src/modules/admin/components/OperadoresList.tsx](../../../frontend/src/modules/admin/components/OperadoresList.tsx) | OperadoresList | [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx) | `/admin`, `/admin/empresas/:id` | 39 |
| [frontend/src/modules/admin/components/ReassignModal.tsx](../../../frontend/src/modules/admin/components/ReassignModal.tsx) | ReassignModal | [frontend/src/modules/admin/hooks/useEditarOperador.ts](../../../frontend/src/modules/admin/hooks/useEditarOperador.ts)<br>[frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx) | `/admin`, `/admin/operadores/:id`, `/admin/empresas/:id` | 11 |
| [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx) | AdminPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/admin`, `/admin/empresas/:id` | 44 |
| [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx) | OperadorDetail | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/admin/operadores/:id` | 59 |
| [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx) | SuperAdminPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/admin/empresas` | 21 |
| [frontend/src/modules/auth/components/PublicPageShell.tsx](../../../frontend/src/modules/auth/components/PublicPageShell.tsx) | PublicPageShell | [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx)<br>[frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx)<br>[frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx)<br>[frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx)<br>[frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx) | `/recuperar-senha`, `/resetar-senha`, `/ativar`, `/verificar-email`, `/quero-conhecer/confirmar` | 5 |
| [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx) | AtivarPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/ativar` | 16 |
| [frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx) | LoginPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/login` | 27 |
| [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx) | PerfilPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/perfil` | 71 |
| [frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx) | RecuperarSenhaPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/recuperar-senha` | 11 |
| [frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx) | ResetarSenhaPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/resetar-senha` | 16 |
| [frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx) | VerificarEmailPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/verificar-email` | 13 |
| [frontend/src/modules/caixa/components/AjustarCaixaModal.tsx](../../../frontend/src/modules/caixa/components/AjustarCaixaModal.tsx) | AjustarCaixaModal | [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx) | `/caixa`, `/admin/operadores/:id` | 3 |
| [frontend/src/modules/caixa/components/AjusteCaixaForm.tsx](../../../frontend/src/modules/caixa/components/AjusteCaixaForm.tsx) | AjusteCaixaForm | [frontend/src/modules/caixa/components/AjustarCaixaModal.tsx](../../../frontend/src/modules/caixa/components/AjustarCaixaModal.tsx) | `/caixa`, `/admin/operadores/:id` | 8 |
| [frontend/src/modules/caixa/components/AjusteHistorico.tsx](../../../frontend/src/modules/caixa/components/AjusteHistorico.tsx) | AjusteRow, AjusteHistorico | [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx) | `/caixa`, `/admin/operadores/:id` | 10 |
| [frontend/src/modules/caixa/components/CaixaKpis.tsx](../../../frontend/src/modules/caixa/components/CaixaKpis.tsx) | CaixaKpis | [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx) | `/caixa`, `/admin/operadores/:id` | 7 |
| [frontend/src/modules/caixa/components/ContratosSemanaModal.tsx](../../../frontend/src/modules/caixa/components/ContratosSemanaModal.tsx) | ContratosSemanaModal | [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx) | `/caixa` | 13 |
| [frontend/src/modules/caixa/components/GastosPeriodoModal.tsx](../../../frontend/src/modules/caixa/components/GastosPeriodoModal.tsx) | GastosPeriodoModal | [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx)<br>[frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx) | `/`, `/caixa` | 14 |
| [frontend/src/modules/caixa/components/MovimentacoesList.tsx](../../../frontend/src/modules/caixa/components/MovimentacoesList.tsx) | MovimentacaoRow, MovimentacoesList | [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx) | `/caixa` | 14 |
| [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx) | CaixaPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/caixa` | 62 |
| [frontend/src/modules/cliente/components/AnexosSection.tsx](../../../frontend/src/modules/cliente/components/AnexosSection.tsx) | AnexoRow (local), AnexosSection | [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx) | `/clientes/:id` | 44 |
| [frontend/src/modules/cliente/components/ClienteCard.tsx](../../../frontend/src/modules/cliente/components/ClienteCard.tsx) | ClienteCard (local) | [frontend/src/modules/cliente/components/ClienteInfo.tsx](../../../frontend/src/modules/cliente/components/ClienteInfo.tsx)<br>[frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx) | `/clientes`, `/clientes/:id` | 34 |
| [frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx) | EnderecoFields (local), ClienteForm | [frontend/src/modules/cliente/pages/ClienteEdit.tsx](../../../frontend/src/modules/cliente/pages/ClienteEdit.tsx)<br>[frontend/src/modules/cliente/pages/ClienteNovo.tsx](../../../frontend/src/modules/cliente/pages/ClienteNovo.tsx) | `/clientes/novo`, `/clientes/:id/editar` | 54 |
| [frontend/src/modules/cliente/components/ClienteInfo.tsx](../../../frontend/src/modules/cliente/components/ClienteInfo.tsx) | ClienteInfo | [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx) | `/clientes/:id` | 1 |
| [frontend/src/modules/cliente/components/SituacaoFinanceira.tsx](../../../frontend/src/modules/cliente/components/SituacaoFinanceira.tsx) | SituacaoFinanceira | [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx) | `/clientes/:id` | 9 |
| [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx) | ClienteDetail | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/clientes/:id` | 20 |
| [frontend/src/modules/cliente/pages/ClienteEdit.tsx](../../../frontend/src/modules/cliente/pages/ClienteEdit.tsx) | ClienteEdit | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/clientes/:id/editar` | 7 |
| [frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx) | ClienteList | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/clientes` | 10 |
| [frontend/src/modules/cliente/pages/ClienteNovo.tsx](../../../frontend/src/modules/cliente/pages/ClienteNovo.tsx) | ClienteNovo | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/clientes/novo` | 3 |
| [frontend/src/modules/contrato/components/ClienteSelect.tsx](../../../frontend/src/modules/contrato/components/ClienteSelect.tsx) | ClienteSelect | [frontend/src/modules/contrato/components/ContratoForm.tsx](../../../frontend/src/modules/contrato/components/ContratoForm.tsx)<br>[frontend/src/modules/contrato/pages/ContratoNovo.tsx](../../../frontend/src/modules/contrato/pages/ContratoNovo.tsx) | `/contratos/novo`, `/contratos/:id/editar` | 17 |
| [frontend/src/modules/contrato/components/ContratoCard.tsx](../../../frontend/src/modules/contrato/components/ContratoCard.tsx) | BadgePeriodicidade (local), ContratoCard (local) | [frontend/src/modules/contrato/components/ContratoInfo.tsx](../../../frontend/src/modules/contrato/components/ContratoInfo.tsx)<br>[frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx) | `/contratos`, `/contratos/:id` | 76 |
| [frontend/src/modules/contrato/components/ContratoForm.tsx](../../../frontend/src/modules/contrato/components/ContratoForm.tsx) | ContratoForm | [frontend/src/modules/contrato/pages/ContratoEdit.tsx](../../../frontend/src/modules/contrato/pages/ContratoEdit.tsx)<br>[frontend/src/modules/contrato/pages/ContratoNovo.tsx](../../../frontend/src/modules/contrato/pages/ContratoNovo.tsx) | `/contratos/novo`, `/contratos/:id/editar` | 33 |
| [frontend/src/modules/contrato/components/ContratoInfo.tsx](../../../frontend/src/modules/contrato/components/ContratoInfo.tsx) | ContratoInfo | [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx) | `/contratos/:id` | 1 |
| [frontend/src/modules/contrato/components/ParcelaList.tsx](../../../frontend/src/modules/contrato/components/ParcelaList.tsx) | ParcelaList | [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx) | `/contratos/:id` | 21 |
| [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx) | ContratoDetail | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/contratos/:id` | 42 |
| [frontend/src/modules/contrato/pages/ContratoEdit.tsx](../../../frontend/src/modules/contrato/pages/ContratoEdit.tsx) | ContratoEdit | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/contratos/:id/editar` | 8 |
| [frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx) | ContratoList | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/contratos` | 25 |
| [frontend/src/modules/contrato/pages/ContratoNovo.tsx](../../../frontend/src/modules/contrato/pages/ContratoNovo.tsx) | ContratoNovo | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/contratos/novo` | 3 |
| [frontend/src/modules/devboard/components/DependabotList.tsx](../../../frontend/src/modules/devboard/components/DependabotList.tsx) | DependabotList | [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx) | `/devboard` | 12 |
| [frontend/src/modules/devboard/components/PRsList.tsx](../../../frontend/src/modules/devboard/components/PRsList.tsx) | PRsList | [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx) | `/devboard` | 12 |
| [frontend/src/modules/devboard/components/RunsList.tsx](../../../frontend/src/modules/devboard/components/RunsList.tsx) | RunsList | [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx) | `/devboard` | 12 |
| [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx) | DevBoardPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/devboard` | 16 |
| [frontend/src/modules/gasto/components/GastoForm.tsx](../../../frontend/src/modules/gasto/components/GastoForm.tsx) | GastoForm | [frontend/src/modules/gasto/pages/GastoPage.tsx](../../../frontend/src/modules/gasto/pages/GastoPage.tsx) | `/gastos` | 7 |
| [frontend/src/modules/gasto/components/GastoList.tsx](../../../frontend/src/modules/gasto/components/GastoList.tsx) | GastoList | sem import direto | não alcançado por página; conferir composição dinâmica | 15 |
| [frontend/src/modules/gasto/pages/GastoPage.tsx](../../../frontend/src/modules/gasto/pages/GastoPage.tsx) | GastoPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/gastos` | 5 |
| [frontend/src/modules/insights/components/CarteiraChart.tsx](../../../frontend/src/modules/insights/components/CarteiraChart.tsx) | CarteiraChart | [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx) | `/insights` | 7 |
| [frontend/src/modules/insights/components/ContribuicaoChart.tsx](../../../frontend/src/modules/insights/components/ContribuicaoChart.tsx) | ContribuicaoChart | [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx) | `/insights` | 7 |
| [frontend/src/modules/insights/components/GastosCategoriaChart.tsx](../../../frontend/src/modules/insights/components/GastosCategoriaChart.tsx) | GastosCategoriaChart | [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx) | `/insights` | 7 |
| [frontend/src/modules/insights/components/PrevistoRecebidoChart.tsx](../../../frontend/src/modules/insights/components/PrevistoRecebidoChart.tsx) | PrevistoRecebidoChart | [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx) | `/insights` | 10 |
| [frontend/src/modules/insights/components/TendenciaChart.tsx](../../../frontend/src/modules/insights/components/TendenciaChart.tsx) | TendenciaChart | [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx) | `/insights` | 8 |
| [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx) | InsightsPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/insights` | 22 |
| [frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx) | ConfirmarLeadPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/quero-conhecer/confirmar` | 13 |
| [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx) | LeadsAdminPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/admin/leads` | 31 |
| [frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx) | QueroConhecerPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/quero-conhecer` | 24 |
| [frontend/src/modules/operacoes/components/CobrancaCard.tsx](../../../frontend/src/modules/operacoes/components/CobrancaCard.tsx) | CobrancaCard | [frontend/src/modules/operacoes/components/CobrancaList.tsx](../../../frontend/src/modules/operacoes/components/CobrancaList.tsx)<br>[frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx) | `/`, `/rota`, `/cobrancas`, `/atendidos` | 11 |
| [frontend/src/modules/operacoes/components/CobrancaList.tsx](../../../frontend/src/modules/operacoes/components/CobrancaList.tsx) | CobrancaList | [frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx)<br>[frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx) | `/cobrancas`, `/atendidos` | 3 |
| [frontend/src/modules/operacoes/components/IndicadoresCards.tsx](../../../frontend/src/modules/operacoes/components/IndicadoresCards.tsx) | IndicadoresCards | [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx) | `/` | 8 |
| [frontend/src/modules/operacoes/components/PagamentoCard.tsx](../../../frontend/src/modules/operacoes/components/PagamentoCard.tsx) | PagamentoCard | [frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx) | `/atendidos` | 10 |
| [frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx](../../../frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx) | PagamentosHojeModal | [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx)<br>[frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx) | `/`, `/caixa` | 11 |
| [frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx](../../../frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx) | PagamentosPeriodoModal | [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx) | `/caixa` | 11 |
| [frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx](../../../frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx) | ParcelasHojeModal | [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx)<br>[frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx) | `/`, `/caixa` | 14 |
| [frontend/src/modules/operacoes/components/RouteProgress.tsx](../../../frontend/src/modules/operacoes/components/RouteProgress.tsx) | RouteProgress | [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx) | `/rota` | 10 |
| [frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx) | AtendidosPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/atendidos` | 14 |
| [frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx) | CobrancaListPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/cobrancas` | 14 |
| [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx) | OperacoesDashboard | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/` | 27 |
| [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx) | RotaPage | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | `/rota` | 43 |
| [frontend/src/modules/pagamento/components/PagamentoModal.tsx](../../../frontend/src/modules/pagamento/components/PagamentoModal.tsx) | PagamentoModal | [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx) | `/rota`, `/contratos/:id` | 25 |
| [frontend/src/shared/auth/AdminRoute.tsx](../../../frontend/src/shared/auth/AdminRoute.tsx) | AdminRoute | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | global/shell/guard; conferir App.tsx | 4 |
| [frontend/src/shared/auth/AuthContext.tsx](../../../frontend/src/shared/auth/AuthContext.tsx) | AuthProvider | [frontend/src/App.tsx](../../../frontend/src/App.tsx)<br>[frontend/src/modules/admin/components/OperadoresList.tsx](../../../frontend/src/modules/admin/components/OperadoresList.tsx)<br>[frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx)<br>[frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx)<br>[frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx)<br>[frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx)<br>[frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx)<br>[frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx)<br>[frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx)<br>[frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx)<br>[frontend/src/shared/auth/AdminRoute.tsx](../../../frontend/src/shared/auth/AdminRoute.tsx)<br>[frontend/src/shared/auth/ContaSuspensaScreen.tsx](../../../frontend/src/shared/auth/ContaSuspensaScreen.tsx)<br>[frontend/src/shared/auth/ProtectedRoute.tsx](../../../frontend/src/shared/auth/ProtectedRoute.tsx)<br>[frontend/src/shared/auth/RequireModule.tsx](../../../frontend/src/shared/auth/RequireModule.tsx)<br>[frontend/src/shared/auth/SuperAdminRoute.tsx](../../../frontend/src/shared/auth/SuperAdminRoute.tsx)<br>[frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx)<br>[frontend/src/shared/layout/BottomTabBar.tsx](../../../frontend/src/shared/layout/BottomTabBar.tsx)<br>[frontend/src/shared/layout/UserMenu.tsx](../../../frontend/src/shared/layout/UserMenu.tsx) | `/login`, `/verificar-email`, `/`, `/rota`, `/clientes/:id`, `/contratos/:id`, `/caixa`, `/perfil`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id` | 1 |
| [frontend/src/shared/auth/ContaSuspensaScreen.tsx](../../../frontend/src/shared/auth/ContaSuspensaScreen.tsx) | ContaSuspensaScreen | [frontend/src/shared/auth/ProtectedRoute.tsx](../../../frontend/src/shared/auth/ProtectedRoute.tsx) | global/shell/guard; conferir App.tsx | 14 |
| [frontend/src/shared/auth/ProtectedRoute.tsx](../../../frontend/src/shared/auth/ProtectedRoute.tsx) | ProtectedRoute | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | global/shell/guard; conferir App.tsx | 4 |
| [frontend/src/shared/auth/RequireModule.tsx](../../../frontend/src/shared/auth/RequireModule.tsx) | RequireModule | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | global/shell/guard; conferir App.tsx | 1 |
| [frontend/src/shared/auth/SuperAdminRoute.tsx](../../../frontend/src/shared/auth/SuperAdminRoute.tsx) | SuperAdminRoute | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | global/shell/guard; conferir App.tsx | 4 |
| [frontend/src/shared/components/Avatar/Avatar.tsx](../../../frontend/src/shared/components/Avatar/Avatar.tsx) | Avatar, AvatarField | [frontend/src/modules/admin/components/ContribuicaoModal.tsx](../../../frontend/src/modules/admin/components/ContribuicaoModal.tsx)<br>[frontend/src/modules/admin/components/EmpresaList.tsx](../../../frontend/src/modules/admin/components/EmpresaList.tsx)<br>[frontend/src/modules/admin/components/EquipeModal.tsx](../../../frontend/src/modules/admin/components/EquipeModal.tsx)<br>[frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx)<br>[frontend/src/modules/admin/components/OperadoresList.tsx](../../../frontend/src/modules/admin/components/OperadoresList.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx)<br>[frontend/src/modules/cliente/components/ClienteCard.tsx](../../../frontend/src/modules/cliente/components/ClienteCard.tsx)<br>[frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx)<br>[frontend/src/shared/layout/UserMenu.tsx](../../../frontend/src/shared/layout/UserMenu.tsx) | `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar`, `/perfil`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id` | 18 |
| [frontend/src/shared/components/Button.tsx](../../../frontend/src/shared/components/Button.tsx) | Button, ButtonLink | [frontend/src/modules/admin/components/CapacidadesModal.tsx](../../../frontend/src/modules/admin/components/CapacidadesModal.tsx)<br>[frontend/src/modules/admin/components/EmpresaForm.tsx](../../../frontend/src/modules/admin/components/EmpresaForm.tsx)<br>[frontend/src/modules/admin/components/EmpresaList.tsx](../../../frontend/src/modules/admin/components/EmpresaList.tsx)<br>[frontend/src/modules/admin/components/ImpactConfirmModal.tsx](../../../frontend/src/modules/admin/components/ImpactConfirmModal.tsx)<br>[frontend/src/modules/admin/components/ModulosModal.tsx](../../../frontend/src/modules/admin/components/ModulosModal.tsx)<br>[frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx)<br>[frontend/src/modules/admin/components/ReassignModal.tsx](../../../frontend/src/modules/admin/components/ReassignModal.tsx)<br>[frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx)<br>[frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx)<br>[frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx)<br>[frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx)<br>[frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx)<br>[frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx)<br>[frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx)<br>[frontend/src/modules/caixa/components/AjustarCaixaModal.tsx](../../../frontend/src/modules/caixa/components/AjustarCaixaModal.tsx)<br>[frontend/src/modules/caixa/components/AjusteCaixaForm.tsx](../../../frontend/src/modules/caixa/components/AjusteCaixaForm.tsx)<br>[frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx)<br>[frontend/src/modules/cliente/components/AnexosSection.tsx](../../../frontend/src/modules/cliente/components/AnexosSection.tsx)<br>[frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx)<br>[frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx)<br>[frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx)<br>[frontend/src/modules/contrato/components/ContratoCard.tsx](../../../frontend/src/modules/contrato/components/ContratoCard.tsx)<br>[frontend/src/modules/contrato/components/ContratoForm.tsx](../../../frontend/src/modules/contrato/components/ContratoForm.tsx)<br>[frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx)<br>[frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx)<br>[frontend/src/modules/gasto/components/GastoForm.tsx](../../../frontend/src/modules/gasto/components/GastoForm.tsx)<br>[frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx)<br>[frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx)<br>[frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx)<br>[frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx)<br>[frontend/src/modules/pagamento/components/PagamentoModal.tsx](../../../frontend/src/modules/pagamento/components/PagamentoModal.tsx)<br>[frontend/src/shared/auth/ContaSuspensaScreen.tsx](../../../frontend/src/shared/auth/ContaSuspensaScreen.tsx)<br>[frontend/src/shared/components/Avatar/Avatar.tsx](../../../frontend/src/shared/components/Avatar/Avatar.tsx)<br>[frontend/src/shared/components/ConfirmModal.tsx](../../../frontend/src/shared/components/ConfirmModal.tsx)<br>[frontend/src/shared/components/ErrorBoundary.tsx](../../../frontend/src/shared/components/ErrorBoundary.tsx)<br>[frontend/src/shared/components/EstadoTela.tsx](../../../frontend/src/shared/components/EstadoTela.tsx)<br>[frontend/src/shared/geo/GpsControl.tsx](../../../frontend/src/shared/geo/GpsControl.tsx)<br>[frontend/src/shared/theme/PreferenciasModal.tsx](../../../frontend/src/shared/theme/PreferenciasModal.tsx) | `/login`, `/recuperar-senha`, `/resetar-senha`, `/ativar`, `/verificar-email`, `/quero-conhecer`, `/quero-conhecer/confirmar`, `/rota`, `/cobrancas`, `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar`, `/contratos`, `/contratos/novo`, `/contratos/:id`, `/contratos/:id/editar`, `/caixa`, `/gastos`, `/insights`, `/perfil`, `/devboard`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/leads` | 2 |
| [frontend/src/shared/components/Card/Card.tsx](../../../frontend/src/shared/components/Card/Card.tsx) | CardRoot (local), CardTitle (local), CardHeader (local), CardBody (local), CardDot (local), CardIndicator (local), CardIndicators (local), CardBadge (local), CardActions (local) | [frontend/src/modules/admin/components/EmpresaList.tsx](../../../frontend/src/modules/admin/components/EmpresaList.tsx)<br>[frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx)<br>[frontend/src/modules/admin/components/OperadoresList.tsx](../../../frontend/src/modules/admin/components/OperadoresList.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx)<br>[frontend/src/modules/cliente/components/AnexosSection.tsx](../../../frontend/src/modules/cliente/components/AnexosSection.tsx)<br>[frontend/src/modules/cliente/components/ClienteCard.tsx](../../../frontend/src/modules/cliente/components/ClienteCard.tsx)<br>[frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx)<br>[frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx)<br>[frontend/src/modules/contrato/components/ContratoCard.tsx](../../../frontend/src/modules/contrato/components/ContratoCard.tsx)<br>[frontend/src/modules/contrato/components/ContratoForm.tsx](../../../frontend/src/modules/contrato/components/ContratoForm.tsx)<br>[frontend/src/modules/devboard/components/DependabotList.tsx](../../../frontend/src/modules/devboard/components/DependabotList.tsx)<br>[frontend/src/modules/devboard/components/PRsList.tsx](../../../frontend/src/modules/devboard/components/PRsList.tsx)<br>[frontend/src/modules/devboard/components/RunsList.tsx](../../../frontend/src/modules/devboard/components/RunsList.tsx)<br>[frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx)<br>[frontend/src/modules/operacoes/components/CobrancaCard.tsx](../../../frontend/src/modules/operacoes/components/CobrancaCard.tsx)<br>[frontend/src/modules/operacoes/components/PagamentoCard.tsx](../../../frontend/src/modules/operacoes/components/PagamentoCard.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx)<br>[frontend/src/shared/components/ChartCard/ChartCard.tsx](../../../frontend/src/shared/components/ChartCard/ChartCard.tsx)<br>[frontend/src/shared/components/KpiCard/KpiCard.tsx](../../../frontend/src/shared/components/KpiCard/KpiCard.tsx) | `/`, `/rota`, `/cobrancas`, `/atendidos`, `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar`, `/contratos`, `/contratos/novo`, `/contratos/:id`, `/contratos/:id/editar`, `/caixa`, `/insights`, `/perfil`, `/devboard`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/leads` | 14 |
| [frontend/src/shared/components/Carousel/Carousel.tsx](../../../frontend/src/shared/components/Carousel/Carousel.tsx) | Carousel | [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx) | `/`, `/rota` | 16 |
| [frontend/src/shared/components/ChartCard/ChartCard.tsx](../../../frontend/src/shared/components/ChartCard/ChartCard.tsx) | ChartCard | [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx) | `/insights` | 4 |
| [frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx](../../../frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx) | CollapsibleSection | [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx) | `/caixa`, `/admin/operadores/:id` | 6 |
| [frontend/src/shared/components/ConfirmModal.tsx](../../../frontend/src/shared/components/ConfirmModal.tsx) | ConfirmModal | [frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx)<br>[frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx)<br>[frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx)<br>[frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx)<br>[frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx) | `/clientes/novo`, `/clientes/:id/editar`, `/contratos/:id`, `/caixa`, `/admin`, `/admin/operadores/:id`, `/admin/empresas/:id`, `/admin/leads` | 3 |
| [frontend/src/shared/components/ErrorBanner/ErrorBanner.tsx](../../../frontend/src/shared/components/ErrorBanner/ErrorBanner.tsx) | ErrorBanner | [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx)<br>[frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx)<br>[frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx)<br>[frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx)<br>[frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx)<br>[frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx)<br>[frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx)<br>[frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx)<br>[frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx)<br>[frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx)<br>[frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx) | `/login`, `/recuperar-senha`, `/resetar-senha`, `/ativar`, `/verificar-email`, `/quero-conhecer`, `/quero-conhecer/confirmar`, `/`, `/cobrancas`, `/atendidos`, `/caixa` | 6 |
| [frontend/src/shared/components/ErrorBoundary.tsx](../../../frontend/src/shared/components/ErrorBoundary.tsx) | ErrorBoundary | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | global/shell/guard; conferir App.tsx | 4 |
| [frontend/src/shared/components/EstadoTela.tsx](../../../frontend/src/shared/components/EstadoTela.tsx) | EstadoTela | [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx)<br>[frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx)<br>[frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx)<br>[frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx)<br>[frontend/src/modules/contrato/pages/ContratoEdit.tsx](../../../frontend/src/modules/contrato/pages/ContratoEdit.tsx)<br>[frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx)<br>[frontend/src/modules/devboard/components/DependabotList.tsx](../../../frontend/src/modules/devboard/components/DependabotList.tsx)<br>[frontend/src/modules/devboard/components/PRsList.tsx](../../../frontend/src/modules/devboard/components/PRsList.tsx)<br>[frontend/src/modules/devboard/components/RunsList.tsx](../../../frontend/src/modules/devboard/components/RunsList.tsx)<br>[frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx)<br>[frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx) | `/rota`, `/clientes`, `/clientes/:id`, `/contratos`, `/contratos/:id`, `/contratos/:id/editar`, `/insights`, `/devboard`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/leads` | 17 |
| [frontend/src/shared/components/Field/Field.tsx](../../../frontend/src/shared/components/Field/Field.tsx) | Field | [frontend/src/modules/admin/components/EmpresaForm.tsx](../../../frontend/src/modules/admin/components/EmpresaForm.tsx)<br>[frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx)<br>[frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx)<br>[frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx)<br>[frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx)<br>[frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx)<br>[frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx)<br>[frontend/src/modules/caixa/components/AjusteCaixaForm.tsx](../../../frontend/src/modules/caixa/components/AjusteCaixaForm.tsx)<br>[frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx)<br>[frontend/src/modules/contrato/components/ContratoForm.tsx](../../../frontend/src/modules/contrato/components/ContratoForm.tsx)<br>[frontend/src/modules/gasto/components/GastoForm.tsx](../../../frontend/src/modules/gasto/components/GastoForm.tsx)<br>[frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx)<br>[frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx) | `/login`, `/recuperar-senha`, `/resetar-senha`, `/ativar`, `/quero-conhecer`, `/quero-conhecer/confirmar`, `/rota`, `/clientes/novo`, `/clientes/:id/editar`, `/contratos/novo`, `/contratos/:id/editar`, `/caixa`, `/gastos`, `/perfil`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id` | 7 |
| [frontend/src/shared/components/Field/FieldSelect.tsx](../../../frontend/src/shared/components/Field/FieldSelect.tsx) | FieldSelect | [frontend/src/modules/admin/components/EmpresaForm.tsx](../../../frontend/src/modules/admin/components/EmpresaForm.tsx)<br>[frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx)<br>[frontend/src/modules/admin/components/ReassignModal.tsx](../../../frontend/src/modules/admin/components/ReassignModal.tsx)<br>[frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx)<br>[frontend/src/modules/gasto/components/GastoForm.tsx](../../../frontend/src/modules/gasto/components/GastoForm.tsx)<br>[frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx) | `/clientes/novo`, `/clientes/:id/editar`, `/gastos`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/leads` | 9 |
| [frontend/src/shared/components/Field/FieldTextarea.tsx](../../../frontend/src/shared/components/Field/FieldTextarea.tsx) | FieldTextarea | [frontend/src/modules/admin/components/ImpactConfirmModal.tsx](../../../frontend/src/modules/admin/components/ImpactConfirmModal.tsx)<br>[frontend/src/modules/caixa/components/AjusteCaixaForm.tsx](../../../frontend/src/modules/caixa/components/AjusteCaixaForm.tsx)<br>[frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx) | `/caixa`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/leads` | 7 |
| [frontend/src/shared/components/KpiCard/KpiCard.tsx](../../../frontend/src/shared/components/KpiCard/KpiCard.tsx) | KpiCard | [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx)<br>[frontend/src/modules/caixa/components/AjusteCaixaForm.tsx](../../../frontend/src/modules/caixa/components/AjusteCaixaForm.tsx)<br>[frontend/src/modules/caixa/components/CaixaKpis.tsx](../../../frontend/src/modules/caixa/components/CaixaKpis.tsx)<br>[frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx)<br>[frontend/src/modules/cliente/components/SituacaoFinanceira.tsx](../../../frontend/src/modules/cliente/components/SituacaoFinanceira.tsx)<br>[frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx)<br>[frontend/src/modules/operacoes/components/IndicadoresCards.tsx](../../../frontend/src/modules/operacoes/components/IndicadoresCards.tsx) | `/`, `/clientes/:id`, `/caixa`, `/devboard`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id` | 4 |
| [frontend/src/shared/components/Logo.tsx](../../../frontend/src/shared/components/Logo.tsx) | Logo, LogoLockup | [frontend/src/modules/auth/components/PublicPageShell.tsx](../../../frontend/src/modules/auth/components/PublicPageShell.tsx)<br>[frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx)<br>[frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx)<br>[frontend/src/shared/auth/ContaSuspensaScreen.tsx](../../../frontend/src/shared/auth/ContaSuspensaScreen.tsx)<br>[frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx) | `/login`, `/recuperar-senha`, `/resetar-senha`, `/ativar`, `/verificar-email`, `/quero-conhecer`, `/quero-conhecer/confirmar` | 16 |
| [frontend/src/shared/components/Modal/Modal.tsx](../../../frontend/src/shared/components/Modal/Modal.tsx) | Modal | [frontend/src/modules/admin/components/CapacidadesModal.tsx](../../../frontend/src/modules/admin/components/CapacidadesModal.tsx)<br>[frontend/src/modules/admin/components/ContribuicaoModal.tsx](../../../frontend/src/modules/admin/components/ContribuicaoModal.tsx)<br>[frontend/src/modules/admin/components/EquipeModal.tsx](../../../frontend/src/modules/admin/components/EquipeModal.tsx)<br>[frontend/src/modules/admin/components/ImpactConfirmModal.tsx](../../../frontend/src/modules/admin/components/ImpactConfirmModal.tsx)<br>[frontend/src/modules/admin/components/ModulosModal.tsx](../../../frontend/src/modules/admin/components/ModulosModal.tsx)<br>[frontend/src/modules/admin/components/ReassignModal.tsx](../../../frontend/src/modules/admin/components/ReassignModal.tsx)<br>[frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx)<br>[frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx)<br>[frontend/src/modules/caixa/components/AjustarCaixaModal.tsx](../../../frontend/src/modules/caixa/components/AjustarCaixaModal.tsx)<br>[frontend/src/modules/caixa/components/ContratosSemanaModal.tsx](../../../frontend/src/modules/caixa/components/ContratosSemanaModal.tsx)<br>[frontend/src/modules/caixa/components/GastosPeriodoModal.tsx](../../../frontend/src/modules/caixa/components/GastosPeriodoModal.tsx)<br>[frontend/src/modules/cliente/components/AnexosSection.tsx](../../../frontend/src/modules/cliente/components/AnexosSection.tsx)<br>[frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx)<br>[frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx)<br>[frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx](../../../frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx)<br>[frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx](../../../frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx)<br>[frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx](../../../frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx)<br>[frontend/src/modules/pagamento/components/PagamentoModal.tsx](../../../frontend/src/modules/pagamento/components/PagamentoModal.tsx)<br>[frontend/src/shared/components/Avatar/Avatar.tsx](../../../frontend/src/shared/components/Avatar/Avatar.tsx)<br>[frontend/src/shared/components/ConfirmModal.tsx](../../../frontend/src/shared/components/ConfirmModal.tsx)<br>[frontend/src/shared/theme/PreferenciasModal.tsx](../../../frontend/src/shared/theme/PreferenciasModal.tsx) | `/`, `/rota`, `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar`, `/contratos/:id`, `/caixa`, `/perfil`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/leads` | 13 |
| [frontend/src/shared/components/PageHeader/PageHeader.tsx](../../../frontend/src/shared/components/PageHeader/PageHeader.tsx) | PageHeader | [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx)<br>[frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx)<br>[frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx)<br>[frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx)<br>[frontend/src/modules/cliente/pages/ClienteEdit.tsx](../../../frontend/src/modules/cliente/pages/ClienteEdit.tsx)<br>[frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx)<br>[frontend/src/modules/cliente/pages/ClienteNovo.tsx](../../../frontend/src/modules/cliente/pages/ClienteNovo.tsx)<br>[frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx)<br>[frontend/src/modules/contrato/pages/ContratoEdit.tsx](../../../frontend/src/modules/contrato/pages/ContratoEdit.tsx)<br>[frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx)<br>[frontend/src/modules/contrato/pages/ContratoNovo.tsx](../../../frontend/src/modules/contrato/pages/ContratoNovo.tsx)<br>[frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx)<br>[frontend/src/modules/gasto/pages/GastoPage.tsx](../../../frontend/src/modules/gasto/pages/GastoPage.tsx)<br>[frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx)<br>[frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx)<br>[frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx)<br>[frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx)<br>[frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx) | `/`, `/rota`, `/cobrancas`, `/atendidos`, `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar`, `/contratos`, `/contratos/novo`, `/contratos/:id`, `/contratos/:id/editar`, `/caixa`, `/gastos`, `/insights`, `/perfil`, `/devboard`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/leads` | 12 |
| [frontend/src/shared/components/QuickActions/QuickActions.tsx](../../../frontend/src/shared/components/QuickActions/QuickActions.tsx) | QuickActions | [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx)<br>[frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx)<br>[frontend/src/shared/components/Card/Card.tsx](../../../frontend/src/shared/components/Card/Card.tsx) | `/`, `/rota`, `/cobrancas`, `/atendidos`, `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar`, `/contratos`, `/contratos/novo`, `/contratos/:id`, `/contratos/:id/editar`, `/caixa`, `/insights`, `/perfil`, `/devboard`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/leads` | 13 |
| [frontend/src/shared/components/SearchBar/SearchBar.tsx](../../../frontend/src/shared/components/SearchBar/SearchBar.tsx) | SearchBar | [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx)<br>[frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx) | `/clientes`, `/admin`, `/admin/empresas/:id`, `/admin/leads` | 5 |
| [frontend/src/shared/components/SectionHeader/SectionHeader.tsx](../../../frontend/src/shared/components/SectionHeader/SectionHeader.tsx) | SectionHeader | [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx)<br>[frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx)<br>[frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx)<br>[frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx)<br>[frontend/src/modules/gasto/pages/GastoPage.tsx](../../../frontend/src/modules/gasto/pages/GastoPage.tsx)<br>[frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx](../../../frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx) | `/contratos/:id`, `/caixa`, `/gastos`, `/devboard`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id` | 3 |
| [frontend/src/shared/components/SegmentedControl/SegmentedControl.tsx](../../../frontend/src/shared/components/SegmentedControl/SegmentedControl.tsx) | SegmentedControl | [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx)<br>[frontend/src/shared/theme/PreferenciasModal.tsx](../../../frontend/src/shared/theme/PreferenciasModal.tsx) | `/insights` | 2 |
| [frontend/src/shared/components/StatusBadge/StatusBadge.tsx](../../../frontend/src/shared/components/StatusBadge/StatusBadge.tsx) | StatusBadge | [frontend/src/modules/admin/components/CapacidadesModal.tsx](../../../frontend/src/modules/admin/components/CapacidadesModal.tsx)<br>[frontend/src/modules/admin/components/ContribuicaoModal.tsx](../../../frontend/src/modules/admin/components/ContribuicaoModal.tsx)<br>[frontend/src/modules/admin/components/EmpresaList.tsx](../../../frontend/src/modules/admin/components/EmpresaList.tsx)<br>[frontend/src/modules/admin/components/EquipeModal.tsx](../../../frontend/src/modules/admin/components/EquipeModal.tsx)<br>[frontend/src/modules/admin/components/ModulosModal.tsx](../../../frontend/src/modules/admin/components/ModulosModal.tsx)<br>[frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx)<br>[frontend/src/modules/admin/components/OperadoresList.tsx](../../../frontend/src/modules/admin/components/OperadoresList.tsx)<br>[frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx)<br>[frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx)<br>[frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx)<br>[frontend/src/modules/contrato/components/ContratoCard.tsx](../../../frontend/src/modules/contrato/components/ContratoCard.tsx)<br>[frontend/src/modules/contrato/components/ParcelaList.tsx](../../../frontend/src/modules/contrato/components/ParcelaList.tsx)<br>[frontend/src/modules/devboard/components/DependabotList.tsx](../../../frontend/src/modules/devboard/components/DependabotList.tsx)<br>[frontend/src/modules/devboard/components/PRsList.tsx](../../../frontend/src/modules/devboard/components/PRsList.tsx)<br>[frontend/src/modules/devboard/components/RunsList.tsx](../../../frontend/src/modules/devboard/components/RunsList.tsx)<br>[frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx)<br>[frontend/src/modules/operacoes/components/CobrancaCard.tsx](../../../frontend/src/modules/operacoes/components/CobrancaCard.tsx)<br>[frontend/src/modules/operacoes/components/PagamentoCard.tsx](../../../frontend/src/modules/operacoes/components/PagamentoCard.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx)<br>[frontend/src/shared/components/Card/Card.tsx](../../../frontend/src/shared/components/Card/Card.tsx)<br>[frontend/src/shared/geo/GpsControl.tsx](../../../frontend/src/shared/geo/GpsControl.tsx) | `/`, `/rota`, `/cobrancas`, `/atendidos`, `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar`, `/contratos`, `/contratos/novo`, `/contratos/:id`, `/contratos/:id/editar`, `/caixa`, `/insights`, `/perfil`, `/devboard`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/leads` | 2 |
| [frontend/src/shared/components/SuccessState/SuccessState.tsx](../../../frontend/src/shared/components/SuccessState/SuccessState.tsx) | SuccessState | [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx)<br>[frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx)<br>[frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx)<br>[frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx)<br>[frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx)<br>[frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx)<br>[frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx)<br>[frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx)<br>[frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx) | `/recuperar-senha`, `/resetar-senha`, `/ativar`, `/verificar-email`, `/quero-conhecer`, `/quero-conhecer/confirmar`, `/`, `/rota`, `/cobrancas` | 5 |
| [frontend/src/shared/components/Switch/Switch.tsx](../../../frontend/src/shared/components/Switch/Switch.tsx) | Switch | [frontend/src/modules/admin/components/CapacidadesModal.tsx](../../../frontend/src/modules/admin/components/CapacidadesModal.tsx)<br>[frontend/src/modules/admin/components/ModulosModal.tsx](../../../frontend/src/modules/admin/components/ModulosModal.tsx) | `/admin/empresas` | 2 |
| [frontend/src/shared/components/Tabs/Tabs.tsx](../../../frontend/src/shared/components/Tabs/Tabs.tsx) | Tabs | sem import direto | não alcançado por página; conferir composição dinâmica | 2 |
| [frontend/src/shared/fab/Fab.tsx](../../../frontend/src/shared/fab/Fab.tsx) | Fab | [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx) | global/shell/guard; conferir App.tsx | 2 |
| [frontend/src/shared/fab/FabContext.tsx](../../../frontend/src/shared/fab/FabContext.tsx) | FabProvider | [frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx)<br>[frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx)<br>[frontend/src/shared/fab/Fab.tsx](../../../frontend/src/shared/fab/Fab.tsx)<br>[frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx) | `/clientes`, `/contratos` | 1 |
| [frontend/src/shared/feedback/FeedbackOverlay.tsx](../../../frontend/src/shared/feedback/FeedbackOverlay.tsx) | FeedbackOverlay | [frontend/src/shared/feedback/FeedbackProvider.tsx](../../../frontend/src/shared/feedback/FeedbackProvider.tsx) | `/rota`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar`, `/contratos/novo`, `/contratos/:id`, `/contratos/:id/editar`, `/caixa`, `/gastos`, `/perfil`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/leads` | 3 |
| [frontend/src/shared/feedback/FeedbackProvider.tsx](../../../frontend/src/shared/feedback/FeedbackProvider.tsx) | FeedbackProvider | [frontend/src/App.tsx](../../../frontend/src/App.tsx)<br>[frontend/src/shared/feedback/useFeedback.ts](../../../frontend/src/shared/feedback/useFeedback.ts) | `/rota`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar`, `/contratos/novo`, `/contratos/:id`, `/contratos/:id/editar`, `/caixa`, `/gastos`, `/perfil`, `/admin`, `/admin/operadores/:id`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/leads` | 2 |
| [frontend/src/shared/geo/GpsControl.tsx](../../../frontend/src/shared/geo/GpsControl.tsx) | GpsControl | [frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx)<br>[frontend/src/shared/geo/estadoGps.ts](../../../frontend/src/shared/geo/estadoGps.ts) | `/clientes/novo`, `/clientes/:id/editar` | 17 |
| [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx) | SidebarContent (local), AppLayout | [frontend/src/App.tsx](../../../frontend/src/App.tsx) | global/shell/guard; conferir App.tsx | 30 |
| [frontend/src/shared/layout/BottomTabBar.tsx](../../../frontend/src/shared/layout/BottomTabBar.tsx) | BottomTabBar | [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx) | global/shell/guard; conferir App.tsx | 7 |
| [frontend/src/shared/layout/UserMenu.tsx](../../../frontend/src/shared/layout/UserMenu.tsx) | UserMenu | [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx) | global/shell/guard; conferir App.tsx | 24 |
| [frontend/src/shared/theme/PreferenciasModal.tsx](../../../frontend/src/shared/theme/PreferenciasModal.tsx) | ThemeSwatch (local), PreferenciasModal | [frontend/src/shared/layout/UserMenu.tsx](../../../frontend/src/shared/layout/UserMenu.tsx) | global/shell/guard; conferir App.tsx | 23 |
| [frontend/src/shared/theme/ThemeProvider.tsx](../../../frontend/src/shared/theme/ThemeProvider.tsx) | ThemeProvider | [frontend/src/main.tsx](../../../frontend/src/main.tsx)<br>[frontend/src/shared/theme/useTheme.ts](../../../frontend/src/shared/theme/useTheme.ts)<br>[frontend/src/shared/utils/chartColors.ts](../../../frontend/src/shared/utils/chartColors.ts) | `/insights` | 1 |

## Elementos por arquivo

Detalhe de atributos, condições e contratos no JSON; localizar modais, estados, HTML, SVG, ícones e componentes inline para o redesign.

### frontend/src/App.tsx

Fonte: [frontend/src/App.tsx](../../../frontend/src/App.tsx). Elementos: `AdminPage`, `AdminRoute`, `AppLayout`, `AtendidosPage`, `AtivarPage`, `AuthProvider`, `BrowserRouter`, `CaixaPage`, `ClienteDetail`, `ClienteEdit`, `ClienteList`, `ClienteNovo`, `CobrancaListPage`, `ConfirmarLeadPage`, `ContratoDetail`, `ContratoEdit`, `ContratoList`, `ContratoNovo`, `DevBoardPage`, `ErrorBoundary`, `FeedbackProvider`, `GastoPage`, `InsightsPage`, `Lazy`, `LeadsAdminPage`, `LoginPage`, `OperacoesDashboard`, `OperadorDetail`, `PerfilPage`, `ProtectedRoute`, `QueroConhecerPage`, `RecuperarSenhaPage`, `RequireModule`, `ResetarSenhaPage`, `RotaPage`, `Route`, `Routes`, `SuperAdminPage`, `SuperAdminRoute`, `Suspense`, `VerificarEmailPage`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/main.tsx

Fonte: [frontend/src/main.tsx](../../../frontend/src/main.tsx). Elementos: `App`, `I18nextProvider`, `QueryClientProvider`, `StrictMode`, `ThemeProvider`.

Ícones: nenhum import direto de lucide-react. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/admin/components/CapacidadesModal.tsx

Fonte: [frontend/src/modules/admin/components/CapacidadesModal.tsx](../../../frontend/src/modules/admin/components/CapacidadesModal.tsx). Elementos: `Button`, `Check`, `Modal`, `StatusBadge`, `Switch`, `ToggleLeft`, `div`, `p`.

Ícones: Check, ToggleLeft. Contratos: `Props`. Portais: 0.

### frontend/src/modules/admin/components/ContribuicaoModal.tsx

Fonte: [frontend/src/modules/admin/components/ContribuicaoModal.tsx](../../../frontend/src/modules/admin/components/ContribuicaoModal.tsx). Elementos: `ArrowRight`, `Avatar`, `Modal`, `StatusBadge`, `button`, `div`, `p`, `span`.

Ícones: ArrowRight. Contratos: `Props`. Portais: 0.

### frontend/src/modules/admin/components/EmpresaForm.tsx

Fonte: [frontend/src/modules/admin/components/EmpresaForm.tsx](../../../frontend/src/modules/admin/components/EmpresaForm.tsx). Elementos: `Button`, `Check`, `Field`, `FieldSelect`, `div`, `form`.

Ícones: Check. Contratos: `EmpresaFormData`, `EmpresaFormInitial`, `EmpresaFormProps`. Portais: 0.

### frontend/src/modules/admin/components/EmpresaList.tsx

Fonte: [frontend/src/modules/admin/components/EmpresaList.tsx](../../../frontend/src/modules/admin/components/EmpresaList.tsx). Elementos: `ArrowRight`, `Avatar`, `Button`, `Card.Root`, `Pencil`, `SlidersHorizontal`, `StatusBadge`, `ToggleLeft`, `div`, `p`, `span`.

Ícones: SlidersHorizontal, ArrowRight, ToggleLeft, Pencil. Contratos: `EmpresaListProps`. Portais: 0.

### frontend/src/modules/admin/components/EquipeModal.tsx

Fonte: [frontend/src/modules/admin/components/EquipeModal.tsx](../../../frontend/src/modules/admin/components/EquipeModal.tsx). Elementos: `ArrowRight`, `Avatar`, `Modal`, `StatusBadge`, `button`, `div`, `p`.

Ícones: ArrowRight. Contratos: `EquipeModalProps`. Portais: 0.

### frontend/src/modules/admin/components/ImpactConfirmModal.tsx

Fonte: [frontend/src/modules/admin/components/ImpactConfirmModal.tsx](../../../frontend/src/modules/admin/components/ImpactConfirmModal.tsx). Elementos: `AlertTriangle`, `Button`, `Check`, `ChevronRight`, `FieldTextarea`, `Lock`, `Modal`, `div`, `li`, `p`, `span`, `ul`.

Ícones: AlertTriangle, Check, ChevronRight, Lock. Contratos: `Props`. Portais: 0.

### frontend/src/modules/admin/components/ModulosModal.tsx

Fonte: [frontend/src/modules/admin/components/ModulosModal.tsx](../../../frontend/src/modules/admin/components/ModulosModal.tsx). Elementos: `Button`, `Check`, `Lock`, `Modal`, `StatusBadge`, `Switch`, `ToggleLeft`, `div`, `p`.

Ícones: Check, Lock, ToggleLeft. Contratos: `Props`. Portais: 0.

### frontend/src/modules/admin/components/OperadorForm.tsx

Fonte: [frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx). Elementos: `AvatarField`, `Button`, `Card.Root`, `ConfirmModal`, `Field`, `FieldSelect`, `Mail`, `ShieldCheck`, `StatusBadge`, `XCircle`, `div`, `form`, `h2`, `p`.

Ícones: Mail, XCircle, ShieldCheck. Contratos: `FieldErrors`, `OperadorFormData`, `Props`, `OperadorFormHandle`. Portais: 0.

### frontend/src/modules/admin/components/OperadoresList.tsx

Fonte: [frontend/src/modules/admin/components/OperadoresList.tsx](../../../frontend/src/modules/admin/components/OperadoresList.tsx). Elementos: `ArrowRight`, `Avatar`, `Card.Root`, `Edit3`, `Mail`, `Phone`, `StatusBadge`, `Trash2`, `button`, `div`, `p`, `span`.

Ícones: ArrowRight, Edit3, Mail, Trash2, Phone. Contratos: `Props`, `RowDef`. Portais: 0.

### frontend/src/modules/admin/components/ReassignModal.tsx

Fonte: [frontend/src/modules/admin/components/ReassignModal.tsx](../../../frontend/src/modules/admin/components/ReassignModal.tsx). Elementos: `AlertTriangle`, `Button`, `Check`, `FieldSelect`, `Modal`, `div`, `p`.

Ícones: AlertTriangle, Check. Contratos: `ReassignState`, `Props`. Portais: 0.

### frontend/src/modules/admin/pages/AdminPage.tsx

Fonte: [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx). Elementos: `Ban`, `Button`, `ConfirmModal`, `ContribuicaoModal`, `EquipeModal`, `EstadoTela`, `KpiCard`, `Modal`, `Navigate`, `OperadorForm`, `OperadoresList`, `PageHeader`, `ReassignModal`, `RefreshCw`, `SearchBar`, `SectionHeader`, `StatusBadge`, `div`, `span`.

Ícones: Settings, Ban, RefreshCw. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/admin/pages/OperadorDetail.tsx

Fonte: [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx). Elementos: `AjustarCaixaModal`, `AjusteRow`, `Avatar`, `Ban`, `Button`, `CaixaKpis`, `Card.Root`, `CollapsibleSection`, `Edit3`, `EstadoTela`, `KpiCard`, `Modal`, `OperadorForm`, `PageHeader`, `ReassignModal`, `RefreshCw`, `SectionHeader`, `StatusBadge`, `Wallet`, `div`, `p`, `span`.

Ícones: User, Wallet, Ban, RefreshCw, Edit3. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/admin/pages/SuperAdminPage.tsx

Fonte: [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx). Elementos: `Building2`, `Button`, `CapacidadesModal`, `EmpresaForm`, `EmpresaList`, `EstadoTela`, `ImpactConfirmModal`, `KpiCard`, `Modal`, `ModulosModal`, `PageHeader`, `SectionHeader`, `div`.

Ícones: Building2. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/auth/components/PublicPageShell.tsx

Fonte: [frontend/src/modules/auth/components/PublicPageShell.tsx](../../../frontend/src/modules/auth/components/PublicPageShell.tsx). Elementos: `Logo`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/auth/pages/AtivarPage.tsx

Fonte: [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx). Elementos: `ArrowRight`, `Button`, `ErrorBanner`, `Eye`, `EyeOff`, `Field`, `PublicPageShell`, `SuccessState`, `button`, `div`, `form`, `h2`, `p`, `span`.

Ícones: ArrowRight, Eye, EyeOff. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/auth/pages/LoginPage.tsx

Fonte: [frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx). Elementos: `ArrowRight`, `Button`, `ErrorBanner`, `Eye`, `EyeOff`, `Field`, `Link`, `Logo`, `ShieldCheck`, `button`, `div`, `form`, `h1`, `h2`, `p`, `span`.

Ícones: Eye, EyeOff, ShieldCheck, ArrowRight. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/auth/pages/PerfilPage.tsx

Fonte: [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx). Elementos: `AvatarField`, `BadgeCheck`, `Button`, `Card.Root`, `Check`, `Field`, `Info`, `Lock`, `Mail`, `Modal`, `PageHeader`, `Save`, `StatusBadge`, `Undo2`, `div`, `form`, `h2`, `p`, `span`.

Ícones: Check, Save, User, Mail, Undo2, BadgeCheck, Info, Lock. Contratos: `PerfilErros`. Portais: 0.

### frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx

Fonte: [frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx). Elementos: `ArrowLeft`, `ArrowRight`, `Button`, `ErrorBanner`, `Field`, `Link`, `PublicPageShell`, `SuccessState`, `form`, `h2`, `p`.

Ícones: ArrowRight, ArrowLeft. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/auth/pages/ResetarSenhaPage.tsx

Fonte: [frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx). Elementos: `ArrowRight`, `Button`, `ErrorBanner`, `Eye`, `EyeOff`, `Field`, `Link`, `PublicPageShell`, `SuccessState`, `button`, `div`, `form`, `h2`, `p`.

Ícones: ArrowRight, Eye, EyeOff. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/auth/pages/VerificarEmailPage.tsx

Fonte: [frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx). Elementos: `ArrowRight`, `Button`, `ErrorBanner`, `PublicPageShell`, `SuccessState`, `div`, `h2`, `p`.

Ícones: ArrowRight. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/caixa/components/AjustarCaixaModal.tsx

Fonte: [frontend/src/modules/caixa/components/AjustarCaixaModal.tsx](../../../frontend/src/modules/caixa/components/AjustarCaixaModal.tsx). Elementos: `AjusteCaixaForm`, `Button`, `Modal`.

Ícones: nenhum import direto de lucide-react. Contratos: `AjustarCaixaModalProps`. Portais: 0.

### frontend/src/modules/caixa/components/AjusteCaixaForm.tsx

Fonte: [frontend/src/modules/caixa/components/AjusteCaixaForm.tsx](../../../frontend/src/modules/caixa/components/AjusteCaixaForm.tsx). Elementos: `Button`, `Check`, `Field`, `FieldTextarea`, `KpiCard`, `div`, `form`.

Ícones: Check. Contratos: `AjusteCaixaFormProps`. Portais: 0.

### frontend/src/modules/caixa/components/AjusteHistorico.tsx

Fonte: [frontend/src/modules/caixa/components/AjusteHistorico.tsx](../../../frontend/src/modules/caixa/components/AjusteHistorico.tsx). Elementos: `AjusteRow`, `div`, `p`, `span`.

Ícones: nenhum import direto de lucide-react. Contratos: `AjusteHistoricoProps`. Portais: 0.

### frontend/src/modules/caixa/components/CaixaKpis.tsx

Fonte: [frontend/src/modules/caixa/components/CaixaKpis.tsx](../../../frontend/src/modules/caixa/components/CaixaKpis.tsx). Elementos: `KpiCard`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: `CaixaKpiKey`, `CaixaKpisProps`. Portais: 0.

### frontend/src/modules/caixa/components/ContratosSemanaModal.tsx

Fonte: [frontend/src/modules/caixa/components/ContratosSemanaModal.tsx](../../../frontend/src/modules/caixa/components/ContratosSemanaModal.tsx). Elementos: `ChevronRight`, `Modal`, `button`, `div`, `p`.

Ícones: ChevronRight. Contratos: `ContratosSemanaModalProps`. Portais: 0.

### frontend/src/modules/caixa/components/GastosPeriodoModal.tsx

Fonte: [frontend/src/modules/caixa/components/GastosPeriodoModal.tsx](../../../frontend/src/modules/caixa/components/GastosPeriodoModal.tsx). Elementos: `Modal`, `div`, `p`, `span`.

Ícones: nenhum import direto de lucide-react. Contratos: `GastosPeriodoModalProps`. Portais: 0.

### frontend/src/modules/caixa/components/MovimentacoesList.tsx

Fonte: [frontend/src/modules/caixa/components/MovimentacoesList.tsx](../../../frontend/src/modules/caixa/components/MovimentacoesList.tsx). Elementos: `MovimentacaoRow`, `div`, `p`, `span`.

Ícones: nenhum import direto de lucide-react. Contratos: `MovimentacoesListProps`. Portais: 0.

### frontend/src/modules/caixa/pages/CaixaPage.tsx

Fonte: [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx). Elementos: `AjustarCaixaModal`, `AjusteRow`, `Button`, `CaixaKpis`, `ChevronLeft`, `ChevronRight`, `CollapsibleSection`, `ConfirmModal`, `ContratosSemanaModal`, `ErrorBanner`, `GastosPeriodoModal`, `KpiCard`, `MovimentacaoRow`, `PagamentosHojeModal`, `PagamentosPeriodoModal`, `PageHeader`, `ParcelasHojeModal`, `Receipt`, `SectionHeader`, `Wallet`, `button`, `div`, `h2`, `span`.

Ícones: ChevronLeft, ChevronRight, Receipt, Wallet. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/cliente/components/AnexosSection.tsx

Fonte: [frontend/src/modules/cliente/components/AnexosSection.tsx](../../../frontend/src/modules/cliente/components/AnexosSection.tsx). Elementos: `AnexoRow`, `Button`, `Card.Root`, `Check`, `Download`, `ExternalLink`, `FileText`, `ImageIcon`, `Modal`, `Paperclip`, `Trash2`, `button`, `div`, `h2`, `iframe`, `img`, `input`, `li`, `p`, `section`, `span`, `ul`.

Ícones: FileText, ImageIcon, Paperclip, Trash2, ExternalLink, Check, Download. Contratos: `Props`. Portais: 0.

### frontend/src/modules/cliente/components/ClienteCard.tsx

Fonte: [frontend/src/modules/cliente/components/ClienteCard.tsx](../../../frontend/src/modules/cliente/components/ClienteCard.tsx). Elementos: `Avatar`, `Card.Body`, `Card.Header`, `Card.Root`, `Card.Title`, `MapPin`, `Phone`, `Store`, `div`, `p`, `span`.

Ícones: Phone, Store, MapPin. Contratos: `ClienteCardProps`. Portais: 0.

### frontend/src/modules/cliente/components/ClienteForm.tsx

Fonte: [frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx). Elementos: `AvatarField`, `Button`, `Card.Header`, `Card.Root`, `Card.Title`, `Check`, `ChevronDown`, `ChevronRight`, `ConfirmModal`, `EnderecoFieldsMemo`, `Field`, `FieldSelect`, `GpsControl`, `Store`, `UserRound`, `button`, `div`, `form`.

Ícones: Check, ChevronDown, ChevronRight, UserRound, Store. Contratos: `ClienteFormProps`, `EnderecoFieldsProps`, `BlocoGps`. Portais: 0.

### frontend/src/modules/cliente/components/ClienteInfo.tsx

Fonte: [frontend/src/modules/cliente/components/ClienteInfo.tsx](../../../frontend/src/modules/cliente/components/ClienteInfo.tsx). Elementos: `ClienteCard`.

Ícones: nenhum import direto de lucide-react. Contratos: `ClienteInfoProps`. Portais: 0.

### frontend/src/modules/cliente/components/SituacaoFinanceira.tsx

Fonte: [frontend/src/modules/cliente/components/SituacaoFinanceira.tsx](../../../frontend/src/modules/cliente/components/SituacaoFinanceira.tsx). Elementos: `KpiCard`, `div`, `p`, `section`, `span`.

Ícones: nenhum import direto de lucide-react. Contratos: `SituacaoFinanceiraProps`. Portais: 0.

### frontend/src/modules/cliente/pages/ClienteDetail.tsx

Fonte: [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx). Elementos: `AnexosSection`, `ButtonLink`, `Card.Body`, `Card.Header`, `Card.Root`, `Card.Title`, `ChevronRight`, `ClienteInfo`, `EstadoTela`, `PageHeader`, `Pencil`, `Plus`, `QuickActions`, `SituacaoFinanceira`, `div`, `p`.

Ícones: ChevronRight, Plus, Pencil, Navigation, MessageCircle, Phone, User. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/cliente/pages/ClienteEdit.tsx

Fonte: [frontend/src/modules/cliente/pages/ClienteEdit.tsx](../../../frontend/src/modules/cliente/pages/ClienteEdit.tsx). Elementos: `ClienteForm`, `PageHeader`, `div`.

Ícones: User. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/cliente/pages/ClienteList.tsx

Fonte: [frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx). Elementos: `ButtonLink`, `ClienteCard`, `EstadoTela`, `Link`, `PageHeader`, `Plus`, `SearchBar`, `div`.

Ícones: Plus, Users. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/cliente/pages/ClienteNovo.tsx

Fonte: [frontend/src/modules/cliente/pages/ClienteNovo.tsx](../../../frontend/src/modules/cliente/pages/ClienteNovo.tsx). Elementos: `ClienteForm`, `PageHeader`, `div`.

Ícones: UserPlus. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/contrato/components/ClienteSelect.tsx

Fonte: [frontend/src/modules/contrato/components/ClienteSelect.tsx](../../../frontend/src/modules/contrato/components/ClienteSelect.tsx). Elementos: `Check`, `ChevronDown`, `Search`, `button`, `div`, `input`, `li`, `p`, `span`, `ul`.

Ícones: Check, ChevronDown, Search. Contratos: `ClienteResumoSelect`, `ClienteSelectProps`. Portais: 0.

### frontend/src/modules/contrato/components/ContratoCard.tsx

Fonte: [frontend/src/modules/contrato/components/ContratoCard.tsx](../../../frontend/src/modules/contrato/components/ContratoCard.tsx). Elementos: `BadgePeriodicidade`, `ButtonLink`, `Card.Body`, `Card.Header`, `Card.Root`, `Card.Title`, `StatusBadge`, `div`, `hr`, `p`, `span`.

Ícones: nenhum import direto de lucide-react. Contratos: `ContratoCardProps`. Portais: 0.

### frontend/src/modules/contrato/components/ContratoForm.tsx

Fonte: [frontend/src/modules/contrato/components/ContratoForm.tsx](../../../frontend/src/modules/contrato/components/ContratoForm.tsx). Elementos: `Button`, `Card.Body`, `Card.Header`, `Card.Root`, `Card.Title`, `Check`, `ClienteSelect`, `Field`, `button`, `div`, `form`, `p`, `span`.

Ícones: Check. Contratos: `ContratoSubmit`, `ContratoFormProps`. Portais: 0.

### frontend/src/modules/contrato/components/ContratoInfo.tsx

Fonte: [frontend/src/modules/contrato/components/ContratoInfo.tsx](../../../frontend/src/modules/contrato/components/ContratoInfo.tsx). Elementos: `ContratoCard`.

Ícones: nenhum import direto de lucide-react. Contratos: `ContratoInfoProps`. Portais: 0.

### frontend/src/modules/contrato/components/ParcelaList.tsx

Fonte: [frontend/src/modules/contrato/components/ParcelaList.tsx](../../../frontend/src/modules/contrato/components/ParcelaList.tsx). Elementos: `StatusBadge`, `button`, `div`, `li`, `p`, `span`, `ul`.

Ícones: nenhum import direto de lucide-react. Contratos: `ParcelaListProps`. Portais: 0.

### frontend/src/modules/contrato/pages/ContratoDetail.tsx

Fonte: [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx). Elementos: `Button`, `ButtonLink`, `ConfirmModal`, `ContratoInfo`, `EstadoTela`, `MessageCircle`, `Modal`, `PagamentoModal`, `PageHeader`, `ParcelaList`, `Pencil`, `RotateCcw`, `SectionHeader`, `Share2`, `button`, `canvas`, `div`, `input`, `span`.

Ícones: FileText, Share2, MessageCircle, RotateCcw, Pencil. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/contrato/pages/ContratoEdit.tsx

Fonte: [frontend/src/modules/contrato/pages/ContratoEdit.tsx](../../../frontend/src/modules/contrato/pages/ContratoEdit.tsx). Elementos: `ContratoForm`, `EstadoTela`, `PageHeader`, `div`, `p`.

Ícones: FileText. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/contrato/pages/ContratoList.tsx

Fonte: [frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx). Elementos: `Button`, `ButtonLink`, `ChevronDown`, `ContratoCard`, `EstadoTela`, `Link`, `PageHeader`, `Plus`, `X`, `button`, `div`, `input`, `p`, `span`.

Ícones: ChevronDown, Plus, X, FileText. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/contrato/pages/ContratoNovo.tsx

Fonte: [frontend/src/modules/contrato/pages/ContratoNovo.tsx](../../../frontend/src/modules/contrato/pages/ContratoNovo.tsx). Elementos: `ContratoForm`, `PageHeader`, `div`.

Ícones: FileText. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/devboard/components/DependabotList.tsx

Fonte: [frontend/src/modules/devboard/components/DependabotList.tsx](../../../frontend/src/modules/devboard/components/DependabotList.tsx). Elementos: `Bot`, `Card.Root`, `EstadoTela`, `StatusBadge`, `div`, `p`, `span`.

Ícones: Bot. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/devboard/components/PRsList.tsx

Fonte: [frontend/src/modules/devboard/components/PRsList.tsx](../../../frontend/src/modules/devboard/components/PRsList.tsx). Elementos: `Card.Root`, `EstadoTela`, `GitPullRequest`, `StatusBadge`, `div`, `p`, `span`.

Ícones: GitPullRequest. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/devboard/components/RunsList.tsx

Fonte: [frontend/src/modules/devboard/components/RunsList.tsx](../../../frontend/src/modules/devboard/components/RunsList.tsx). Elementos: `Card.Root`, `EstadoTela`, `GitBranch`, `StatusBadge`, `div`, `p`, `span`.

Ícones: GitBranch. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/devboard/pages/DevBoardPage.tsx

Fonte: [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx). Elementos: `DependabotList`, `KpiCard`, `PRsList`, `PageHeader`, `RunsList`, `SectionHeader`, `div`, `section`.

Ícones: Activity, GitPullRequest, Bot. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/gasto/components/GastoForm.tsx

Fonte: [frontend/src/modules/gasto/components/GastoForm.tsx](../../../frontend/src/modules/gasto/components/GastoForm.tsx). Elementos: `Button`, `Check`, `Field`, `FieldSelect`, `form`.

Ícones: Check. Contratos: `GastoFormProps`. Portais: 0.

### frontend/src/modules/gasto/components/GastoList.tsx

Fonte: [frontend/src/modules/gasto/components/GastoList.tsx](../../../frontend/src/modules/gasto/components/GastoList.tsx). Elementos: `Trash2`, `button`, `div`, `p`, `span`.

Ícones: Trash2. Contratos: `GastoListProps`. Portais: 0.

### frontend/src/modules/gasto/pages/GastoPage.tsx

Fonte: [frontend/src/modules/gasto/pages/GastoPage.tsx](../../../frontend/src/modules/gasto/pages/GastoPage.tsx). Elementos: `GastoForm`, `PageHeader`, `SectionHeader`, `div`, `p`.

Ícones: Receipt. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/insights/components/CarteiraChart.tsx

Fonte: [frontend/src/modules/insights/components/CarteiraChart.tsx](../../../frontend/src/modules/insights/components/CarteiraChart.tsx). Elementos: `Cell`, `Legend`, `Pie`, `PieChart`, `ResponsiveContainer`, `Tooltip`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: `CarteiraChartProps`. Portais: 0.

### frontend/src/modules/insights/components/ContribuicaoChart.tsx

Fonte: [frontend/src/modules/insights/components/ContribuicaoChart.tsx](../../../frontend/src/modules/insights/components/ContribuicaoChart.tsx). Elementos: `Bar`, `BarChart`, `ResponsiveContainer`, `Tooltip`, `XAxis`, `YAxis`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: `ContribuicaoChartProps`. Portais: 0.

### frontend/src/modules/insights/components/GastosCategoriaChart.tsx

Fonte: [frontend/src/modules/insights/components/GastosCategoriaChart.tsx](../../../frontend/src/modules/insights/components/GastosCategoriaChart.tsx). Elementos: `Cell`, `Legend`, `Pie`, `PieChart`, `ResponsiveContainer`, `Tooltip`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: `GastosCategoriaChartProps`. Portais: 0.

### frontend/src/modules/insights/components/PrevistoRecebidoChart.tsx

Fonte: [frontend/src/modules/insights/components/PrevistoRecebidoChart.tsx](../../../frontend/src/modules/insights/components/PrevistoRecebidoChart.tsx). Elementos: `Bar`, `BarChart`, `CartesianGrid`, `Legend`, `ResponsiveContainer`, `Tooltip`, `XAxis`, `YAxis`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: `PrevistoRecebidoChartProps`. Portais: 0.

### frontend/src/modules/insights/components/TendenciaChart.tsx

Fonte: [frontend/src/modules/insights/components/TendenciaChart.tsx](../../../frontend/src/modules/insights/components/TendenciaChart.tsx). Elementos: `Area`, `AreaChart`, `CartesianGrid`, `ResponsiveContainer`, `Tooltip`, `XAxis`, `YAxis`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: `TendenciaChartProps`. Portais: 0.

### frontend/src/modules/insights/pages/InsightsPage.tsx

Fonte: [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx). Elementos: `CarteiraChart`, `ChartCard`, `ContribuicaoChart`, `EstadoTela`, `GastosCategoriaChart`, `PageHeader`, `PrevistoRecebidoChart`, `SegmentedControl`, `TendenciaChart`, `div`, `h2`.

Ícones: LineChart. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx

Fonte: [frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx). Elementos: `Button`, `ErrorBanner`, `Field`, `PublicPageShell`, `SuccessState`, `div`, `form`, `h2`, `p`.

Ícones: nenhum import direto de lucide-react. Contratos: `Estado`. Portais: 0.

### frontend/src/modules/leads/pages/LeadsAdminPage.tsx

Fonte: [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx). Elementos: `Button`, `Card.Actions`, `Card.Body`, `Card.Header`, `Card.Indicator`, `Card.Indicators`, `Card.Root`, `ConfirmModal`, `EstadoTela`, `FieldSelect`, `FieldTextarea`, `Modal`, `PageHeader`, `SearchBar`, `StatusBadge`, `div`, `p`, `span`.

Ícones: Mail, PlayCircle, UserPlus, Trash2. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/leads/pages/QueroConhecerPage.tsx

Fonte: [frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx). Elementos: `ArrowLeft`, `ArrowRight`, `Button`, `ErrorBanner`, `Field`, `Link`, `Logo`, `ShieldCheck`, `SuccessState`, `button`, `div`, `form`, `h2`, `p`.

Ícones: ArrowRight, ArrowLeft, ShieldCheck. Contratos: `Erros`. Portais: 0.

### frontend/src/modules/operacoes/components/CobrancaCard.tsx

Fonte: [frontend/src/modules/operacoes/components/CobrancaCard.tsx](../../../frontend/src/modules/operacoes/components/CobrancaCard.tsx). Elementos: `Card.Root`, `ChevronRight`, `StatusBadge`, `div`, `p`, `span`.

Ícones: ChevronRight. Contratos: `CobrancaCardProps`. Portais: 0.

### frontend/src/modules/operacoes/components/CobrancaList.tsx

Fonte: [frontend/src/modules/operacoes/components/CobrancaList.tsx](../../../frontend/src/modules/operacoes/components/CobrancaList.tsx). Elementos: `CobrancaCard`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: `CobrancaListProps`. Portais: 0.

### frontend/src/modules/operacoes/components/IndicadoresCards.tsx

Fonte: [frontend/src/modules/operacoes/components/IndicadoresCards.tsx](../../../frontend/src/modules/operacoes/components/IndicadoresCards.tsx). Elementos: `KpiCard`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: `IndicadoresCardsProps`. Portais: 0.

### frontend/src/modules/operacoes/components/PagamentoCard.tsx

Fonte: [frontend/src/modules/operacoes/components/PagamentoCard.tsx](../../../frontend/src/modules/operacoes/components/PagamentoCard.tsx). Elementos: `Card.Root`, `ChevronRight`, `StatusBadge`, `div`, `p`, `span`.

Ícones: ChevronRight. Contratos: `PagamentoCardProps`. Portais: 0.

### frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx

Fonte: [frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx](../../../frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx). Elementos: `Modal`, `div`, `p`.

Ícones: nenhum import direto de lucide-react. Contratos: `PagamentosHojeModalProps`. Portais: 0.

### frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx

Fonte: [frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx](../../../frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx). Elementos: `Modal`, `div`, `p`.

Ícones: nenhum import direto de lucide-react. Contratos: `PagamentosPeriodoModalProps`. Portais: 0.

### frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx

Fonte: [frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx](../../../frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx). Elementos: `Modal`, `div`, `p`, `span`.

Ícones: nenhum import direto de lucide-react. Contratos: `ParcelasHojeModalProps`. Portais: 0.

### frontend/src/modules/operacoes/components/RouteProgress.tsx

Fonte: [frontend/src/modules/operacoes/components/RouteProgress.tsx](../../../frontend/src/modules/operacoes/components/RouteProgress.tsx). Elementos: `div`, `p`.

Ícones: nenhum import direto de lucide-react. Contratos: `RouteProgressProps`. Portais: 0.

### frontend/src/modules/operacoes/pages/AtendidosPage.tsx

Fonte: [frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx). Elementos: `CobrancaList`, `ErrorBanner`, `PagamentoCard`, `PageHeader`, `button`, `div`, `p`.

Ícones: CheckCircle2. Contratos: `Filtro`. Portais: 0.

### frontend/src/modules/operacoes/pages/CobrancaListPage.tsx

Fonte: [frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx). Elementos: `Button`, `ChevronRight`, `CobrancaList`, `ErrorBanner`, `PageHeader`, `SuccessState`, `button`, `div`, `span`.

Ícones: ChevronRight, ClipboardList. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx

Fonte: [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx). Elementos: `Carousel`, `CobrancaCard`, `ErrorBanner`, `GastosPeriodoModal`, `IndicadoresCards`, `PagamentosHojeModal`, `PageHeader`, `ParcelasHojeModal`, `QuickActions`, `SuccessState`, `button`, `div`, `h2`, `p`, `span`.

Ícones: LayoutDashboard, Banknote, MapPinned, UserPlus. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/operacoes/pages/RotaPage.tsx

Fonte: [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx). Elementos: `Button`, `CalendarClock`, `Card.Root`, `Carousel`, `CobrancaCard`, `EstadoTela`, `Field`, `Loader2`, `MapPinOff`, `MessageCircle`, `Modal`, `PagamentoModal`, `PageHeader`, `QuickActions`, `RouteProgress`, `Share2`, `StatusBadge`, `SuccessState`, `UserCheck`, `canvas`, `div`, `p`, `span`.

Ícones: Navigation, MessageCircle, Phone, FileText, Share2, UserCheck, MapPinOff, CalendarClock, Route, Loader2. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/modules/pagamento/components/PagamentoModal.tsx

Fonte: [frontend/src/modules/pagamento/components/PagamentoModal.tsx](../../../frontend/src/modules/pagamento/components/PagamentoModal.tsx). Elementos: `Button`, `Check`, `Loader2`, `Modal`, `div`, `form`, `input`, `label`, `p`, `span`.

Ícones: Check, Loader2. Contratos: `PagamentoSuccessData`, `PagamentoModalProps`. Portais: 0.

### frontend/src/shared/auth/AdminRoute.tsx

Fonte: [frontend/src/shared/auth/AdminRoute.tsx](../../../frontend/src/shared/auth/AdminRoute.tsx). Elementos: `Navigate`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/shared/auth/AuthContext.tsx

Fonte: [frontend/src/shared/auth/AuthContext.tsx](../../../frontend/src/shared/auth/AuthContext.tsx). Elementos: `AuthContext.Provider`.

Ícones: nenhum import direto de lucide-react. Contratos: `AuthUser`, `AuthContextType`. Portais: 0.

### frontend/src/shared/auth/ContaSuspensaScreen.tsx

Fonte: [frontend/src/shared/auth/ContaSuspensaScreen.tsx](../../../frontend/src/shared/auth/ContaSuspensaScreen.tsx). Elementos: `AlertTriangle`, `Ban`, `Button`, `LogOut`, `Logo`, `div`, `h2`, `p`, `span`.

Ícones: Ban, LogOut, AlertTriangle. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/shared/auth/ProtectedRoute.tsx

Fonte: [frontend/src/shared/auth/ProtectedRoute.tsx](../../../frontend/src/shared/auth/ProtectedRoute.tsx). Elementos: `ContaSuspensaScreen`, `Navigate`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/shared/auth/RequireModule.tsx

Fonte: [frontend/src/shared/auth/RequireModule.tsx](../../../frontend/src/shared/auth/RequireModule.tsx). Elementos: `Navigate`.

Ícones: nenhum import direto de lucide-react. Contratos: `Props`. Portais: 0.

### frontend/src/shared/auth/SuperAdminRoute.tsx

Fonte: [frontend/src/shared/auth/SuperAdminRoute.tsx](../../../frontend/src/shared/auth/SuperAdminRoute.tsx). Elementos: `Navigate`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/shared/components/Avatar/Avatar.tsx

Fonte: [frontend/src/shared/components/Avatar/Avatar.tsx](../../../frontend/src/shared/components/Avatar/Avatar.tsx). Elementos: `Avatar`, `Button`, `Camera`, `Modal`, `Trash2`, `button`, `div`, `img`, `input`, `p`, `span`.

Ícones: Camera, Trash2. Contratos: `AvatarSize`, `AvatarProps`, `AvatarFieldProps`. Portais: 0.

### frontend/src/shared/components/Button.tsx

Fonte: [frontend/src/shared/components/Button.tsx](../../../frontend/src/shared/components/Button.tsx). Elementos: `Link`, `button`.

Ícones: nenhum import direto de lucide-react. Contratos: `Variant`, `Size`, `ButtonBaseProps`, `ButtonProps`, `ButtonLinkProps`. Portais: 0.

### frontend/src/shared/components/Card/Card.tsx

Fonte: [frontend/src/shared/components/Card/Card.tsx](../../../frontend/src/shared/components/Card/Card.tsx). Elementos: `Link`, `QuickActions`, `StatusBadge`, `button`, `div`, `p`, `span`.

Ícones: LucideIcon. Contratos: `CardVariant`, `CardTone`, `CardRootProps`, `CardTitleProps`, `CardHeaderProps`, `CardBodyProps`, `CardDotProps`, `CardIndicatorProps`, `CardIndicatorsProps`, `CardBadgeProps`, `CardActionsProps`. Portais: 0.

### frontend/src/shared/components/Carousel/Carousel.tsx

Fonte: [frontend/src/shared/components/Carousel/Carousel.tsx](../../../frontend/src/shared/components/Carousel/Carousel.tsx). Elementos: `ChevronLeft`, `ChevronRight`, `button`, `div`.

Ícones: ChevronLeft, ChevronRight. Contratos: `CarouselProps`. Portais: 0.

### frontend/src/shared/components/ChartCard/ChartCard.tsx

Fonte: [frontend/src/shared/components/ChartCard/ChartCard.tsx](../../../frontend/src/shared/components/ChartCard/ChartCard.tsx). Elementos: `Card.Body`, `Card.Header`, `Card.Root`, `Card.Title`.

Ícones: nenhum import direto de lucide-react. Contratos: `ChartCardProps`. Portais: 0.

### frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx

Fonte: [frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx](../../../frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx). Elementos: `ChevronDown`, `SectionHeader`, `button`, `div`, `section`.

Ícones: ChevronDown. Contratos: `CollapsibleSectionProps`. Portais: 0.

### frontend/src/shared/components/ConfirmModal.tsx

Fonte: [frontend/src/shared/components/ConfirmModal.tsx](../../../frontend/src/shared/components/ConfirmModal.tsx). Elementos: `Button`, `Modal`.

Ícones: nenhum import direto de lucide-react. Contratos: `ConfirmModalProps`. Portais: 0.

### frontend/src/shared/components/ErrorBanner/ErrorBanner.tsx

Fonte: [frontend/src/shared/components/ErrorBanner/ErrorBanner.tsx](../../../frontend/src/shared/components/ErrorBanner/ErrorBanner.tsx). Elementos: `X`, `button`, `div`, `p`.

Ícones: X. Contratos: `ErrorBannerProps`. Portais: 0.

### frontend/src/shared/components/ErrorBoundary.tsx

Fonte: [frontend/src/shared/components/ErrorBoundary.tsx](../../../frontend/src/shared/components/ErrorBoundary.tsx). Elementos: `Button`, `div`, `h2`, `p`.

Ícones: nenhum import direto de lucide-react. Contratos: `ErrorBoundaryProps`, `ErrorBoundaryState`. Portais: 0.

### frontend/src/shared/components/EstadoTela.tsx

Fonte: [frontend/src/shared/components/EstadoTela.tsx](../../../frontend/src/shared/components/EstadoTela.tsx). Elementos: `AlertTriangle`, `Button`, `ButtonLink`, `Inbox`, `Loader2`, `div`, `p`, `span`.

Ícones: Loader2, AlertTriangle, Inbox. Contratos: `EstadoTelaProps`. Portais: 0.

### frontend/src/shared/components/Field/Field.tsx

Fonte: [frontend/src/shared/components/Field/Field.tsx](../../../frontend/src/shared/components/Field/Field.tsx). Elementos: `div`, `input`, `label`, `span`.

Ícones: nenhum import direto de lucide-react. Contratos: `FieldProps`. Portais: 0.

### frontend/src/shared/components/Field/FieldSelect.tsx

Fonte: [frontend/src/shared/components/Field/FieldSelect.tsx](../../../frontend/src/shared/components/Field/FieldSelect.tsx). Elementos: `div`, `label`, `option`, `select`, `span`.

Ícones: nenhum import direto de lucide-react. Contratos: `FieldSelectProps`. Portais: 0.

### frontend/src/shared/components/Field/FieldTextarea.tsx

Fonte: [frontend/src/shared/components/Field/FieldTextarea.tsx](../../../frontend/src/shared/components/Field/FieldTextarea.tsx). Elementos: `div`, `label`, `span`, `textarea`.

Ícones: nenhum import direto de lucide-react. Contratos: `FieldTextareaProps`. Portais: 0.

### frontend/src/shared/components/KpiCard/KpiCard.tsx

Fonte: [frontend/src/shared/components/KpiCard/KpiCard.tsx](../../../frontend/src/shared/components/KpiCard/KpiCard.tsx). Elementos: `Card.Root`, `p`.

Ícones: nenhum import direto de lucide-react. Contratos: `KpiVariant`, `KpiCardProps`. Portais: 0.

### frontend/src/shared/components/Logo.tsx

Fonte: [frontend/src/shared/components/Logo.tsx](../../../frontend/src/shared/components/Logo.tsx). Elementos: `Logo`, `circle`, `div`, `g`, `line`, `p`, `path`, `rect`, `span`, `svg`, `title`.

Ícones: nenhum import direto de lucide-react. Contratos: `MarkVariant`, `LogoProps`, `Ponto`, `LogoLockupProps`. Portais: 0.

### frontend/src/shared/components/Modal/Modal.tsx

Fonte: [frontend/src/shared/components/Modal/Modal.tsx](../../../frontend/src/shared/components/Modal/Modal.tsx). Elementos: `X`, `button`, `div`, `h2`, `p`, `span`.

Ícones: X. Contratos: `ModalProps`. Portais: 1.

### frontend/src/shared/components/PageHeader/PageHeader.tsx

Fonte: [frontend/src/shared/components/PageHeader/PageHeader.tsx](../../../frontend/src/shared/components/PageHeader/PageHeader.tsx). Elementos: `ChevronLeft`, `Icon`, `button`, `div`, `h1`, `p`, `span`.

Ícones: LucideIcon, ChevronLeft. Contratos: `PageHeaderProps`. Portais: 0.

### frontend/src/shared/components/QuickActions/QuickActions.tsx

Fonte: [frontend/src/shared/components/QuickActions/QuickActions.tsx](../../../frontend/src/shared/components/QuickActions/QuickActions.tsx). Elementos: `Icon`, `button`, `div`, `span`.

Ícones: LucideIcon. Contratos: `QuickAction`, `QuickActionsProps`. Portais: 0.

### frontend/src/shared/components/SearchBar/SearchBar.tsx

Fonte: [frontend/src/shared/components/SearchBar/SearchBar.tsx](../../../frontend/src/shared/components/SearchBar/SearchBar.tsx). Elementos: `Search`, `X`, `button`, `div`, `input`.

Ícones: Search, X. Contratos: `SearchBarProps`. Portais: 0.

### frontend/src/shared/components/SectionHeader/SectionHeader.tsx

Fonte: [frontend/src/shared/components/SectionHeader/SectionHeader.tsx](../../../frontend/src/shared/components/SectionHeader/SectionHeader.tsx). Elementos: `button`, `div`, `h2`.

Ícones: nenhum import direto de lucide-react. Contratos: `SectionHeaderProps`. Portais: 0.

### frontend/src/shared/components/SegmentedControl/SegmentedControl.tsx

Fonte: [frontend/src/shared/components/SegmentedControl/SegmentedControl.tsx](../../../frontend/src/shared/components/SegmentedControl/SegmentedControl.tsx). Elementos: `button`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: `Item`, `SegmentedControlProps`. Portais: 0.

### frontend/src/shared/components/StatusBadge/StatusBadge.tsx

Fonte: [frontend/src/shared/components/StatusBadge/StatusBadge.tsx](../../../frontend/src/shared/components/StatusBadge/StatusBadge.tsx). Elementos: `span`.

Ícones: nenhum import direto de lucide-react. Contratos: `Variant`, `Size`, `StatusBadgeProps`. Portais: 0.

### frontend/src/shared/components/SuccessState/SuccessState.tsx

Fonte: [frontend/src/shared/components/SuccessState/SuccessState.tsx](../../../frontend/src/shared/components/SuccessState/SuccessState.tsx). Elementos: `CheckCircle`, `button`, `div`, `p`.

Ícones: CheckCircle. Contratos: `SuccessStateProps`. Portais: 0.

### frontend/src/shared/components/Switch/Switch.tsx

Fonte: [frontend/src/shared/components/Switch/Switch.tsx](../../../frontend/src/shared/components/Switch/Switch.tsx). Elementos: `button`, `span`.

Ícones: nenhum import direto de lucide-react. Contratos: `SwitchProps`. Portais: 0.

### frontend/src/shared/components/Tabs/Tabs.tsx

Fonte: [frontend/src/shared/components/Tabs/Tabs.tsx](../../../frontend/src/shared/components/Tabs/Tabs.tsx). Elementos: `button`, `div`.

Ícones: nenhum import direto de lucide-react. Contratos: `TabsProps`. Portais: 0.

### frontend/src/shared/fab/Fab.tsx

Fonte: [frontend/src/shared/fab/Fab.tsx](../../../frontend/src/shared/fab/Fab.tsx). Elementos: `Link`, `Plus`.

Ícones: Plus. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/shared/fab/FabContext.tsx

Fonte: [frontend/src/shared/fab/FabContext.tsx](../../../frontend/src/shared/fab/FabContext.tsx). Elementos: `FabContext.Provider`.

Ícones: nenhum import direto de lucide-react. Contratos: `FabState`, `FabContextType`. Portais: 0.

### frontend/src/shared/feedback/FeedbackOverlay.tsx

Fonte: [frontend/src/shared/feedback/FeedbackOverlay.tsx](../../../frontend/src/shared/feedback/FeedbackOverlay.tsx). Elementos: `Icon`, `div`, `span`.

Ícones: Loader2, CheckCircle2, AlertCircle, AlertTriangle, Info. Contratos: `FeedbackStatus`, `FeedbackOverlayProps`. Portais: 0.

### frontend/src/shared/feedback/FeedbackProvider.tsx

Fonte: [frontend/src/shared/feedback/FeedbackProvider.tsx](../../../frontend/src/shared/feedback/FeedbackProvider.tsx). Elementos: `FeedbackContext.Provider`, `FeedbackOverlay`.

Ícones: nenhum import direto de lucide-react. Contratos: `FeedbackState`, `RunOptions`, `FeedbackContextValue`. Portais: 0.

### frontend/src/shared/geo/GpsControl.tsx

Fonte: [frontend/src/shared/geo/GpsControl.tsx](../../../frontend/src/shared/geo/GpsControl.tsx). Elementos: `AlertTriangle`, `Button`, `LocateFixed`, `MapPin`, `StatusBadge`, `div`, `p`, `span`.

Ícones: MapPin, LocateFixed, AlertTriangle. Contratos: `GpsEstado`, `GpsControlProps`. Portais: 0.

### frontend/src/shared/layout/AppLayout.tsx

Fonte: [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx). Elementos: `BottomTabBar`, `Fab`, `FabProvider`, `Link`, `Logo`, `NavLink`, `SidebarContent`, `UserMenu`, `aside`, `div`, `header`, `item.icon`, `li`, `main`, `nav`, `p`, `span`, `ul`.

Ícones: Activity, Building2, FileText, LayoutDashboard, Mail, RouteIcon, ShieldCheck, Users, Wallet. Contratos: `NavItem`. Portais: 0.

### frontend/src/shared/layout/BottomTabBar.tsx

Fonte: [frontend/src/shared/layout/BottomTabBar.tsx](../../../frontend/src/shared/layout/BottomTabBar.tsx). Elementos: `NavLink`, `aba.icon`, `li`, `nav`, `span`, `ul`.

Ícones: Activity, Building2, FileText, LayoutDashboard, Mail, Route, ShieldCheck, Users, Wallet, LucideIcon. Contratos: `ChaveNav`, `Aba`. Portais: 0.

### frontend/src/shared/layout/UserMenu.tsx

Fonte: [frontend/src/shared/layout/UserMenu.tsx](../../../frontend/src/shared/layout/UserMenu.tsx). Elementos: `Avatar`, `Link`, `PreferenciasModal`, `button`, `div`, `item.icon`, `li`, `p`, `span`, `ul`.

Ícones: LogOut, Settings, User, LucideIcon. Contratos: `Item`, `UserMenuProps`. Portais: 1.

### frontend/src/shared/theme/PreferenciasModal.tsx

Fonte: [frontend/src/shared/theme/PreferenciasModal.tsx](../../../frontend/src/shared/theme/PreferenciasModal.tsx). Elementos: `Button`, `Check`, `Languages`, `Modal`, `Monitor`, `Moon`, `Palette`, `SegmentedControl`, `SunMedium`, `ThemeSwatch`, `button`, `div`, `p`, `span`.

Ícones: Check, Languages, Monitor, Moon, Palette, SunMedium. Contratos: inferidos/sem interface local. Portais: 0.

### frontend/src/shared/theme/ThemeProvider.tsx

Fonte: [frontend/src/shared/theme/ThemeProvider.tsx](../../../frontend/src/shared/theme/ThemeProvider.tsx). Elementos: `ThemeContext.Provider`.

Ícones: nenhum import direto de lucide-react. Contratos: `ThemeMode`, `ThemeContextValue`, `ThemeProviderProps`. Portais: 0.

## Recursos visuais, temas e conteúdo

| Arquivo | Bytes | SHA-256 |
|---|---|---|
| [frontend/index.html](../../../frontend/index.html) | 1212 | `9fc977a185cad061a829b95c68e76d1d7eec23aad63b56983e403eb75514d24c` |
| [frontend/package.json](../../../frontend/package.json) | 967 | `320a3c5cebcb5a11ae5de211ef4d84457dcda5efe4c2e7ace31fdf662f8258d2` |
| [frontend/postcss.config.js](../../../frontend/postcss.config.js) | 80 | `190c877db466995bf1482f4a16abd06e04a89ede3119341e2a86ff96e1737b27` |
| [frontend/public/apple-touch-icon.png](../../../frontend/public/apple-touch-icon.png) | 51278 | `e1cff0962ab98a0709e2b9199ee2a451dffd52966e81afd347b89385506dd0e7` |
| [frontend/public/favicon.ico](../../../frontend/public/favicon.ico) | 302430 | `b27a882516438b04338bb63e6fd1f52d7d7ce494c9e0ef47965a415e8e3d30bb` |
| [frontend/public/favicon.svg](../../../frontend/public/favicon.svg) | 1132 | `69c65a327f72571469bcdcaa02995aa879e272a19fe9e457b6a7c7dee7f1abae` |
| [frontend/public/icon-192.png](../../../frontend/public/icon-192.png) | 50107 | `be3fe395448855197ad7071645114aecd3c02c5687c2df29c6517275e939c29d` |
| [frontend/public/icon-512.png](../../../frontend/public/icon-512.png) | 319355 | `ae78f184d3edd0924023e4893d8eee5970751f6a5ec66eb956dc539ede573f19` |
| [frontend/public/icon-maskable-512.png](../../../frontend/public/icon-maskable-512.png) | 319355 | `0e2fb561843ec6a15a3fb219586ee377880c3786ca7e763bc74c58d1167ae38f` |
| [frontend/public/manifest.webmanifest](../../../frontend/public/manifest.webmanifest) | 573 | `12f8e05357511d44aa3774780f560ab7cad3ff70d0e9ae56b783e7e8d50e638d` |
| [frontend/public/sw.js](../../../frontend/public/sw.js) | 2076 | `181993b5fe4ed4a4c8b1059ee9175b240e8eecf52d227085d4aa35b256f185eb` |
| [frontend/src/i18n/locales/en.json](../../../frontend/src/i18n/locales/en.json) | 39979 | `abfc6a6b18f4b21b6706090b370ca10cba625232ee1bf44df40a0a861042b696` |
| [frontend/src/i18n/locales/es.json](../../../frontend/src/i18n/locales/es.json) | 42056 | `7d2f53b51cb8b790217972688a7a7822562593ec0c71159be4afed975315016a` |
| [frontend/src/i18n/locales/pt-BR.json](../../../frontend/src/i18n/locales/pt-BR.json) | 41501 | `5e4dc34c7fcf4e97959d0ebeedf41557ecafbc59b8b52c7bde542a5292d561b8` |
| [frontend/src/index.css](../../../frontend/src/index.css) | 11702 | `7b3310e457e32659398e33034171a39236d6242490b99a36521e0bf201ac0e29` |
| [frontend/src/shared/theme/PreferenciasModal.tsx](../../../frontend/src/shared/theme/PreferenciasModal.tsx) | 4852 | `eef669ad881e2a4db0d1a63ba1f3c31c10a63590ea486bc27673a898f758fbaf` |
| [frontend/src/shared/theme/ThemeProvider.tsx](../../../frontend/src/shared/theme/ThemeProvider.tsx) | 3268 | `a2f546293b0a7e46086cd5dba36265b14a7aa1a5dda570421a03da61e4e858f7` |
| [frontend/src/shared/theme/favicon.ts](../../../frontend/src/shared/theme/favicon.ts) | 3174 | `5c18fd0a9db7ee3d7a43c6525c45e21e91f0d2405867d79c76aa3efa917f965f` |
| [frontend/src/shared/theme/themes.ts](../../../frontend/src/shared/theme/themes.ts) | 456 | `65c35e47e604b9f2997c8202e04890f397074fe95fdab6cdf0d72e63fc1cd6e1` |
| [frontend/src/shared/theme/useTheme.ts](../../../frontend/src/shared/theme/useTheme.ts) | 230 | `29f8c213d8678e06644044deca5def3ca4fb1bc64536d213cbedc9e7433f90dd` |
| [frontend/tailwind.config.js](../../../frontend/tailwind.config.js) | 3347 | `a47356565ff810155ba163e4d86c09ae107f8c85e49d6f70d4d6431e0b43e6f5` |

## Uso na repaginação

1. Selecionar uma rota e suas dependências no inventário.
2. Conferir carregando/vazio/erro/sucesso, papéis/módulos, modais, confirmações, validações, teclado/foco, mobile/desktop e temas no navegador.
3. Alterar componentes compartilhados junto de seus consumidores: `node scripts/consumers.mjs Nome`.
4. Regenerar `npm run docs:visual`; executar auditorias UI/estilos/módulos/documentação e testes relevantes.
5. Registrar evidência visual antes de marcar uma superfície como revisada. O inventário não declara aprovação visual de todas as telas.


[Estados por rota, referências visuais e lacunas](UI-STATES.md).
