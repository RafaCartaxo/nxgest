# PLAN-032 — Papéis hierárquicos: `socio` + chefe por operador

**Status:** Concluído

**Versão:** 1.0

**Início:** 03/08/2026

**Última atualização:** 03/08/2026

**Roadmap:** product/04-ROADMAP.md §5.2 (evolução do painel admin)

---

## Objetivo

Introduzir o papel **`socio`** com hierarquia por empresa: cada usuário tem um **chefe** (`usuarios.chefeId`) e o **escopo de dados** passa a ser por nível (subárvore). Atualmente o modelo é binário (operador = próprio · admin = empresa toda) — sem representação de "grupo".

## Escopo

| # | Entrega |
|---|---------|
| 1 | Papel `socio` (mesmas funções do admin, escopo menor — subárvore) |
| 2 | `usuarios.chefeId` (o "chefe") + migração no boot |
| 3 | Escopo por nível: operator = próprio · socio = subárvore · admin = empresa |
| 4 | Sócio cria operador do próprio grupo (BR-095) |
| 5 | Painel admin reutilizado e escopado para o sócio |

## Decisões de design

| Decisão | Escolha |
|---------|---------|
| Profundidade | 3 níveis (admin → sócio → operador); sem sub-sócio no v1 |
| Landing do sócio | `/admin` (painel escopado), como o admin |
| Quem cria | Admin cria `operator`/`socio`/`admin`; sócio cria apenas `operator` (chefe = ele) |
| Backfill | Operadores existentes → `chefeId = null` (= sob o admin da empresa) |
| `chefeId` nulo | = sob o admin (subárvore do admin = empresa inteira) |

## Implementação

### Backend
| Arquivo | Mudança |
|---------|---------|
| `src/database.ts` | `usuarios.chefeId` (drizzle + CREATE + recriação da tabela + migração boot) |
| `src/shared/types/express.d.ts`, `utils/jwt.ts` | role `socio` |
| `src/modules/auth/domain/usuario.entity.ts`, `auth.repository*` | `chefeId` |
| `src/modules/admin/application/ports/admin.repository.ts` | `chefeId`, `scopeUserIds`, `subarvoreIds` |
| `admin.repository.impl.ts` | `chefeId`, escopo `scopeUserIds` em findAll/findById/dashboard/equipe, `subarvoreIds` |
| `src/shared/utils/scope.ts` | `resolveUsuarioAlvo` — sócio restrito à subárvore |
| `admin.controller.ts` | aceita `socio`; valida `chefeId` (mesma empresa, não-self p/ alvo, role compatível); escopo por subárvore |
| use cases | Criar/Editar/Remover/Listar/Equipe com `socio` + `scopeUserIds` |
| `admin.middleware.ts` | permite `socio` |

### Frontend
| Arquivo | Mudança |
|---------|---------|
| tipos (AuthContext, auth.service, admin.service) | role `socio` + `chefeId` |
| `AdminRoute`, `LoginPage`, `Navbar` | sócio no painel/navbar |
| `OperadorForm` | role `socio` + campo "Chefe (gestor)" |
| `OperadoresList` | grupo "Sócios" + badge `roleSocio` |
| i18n | `roleSocio`, `chefe`, `chefeSem`, `secaoSocios` |

## Regras de negócio
| BR | Descrição |
|----|-----------|
| BR-094 | Hierarquia: `chefeId`/subárvore; escopo por nível; validações de chefe |
| BR-095 | Sócio cria operador do grupo (só `operator`); admin cria `operator`/`socio`/`admin` |
| BR-056/057/066/081 | Revisadas (isolamento por nível, quem cria, roles, routing `socio → /admin`) |

## UCs (06) / CTs (07)
- UCs 064-069: painel escopado, criar operador do grupo, criar sócio/associar, escopo por nível, gerenciar grupo, bloqueios.
- API CTs 098-102: criar sócio, sócio cria operador (403 p/ admin/socio), escopo da equipe, acesso fora da subárvore (404), chefe inválido (422).

## Validação
- `npm run build` ✅ · Smoke estendido: **104/104** (SC-001..006) ✅ · auditoria limpa ✅

## Referências
- `product/02-BUSINESS-RULES.md` BR-094/095
- `product/06-CASOS-DE-USO.md` UC-064..069
- `product/07-CASOS-DE-USO-API.md` API-CT-098..102
- `engineering/05-MAPEAMENTO-TELAS.md` v1.20
