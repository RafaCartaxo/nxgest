# Planos de Implementação

Os Planos de Implementação são artefatos produzidos pela **SKILL-003 — Feature Planner**.

Cada plano representa o planejamento completo de uma funcionalidade antes do início de sua implementação.

Após aprovado, o Plano serve como entrada oficial para a **SKILL-004 — Vertical Slice Builder**, responsável pela implementação da funcionalidade.

## Planos Existentes

| Plano | Descrição | Status |
|---|---|---|
| [PLAN-001-contrato.md](PLAN-001-contrato.md) | Módulo Contrato | Concluído |
| [PLAN-002-pagamento.md](PLAN-002-pagamento.md) | Módulo Pagamento | Concluído |
| [PLAN-003-operacoes.md](PLAN-003-operacoes.md) | Módulo Operações | Concluído |
| [PLAN-004-feedback.md](PLAN-004-feedback.md) | Sistema Global de Feedback | Concluído |
| [PLAN-005-cliente-card.md](PLAN-005-cliente-card.md) | ClienteCard — Componentização e Padronização | Concluído |
| [PLAN-006-padronizacao-visual.md](PLAN-006-padronizacao-visual.md) | Padronização Visual (Tokens + ContratoCard) | Concluído |
| [PLAN-007-padronizacao-cobrancas.md](PLAN-007-padronizacao-cobrancas.md) | Padronização de Cards de Cobrança | Concluído |
| [PLAN-008-carrossel-navegacao.md](PLAN-008-carrossel-navegacao.md) | Carrossel de Navegação | Concluído |
| [PLAN-009-conceito-atendimento.md](PLAN-009-conceito-atendimento.md) | Conceito de Atendimento | Concluído |
| [PLAN-010-barra-progresso.md](PLAN-010-barra-progresso.md) | Barra de Progresso (Fila Operacional) | Concluído |
| [PLAN-011-atendidos-hoje.md](PLAN-011-atendidos-hoje.md) | Atendidos Hoje | Concluído |
| [PLAN-012-resumo-operacional-rota.md](PLAN-012-resumo-operacional-rota.md) | Resumo Operacional da Rota | Concluído |
| [PLAN-013-dark-mode.md](PLAN-013-dark-mode.md) | Dark Mode — Tema Escuro | Concluído |
| [PLAN-014-caixa-gasto.md](PLAN-014-caixa-gasto.md) | Módulos Caixa e Gasto (Fase 4) | Concluído |
| [PLAN-015-autenticacao.md](PLAN-015-autenticacao.md) | Autenticação Multi-Usuário (Fase 5.2) | Concluído |
| [PLAN-016-endereco-comercio.md](PLAN-016-endereco-comercio.md) | Endereço do Comércio + GPS (Fase 5.6) | Concluído |
| [PLAN-017-admin-panel.md](PLAN-017-admin-panel.md) | Admin Panel + Níveis Permissionais (Fase 5.2b) | Concluído |
| [PLAN-018-deploy.md](PLAN-018-deploy.md) | Deploy do Primeiro Cliente (SQLite + VPS) | Concluído |
| [PLAN-019-multi-tenant.md](PLAN-019-multi-tenant.md) | Multi-Tenant: Super Admin + Empresas | Concluído |
| [PLAN-020-admin-operador-caixa.md](PLAN-020-admin-operador-caixa.md) | Drill-down Admin → Operador + Caixa Base do Admin + Fix cálculo do Caixa | Concluído |
| [PLAN-021-admin-contexto-kpis.md](PLAN-021-admin-contexto-kpis.md) | Painel admin: contexto de empresa, KPIs por seção, Admins × Operadores, login por role, engrenagem na navbar | Concluído |
| [PLAN-022-admin-kpis-ajuste.md](PLAN-022-admin-kpis-ajuste.md) | Ajuste de KPIs (contratos ativos por estado, tooltip do Resultado do Dia, escopo de nível) + idioma na engrenagem | Concluído |
| [PLAN-023-ajustes-pos-validacao.md](PLAN-023-ajustes-pos-validacao.md) | Ajustes pós-validação: fix bug da rota, destaque "Vence Hoje", pagos no "Todos" e histórico de atrasos | Concluído |
| [PLAN-024-admin-organizacao-kpis.md](PLAN-024-admin-organizacao-kpis.md) | Página admin: fix do ajuste de saldo no operador, cards no padrão do sistema, usuário corrente na Equipe, admins no topo e KPIs clicáveis | Concluído |
| [PLAN-025-regra-exclusiva-ajuste-caixa.md](PLAN-025-regra-exclusiva-ajuste-caixa.md) | Ajuste do Caixa Base exclusivo de admin/super_admin (operador read-only) + contexto de empresa no super admin (admin no card, breadcrumb/voltar) | Concluído |
| [PLAN-026-auditoria-modais-nomencleatura-admin.md](PLAN-026-auditoria-modais-nomencleatura-admin.md) | Sprint 1 do backlog: Auditoria de Caixa (P014), padronização de modais (P018), nomenclatura admin (P012) | Concluído |
| [PLAN-027-exibicao-historico-caixa.md](PLAN-027-exibicao-historico-caixa.md) | Exibição do Histórico de Ajustes do Caixa Base (P014) — admin e operador veem data, valores, quem ajustou e motivo | Concluído |
| [PLAN-028-estorno-pagamento.md](PLAN-028-estorno-pagamento.md) | Estorno de Pagamento pelo Admin (P013 — fatia 1): admin corrige transação errada do operador | Concluído |
| [PLAN-029-senha-perfil.md](PLAN-029-senha-perfil.md) | Senha e Perfil do Usuário: mostrar/ocultar senha no login, `PATCH /api/auth/senha`, página "Meus dados" para todos os perfis | Concluído |
| [PLAN-030-admin-visao-equipe.md](PLAN-030-admin-visao-equipe.md) | Admin: visão da equipe — KPIs de Operação agregados (BR-091), `GET /api/admin/equipe`, `ContribuicaoModal`, navbar com Administração/Empresas visíveis | Concluído |
| [PLAN-031-temas-modulos-whitelabel.md](PLAN-031-temas-modulos-whitelabel.md) | Temas & gradientes (5 por usuário) + Super Admin whitelabel: módulos por empresa (BR-092/093), `PATCH /modulos`, gating de UI | Concluído |
| [PLAN-032-papeis-hierarquicos-socio.md](PLAN-032-papeis-hierarquicos-socio.md) | Papéis hierárquicos: papel `socio` (escopo por subárvore), `usuarios.chefeId`, sócio cria operador do grupo (BR-094/095) | Concluído |
| [PLAN-033-atrasos-cliente-historico.md](PLAN-033-atrasos-cliente-historico.md) | Situação financeira do cliente: atraso, vence hoje e lucro previsto no detalhe + histórico de atrasos (BR-096/097/098) | Concluído |
| [PLAN-034-atraso-card-contrato.md](PLAN-034-atraso-card-contrato.md) | Atraso no card do contrato (lista): linha de atraso "N parcelas · R$ Y · D dias" (BR-099) | Concluído |
| [PLAN-035-temas-componentes-e-hero-headers.md](PLAN-035-temas-componentes-e-hero-headers.md) | Temas nos componentes (fim das cores fixas da paleta) + hero header nos módulos (`PageHeader`) + guarda `audit:styles` | Concluído |
| [PLAN-036-whitelabel-enforcement-backend.md](PLAN-036-whitelabel-enforcement-backend.md) | Whitelabel: enforcement de módulos no backend — 403 `MODULE_DISABLED` por módulo desativado (P024) | Concluído |
| [PLAN-037-coerencia-whitelabel-central-adapta.md](PLAN-037-coerencia-whitelabel-central-adapta.md) | Coerência do whitelabel: `contratos⇒clientes` + validação transitiva de combos + Central se adapta por módulo (P025) | Concluído |
| [PLAN-038-identidade-visual-nexus.md](PLAN-038-identidade-visual-nexus.md) | Identidade visual "Nexus": tokens OKLCH, tipografia Sora, logo, sidebar lateral, login redesenhadado | Concluído |
| [PLAN-039-padronizacao-forms-inputs.md](PLAN-039-padronizacao-forms-inputs.md) | Padronização de Forms & Inputs: token `border-strong`, componente `Field`, avatar no ClienteCard | Em andamento |
| [PLAN-040-admin-identidade.md](PLAN-040-admin-identidade.md) | Painel Admin na identidade "Nexus": forms com `Field`, `ModulosModal` v2 (switches + dependências), `AdminPage`/`EmpresaList` com avatar/badges | Concluído |
| [PLAN-041-avatar-foto.md](PLAN-041-avatar-foto.md) | Avatar com foto (usuário/operador/cliente): componente `Avatar` + `processarImagem` (data URL ≤200px) + `usuarios.foto`/`clientes.foto` | Planejado |
| [PLAN-042-anexos-cliente.md](PLAN-042-anexos-cliente.md) | Anexos do cliente: comprovante de residência (foto ou PDF, limites 1MB/5MB), `/data/uploads`, endpoints escopados, backup inclui uploads | Planejado |
| [PLAN-043-polimento-final-identidade-nexus.md](PLAN-043-polimento-final-identidade-nexus.md) | Polimento final da identidade "Nexus": forms/listas/inputs no padrão, navbar com 3 dropdowns (tema/cores/idioma), fix QuickActions, docs stale | Concluído |
| [PLAN-044-governanca-ui-anti-drift.md](PLAN-044-governanca-ui-anti-drift.md) | Governança de UI: `audit:ui` (gate no deploy), inventário `UI-COVERAGE`, protocolo de shared-component, checklist corrigida, ADR-005 | Concluído |
| [PLAN-045-modularizacao-whitelabel.md](PLAN-045-modularizacao-whitelabel.md) | Modularização pro whitelabel: Module Manifest (`audit:modules`), Central composável por widgets, grafo refinado (rota/atendidos⇒cobrancas), matriz UC×módulo | Concluído |
| [PLAN-046-fix-switch-modulos-engrenagem-coerencia-grafo.md](PLAN-046-fix-switch-modulos-engrenagem-coerencia-grafo.md) | Fix do switch de módulos + engrenagem única (tema/cores/idioma) + coerência do grafo (CT-118/119, UC-055, smoke MOD-100/101) | Concluído |
| [FEATURE-temp.md](FEATURE-temp.md) | Prévia do Pagamento (rascunho → implementado no `PagamentoModal`) | Concluído |
