# Índice

## Foundation

- [00-NORTH-STAR.md](foundation/00-NORTH-STAR.md) — Propósito, valores, princípios e prioridades do projeto
- [ADR-001 — Arquitetura Base](foundation/ADR-001-Arquitetura.md) — Stack, arquitetura e estrutura do backend
- [ADR-002 — Arquitetura do Frontend](foundation/ADR-002-Arquitetura-Front.md) — Stack e decisões de frontend
- [ADR-003 — Auth + Autorização](foundation/ADR-003-Auth-Autorizacao.md) — Subsistema de autenticação e permissões
- [ADR-004 — Infraestrutura de Deploy](foundation/ADR-004-Infra-Deploy.md) — VPS + Caddy + DuckDNS, decisão de infraestrutura

## Product

- [00-PROJECT.md](product/00-PROJECT.md) — Visão do produto, escopo, funcionalidades e premissas
- [01-DOMAIN.md](product/01-DOMAIN.md) — Entidades, responsabilidades, relacionamentos e estados
- [02-BUSINESS-RULES.md](product/02-BUSINESS-RULES.md) — Regras de negócio (BR-001 a BR-090)
- [03-PRD.md](product/03-PRD.md) — Product Requirements Document
- [04-ROADMAP.md](product/04-ROADMAP.md) — Roadmap do produto (v2.7, Fases 0-5)
- [05-CONVENTIONS.md](product/05-CONVENTIONS.md) — Convenções de código e nomenclatura
- [06-CASOS-DE-USO.md](product/06-CASOS-DE-USO.md) — Casos de uso reais de validação por fluxo (o que deve acontecer e onde o dado reflete)
- [07-CASOS-DE-USO-API.md](product/07-CASOS-DE-USO-API.md) — Casos de uso e cenários de teste da API (request/response + coerência de retornos)
- [08-UC-MODULOS.md](product/08-UC-MODULOS.md) — Matriz UC/CT × módulo do whitelabel (validação on/off, PLAN-045)

## Engineering

- [00-ARCHITECTURE.md](engineering/00-ARCHITECTURE.md) — Arquitetura do sistema, camadas e fluxo
- [01-DATABASE.md](engineering/01-DATABASE.md) — Modelo de persistência, entidades e integridade
- [02-API.md](engineering/02-API.md) — Contratos da API, endpoints e validações
- [03-FRONTEND.md](engineering/03-FRONTEND.md) — Implementação do frontend, camadas e padrões
- [04-BACKEND.md](engineering/04-BACKEND.md) — Implementação do backend, Use Cases e Ports
- [05-MAPEAMENTO-TELAS.md](engineering/05-MAPEAMENTO-TELAS.md) — Mapeamento de telas, componentes e aderência ao Design System
- [06-PRODUCAO.md](engineering/06-PRODUCAO.md) — Runbook de operação: acesso, deploy, backup, rollback
- [07-FORMS-INPUTS.md](engineering/07-FORMS-INPUTS.md) — Padrões de formulários e inputs (Field, validação, máscaras)
- [08-SETUP-NOVA-MAQUINA.md](engineering/08-SETUP-NOVA-MAQUINA.md) — Setup de nova máquina, portabilidade de SO e Disaster Recovery
- [TESTES.md](engineering/TESTES.md) — Estratégia de testes, rotina e convenções (PLAN-067)
- [SEGURANCA.md](engineering/SEGURANCA.md) — Postura de segurança, gaps e processos (PLAN-066)

### Design

- [01-UX.md](engineering/design/01-UX.md) — Perfil do operador, jornadas e princípios de interface
- [02-DESIGN-SYSTEM.md](engineering/design/02-DESIGN-SYSTEM.md) — Identidade visual, tipografia, cores e componentes
- [03-COMPONENT-ARCHITECTURE.md](engineering/design/03-COMPONENT-ARCHITECTURE.md) — Arquitetura dos componentes da interface
- [04-UI-COMPONENTS.md](engineering/design/04-UI-COMPONENTS.md) — Catálogo oficial de componentes da UI
- [05-TOKEN.md](engineering/design/05-TOKEN.md) — Design tokens implementados no código
- [06-UI-PATTERNS.md](engineering/design/06-UI-PATTERNS.md) — Padrões de composição, templates de tela e anti-patterns
- [UI-COVERAGE.md](engineering/design/UI-COVERAGE.md) — Inventário de cobertura da UI por tela/componente (PLAN-044)

