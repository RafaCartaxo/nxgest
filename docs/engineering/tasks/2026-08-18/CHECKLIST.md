# CHECKLIST — PLAN-079: estabilidade de deploy + correção do erro "text/html MIME"

**Data:** 18/08/2026

**Planos/refs:** `docs/plans/PLAN-079-deploy-estabilidade.md` · `docs/engineering/TESTES.md` · `docs/STATUS.md` · PRs dependabot #12/#14

> Após o code-splitting (PLAN-077), usuários em produção recebiam `text/html is not a valid JavaScript MIME type` ao navegar entre telas — service worker com cache fixo + fallback SPA capturando assets + assets sem cache HTTP. Correção em 4 fases + higiene de docs e dependabot.

## Status

| Emoji | Significado |
|---|---|
| ✅ | Entregue / concluído |
| 🔵 | Em execução (parcial) |
| ⏳ | Aguardando algo |

## Entregue

- [x] **F1 — Cache-busting automático do SW** — `frontend/public/sw.js` com placeholder `__NXGEST_CACHE_VERSION__` + plugin inline `cacheBustingSw` no `frontend/vite.config.ts` (injeta hash sha1 do `index.html` no `closeBundle`). Prod: `CACHE = "nxgest-a979e1c4d9fa"`.
- [x] **F2 — Fallback SPA não captura assets** — `src/main.ts`: `app.use("/assets")` → 404 JSON; fallback `/{*splat}` só para navegação (regex de extensão → `next()`).
- [x] **F3 — `express.static` imutável** — `maxAge: "1y"`, `immutable`, `etag`, `index: false` para assets com hash; `index.html` via fallback.
- [x] **F4 — `scripts/check-dist.mjs`** — valida que todo asset referenciado no `index.html` existe em `dist/`; passo novo no CI após o build.
- [x] **Docs hygiene** — `TESTES.md` (250→**274** cenários + `check-dist` no CI) · `STATUS.md` (154 testes, smoke 274, data 18/08, PLAN-079) · `README.md` PLAN-075 corrigido para **✅ Implementado** + entrada no STATUS.
- [x] **Deploy em produção + validação manual** — push `2c0b916` → CI verde (smoke 274) → staging → CD prod ✅. Verificado em `nxgest.com.br`: asset inexistente → **404** (era `text/html`), asset real → `text/javascript`, SW versionado, SPA fallback ok.

## Dependabot / pipeline

- [x] **Branch protection** — corrigido check obrigatório `smoke-api (DB isolado)` → **`smoke-api (PostgreSQL isolado)`** (nome desatualizado bloqueava merge de qualquer PR).
- [x] **PR #12** (`@hookform/resolvers 5.7.1→5.8.0`) — rebase (pegou fix do flake PAG-COH2) → **merged**.
- [x] **PR #14** (user-event · drizzle-kit · tsx) — **fechado**; `drizzle-kit 0.24→0.31` (breaking em 0.x, não usado no projeto) adicionado ao ignore do `dependabot.yml` (`>=0.25`); user-event + tsx serão reabertos pelo dependabot.
- [x] `docs/engineering/tasks/2026-08-17-DEPENDABOT-HANDOFF.md` — **apagado** (superado).

## Validação

- [x] `npx tsc --noEmit` limpo
- [x] `npm run build` verde (cache-busting injetado)
- [x] `node scripts/check-dist.mjs` — OK (4 assets)
- [x] `npm run audit:ui` · `audit:styles` · `audit:modules` verdes
- [x] `npm test` — **154/154**
- [x] `npm run docs:audit` — 0 divergências
- [x] `npm run smoke:api` — **274/274** (PG isolado, node 20)
- [x] CI/CD verdes + validação manual em produção

## Observações

- O erro "text/html MIME" é resolvido em 3 camadas: cache-busting (causa) + 404 de assets (defesa) + `immutable` (performance).
- `drizzle-kit` é 0.x: o gate `update-types: minor/patch` não protege de bump breaking — agora coberto pelo `ignore >=0.25`.
- Branch protection referenciava job renomeado — checar nome dos checks sempre que renomear um job do CI.
