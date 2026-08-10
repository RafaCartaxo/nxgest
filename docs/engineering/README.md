# Engineering

Documentos técnicos que definem a arquitetura, o banco de dados, a API, o frontend e o backend.

## Documentos

| Documento | Descrição | Status |
|---|---|---|
| [00-ARCHITECTURE.md](00-ARCHITECTURE.md) | Arquitetura do sistema, camadas e fluxo | Aprovado |
| [01-DATABASE.md](01-DATABASE.md) | Modelo de persistência, entidades e integridade | Aprovado |
| [02-API.md](02-API.md) | Contratos da API, endpoints e validações | Aprovado |
| [03-FRONTEND.md](03-FRONTEND.md) | Implementação do frontend, camadas e padrões | Aprovado |
| [04-BACKEND.md](04-BACKEND.md) | Implementação do backend, Use Cases e Ports | Aprovado |
| [05-MAPEAMENTO-TELAS.md](05-MAPEAMENTO-TELAS.md) | Mapeamento de telas, componentes e aderência ao Design System | Aprovado |
| [06-PRODUCAO.md](06-PRODUCAO.md) | Runbook de operação: acesso, deploy, backup, rollback, monitoramento | Aprovado |
| [07-FORMS-INPUTS.md](07-FORMS-INPUTS.md) | Padrões de formulários e inputs (Field, validação, máscaras) | Aprovado |
| [TESTES.md](TESTES.md) | Estratégia de testes, rotina e convenções (PLAN-067) | Aprovado |
| [SEGURANCA.md](SEGURANCA.md) | Postura de segurança, gaps e processos (PLAN-066) | Aprovado |

## Design

A subpasta [design/](design/) contém os documentos de identidade visual e experiência do usuário:

| Documento | Descrição | Status |
|---|---|---|
| [01-UX.md](design/01-UX.md) | Perfil do operador, jornadas e princípios de interface | Aprovado |
| [02-DESIGN-SYSTEM.md](design/02-DESIGN-SYSTEM.md) | Identidade visual, tipografia, cores e componentes | Aprovado |
| [03-COMPONENT-ARCHITECTURE.md](design/03-COMPONENT-ARCHITECTURE.md) | Arquitetura dos componentes da interface | Aprovado |
| [04-UI-COMPONENTS.md](design/04-UI-COMPONENTS.md) | Catálogo oficial de componentes da UI | Aprovado |
| [05-TOKEN.md](design/05-TOKEN.md) | Design tokens implementados no código | Aprovado |
| [06-UI-PATTERNS.md](design/06-UI-PATTERNS.md) | Padrões de composição e anti-patterns | Aprovado |
| [UI-COVERAGE.md](design/UI-COVERAGE.md) | Inventário de cobertura da UI por tela/componente (PLAN-044) | Aprovado |

## Ordem de leitura recomendada

00-ARCHITECTURE → 04-BACKEND → 01-DATABASE → 02-API → 03-FRONTEND → design/01-UX → design/02-DESIGN-SYSTEM → 05-MAPEAMENTO-TELAS
