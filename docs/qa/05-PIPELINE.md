# 05 — Pipeline (CI/CD)

**Status:** Ativo (18/08/2026) · **Fonte:** `.github/workflows/ci.yml` · `.github/workflows/cd.yml` · `docs/engineering/06-PRODUCAO.md §1.1`

---

## Visão de alto nível

```text
push/PR → [CI] tsc+build+audits+unit → smoke (274) → merge main
                                                        ↓
                      CI no push à main → deploy-staging (automático)
                                                        ↓
              [CD] validate (CI verde + staging saudável) → deploy-prod (automático)
                                                        ↓
                                      health check pós-deploy
```

**Regra de promoção:** produção **só recebe código que passou CI e staging**.

---

## CI — `.github/workflows/ci.yml` (push/PR/manual)

### Job `test`
`npm ci` (workspaces) → `tsc --noEmit` → `npm run build` → `audit:ui` → `audit:styles` → `audit:modules` → `npm test` (78) → `test:coverage` (+ artifact 14 dias) → `docs:audit`.

### Job `smoke`
`schema isolado` → `seed-demo` → **uma** instância (`JWT_SECRET` + `LOGIN_RATE_LIMIT_MAX=10000` + `USER_RATE_LIMIT_MAX=100000`) → `smoke-api` (274/274).

### Job `deploy-staging` (push→main, `needs: [test, smoke]`)
SSH (secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY`) → `scripts/deploy-staging.sh` → staging em `nxgestao.duckdns.org`.

### Hardening
`permissions: contents: read` · `concurrency` (cancel-in-progress) · `timeout-minutes` · `workflow_dispatch`.

---

## CD — `.github/workflows/cd.yml` (promoção para produção)

| Gatilho | Quando |
|---|---|
| `workflow_run` | CI concluiu com **success** no push à main |
| `workflow_dispatch` | Manual — input `ref` (branch/tag/commit) p/ deploy sob demanda ou **rollback** |

### Jobs

1. **`validate`** — garante CI verde (no automático) ou roda gates no manual (tsc+test no ref escolhido) + **health do staging** (gate de promoção).
2. **`deploy-prod`** — `environment: production` → SSH → `scripts/deploy.sh` (backup pré-deploy + audits) → **health check pós-deploy** de `nxgest.com.br`.

---

## Ambientes

| | Staging | Produção |
|---|---|---|
| Domínio | `nxgestao.duckdns.org` | `nxgest.com.br` |
| Arquivo compose | `docker-compose.staging.yml` | `docker-compose.prod.yml` |
| Serviço | `staging-app` (:8081) | `app` (:8080) + `caddy` |
| Volume | `nxgestao_staging_data` | `nxgestao_data` |
| Rede compartilhada | `nxgestao_net` (external) | `nxgestao_net` |
| Caddyfile | `nxgestao.duckdns.org → staging-app:8081` | `nxgest.com.br → app:8080` |
| Dados | Seed fake (teste123!) | Reais |

---

## Fluxo de um deploy completo

1. `git push`/merge à `main`.
2. CI roda `test` + `smoke` (gate de qualidade).
3. CI `deploy-staging` publica o staging e valida health.
4. CD dispara (`workflow_run`), `validate` confirma CI + staging, `deploy-prod` publica prod.
5. Health check pós-deploy; em caso de falha, o job falha (visível na run).

---

## Rollback

- **Manual:** `Actions → CD → Run workflow` → input `ref` = commit/tag anterior.
- **No VPS:** `git reset --hard <commit>` + `bash scripts/deploy.sh` (ver `06-OPERACAO.md`).

---

## Branch protection (main)

- Checks obrigatórios: `tsc · build · audits · unit/UI` + `smoke-api (DB isolado)`.
- Exige **1 review de PR** para merge.

---

## Documentos relacionados

- `docs/engineering/06-PRODUCAO.md §1.1` — pipeline e operação
- `.github/workflows/ci.yml` · `.github/workflows/cd.yml` — definições reais
- `scripts/deploy.sh` · `scripts/deploy-staging.sh` — scripts de deploy
