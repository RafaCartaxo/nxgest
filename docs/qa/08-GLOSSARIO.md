# 08 — Glossário

**Status:** Ativo · Termos do domínio e técnicos usados nos documentos do NX Gest.

---

## Domínio de negócio

| Termo | Significado |
|---|---|
| **Operador** | Usuário de campo que faz as cobranças (`role = operator`) |
| **Admin** | Usuário que gerencia a empresa (operadores, dashboard) (`role = admin`) |
| **Sócio** | Papel hierárquico dentro da empresa; enxerga a própria subárvore (`role = socio`) |
| **Super admin** | Papel do sistema; acesso transversal a todas as empresas (`empresaId = null`) |
| **Cliente** | Pessoa/estabelecimento que recebe cobrança |
| **Contrato** | Acordo de parcelamento (valor base + juros + nº de parcelas) |
| **Parcela** | Cada vencimento do contrato |
| **Pagamento** | Recebimento aplicado às parcelas (pode atravessar parcelas) |
| **Estorno** | Reversão de um pagamento (gera movimentação reversa + auditoria) |
| **Caixa** | Controle de valores do operador (base, saldo, recebido, gastos, fechamento semanal) |
| **Gasto** | Despesa registrada pelo operador |
| **Fechamento semanal** | Fecho do caixa da semana (único por período) |
| **Visita** | Registro operacional da cobrança (visitado / não localizado / promessa) |
| **Lead** | Prospect de onboarding comercial (public + admin) |
| **Empresa** | Unidade multi-tenant (whitelabel: módulos/capacidades) |
| **Multi-tenant** | Vários clientes/empresas no mesmo deploy, isolados por dados |

---

## Arquitetura e engenharia

| Termo | Significado |
|---|---|
| **Modular Monolith** | Um deploy, código organizado por módulos de negócio |
| **DDD Lite** | Uso pragmático de entidades/value objects/regras do domínio |
| **Clean Layers** | Presentation → Application → Domain + Ports · Infrastructure |
| **Use Case** | Uma operação de negócio = um arquivo/caso de uso na camada Application |
| **Port** | Contrato (interface) que a Application define para o mundo externo |
| **Adapter / Infrastructure** | Implementação concreta do Port (repo, serviço externo) |
| **Repository** | Acesso a dados de um agregado (implementa um Port) |
| **Whitelabel** | Personalização por empresa via `módulos`/`capacidades` |
| **Module Manifest** | Fonte única do whitelabel granular (backend + frontend espelhados, PLAN-045) |

---

## Qualidade e processos

| Termo | Significado |
|---|---|
| **UC** | Caso de uso (de produto ou de API — `API-UC-###`) |
| **CT** | Cenário de teste (Dado/Quando/Então — `API-CT-###`) |
| **BR** | Regra de negócio (`BR-###` em `02-BUSINESS-RULES.md`) |
| **Smoke** | Teste de integração da API (`scripts/smoke-api.mjs`, 250 cenários) |
| **Gate** | Checagem que bloqueia avanço (ex.: CI verde, staging saudável) |
| **Pipeline** | Sequência CI → staging → produção |
| **Promoção** | Movimento de uma mudança para o próximo ambiente |
| **CI** | Integração contínua (`.github/workflows/ci.yml`) |
| **CD** | Entrega contínua (`.github/workflows/cd.yml`) |
| **Staging / Homologação** | Ambiente de QA (`nxgestao.duckdns.org`) |
| **Coverage** | Cobertura de código (v8; report-only no momento) |
| **Audit (docs/UI/styles/modules)** | Scripts de regressão mecânica de padrões |

---

## Infra e operação

| Termo | Significado |
|---|---|
| **VPS** | Servidor dedicado virtual (`172.245.152.223`) |
| **Caddy** | Proxy reverso + HTTPS automático (Let's Encrypt) |
| **Compose** | Docker Compose (prod/staging) |
| **Volume** | Persistência Docker (`nxgestao_data`, `nxgestao_staging_data`) |
| **Rede compartilhada** | `nxgestao_net` (external) — Caddy alcança os dois stacks |
| **WAL** | SQLite Write-Ahead Log (modo de journal) |
| **Backup off-site** | Cópia externa cifrada (gpg/age) |
| **Rollback** | Reverter deploy para commit/tag anterior |

---

## Referências de siglas do projeto

| Sigla | Nome |
|---|---|
| PLAN-### | Plano de implementação (`docs/plans/`) |
| ADR-### | Registro de decisão arquitetural (`docs/decisions/`) |
| SKILL-### | Processo oficial de desenvolvimento (`docs/skills/`) |
| P### | Item do backlog (`docs/plans/BACKLOG.md`) |
| G### | Gap/risco (ex.: G13 no PLAN-070) |
