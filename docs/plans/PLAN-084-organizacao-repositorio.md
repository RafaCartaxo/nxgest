# PLAN-084 — Organização do Repositório

**Status:** ✅ Concluído — Blocos 1–5 executados (Bloco 4 integrado na trilha em 20/08) · pendências 1–5 resolvidas (20/08/2026)
**Projeto:** NX Gest (`nxgest`)
**Origem:** plano elaborado no GitHub Copilot (sessão de memória) + reconciliação com o trabalho já entregue em 19/08 (PLAN-083 + purga SQLite→PG).
**Relacionado:** PLAN-083 (concluído) · SKILL-009 (documentation sync) · `docs/README.md` · `docs/INDEX.md` · `AGENTS.md`

## Progresso (20/08)

- **Bloco 1 — Sync factual ✅** — `docs/README.md` (`audita-docs`→`npm run docs:audit`) · `AGENTS.md` (faixa de planos removida) · `docs/STATUS.md` (itens "aguardando commit" → em produção) · `docs/engineering/tasks/README.md` (14/15/18) · `docs/plans/README.md` (PLAN-083 ✅ + PLAN-084).
- **Bloco 2 — Ambiente + fronteira ✅** — `.env.production.example` (sem `uuidgen`) · `.gitignore`/`.dockerignore` ampliados · `SEGURANCA.md` (`~/.config/nxgestao`) · e-mail `MAIL_FROM` unificado em `MAIL_FROM_ADDRESS` (compose) · `.env.staging.example` + staging com secrets aleatórios e `MAIL_PROVIDER=console` (`deploy-staging.sh`).
- **Bloco 3 — Verificado ✅ (sem mudanças de código)** — `migracao:test`/`test-migracao` só em tasks históricas (nenhuma doc viva) · schema sem divergência (money=`NUMERIC(12,2)`, lat/lng=`doublePrecision` são colunas distintas) · `nxgestao` em docs vivas só operacional (VPS/`~/.config/nxgestao`).
- **Bloco 5 — Parcial ✅** — link checker one-off: **3 links relativos corrigidos** em `docs/INDEX.md` (0 quebrados restantes) · PLAN-069 confirmado **parcial** (falta parte Admin — não marcar concluído) · item 17 (matriz plano/status/checklist) coberto por SKILL-009 + `docs/plans/README.md` + `docs/STATUS.md`.
- **Bloco 4 — Concluído (20/08)** — SHA validado no staging (CI passa `${{ github.sha }}` → `deploy-staging.sh` faz `fetch` + `reset --hard` no SHA; `|| true` removido) · CD manual roda os gates completos (tsc/build/check-dist/audits/test/docs) · `deploy.sh` exige backup pré-deploy com escape explícito `NXGEST_SKIP_BACKUP=1`.
- **Pendências finais (20/08)** — ① Rastreamento Git verificado (nenhum `.env` real/backup/upload/dump rastreado; `.gitignore`/`.dockerignore` cobrem tudo; remote sem token) · ② `GITHUB_TOKEN` do `.env` local ignorado pelo git — **revogação manual pendente** (ação no GitHub) · ③ Auditoria de links **automatizada** (`scripts/audit-links.mjs` + `npm run audit:links` + CI) · ④ Backups SQLite legados **deletados** (~8,5M) · ⑤ Bloco 4 acima.

## Objetivo

Organizar o repositório por responsabilidade e manter rastreabilidade entre código, planos, documentação, QA, tarefas, ferramentas e operação. Primeira etapa **conservadora**: preservar caminhos oficiais e histórico, sem refatorar o produto, sem renomear infraestrutura de produção e sem mover documentos em massa antes de mapear links.

## Convenção de nomes

