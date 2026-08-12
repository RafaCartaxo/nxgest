# CHECKLIST — Pipeline CI/CD completo + staging de homologação (11/08)

**Data:** 11/08/2026

**Planos/refs:** `docs/engineering/TESTES.md` · `docs/engineering/06-PRODUCAO.md §1.1` · `AGENTS.md` · `.github/workflows/{ci,cd}.yml` · `scripts/{deploy,deploy-staging}.sh` · `docker-compose.staging.yml`

> O CI nunca havia passado desde a criação (08/08 — 16 runs vermelhas). Rodada de correção + evolução para um sistema de qualidade completo: CI verde, staging de homologação automático e CD para produção com gate de promoção.

## Entregue

- [x] **Fix CI (causas raiz)** — (1) deps do frontend nunca instaladas → `frontend/` virou **npm workspace** (node_modules unificada, React hoisted — eliminou a dupla cópia que quebrava os testes de UI); (2) smoke com `EADDRINUSE` (duplo-boot) → novo `scripts/create-schema.mjs` (schema sem subir servidor); (3) `JWT_SECRET` + `LOGIN_RATE_LIMIT_MAX`/`USER_RATE_LIMIT_MAX` definidos no job smoke (250/250 cenários)
- [x] **Hardening CI** — `permissions: contents: read` · `concurrency` cancel-in-progress · `timeout-minutes` · `npm run test:coverage` + artifact `coverage/` · `workflow_dispatch`
- [x] **Deps/segurança** — `dependabot.yml` (npm + github-actions, agrupado, weekly) · **react-router 7.18.2** (fix GHSA-337j/CVE-2025-68470 — runtime prod 0 vulns)
- [x] **Staging de homologação** — `nxgestao.duckdns.org` (ex-transitório de prod) → QA: `docker-compose.staging.yml` (serviço `staging-app:8081`, volume próprio `nxgestao_staging_data`, rede compartilhada `nxgestao_net`) · `Caddyfile` em 2 blocos (`nxgest.com.br → app:8080` · duckdns → `staging-app:8081`) · `scripts/deploy-staging.sh` (wait boot → seed 1ª vez → caddy reload → health) · `.env.staging` gitignored
- [x] **CD produção** — `.github/workflows/cd.yml`: dispara por `workflow_run` (CI concluído em main) ou manual (`workflow_dispatch` + input `ref` p/ rollback); job `validate` (CI verde do push + health do staging — **gate: prod só passa se staging passou**) → job `deploy-prod` (environment `production`, SSH → `scripts/deploy.sh`, health pós-deploy)
- [x] **Deploy automático** — push/merge à main → CI (test+smoke) → deploy-staging → CD → deploy-prod. **Validado de ponta a ponta: prod e staging saudáveis; prod no último commit.**
- [x] **Secrets no repo** — `VPS_HOST` · `VPS_USER` · `VPS_SSH_KEY` (chave `id_ed25519` sem passphrase)
- [x] **Infra VPS (migração 1x)** — rede `nxgestao_net` compartilhada criada; containers prod (`app`, `caddy`) recriados na rede nova; staging no ar
- [x] **Docs** — `06-PRODUCAO.md §1.1` (pipeline) · `TESTES.md` (CI/CD) · `AGENTS.md` (produção/homologação/pipeline) · `UPDATES.md` · `STATUS.md` · `plans/README.md` · `PLAN-070` (status atualizado; smoke 250)
- [x] **Contagem de smoke sincronizada (248→250)** — `PLAN-067-testes.md` (critérios de aceite) e `07-CASOS-DE-USO-API.md` (nota "Smoke atual 250/250" no cabeçalho, mantendo o registro histórico de 104 de 03/08)

## Validação (rodar antes de finalizar)

- [x] `npx tsc --noEmit` limpo (raiz + frontend)
- [x] `npm run build` verde (local + Docker build)
- [x] `npm run audit:ui` · `npm run audit:styles` · `npm run audit:modules` verdes
- [x] `npm test` verde (78 testes)
- [x] `npm run smoke:api` — **250/250** (instância isolada)
- [x] `npm run docs:audit` sem divergência (SKILL-009)
- [x] **CI no GitHub** — run verde: test + smoke + deploy-staging
- [x] **CD no GitHub** — run verde: validate + deploy-prod → prod no último commit
- [x] Health checks: `https://nxgest.com.br/api/health` e `https://nxgestao.duckdns.org/api/health` → 200

## Pendências

- [ ] **Branch protection em `main`** — exigir CI (`test`+`smoke`) verdes + PR (último gate de qualidade)
- [ ] Validação manual no staging (seed `teste123!`) — QA pré-produção
- [ ] Revisar vulns dev-only restantes (`vite`/`vitest` — major bump, fora de escopo)
- [ ] `PLAN-070` (postgres) — pré-requisito CI/docker atendido; seguir para Fase A

## Observações

- O `deploy-staging.sh` precisa ser invocado via `bash` (robusto a exec bit) — primeira execução no CI falhou por `Permission denied` até o fix.
- A migração de rede (`nxgestao_net`) foi pontual; `deploy.sh`/`deploy-staging.sh` garantem a rede a partir de agora.
