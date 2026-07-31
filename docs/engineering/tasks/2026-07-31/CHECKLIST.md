# CHECKLIST — Deploy do Primeiro Cliente (PLAN-018) + Rename para nxgestao

**Status:** Concluído

**Data:** 31/07/2026

**Roadmap:** product/04-ROADMAP.md §5 (Fase 5 — Polimento)

**Plano:** plans/PLAN-018-deploy.md

---

## Objetivo

Publicar o NX Gestão em produção (VPS + Caddy + HTTPS) e renomear o projeto para `nxgestao` (marca "NX Gestão").

---

## 1 — Rename do projeto para nxgestao

- [x] UI: `LoginPage.tsx` h1 → "NX Gestão"; `index.html` title → "NX Gestão"
- [x] localStorage: `nexus_token` → `nxgestao_token` (client.ts, AuthContext, ProtectedRoute)
- [x] package.json names → `nxgestao` / `nxgestao-frontend` (+ lockfiles)
- [x] Volumes Docker → `nxgestao_data` (docker-compose.yml + docker-compose.prod.yml)
- [x] Docs: README, PLAN-018, PLAN-019 (`super@nxgestao.com`), plans/README
- [x] GitHub repo renomeado para `RafaCartaxo/nxgestao` (via gh CLI); remote atualizado
- [x] Pasta local renomeada para `nxgestao` (git intacto)
- [x] Commit `a02dd0e` + push; build verde (`npm run build`)

## 2 — Deploy em produção (VPS)

- [x] DNS `nxgestao.duckdns.org` → `172.245.152.223` (verificado em 8.8.8.8 e 1.1.1.1)
- [x] Segurança: senha root trocada; `PasswordAuthentication no`; `PermitRootLogin prohibit-password`; chave SSH ed25519 instalada
- [x] Docker instalado (AlmaLinux: repositório oficial — `get.docker.com` falha) + `systemctl enable --now docker`
- [x] Repo clonado em `/opt/nxgestao`; `.env` criado (JWT_SECRET e senhas via `openssl rand`)
- [x] `./scripts/deploy.sh` — build + containers `app` e `caddy` no ar
- [x] Certificado Let's Encrypt emitido automaticamente pelo Caddy

### Testes em produção

- [x] `GET /api/health` → 200 `{"status":"ok","db":"connected"}`
- [x] Frontend HTTP 200 com `<title>NX Gestão</title>`
- [x] Login `admin@cobranca.com` → token JWT válido
- [x] CRUD cliente: criar (validação CPF/campos) → listar → deletar (204); banco limpo após teste
- [x] Conta admin criada: `thalianietomedina@hotmail.com` (Thalia N Medina) via `POST /api/admin/operadores`; login validado
- [x] Backup cron: script `/opt/scripts/backup-nxgestao.sh` testado (arquivo gerado em `/opt/backups`); cron `0 */12 * * *` instalado; cópia off-site baixada

## 3 — Documentação

- [x] `PLAN-018-deploy.md` v3.0 — Status Concluído, provedor real (VPS Hosting Service), dados do deploy, segurança, testes, contas criadas
- [x] `engineering/06-PRODUCAO.md` — runbook de operação (acesso, credenciais, deploy, backup, restauração, logs, rollback, usuários)
- [x] `foundation/ADR-004-Infra-Deploy.md` — decisão de infra (VPS + Caddy + DuckDNS)
- [x] Índices atualizados: `engineering/README.md`, `decisions/ADR-INDEX.md`, `INDEX.md`, `plans/README.md`

---

## Resultados de verificação

- `npm run build` → OK (backend tsc + frontend vite)
- `docker compose -f docker-compose.prod.yml ps` → app + caddy `Up`
- `curl https://nxgestao.duckdns.org/api/health` → `{"status":"ok","db":"connected"}`
