# UI COVERAGE — superfícies atuais

Gerado por `npm run docs:visual`. Base: código atual. Inventariado não significa aprovado visualmente; as marcas históricas de canonicidade não substituem validação no navegador.

São **29 rotas concretas**, **28 arquivos de página**, um shell catch-all e a superfície condicional ContaSuspensaScreen. AdminPage é reutilizada no contexto da empresa.

## Telas e contextos

| Rota | Componente | Acesso | Módulo | Fonte |
|---|---|---|---|---|
| `/login` | LoginPage | público | — | [frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx) |
| `/recuperar-senha` | RecuperarSenhaPage | público | — | [frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx) |
| `/resetar-senha` | ResetarSenhaPage | público | — | [frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx) |
| `/ativar` | AtivarPage | público | — | [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx) |
| `/verificar-email` | VerificarEmailPage | público | — | [frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx) |
| `/quero-conhecer` | QueroConhecerPage | público | — | [frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx) |
| `/quero-conhecer/confirmar` | ConfirmarLeadPage | público | — | [frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx) |
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

## Superfícies transversais

- AppLayout, sidebar, BottomTabBar e UserMenu: navegação condicionada por perfil/módulo.
- ProtectedRoute/ContaSuspensaScreen e guards administrativos/de módulos: acesso, bloqueio e redirecionamento.
- Suspense/ErrorBoundary/EstadoTela: carregamento, erro e recuperação.
- FeedbackProvider: toast, confirmações e alertas; Modal: portal, overlay, foco e bottom-sheet mobile.
- Avatar: iniciais/foto/lightbox; AvatarField usa MAX_LADO=640 em processarImagem.ts.
- Temas, paletas, ícones/favicon/PWA, traduções, CSS e variantes: recursos e contratos no inventário.

## Componentes, estados e elementos

O [inventário completo](UI-INVENTORY.md) localiza os 118 arquivos com JSX e suas declarações locais/compartilhadas. O [catálogo](04-UI-COMPONENTS.md) extrai assinaturas, interfaces/types e receitas. O [JSON](ui-inventory.json) registra cada ocorrência HTML/SVG/componente com linha, atributos e condições. A alcançabilidade é estática; não significa renderização simultânea.

## Gate da repaginação

- [ ] Percorrer todos os perfis/módulos e contextos da rota.
- [ ] Conferir desktop/mobile, temas/paletas, foco, teclado e acessibilidade.
- [ ] Conferir carregando/vazio/erro/sucesso, validações, confirmações, menus, modais e sobreposições.
- [ ] Atualizar consumidores ao alterar um componente compartilhado.
- [ ] Executar docs:visual, docs:audit, audit:ui, audit:styles, audit:modules e testes relevantes.
- [ ] Registrar capturas e resultado da revisão visual; nenhum check AST concede aprovação visual.


[Estados por rota, referências visuais e lacunas](UI-STATES.md).
