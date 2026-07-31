# AGENTS.md

Orientações para qualquer agente de IA trabalhando neste repositório.

## O projeto

**NX Gestão** (`nxgestao`) — sistema de gestão de cobranças em campo (credores, contratos, parcelas, pagamentos, caixa). Backend Node.js + Express + TypeScript + SQLite (better-sqlite3 + Drizzle); frontend React + Vite + TailwindCSS.

**Repo GitHub:** `RafaCartaxo/nxgestao`

## Documentação — comece por aqui

| O que você quer | Onde |
|---|---|
| Índice geral | `docs/README.md` e `docs/INDEX.md` |
| Produto (domínio, regras, PRD, roadmap) | `docs/product/` |
| Arquitetura, banco, API, backend, frontend | `docs/engineering/` |
| Planos de implementação (PLAN-001 a PLAN-019) | `docs/plans/README.md` |
| Decisões arquiteturais (ADRs) | `docs/decisions/ADR-INDEX.md` |
| **Produção / operação (runbook)** | `docs/engineering/06-PRODUCAO.md` |
| Deploy do primeiro cliente | `docs/plans/PLAN-018-deploy.md` |

## Segurança — regras obrigatórias

- **Nunca versionar** `.env`, senhas, tokens ou segredos.
- **Credenciais e acessos externos ficam fora do repo**, em `~/.config/nxgestao/`
  (ver `ACESSOS.md` lá — painel VPS, DuckDNS, GitHub, senhas do sistema).
- O `.env` de produção vive no VPS (`/opt/nxgestao/.env`, chmod 600) — nunca copiar pro repo.
- `JWT_SECRET` é obrigatório em produção (app falha ao iniciar sem ele).

## Produção

- **URL:** `https://nxgestao.duckdns.org`
- **VPS:** `172.245.152.223` (root, somente chave SSH), AlmaLinux 8.10, Docker + Compose
- **Domínio:** DuckDNS (`nxgestao.duckdns.org`) é **provisório** — plano de migração para `.com.br` e novo host em andamento (ver `foundation/ADR-004-Infra-Deploy.md` e `06-PRODUCAO.md`)
- **Backup:** cron 2x/dia no VPS → `/opt/backups`; **host não tem snapshot** — nunca assumir recuperação pelo provedor
- Para operar (deploy, backup, logs, rollback, usuários): seguir `docs/engineering/06-PRODUCAO.md`

## Comandos

```bash
npm run dev              # backend + frontend com HMR
npm run dev:backend      # só backend (tsx watch)
npm run dev:frontend     # só frontend (Vite)
npm run build            # tsc (backend) + vite build (frontend)
npm start                # produção local (Node serve API + frontend estático)
npm test                 # vitest
```

## Convenções

- Backend em Clean Architecture: `src/modules/<modulo>/{domain,application,infrastructure,presentation}`
- Endpoints da API documentados em `docs/engineering/02-API.md` e `docs/api-collection.json`
- Alterações de features seguem um plano em `docs/plans/` (padrão do projeto)
- Registro diário de trabalho em `docs/engineering/tasks/YYYY-MM-DD/CHECKLIST.md`

## Agentes do projeto

Subagentes customizados (se existirem) ficam em `.opencode/agents/`. Cada um tem escopo e permissões próprios; todos herdam estas regras.