- `nxgest` é o nome canônico (produto, repo, package, docs correntes, scripts, novos recursos).
- `nxgestao` **não** deve ser usado em novos nomes; ocorrências existentes são classificadas como: (a) histórico legítimo, (b) recurso operacional existente (ex.: `/opt/nxgestao`, volumes, containers, rede Docker — **não renomear automaticamente**), (c) inconsistência documental a corrigir.
- Produção: `https://nxgest.com.br` · Staging: `https://nxgestao.duckdns.org`.
- `AGENTS.md` permanece na raiz como contrato universal (reconhecido por agentes e referenciado por planos).

## Classificação do repositório

### Permanecem rastreados
- Código/testes: `src/**`, `frontend/src/**`, `frontend/public/**`.
- Scripts: `scripts/**`; `scripts/arquivo/**` só como legado claramente identificado.
- Infra: `Dockerfile`, `docker-compose*.yml`, `Caddyfile`, `.github/**`, `.nvmrc`.
- Manifestos/lockfiles: `package.json`, `package-lock.json`, `frontend/package.json`, `.opencode/package.json` + lock.
- Exemplos de ambiente: `.env.example`, `.env.production.example`, `.env.staging.example`.
- Docs oficiais, planos, ADRs, QA, skills, templates, tasks, READMEs, collection gerada.
- `AGENTS.md` e `.opencode/agents/**` (repo privado, sem segredos).

### Devem ser ignorados / removidos da árvore quando possível
- `.env*` reais, `node_modules/**` (inclui `frontend` e `.opencode`), `dist/**`, `frontend/dist/**`, `coverage/**`, logs, PIDs, caches, temporários.
- `uploads/**`, `gestao.db*`, sidecars WAL/SHM, backups SQLite, dumps PG, `.tar.gz` de backup.
- `.obsidian/**` (estado local do vault).
- `.dockerignore` deve excluir essas classes (não enviar dados/segredos ao contexto de build).

### Permanecem rastreados como histórico
- `docs/plans/arquivo/**`, `scripts/arquivo/**`, `FEATURE-temp.md`, briefings `Lovable-*`/`Stitch-*`.
- Planos concluídos, tasks/handoffs antigos.
- PLAN-018, ADRs e QA que descrevem SQLite — marcados `legacy`/`superseded` (não reescritos como corrente).

## Estado de reconciliação (19/08)

Itens já confirmados no estado atual e que não devem ser retrabalhados sem nova evidência:

- ✅ `.env.example` usa PostgreSQL e não contém `DB_PATH`.
- ✅ `AGENTS.md` declara PostgreSQL como banco atual e `nxgest` como nome canônico.
- ✅ `docs/qa/01-VISAO-GERAL.md` e `docs/product/07-CASOS-DE-USO-API.md` refletem PostgreSQL/Smoke PG.
- ✅ `better-sqlite3` e `@types/better-sqlite3` não estão nas dependências atuais.
- ✅ `docs/plans/PLAN-083-otimizacao-consultas-busca.md` está concluído e registra smoke 278/278.
- ✅ README, QA 01/02/03/06, `.env.production.example`, `.dockerignore` e índices foram sincronizados nesta rodada.
- ✅ Bloco de ambiente parcialmente aplicado: `.env.staging.example` versionável, staging sem envio real (`MAIL_PROVIDER=console`), secrets aleatórios na criação/atualização de `.env.staging`, rate limits de QA normalizados e `MAIL_FROM` removido dos Compose.
- ⚠️ O `.env` local contém um `GITHUB_TOKEN`; revogar e recriar esse token antes de compartilhar o workspace ou executar qualquer operação que possa expô-lo. **Estado (20/08):** o token permanece no `.env` local, **ignorado pelo git** (nunca versionado) e sem vazamento pro repo — a revogação em si é ação manual no GitHub (Settings → Developer settings → Personal access tokens).

## Pendências restantes (por Bloco)

### Bloco 1 — Sync factual das docs vivas (concluído)
| Item | Local | Ação |
|---|---|---|
| 1–5 | Índices e status | Concluído: comandos, faixa de planos, PLAN-083/084, status e tasks sincronizados |

