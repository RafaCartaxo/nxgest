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
| [PLAN-039-padronizacao-forms-inputs.md](PLAN-039-padronizacao-forms-inputs.md) | Padronização de Forms & Inputs: token `border-strong`, componente `Field`, avatar no ClienteCard | Concluído |
| [PLAN-040-admin-identidade.md](PLAN-040-admin-identidade.md) | Painel Admin na identidade "Nexus": forms com `Field`, `ModulosModal` v2 (switches + dependências), `AdminPage`/`EmpresaList` com avatar/badges | Concluído |
| [PLAN-041-avatar-foto.md](PLAN-041-avatar-foto.md) | Avatar com foto (usuário/operador/cliente): componente `Avatar` + `processarImagem` (data URL ≤200px) + `usuarios.foto`/`clientes.foto` | Concluído |
| [PLAN-042-anexos-cliente.md](PLAN-042-anexos-cliente.md) | Anexos do cliente: comprovante de residência (foto ou PDF, limites 1MB/5MB), `/data/uploads`, endpoints escopados, backup inclui uploads | Concluído |
| [PLAN-043-polimento-final-identidade-nexus.md](PLAN-043-polimento-final-identidade-nexus.md) | Polimento final da identidade "Nexus": forms/listas/inputs no padrão, navbar com 3 dropdowns (tema/cores/idioma), fix QuickActions, docs stale | Concluído |
| [PLAN-044-governanca-ui-anti-drift.md](PLAN-044-governanca-ui-anti-drift.md) | Governança de UI: `audit:ui` (gate no deploy), inventário `UI-COVERAGE`, protocolo de shared-component, checklist corrigida, ADR-005 | Concluído |
| [PLAN-045-modularizacao-whitelabel.md](PLAN-045-modularizacao-whitelabel.md) | Modularização pro whitelabel: Module Manifest (`audit:modules`), Central composável por widgets, grafo refinado (rota/atendidos⇒cobrancas), matriz UC×módulo | Concluído |
| [PLAN-046-fix-switch-modulos-engrenagem-coerencia-grafo.md](PLAN-046-fix-switch-modulos-engrenagem-coerencia-grafo.md) | Fix do switch de módulos + engrenagem única (tema/cores/idioma) + coerência do grafo (CT-118/119, UC-055, smoke MOD-100/101) | Concluído |
| [PLAN-047-card-cobranca-dia-lovable-badges-modais.md](PLAN-047-card-cobranca-dia-lovable-badges-modais.md) | **Identidade visual "Nexus" (consolidado, absorve PLAN-048..054):** card de cobrança do dia (Lovable, `diasEmAtraso`, fix parcela, altura uniforme, alinhamentos), componentes (Modal bottom-sheet, FieldSelect/Textarea, Tabs, EstadoTela, StatusBadge dot, Switch, ParcelaList), admin (ModulosModal v2, OperadorDetail), anti-drift (`audit:ui`) e docs | Concluído |
| [PLAN-055-modulo-localizacao-navegacao-fix-endereco.md](PLAN-055-modulo-localizacao-navegacao-fix-endereco.md) | Módulo `shared/geo` de localização/navegação + fix do endereço (editar texto descarta coords, GPS no principal, alvo comércio→principal, CTs GEO-001..007) | Concluído |
| [PLAN-056-port-material-lovable-botoes-gps-form-preferencias.md](PLAN-056-port-material-lovable-botoes-gps-form-preferencias.md) | Port do material Lovable: Button variantes (soft/outline/success+size), GpsControl (3 estados), ClienteForm em 4 Cards, ClienteSelect, vocabulário de botões (sem "→"), Preferências em modal (tema light/dark/system + paletas + idioma) | Concluído |
| [PLAN-058-foto-qualidade-lightbox.md](PLAN-058-foto-qualidade-lightbox.md) | Foto com qualidade (640px, q0.8) + lightbox (clique amplia) + segurança by-design do upload (allowlist MIME, magic bytes, ≤1MB) | Concluído |
| [PLAN-059-modularizacao-fina-capacidades-guard.md](PLAN-059-modularizacao-fina-capacidades-guard.md) | Modularização fina: capacidades por empresa (BR-104) + guard de desativação com dados em aberto (BR-105, 409/force/auditoria) + arquitetura (use-cases+ports, controller sem infra) | Concluído |
| [PLAN-060-Stitch-Nav-AppFirst-NXGest.md](PLAN-060-Stitch-Nav-AppFirst-NXGest.md) | Navegação app-first: `BottomTabBar` mobile + `UserMenu` + sidebar desktop sem drawer/Topbar + fix link morto `/design` | Concluído |
| [PLAN-061-empresa-card-suspensao-rebaixamento.md](PLAN-061-empresa-card-suspensao-rebaixamento.md) | Card da empresa (Recursos/Editar) + suspensão por `ativa` (403 EMPRESA_INATIVA, BR-106) + rebaixamento com reassign atômico (OPERATOR_HAS_SUBORDINATES) + SuperAdminRoute + fixes | Concluído |
| [PLAN-062-rota-dia-lovable.md](PLAN-062-rota-dia-lovable.md) | Rota do dia: progresso Lovable, card de ações, "Parada X de Y", modais 3→2, alça Modal, html lang, FAB | Concluído |
| [PLAN-063-contexto-operador-clientes.md](PLAN-063-contexto-operador-clientes.md) | Contexto do operador: clientes do operador (`?usuarioId=` na lista) — fecha P13 | Concluído |
| [PLAN-064-onboarding-comercial-leads.md](PLAN-064-onboarding-comercial-leads.md) | Onboarding comercial: Lead → confirmação de e-mail → painel super → converter (reusa createEmpresa + convite) — P026 | Concluído |
| [PLAN-065-fluxo-de-conta.md](PLAN-065-fluxo-de-conta.md) | Fluxo de conta: convite/ativação + esqueci a senha + infra de e-mail (Resend) — P020 | Concluído |
| [PLAN-066-hardening-seguranca.md](PLAN-066-hardening-seguranca.md) | Hardening de segurança (trust proxy/CF-Connecting-IP · helmet/CSP · CORS fail-closed · rate limit por usuário · backup cripto) — P0+P1 ✅ · P2 pendente | 🔵 P2 pendente |
| [PLAN-067-testes.md](PLAN-067-testes.md) | Implementação de testes: infra vitest/jsdom/RTL + coverage + CI; unit use-cases + shared/segurança + lógica front + UI crítica (P022) | 🔵 Em execução (F0+F1+F3-P022+CI+coverage, 08/08) |
| [PLAN-068-migracao-url-email-producao.md](PLAN-068-migracao-url-email-producao.md) | Migração de URL para `nxgest.com.br` + e-mail em produção (Resend · Caddy www→apex · env/compose · SSL Full strict · duckdns transitório) | ✅ Em produção (08/08) |
| [PLAN-069-polimento-ui-app.md](PLAN-069-polimento-ui-app.md) | Port-back do polimento de UI (protótipo Lovable `42f1adcb` — Config/Fechar caixa/Ajuste caixa/Admin) | 🔵 Em execução — parte 1 ✅ (08/08) · parte 2 (Admin) pendente |
| [PLAN-070-postgres-otimizacao.md](PLAN-070-postgres-otimizacao.md) | **Migração SQLite → PostgreSQL** + otimização da camada de dados (N+1, subqueries correlacionadas, índices, transações, backup pg_dump) | ✅ **Concluído — PostgreSQL em produção** (13/08) |
| [PLAN-071-email-deliverability.md](PLAN-071-email-deliverability.md) | E-mail: sair do spam (display name "NX Gest", DMARC rua→quarantine, assuntos) + política de envio dev/staging/prod via `MAIL_PROVIDER` | 🔵 Fase 1+2 ✅ (11/08) · Fase 3 (DNS) e 4 (monitoramento) manuais |
| [PLAN-072-identidade-visual-autosservico.md](PLAN-072-identidade-visual-autosservico.md) | **Identidade visual da empresa: autosserviço + branding por tenant** — admin/sócio edita nomeFantasia/tema/logo/contato, super modera, migração com ALTER, seed de identidade na conversão de lead | ⏳ Planejado (análises + CTs ID-/LD- registrados, 13/08) |
| [PLAN-073-ia-produto.md](PLAN-073-ia-produto.md) | **IA no produto (plano mestre F1-F5):** WhatsApp inteligente · resumo do dia · priorização de rota · OCR de anexos · FAQ (P029) | ⏳ Planejado — F1 detalhada |
| [PLAN-074-ia-whatsapp.md](PLAN-074-ia-whatsapp.md) | **IA F1 — WhatsApp inteligente (P017):** endpoint `sugerir` (Gemini Flash-Lite, free tier) + fallback ao template | ⏳ Planejado |
| [FEATURE-temp.md](FEATURE-temp.md) | Prévia do Pagamento (rascunho → implementado no `PagamentoModal`) | Concluído |