## Decisions

- [ADR-INDEX.md](decisions/ADR-INDEX.md) — Lista completa de ADRs

## Plans

Consulte o [índice completo de planos](plans/README.md).

## Status

- [STATUS.md](STATUS.md) — Visão de relance: planos em aberto, pendências de produção, últimos deploys

## QA — Qualidade e fonte de estudo

- [QA README](qa/README.md) — material de QA + trilha de estudo
- [01-VISAO-GERAL.md](qa/01-VISAO-GERAL.md) — o sistema, stack e ambientes
- [02-ARQUITETURA.md](qa/02-ARQUITETURA.md) — camadas, módulos, fluxo, ADRs
- [03-ENGENHARIA.md](qa/03-ENGENHARIA.md) — backend, frontend e banco
- [04-TESTES.md](qa/04-TESTES.md) — estratégia de testes e como rodar
- [05-PIPELINE.md](qa/05-PIPELINE.md) — CI/CD: PR → staging → produção
- [06-OPERACAO.md](qa/06-OPERACAO.md) — deploy, backup, rollback, monitoramento
- [07-SEGURANCA.md](qa/07-SEGURANCA.md) — postura de segurança
- [08-GLOSSARIO.md](qa/08-GLOSSARIO.md) — termos do domínio e técnicos
- [09-CHECKLISTS.md](qa/09-CHECKLISTS.md) — checklists operacionais de QA

## Skills

- [SKILL-001 — Documentation Reviewer](skills/SKILL-001-documentation-reviewer.md)
- [SKILL-002 — Architecture Guardian](skills/SKILL-002-architecture-guardian.md)
- [SKILL-003 — Feature Planner](skills/SKILL-003-feature-planner.md)
- [SKILL-004 — Vertical Slice Builder](skills/SKILL-004-vertical-slice-builder.md)
- [SKILL-005 — Code Reviewer](skills/SKILL-005-code-reviewer.md)
- [SKILL-006 — Bug Investigator](skills/SKILL-006-bug-investigator.md)
- [SKILL-007 — UX Reviewer](skills/SKILL-007-ux-reviewer.md)
- [SKILL-008 — Release Reviewer](skills/SKILL-008-release-reviewer.md)
- [SKILL-009 — Documentation Sync](skills/SKILL-009-documentation-sync.md) — fonte única de verdade + matriz de propagação (mantém docs sempre alinhadas)

## Scripts (ferramentas de apoio)

| Script | npm | Finalidade |
|--------|-----|------------|
| [`scripts/audit-docs.mjs`](../scripts/audit-docs.mjs) | `npm run docs:audit` | Auditoria de consistência: código ↔ 02-API ↔ 07 ↔ collection ↔ telas (SKILL-009) |
| [`scripts/build-collection.mjs`](../scripts/build-collection.mjs) | `npm run docs:collection` | Regenera `api-collection.json` a partir da lista canônica |
| [`scripts/smoke-api.mjs`](../scripts/smoke-api.mjs) | `npm run smoke:api` | Executa os cenários da [07-CASOS-DE-USO-API](product/07-CASOS-DE-USO-API.md) (PASS/FAIL) |

## Templates

- [ADR.template.md](templates/ADR.template.md)
- [DOCUMENT.template.md](templates/DOCUMENT.template.md)
- [FEATURE.template.md](templates/FEATURE.template.md)
- [MODULE.template.md](templates/MODULE.template.md)

## Tasks

Consulte o [histórico completo de tarefas](engineering/tasks/README.md).