### Bloco 2 — Ambiente, exemplos e fronteira Git/Docker (concluído)
| Item | Local | Ação |
|---|---|---|
| 6–9 | Env, Compose e ignores | Concluído: placeholders, `MAIL_FROM_ADDRESS`, staging `console`, credenciais e contexto Docker organizados |

### Bloco 3 — Referências órfãs e coerência (concluído)
| Item | Local | Ação |
|---|---|---|
| 10–12 | Referências e nomenclatura | Concluído: ocorrências antigas classificadas, schema reconciliado e `nxgestao` restrito a infraestrutura operacional |

### Bloco 4 — CI/CD operacional (concluído em 20/08)
| Item | Local | Ação |
|---|---|---|
| 13 | `scripts/deploy-staging.sh` | ✅ CI passa `${{ github.sha }}` → script faz `git fetch origin <sha>` + `git reset --hard`; `|| true` removido (deploy manual sem arg mantém `pull --ff-only`) |
| 14 | CD manual (`cd.yml`) | ✅ `workflow_dispatch` roda gates completos (tsc · build · check-dist · audit:ui/styles/modules · test · docs:audit · audit:links); smoke fica fora com nota (ref de rollback já passou CI) |
| 15 | `scripts/deploy.sh` | ✅ backup pré-deploy obrigatório (falha sem `/opt/scripts/backup-nxgest.sh`); escape explícito `NXGEST_SKIP_BACKUP=1` |

### Bloco 5 — Governança e auditoria (concluído em 20/08)
| Item | Ação |
|---|---|
| 16 | ✅ `scripts/audit-links.mjs` novo (links internos + âncoras + wikilinks + órfãos warn) · `npm run audit:links` · step no CI (job test) + job summary · 1 âncora pré-existente corrigida (`#módulo-admin`) · **0 erros** |
| 17 | ✅ Matriz plano/status/checklist coberta por SKILL-009 + índice de planos + STATUS; automação dos links acima é o reforço |
| 18 | ✅ PLAN-069 confirmado **parcial** (parte 2 Admin pendente) — status mantido 🔵 |

## Histórico da execução

1. **Bloco 1** — sincronizado.
2. **Bloco 2** — sincronizado.
3. **Bloco 3** — referências e nomenclatura classificadas.
4. **Bloco 5** — link checker automatizado (`audit-links`), matriz coberta, PLAN-069 confirmado parcial.
5. **Bloco 4** — integrado: SHA validado no staging, gates completos no CD manual, backup obrigatório no deploy.

> Bloco 4 foi **integrado** à rodada em 20/08 (SHA validado no staging, gates completos no CD manual, backup obrigatório no deploy) — validado em staging antes do push.

## Validação

- `git status --short --branch`, `git ls-files`, `git ls-files --others --exclude-standard`, `git check-ignore -v`.
- `npm run docs:audit` · `npm run audit:styles` · `npm run audit:ui` · `npm run audit:modules` · `npm test` · `npm run build`.
- Busca final por `SQLite|Node 18|DB_PATH` em docs vivas (classificar cada ocorrência).
- `docker compose ... config` + inspeção do contexto `docker build` sem dados/segredos locais.
- Caminho completo plano → código → checklist → CT → docs canônicas → STATUS/UPDATES.

## Fora do escopo imediato

- Refatorar `src`/`frontend`; alterar comportamento da aplicação.
- Renomear infraestrutura real em produção (`/opt/nxgestao`, volumes, containers, rede).
- Apagar uploads/bancos/backups sem confirmar retenção e backup externo — **backups SQLite legados deletados em 20/08** após confirmar retenção (dados 100% no PG + `/opt/backups` no VPS). Obs.: `backup-offsite-gestao.db` (241K, 02/08) em `~/.config/nxgestao/backups/` permanece — decisão de retenção em aberto.
- Reescrever histórico Git; mover toda a documentação antes de mapear links.