## Backlog e briefings auxiliares

> **Backlog do produto** (refinamentos priorizados por epic): [BACKLOG.md](BACKLOG.md).

Briefings para ferramentas de IA/Lovable e artefatos de referência — históricos quando o trabalho já foi portado para o app real:

| Documento | Descrição | Status |
|---|---|---|
| [BACKLOG.md](BACKLOG.md) | Refinamentos do produto por epic (P011..P027) — prioridade sugerida | 🔵 Em andamento |
| [Lovable-Polimento-UI-NXGest.md](Lovable-Polimento-UI-NXGest.md) | Briefing Lovable: polimento de 4 superfícies (Configurações · Fechar caixa Central · Ajuste caixa operador · Admin) — estado-alvo app-feel | ✅ Portado (PLAN-069) |
| [Lovable-Icone-Marca-NXGest.md](Lovable-Icone-Marca-NXGest.md) | Briefing Lovable: ícone/marca — "N" limpo e centralizado + fundo full-bleed + legível a 16px (favicon/logo/PWA) | ✅ Portado (10/08, v1.1+v1.2 — LOGO `sm` + SW) |
| [Lovable-Admin-NXGest.md](Lovable-Admin-NXGest.md) | Briefing Lovable: área administrativa — `Field`, `ModulosModal` v2, AdminPage, EmpresaList | ✅ Histórico (portado em PLAN-040) |
| [Lovable-Avatar-NXGest.md](Lovable-Avatar-NXGest.md) | Briefing Lovable: Avatar com foto (usuário/operador/cliente) | ✅ Histórico (portado em PLAN-041) |
| [Lovable-Anexos-NXGest.md](Lovable-Anexos-NXGest.md) | Briefing Lovable: anexos do cliente (comprovante de residência, foto/PDF) | ✅ Histórico (portado em PLAN-042) |
| [Lovable-Cadastro-Rota-NXGest.md](Lovable-Cadastro-Rota-NXGest.md) | Briefing Lovable: cadastro (cliente/contrato) + rota + botões na identidade Nexus | ✅ Histórico (portado em PLAN-055/056/062) |
| [Lovable-NXGest.md](Lovable-NXGest.md) | Briefing original de identidade visual (pré-"Nexus") | ✅ Superseded (mantido como histórico) |
| [Stitch-Nav-AppFirst-NXGest.md](Stitch-Nav-AppFirst-NXGest.md) | Briefing Lovable: navegação app-first (bottom tab bar + UserMenu + sidebar) | ✅ Histórico (implementado em 07/08, PLAN-060) |
