# PLAN-077 — Performance & escalabilidade (whitelabel)

**Status:** 🔵 Implementado (15/08) — F1–F4 + validação; F1 reinício do dev pendente

**Versão:** 1.0

**Início:** 14/08/2026

**Origem:** lentidão/travamento percebido no ambiente local ("sistema travado", não era o VPS). Investigação estrutural apontou causas concretas: pool PG sem timeout + rajadas de queries por request + query da tela inicial do operador com subqueries correlacionadas + N+1 em pagamentos + bundle frontend único. Preparação para escala **whitelabel/multi-tenant**.

---

## Diagnóstico (antes — medido 14/08)

| # | Achado | Impacto | Evidência |
|---|---|---|---|
| 1 | Pool PG `max:10` **sem** `connectionTimeoutMillis`/`idleTimeout` | 🔴 Rajadas de ~13 queries saturam o pool; a 11ª espera indefinidamente | `database.ts:31-34` |
| 2 | Auth: **2 queries/request** (usuário + empresa) + `requireModule` +1 | 🔴 3 queries antes de todo handler | `auth.middleware.ts:18-36` · `module.middleware.ts:26-36` |
| 3 | `listarCobrancasDoDia`: 2 subqueries correlacionadas de parcela por linha + subquery aninhada no LEFT JOIN de visitas + 4 agregadas separadas | 🔴 Tela inicial do operador (5 queries) | `operacoes.repository.impl.ts:54-177` |
| 4 | Dashboard operador refaz ~13 queries a cada `visibilitychange` | 🟡 | `OperacoesDashboard.tsx:112-122` |
| 5 | Caixa `getStatus` = 9 queries + 2 + 2 ≈ 13/mount | 🟡 | `caixa.controller.ts:37-75` |
| 6 | N+1 em pagamentos do contrato (1 query por pagamento) | 🟡 | `pagamento.repository.impl.ts:46-51` |
| 7 | Frontend: 28 páginas `eager`, sem lazy/splitting | 🟡 Bundle único ~708KB; HMR recompila tudo | `App.tsx:1-35` |
| 8 | GPS `watchPosition` re-sort a cada tick | 🟡 | `OperacoesDashboard.tsx` + `distance.ts` |
| 9 | ⚠️ Node v18 rodando (`.nvmrc`/AGENTS exigem 20) | 🟡 | processos dev |
| 10 | 🐛 `caixa.repository.impl.ts:122` — `m.'data'` aspas simples no identificador (SQL inválido se filtrar por período) | 🐛 latente | código |

---

## Implementado (15/08)

### F1 — Destravar o sintoma
- **`src/database.ts`** — pool ganhou `connectionTimeoutMillis: 5000` e `idleTimeoutMillis: 30000` (envs `PG_CONNECTION_TIMEOUT_MS`/`PG_IDLE_TIMEOUT_MS`); `max` já via `PG_POOL_MAX`.
- **`.env` local** — agora PostgreSQL (`DATABASE_URL` + `PG_POOL_MAX=25` + timeouts); removido `DB_PATH` legado (SQLite).
- **`.env.example`** — documentados os novos envs de pool.
- **Node 20 instalado** (`v20.20.2` via nvm). ⏳ Reiniciar processos dev pendente (o outro chat está usando o ambiente).

### F2 — Cortar queries por request (auth/módulo)
- **`auth.middleware.ts`** — resolve `usuario` + `empresa` (incl. `modulos`) uma vez e grava `req.authUsuario`/`req.authEmpresa`; checagens de suspensão/convite/empresa inativa mantidas.
- **`module.middleware.ts`** — reutiliza `req.authEmpresa.modulos` quando presente (fallback à query só se ausente).
- **`express.d.ts`** — types `RequestAuthUsuario`/`RequestAuthEmpresa`.
- **Resultado:** rotas de módulo passam de 3 queries para 2 por request (e o auth continua 2 quando não há módulo).

### F3 — Otimizar queries quentes
- **`operacoes.repository.impl.ts` (`listarCobrancasDoDia`)** — reescrita conforme PLAN-070 Fase E:
  - `proxima_parcela`/`proximo_numero_parcela`: 2 subqueries correlacionadas → **1 `LATERAL`** (usa `idx_parcelas_venc_partial`).
  - Visitas: subquery correlacionada aninhada → **`LATERAL` com `ORDER BY created_at DESC LIMIT 1`** + range `[inicio, fim)` em `createdAt` (usa `idx_historico_user`).
  - **Shape da resposta idêntico** — validado por comparação de resultado e pelo smoke (267/267).
- **`pagamento.repository.impl.ts` (`findByContratoId`)** — N+1 → **1 query `IN (ids)`** para `pagamento_parcelas`.
- **🐛 `caixa.repository.impl.ts:122`** — `"m.'data' >= ?"` → `'m."data" >= ?'` (identificador correto; o filtro por período deixava de quebrar).

### F4 — Frontend
- **`App.tsx`** — `React.lazy` + `Suspense` por página (27 páginas); helper `lazyPage(name, loader)` resolve export nomeado.
- **`vite.config.ts`** — `manualChunks`: `react` (react/react-dom/react-router) + `vendor` (i18next/react-i18next/lucide). Bundle principal ~708KB → **~175KB index + react 172KB + vendor 88KB**, 70 chunks on-demand.
- **`distance.ts` (`useWatchPosition`)** — throttling por distância mínima (30m): só atualiza estado quando o operador se move; evita re-render + re-sort a cada tick.

### Adiado (conflito com trabalho em andamento do outro chat)
- **Bulk insert de parcelas** (`CreateContrato`/`UpdateContrato`) — arquivos de contrato estão sendo editados por outra sessão (PLAN-076 periodicidade). Retomar depois que estabilizar.

---

## Validação (15/08)

- `npx tsc --noEmit` limpo (backend + frontend)
- `npm run build` verde (tsc + vite; 70 chunks)
- `npm test` — **125/125** verdes
- `audit:styles` · `audit:ui` · `audit:modules` verdes
- `docs:audit` sem divergência (69 rotas = 69 UCs = 69 collection)
- `npm run smoke:api` (instância PG isolada, node 20) — **267/267 ✅ (0 falhas)**
- Query de cobranças validada: `EXPLAIN ANALYZE` antes/depois (local, volume pequeno) + resultado idêntico + API real 200.

## Pendências (fora desta entrega ou postergadas)

- ⏳ **Reiniciar processos dev com node 20** (backend `tsx watch` + vite) — quando o outro chat liberar o ambiente.
- ⏳ **Bulk insert de parcelas** — após PLAN-076 estabilizar.
- ⏳ Medir queries/request no dump de produção (`EXPLAIN ANALYZE` com volume real) — registrar no CHECKLIST.
- 📌 Backlog: cache global/redis quando houver N tenants reais · `drizzle-kit` migrations (PLAN-070) · latência de rede/MCP (PLAN-070).
- 📌 Docs desatualizadas pós-Stitch (05-MAPEAMENTO-TELAS, 04-BACKEND "SQLite") — registrar no CHECKLIST de sync.

---

## Decisões

- **Cache por request**, não global em memória — multi-tenant: cache global de usuário/empresa vazaria dados entre tenants.
- **`LATERAL`** em vez de subqueries — PG suporta e usa índice parcial; mesmo padrão que o PLAN-070 já previa (não é retrabalho).
- **Shape da API preservado** — nenhum endpoint mudou de formato; otimização transparente.
