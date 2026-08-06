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
npm run docs:audit       # auditoria de consistência da documentação (SKILL-009)
npm run docs:collection  # regenera docs/api-collection.json
npm run smoke:api        # executa os cenários da 07 (requer instância isolada; ver 07 "Como executar")
npm run audit:styles     # falha se houver cor fixa da paleta em frontend/src (PLAN-035)
npm run audit:ui         # falha se houver padrão legado ou fora-do-canônico (pré-Nexus, select cru, Modal sem title, pills cruas) em frontend/src (PLAN-044/047)
npm run audit:modules    # falha se o Module Manifest do whitelabel estiver incoerente (PLAN-045)
```

> **Documentação alinhada (SKILL-009):** após qualquer mudança de código, rodar `npm run docs:audit` e aplicar a matriz de propagação — ver `docs/skills/SKILL-009-documentation-sync.md`.

## Diagnóstico de ambiente — checar antes de culpar o código

Bug reportado "em produção" nem sempre é bug de código. Antes de investigar, **confirmar o que está de fato rodando e qual resposta a API real devolve**:

- `ps aux | grep -E "node|vite|tsx"` e `ss -tlnp | grep -E "3000|5173"` — ver PIDs, **hora de início** e qual binário cada porta serve.
- Um processo `node dist/main.js` carrega o `dist` **no boot**: se o processo foi iniciado **antes** de um `npm run build`, ele segue servindo o build antigo mesmo com o `dist` atualizado no disco. Reiniciar o processo é parte da correção.
- Frontend `vite` (dev) serve código fonte via HMR; backend `node dist/main.js` serve o build compilado. **Misturar os dois = shape divergente** entre o que o frontend espera e o que o backend devolve (ex.: campo novo no frontend, build antigo sem ele no backend).
- Para ver o shape real da resposta, chamar a API direto (curl com token) e comparar com a interface TypeScript do frontend.
- O backend **local** e o **VPS** podem estar em versões diferentes — confirmar qual o usuário está vendo (URL/porta) antes de fechar diagnóstico.

**Precedente (2026-08-01):** "bug" `stats.totalAdmins is undefined` em qualquer admin. Causa: backend local `node dist/main.js` rodando desde 12:38 com `dist` de 2026-07-31 (sem `totalAdmins`), enquanto o frontend Vite servia o código atual (que espera `totalAdmins`). Produção (VPS, deploy PLAN-022) estava normal. Correção: rebuild + reiniciar o processo do backend.

## Convenções

- Backend em Clean Architecture: `src/modules/<modulo>/{domain,application,infrastructure,presentation}`
- Endpoints da API documentados em `docs/engineering/02-API.md` e `docs/api-collection.json`
- Alterações de features seguem um plano em `docs/plans/` (padrão do projeto)
- Registro diário de trabalho em `docs/engineering/tasks/YYYY-MM-DD/CHECKLIST.md`
- **UI (PLAN-044/047):** novas telas/módulos usam **apenas componentes compartilhados** (PageHeader, Card, KpiCard, Field/FieldSelect/FieldTextarea, Modal com `title`, Tabs, Switch, QuickActions, Button, StatusBadge) e tokens — sem padrão legado (`rounded-md` em inputs/rows, `bg-secondary-light`, `border-l-*`, `variant="onDark"`, `RotaCobrancaSection`, `<select>`/`<textarea>` cru, `<Modal>` sem `title`, `role="tab"` fora do Tabs). Rodar `npm run audit:ui` + `npm run audit:styles` após qualquer mudança visual; atualizar `docs/engineering/design/UI-COVERAGE.md`.
- **Componente compartilhado mudou? (PLAN-044):** varrer TODOS os consumidores (`node scripts/consumers.mjs <componente>`) e atualizá-los **no mesmo PR**, com `audit:ui` limpo.

## Agentes do projeto

Subagentes customizados (se existirem) ficam em `.opencode/agents/`. Cada um tem escopo e permissões próprios; todos herdam estas regras.

## Skills do ambiente

- **`handoff`** (global, opencode + Claude Code) — gera documento de transição
  resumindo a conversa atual para outro agente/sessão continuar. Instalada em:
  `~/.config/opencode/skills/handoff/SKILL.md` e `~/.claude/skills/handoff/SKILL.md`.
  Fonte: `mattpocock/skills` (skills/productivity/handoff).
- O documento gerado segue as instruções da própria skill (temp dir do SO,
  seção "suggested skills", referências por caminho, segredos redigidos).
