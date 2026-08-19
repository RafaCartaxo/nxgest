# CHECKLIST — PLAN-083: otimização de consultas, round trips e busca

**Data:** 18/08/2026

**Planos/refs:** `docs/plans/PLAN-083-otimizacao-consultas-busca.md` · PLAN-070 · PLAN-077

> Com latência VPS↔Brasil ~400–500ms, o custo dominante por request é o round trip. PLAN-083 reduz queries/request nos endpoints quentes (caixa 12→5, dashboard 8→3, cobrança 7→3), elimina subqueries correlacionadas por linha, aplica bulk inserts, corta SELECTs pesados, corrige índice de login, implementa busca sem acento (unaccent + multi-campo) e adota cache no frontend. Nenhum endpoint muda de shape.

## Status (catálogo oficial)

| Emoji | Significado |
|---|---|
| ✅ | Entregue / concluído |
| 🔵 | Em execução (parcial — parte concluída) |
| ⏳ | Aguardando algo (deploy, externo, decisão) |
| 🚨 | Parado há 7+ dias / urgente |
| ❌ | Bloqueado / falhou |
| 🐛 | Bug encontrado (referenciar card/CT) |
| 🔁 | Retestado / revalidado |

## Entregue

- [x] **Fase 0 — Baseline** — EXPLAIN ANALYZE das queries quentes no PG local (dados reais: 201 clientes / 3.968 parcelas / 1.371 pagamentos) + contagem queries/request por endpoint registrada no plano (caixa 12, dashboard 8, cliente-find 8, cobrança 7, PUT operadores ~20).
- [x] **Plano doc** — `docs/plans/PLAN-083-otimizacao-consultas-busca.md` + entrada no `docs/plans/README.md`.
- [x] **Fase 1 — Consolidar agregados** ✅ — `caixa/status` **12→6** (`getFluxoConsolidado`, 1 query `FILTER`) · `admin/dashboard` **8→2** (subselects não-correlacionados + `COUNT(*) FILTER`) · cobrança do dia **5→2** (subquery `saldo_total` removida + 4 indicadores em 1 query `FILTER`) · **1.4** snapshot de atraso fora do GET (→ sob demanda no `historico-atrasos`, upsert 1/dia) · `clientes/:id` **8→6** (lucro×2→1, atraso+venceHoje→1, agregados em `Promise.all`). Shape preservado; validado em runtime (caixa, cobranças, dashboard nos 3 escopos, clientes/:id cruzado com SQL) + tsc + testes + `docs:audit` limpo.
- [x] **Fase 2 — Eliminar N+1 / subqueries correlacionadas** ✅ — `listMovimentacoes` (5 subqueries correlacionadas → LEFT JOINs + COALESCE, 0 SubPlan no EXPLAIN) · `listarPagamentosDoDia` (`array_agg` correlacionado → LEFT JOIN + GROUP BY, 0 SubPlan) · `PATCH operadores/:id` **~20→~8** (`getOperadorContexto` 1 query + `existing` reuso; `findById` só na resposta final). Runtime validado + contador no pool (~17→~6, excl. tx) + tsc + 154 testes + `docs:audit` limpo + **smoke 317/317** (DB limpo).
- [x] **Fase 3 — Bulk operations** ✅ — `CreateContrato`/`UpdateContrato` (loop de INSERT de parcelas → 1 bulk insert, fecha débito do PLAN-077) · `CreatePagamento` (2N → 1 `UPDATE ... FROM (VALUES)` + 1 bulk INSERT) · `EstornarPagamento` (N UPDATEs → 1 `UPDATE ... FROM (VALUES)`). Gotcha resolvido: alias do VALUES não aceita tipos no PG — cast por valor (`::numeric`/`::date`/`::timestamptz`). tsc + 154 testes + **smoke 317/317** (DB limpo).
- [ ] **Fase 4 — Dados retornados** (colunas, paginação leads, COUNT(*) OVER())
- [ ] **Fase 5 — Índice funcional `lower(email)` + validação de cobertura**
- [ ] **Fase 6 — Busca sem acento + CPF/telefone/comércio + leads + multi-campo**
- [ ] **Fase 7 — rawQuery transacional** (getSaldoAtual no CreateContrato)
- [ ] **Fase 8 — Frontend** (React Query telas operacionais, cooldown visibilitychange, requests inúteis)
- [ ] **Fase 9 — Re-medição + docs propagadas**

## Validação (rodar antes de finalizar)

- [x] `npx tsc --noEmit` limpo
- [ ] `npm run build` verde
- [ ] `npm run audit:ui` · `npm run audit:styles` · `npm run audit:modules` verdes (se UI mudou)
- [x] `npm test` verde (154 testes)
- [x] `npm run smoke:api` (instância isolada, node 20) — **317/317** (DB recriado do zero em 19/08)
- [x] `npm run docs:audit` sem divergência (SKILL-009)
- [x] EXPLAIN antes/depois + contagem queries/request (tabela do plano)

## Pendências

- [ ] <itens que ficaram para depois>

## Observações

- Baseline confirma: tempos de execução <6 ms no volume atual (como o PLAN-070 já apontava); o custo é round trips + estrutura que escala (subplans por linha, seq scans).
- Busca fuzzy (média-alta) decidida FORA do escopo em 18/08 — registrada no backlog do plano.
- Gotcha encontrado na Fase 1: `OR ? IS NULL` para data opcional falha no PG com `42P18` (tipo do parâmetro não inferível) — resolvido com cast `?::date`.
- `getFluxoConsolidado` é método novo no port `ICaixaRepository`; os métodos antigos (getSaldoAtual/getLucro/getRecebidoSemana/getGastoSemana) foram **preservados** — LiquidarSemana e seus testes continuam intactos.
- Fase 2.3: `getOperadorContexto` (port `IAdminRepository`) retorna só `{id, email, role, emailPendente, status}` em 1 query; `update()` aceita `existing?` e pula o reload. `findById` (com counts + convite) permanece para listagem e resposta final.
- Fase 2.1: os LEFT JOINs **não** filtram `deleted_at` (espelham as subqueries originais), exceto `gastos` (`g.deleted_at IS NULL` como na subquery). `COALESCE(cl_pg.nome, cl.nome)` reproduz o fallback pagamento→contrato do 'Cancelamento'.
- A rota real do 2.3 é `PATCH /api/admin/operadores/:id` (não PUT).
- Fase 3: o `UPDATE ... FROM (VALUES)` roda via `drizzle.execute(sql...)` (client da tx) e **não** via `rawQuery` (pool global ficaria fora da transação). Sem cast por valor, o PG infere as colunas do VALUES como `text` e falha contra colunas `numeric` — os casts estão por valor, não no alias (o alias não aceita tipos).
