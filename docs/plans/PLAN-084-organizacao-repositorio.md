# PLAN-084 — Organização do Repositório

**Status:** 🔵 Em execução — Blocos 1–3 concluídos · Bloco 5 parcial (verificado) · Bloco 4 separado (19–20/08/2026)
**Projeto:** NX Gest (`nxgest`)
**Origem:** plano elaborado no GitHub Copilot (sessão de memória) + reconciliação com o trabalho já entregue em 19/08 (PLAN-083 + purga SQLite→PG).
**Relacionado:** PLAN-083 (concluído) · SKILL-009 (documentation sync) · `docs/README.md` · `docs/INDEX.md` · `AGENTS.md`

## Progresso (20/08)

- **Bloco 1 — Sync factual ✅** — `docs/README.md` (`audita-docs`→`npm run docs:audit`) · `AGENTS.md` (faixa de planos removida) · `docs/STATUS.md` (itens "aguardando commit" → em produção) · `docs/engineering/tasks/README.md` (14/15/18) · `docs/plans/README.md` (PLAN-083 ✅ + PLAN-084).
- **Bloco 2 — Ambiente + fronteira ✅** — `.env.production.example` (sem `uuidgen`) · `.gitignore`/`.dockerignore` ampliados · `SEGURANCA.md` (`~/.config/nxgestao`) · e-mail `MAIL_FROM` unificado em `MAIL_FROM_ADDRESS` (compose) · `.env.staging.example` + staging com secrets aleatórios e `MAIL_PROVIDER=console` (`deploy-staging.sh`).
- **Bloco 3 — Verificado ✅ (sem mudanças de código)** — `migracao:test`/`test-migracao` só em tasks históricas (nenhuma doc viva) · schema sem divergência (money=`NUMERIC(12,2)`, lat/lng=`doublePrecision` são colunas distintas) · `nxgestao` em docs vivas só operacional (VPS/`~/.config/nxgestao`).
- **Bloco 5 — Parcial ✅** — link checker one-off: **3 links relativos corrigidos** em `docs/INDEX.md` (0 quebrados restantes) · PLAN-069 confirmado **parcial** (falta parte Admin — não marcar concluído) · item 17 (matriz plano/status/checklist) coberto por SKILL-009 + `docs/plans/README.md` + `docs/STATUS.md`.
- **Bloco 4 — Separado (não iniciado)** — CI/CD operacional (SHA validado no deploy-staging · gates do CD · backup obrigatório no deploy.sh). Recomendado como trilha própria por risco.

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
- Exemplos de ambiente: `.env.example`, `.env.production.example` (após correção).
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
- ⚠️ O inventário local confirmou que README, QA 02/06, `.env.production.example`, `.dockerignore` e índices ainda exigem sincronização; esses itens permanecem nos blocos de execução abaixo.
- ✅ Bloco de ambiente parcialmente aplicado: `.env.staging.example` versionável, staging sem envio real (`MAIL_PROVIDER=console`), secrets aleatórios na criação/atualização de `.env.staging`, rate limits de QA normalizados e `MAIL_FROM` removido dos Compose.
- ⚠️ O `.env` local contém um `GITHUB_TOKEN`; revogar e recriar esse token antes de compartilhar o workspace ou executar qualquer operação que possa expô-lo.

## Pendências confirmadas (por Bloco)

### Bloco 1 — Sync factual das docs vivas (baixo risco, alta prioridade)
| Item | Local | Ação |
|---|---|---|
| 1 | `docs/README.md:29` | `audita-docs` → comando oficial `npm run docs:audit` |
| 2 | `AGENTS.md:20` | faixa "PLAN-001 a PLAN-069" → referência dinâmica ao `docs/plans/README.md` |
| 3 | `docs/plans/README.md` | PLAN-083 `🔵` → `✅ Concluído`; incorporar PLAN-080/081/082/083 e este PLAN-084 |
| 4 | `docs/STATUS.md` | itens 12–13/08 "aguardando commit" (linhas 23–28) → atualizar (já commitados/pushados) |
| 5 | `docs/engineering/tasks/README.md` | incluir tasks de 14, 15 e 18/08 (lista hoje só até 13/08) |

