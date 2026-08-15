# CHECKLIST — PLAN-077: performance & escalabilidade (whitelabel)

**Data:** 15/08/2026

**Planos/refs:** `docs/plans/PLAN-077-performance-escalabilidade.md` · PLAN-070 (Fase E — LATERAL) · `docs/plans/README.md`

> Otimização estrutural: pool PG com timeout, cache por request no auth/módulo, reescrita da query de cobranças do dia (LATERAL), N+1 em pagamentos, fix de SQL latente no caixa, code-splitting do frontend + GPS throttle, node 20.

## Status (catálogo oficial)

| Emoji | Significado |
|---|---|
| ✅ | Entregue / concluído |
| 🔵 | Em execução (parcial — parte concluída) |
| ⏳ | Aguardando algo (deploy, externo, decisão) |

## Entregue

- [x] **F1 — Pool PG com timeout** — `connectionTimeoutMillis: 5000` + `idleTimeoutMillis: 30000` (envs `PG_CONNECTION_TIMEOUT_MS`/`PG_IDLE_TIMEOUT_MS`); `.env` local aponta PostgreSQL (`DATABASE_URL` + `PG_POOL_MAX=25`); `.env.example` documentado; **node 20 instalado** (`v20.20.2`).
- [x] **F2 — Auth/módulo sem re-query por request** — `authMiddleware` resolve `usuario`+`empresa` (incl. `modulos`) e grava `req.authUsuario`/`req.authEmpresa`; `requireModule` reutiliza. Rotas de módulo: 3 → 2 queries/request.
- [x] **F3 — `listarCobrancasDoDia` reescrita (LATERAL)** — 2 subqueries de parcela → 1 `LATERAL`; visitas → `LATERAL` + range `[inicio, fim)`; shape idêntico (validado por resultado + smoke).
- [x] **F3 — N+1 em pagamentos** — `findByContratoId` com `IN (ids)` (1 query em vez de 1 por pagamento).
- [x] **F3 — 🐛 fix SQL latente no caixa** — `caixa.repository.impl.ts:122` `m.'data'` → `m."data"` (filtro por período).
- [x] **F4 — Frontend code-splitting** — `React.lazy`+`Suspense` nas 27 páginas; `manualChunks` (react/vendor). Bundle principal ~708KB → ~175KB (+ react 172KB + vendor 88KB); 70 chunks on-demand.
- [x] **F4 — GPS throttle** — `useWatchPosition` com distância mínima (30m) — sem re-sort a cada tick.
- [x] **Validação** — tsc · build · `npm test` **125/125** · audits (styles/ui/modules) · `docs:audit` · smoke **267/267 ✅** (instância PG isolada, node 20).

## Pendências

- [ ] ⏳ **Reiniciar processos dev com node 20** (backend `tsx watch` + vite) — o outro chat está usando o ambiente; reiniciar quando liberar.
- [ ] ⏳ **Bulk insert de parcelas** (`CreateContrato`/`UpdateContrato`) — adiado: arquivos de contrato em edição por outra sessão (PLAN-076).
- [ ] ⏳ Medir queries/request no **dump de produção** (`EXPLAIN ANALYZE` com volume real) — registrar números antes/depois.
- [ ] 📌 Sync de docs desatualizadas pós-Stitch: `05-MAPEAMENTO-TELAS.md` (OperadorDetail/PerfilPage/AdminPage, tela 27 Conta Suspensa, contagem 45→62) · `04-BACKEND.md` ("SQLite" → PostgreSQL).

## Observações

- Cache é **por request** (não global) — multi-tenant: cache global de usuário/empresa vazaria dados entre tenants.
- Nenhum endpoint mudou de shape — otimização transparente.
- Smoke 267/267 inclui cenários de cobranças, cliente, contrato, caixa, pagamento, auth, leads, admin, empresa, suspensão, convite — todos verdes.
