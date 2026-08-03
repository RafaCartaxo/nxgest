# PLAN-030 — Admin: visão da equipe (KPIs agregados + drill-down + navbar)

**Status:** Concluído

**Versão:** 1.0

**Início:** 03/08/2026

**Última atualização:** 03/08/2026

**Roadmap:** product/04-ROADMAP.md §5.2 (evolução do painel admin)

---

## Objetivo

Tirar o "administrador cru": hoje o admin (gestor de equipe) vê nos KPIs de Operação os dados do **próprio usuário** (BR-087) com subtítulo "de {nome}" — não da equipe — e a parte administrativa fica escondida na engrenagem da navbar. Este plano torna o painel **centrado na equipe** e a administração **visível**.

## Escopo

| # | Entrega |
|---|---------|
| 1 | KPIs de Operação (Clientes, Contratos Ativos, Recebido hoje) = **total da equipe** (BR-091) |
| 2 | **ContribuicaoModal**: clique no KPI → cada operador com "quanto geriu"; clique no operador → `OperadorDetail` (preserva `?empresaId=`) |
| 3 | **EquipeModal** com stats + navegação ao operador |
| 4 | Navbar com **"Administração"** (admin) e **"Empresas"** (super_admin) visíveis |
| 5 | Novo endpoint **`GET /api/admin/equipe`** (por operador + totais) |
| 6 | Docs/UCs/CTs/smoke atualizados |

**Fora de escopo:** manter `GET /api/admin/dashboard` (continua servindo `totalAdmins`/`totalOperadores` e o agregado); `ResultadoDiaModal` removido (sem uso).

---

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Semântica dos KPIs de Operação | **Total da equipe** (admins + operadores + próprio) — BR-091 substitui BR-087 para esses KPIs | Gestor de equipe quer ver a equipe, não só a si mesmo |
| Métrica do 3º KPI | **Recebido hoje** (Σ `recebidoHoje` dos operadores), no lugar de "Resultado do Dia" (entradas−saídas) | Decompõe por operador no modal; rótulo honesto; simplifica a inconsistência do C1 nesse contexto |
| Dados do próprio admin | Permanecem na aba **"Meus dados"** e nas telas operacionais normais | Nada se perde com a mudança |
| Fonte para o modal | Endpoint dedicado `GET /api/admin/equipe` (1 request) | Evita N chamadas de `GET /caixa?usuarioId=` no front; testável no smoke |
| Navegação preserva contexto | Linhas do modal levam `?empresaId=` | Regra DS (06-UI-PATTERNS §Navegação) |

## Implementação

### Backend

| Arquivo | Mudança |
|---------|---------|
| `src/modules/admin/application/ports/admin.repository.ts` | Tipos `EquipeItem`/`EquipeResult` + método `listEquipe(empresaId)` |
| `src/modules/admin/infrastructure/repositories/admin.repository.impl.ts` | `listEquipe` — usuários da empresa + clientes/contratos (reuso) + `recebidoHoje` por usuário (query agrupada) |
| `src/modules/admin/application/use-cases/ListarEquipe/ListarEquipeUseCase.ts` | Novo — retorna `{ operadores, totais }` |
| `src/modules/admin/presentation/controllers/admin.controller.ts` | Handler `equipe` (super exige `?empresaId=`; admin usa `req.empresaId`) |
| `src/modules/admin/presentation/routes/admin.routes.ts` | `GET /equipe` |

### Frontend

| Arquivo | Mudança |
|---------|---------|
| `frontend/src/modules/admin/services/admin.service.ts` | `getEquipe()` + tipos + `ContribuicaoMetric` |
| `frontend/src/modules/admin/components/ContribuicaoModal.tsx` | Novo (Modal base + rows clicáveis → OperadorDetail) |
| `frontend/src/modules/admin/components/EquipeModal.tsx` | Stats por membro + clique → OperadorDetail |
| `frontend/src/modules/admin/pages/AdminPage.tsx` | KPIs de Operação com `equipe.totais` + `ContribuicaoModal`; KPI "Recebido hoje"; remove `ResultadoDiaModal` |
| `frontend/src/modules/admin/components/ResultadoDiaModal.tsx` | **Removido** (sem usos) |
| `frontend/src/shared/components/Navbar.tsx` | Links "Administração"/"Empresas" visíveis; engrenagem limpa (perfil/tema/idioma/sair) |
| i18n (pt-BR, en, es) | `admin.daEquipe`, `admin.recebidoHoje`, `admin.contribuicao*` |

## Regras de negócio

| BR | Descrição |
|----|-----------|
| BR-091 | KPIs de Operação do admin = total da equipe; clique → modal de contribuição por operador; KPI "Recebido hoje" substitui "Resultado do Dia"; **substitui BR-087** para esses KPIs |

## API

`GET /api/admin/equipe` — ver `engineering/02-API.md` e `product/07-CASOS-DE-USO-API.md` (API-UC-042, CT-088..090).

## Documentação atualizada (matriz SKILL-009)

- `engineering/02-API.md` — `GET /api/admin/equipe`
- `product/07-CASOS-DE-USO-API.md` — API-UC-042 + CT-088..090
- `product/06-CASOS-DE-USO.md` — UC-023/024 atualizados + UC-053 (contribuição da equipe) + UC-054 (navbar)
- `product/02-BUSINESS-RULES.md` — BR-091 (revoga BR-087 para KPIs de Operação)
- `engineering/05-MAPEAMENTO-TELAS.md` — §12 + árvore do navbar
- `api-collection.json` — request `Admin > Equipe` (regenerada)
- `docs/UPDATES.md`

## Validação

- `npm run build` (tsc + vite)
- Smoke estendido (`scripts/smoke-api.mjs`): `/equipe` com coerência Σ operadores = totais = dashboard da empresa; escopo (403 operator, 400 super sem empresa); `npm run docs:audit` limpo.

## Referências

- `foundation/ADR-003-Auth-Autorizacao.md`
- `plans/BACKLOG.md`
- `engineering/design/04-UI-COMPONENTS.md` (KpiCard/Modal), `06-UI-PATTERNS.md` (navegação preserva contexto)
- `product/02-BUSINESS-RULES.md` BR-091