### Bloco 2 — Ambiente, exemplos e fronteira Git/Docker
| Item | Local | Ação |
|---|---|---|
| 6 | `.env.production.example` | `uuidgen`/comandos shell como valores (linhas 6,7,11,22) → placeholders + instruções |
| 7 | Política de e-mail | resolver `MAIL_FROM` vs `MAIL_FROM_ADDRESS` (1 fonte canônica) · staging `console` vs `resend` |
| 8 | `docs/engineering/SEGURANCA.md` | `~/.config/nxgest` (linhas 22,45) → `~/.config/nxgestao` |
| 9 | `.dockerignore` | **incompleto** — adicionar `.env.*`, `uploads`, `coverage`, logs, `.obsidian`, dumps PG, backups, `frontend/dist`, `*.db.backup-*`, `.opencode/node_modules` |

### Bloco 3 — Referências órfãs e coerência
| Item | Local | Ação |
|---|---|---|
| 10 | `migracao:test`/`test-migracao` | ocorrências em UPDATES/tasks/PLAN-059 → classificar como histórico; não deixar como comando corrente |
| 11 | `docs/engineering/01-DATABASE.md` vs PLAN-070 | conferir `NUMERIC(12,2)` vs `doublePrecision` contra o schema real; definir fonte canônica |
| 12 | Nomenclatura `nxgestao` vs `nxgest` | auditoria em texto/docs correntes; classificar por contexto (não renomear infra) |

### Bloco 4 — CI/CD operacional (trilha separada — maior risco)
| Item | Local | Ação |
|---|---|---|
| 13 | `scripts/deploy-staging.sh` | `git pull origin main` após CI → pode implantar SHA ≠ validado; checkout do SHA validado |
| 14 | CD manual (`cd.yml`) | não replica todos os gates do CI (build/audits/smoke/docs) |
| 15 | `scripts/deploy.sh` | prossegue sem backup externo → tornar backup obrigatório (com escape explícito) |

### Bloco 5 — Governança e auditoria
| Item | Ação |
|---|---|
| 16 | `scripts/audit-docs.mjs` não valida links Markdown/arquivos/scripts órfãos → verificar ou criar check complementar no CI |
| 17 | Matriz plano/status/checklist (link do plano ↔ status ↔ evidência da task) |
| 18 | Verificar escopo real do PLAN-069 antes de qualquer ajuste de status (parte 2 Admin pendente) |

## Ordem lógica de execução recomendada

1. **Bloco 1** — sincronizar índices/status factuais (AGENTS, docs/README, plans/README, STATUS, tasks/README).
2. **Bloco 2** — corrigir ambiente/exemplos e fronteira Git/Docker (env.production.example, e-mail, SEGURANCA, .dockerignore).
3. **Bloco 3** — classificar referências órfãs, resolver divergência de schema e auditar nomenclatura.
4. **Bloco 5** — link checker, matriz de rastreabilidade, escopo do PLAN-069.
5. **Bloco 4 (separado)** — integridade CI/CD (SHA validado, gates de CD, backup obrigatório) como trilha própria por risco operacional.

> Bloco 4 fica **fora** da rodada inicial por mexer em pipeline de produção; tratar isoladamente.

## Validação

- `git status --short --branch`, `git ls-files`, `git ls-files --others --exclude-standard`, `git check-ignore -v`.
- `npm run docs:audit` · `npm run audit:styles` · `npm run audit:ui` · `npm run audit:modules` · `npm test` · `npm run build`.
- Busca final por `SQLite|Node 18|DB_PATH` em docs vivas (classificar cada ocorrência).
- `docker compose ... config` + inspeção do contexto `docker build` sem dados/segredos locais.
- Caminho completo plano → código → checklist → CT → docs canônicas → STATUS/UPDATES.

## Fora do escopo imediato

- Refatorar `src`/`frontend`; alterar comportamento da aplicação.
- Renomear infraestrutura real em produção (`/opt/nxgestao`, volumes, containers, rede).
- Apagar uploads/bancos/backups sem confirmar retenção e backup externo.
- Reescrever histórico Git; mover toda a documentação antes de mapear links.
