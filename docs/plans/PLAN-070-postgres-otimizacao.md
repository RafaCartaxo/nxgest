# PLAN-070 — Migração para PostgreSQL + Otimização da Camada de Dados

**Status:** ✅ **Concluído (12/08)** — PostgreSQL em produção · **Modelo final** aplicado e deployado em prod+staging (money `numeric(12,2)`, datas `DATE`, **16 FKs**, índice parcial, `UPLOADS_DIR`, `better-sqlite3` devDep). CI/CD verdes. **Débitos 1-3 resolvidos (12/08):** timestamps `TIMESTAMPTZ` · **snake_case** em todas as colunas/tabelas · node 20 (`.nvmrc`). Aplicado em prod+staging via migrate-modelo v2. Resta apenas: **latência de rede** (host BR, plano separado) e **MCP** (plano futuro).

**Versão:** 1.7

**Início:** 11/08/2026

**Origem:** demanda do Rafael (performance em produção — lentidão real no VPS) + rascunho em `~/Downloads/PLAN — Migração para PostgreSQL e Otimização da Camada de Dados.md` · cruza com o código do repo (auditoria Fase 0 abaixo)

**Execução:** sequencial, uma fase por vez (ordem na seção "Ordem de execução"). Fix de CI/docker já na `main`. Regras em `AGENTS.md`.

---

## Objetivo

Migrar o banco da aplicação de **SQLite para PostgreSQL** preservando o comportamento funcional, aproveitando a migração para corrigir gargalos reais de performance medidos por `EXPLAIN ANALYZE` (N+1, subqueries correlacionadas, índices). **MCP é preparação futura, fora desta entrega** (seção "MCP").

Princípio do rascunho mantido: **não otimizar por suposição** — identificar → medir antes → alterar → medir depois.

---

## Decisões travadas

| # | Decisão | Escolha | Justificativa |
|---|---|---|---|
| D1 | Número do plano | **PLAN-070** | `PLAN-021` já existe no repo (admin-contexto-kpis) |
| D2 | Datas | **manter `TEXT`** nesta fase | Comparações lexicais continuam iguais; tipar `DATE/TIMESTAMPTZ` fica como débito técnico documentado |
| D3 | Dialeto | **Postgres-only** na app; SQLite só no script de migração e nos backups | Evita manter dois schemas drizzle; rollback via imagem anterior + backup |
| D4 | Booleans (`ativa`, `force`) | **manter `integer 0/1`** | Código compara `=== 1`; trocar pra `boolean` mexe em lógica sem ganho |
| D5 | Monetário | **`numeric(12,2)`** | REAL/float é risco de precisão |
| D6 | IDs | **`text`** (UUID v4 já são strings) | Menor risco; tipo `uuid` fica como débito |

---

## Fase 0 — Auditoria (executada — entregável)

Diagnóstico real do repo:

| Item | Resultado |
|---|---|
| Banco atual | SQLite (`better-sqlite3`), `gestao.db` (~3,5MB + WAL 4,5MB); prod no volume docker `/data/gestao.db` |
| ORM/query builder | Drizzle `sqlite-core` + **SQL cru** via `sqlite.prepare` em 6 arquivos (ver Fase B) |
| Schema | ~19 tabelas; todos os IDs UUID v4; soft-delete (`deletedAt`); isolamento por `userId` (operacional) + `empresaId` (JOIN via `usuarios`) |
| Migrations existentes | **Caseiras no boot** (`createTables()` em `src/database.ts`, 788 linhas) — ALTERs incrementais + rebuilds + **seeds com efeito colateral**; `drizzle-kit` instalado mas não usado |
| Repositories | Clean Architecture (Ports & Adapters) já em vigor — acesso via `src/modules/*/infrastructure/repositories` |
| Transações | `db.transaction` correto em `empresa.create` (retorna a promise) · **G21**: `admin.editarOperador` chama `db.transaction` **sem `await`** (só funciona hoje por ser síncrono) · **G5**: `ContratoRepository.transaction` usa `sqlite.exec("BEGIN IMMEDIATE")` cru |
| Problemas encontrados | **(1)** N+1 real em `empresa.repository.impl.ts:31-34,51-54` e `admin.repository.impl.ts:46-47,66-67` (loop de `COUNT` por linha); **(2)** 4 subqueries correlacionadas no `listarCobrancasDoDia`; **(3)** `date(h.createdAt,'localtime')` não-sargável (2 arquivos); **(4)** `LIKE '%nome%'` sem índice e com semântica case-sensitive **diferente** no PG (G7); **(5)** monetário em REAL; **(6)** `count()` + select em toda listagem (clientes/contratos); **(7)** `getSaldoAtual`/`cliente-financeiro` com SQL cru; **(8)** **18 chamadas `.run()`/`.get()`** (API drizzle SQLite-only, G13); **(9)** `editarOperador` sem await (G21) |
| Riscos da migração | `datetime('now')` · `julianday()` · `date(x,'localtime')` · `INSERT OR IGNORE` · `numeric` volta como string no driver `pg` · **`.run()`/`.get()` drizzle** (sqlite-only) · **binding `?`→`$1..$N`** · N+1 fica **mais caro** no PG se não corrigido junto · semântica de TZ do VPS · concorrência que o SQLite mascarava |

> **Lentidão em produção:** além dos padrões acima, há a latência documentada VPS~Brasil (~120–180ms, `06-PRODUCAO.md` §10.4). A otimização resolve a parte do banco; a latência de rede é outro problema (fora deste plano).

---

## Fase A — Baseline (preparação, sem tocar produção)

- [x] Criar branch `feat/plan070-postgres` a partir da `main` (fix de CI/docker já mergeado).
- [x] Obter um **dump válido de produção** (`/opt/backups/gestao-20260812-120001.db` → análise local; 500 registros / 19 tabelas).
- [x] Medir baseline: `EXPLAIN QUERY PLAN` + tempo real das queries críticas no dump local + latência de rede em produção.
- [x] Registrar o baseline neste documento (abaixo).
- [x] **Gate de go/no-go** — concluído (ver resultado abaixo).

### Resultado do baseline (11/08)

| Métrica | Valor | Amostra |
|---|---|---|
| Tempo de **DB** (cobranças do dia, query mais cara) | **0,42 ms** | dump real de produção |
| Tempo de **DB** (lista clientes com `LIKE`) | **0,12 ms** | dump real |
| Tempo de **DB** (financeiro do cliente) | **0,02 ms** | dump real |
| Tempo de **DB** (contratos count+list+sums) | **~0,1 ms** | dump real |
| **Latência de rede** (VPS~Brasil, `api/health`) | **~400–500 ms** (picos 1,1 s) | 10 amostras curl |

**Conclusão do gate:** a query mais cara do sistema roda em **0,42 ms** no dump real (500 registros); a latência de rede **~400–500 ms** é **~1000× maior** que o tempo de banco. **O banco NÃO é o gargalo da lentidão percebida — é a rede (VPS nos EUA → Brasil).** Migrar para PostgreSQL no mesmo VPS **não melhora a performance percebida** no volume atual.

**Recomendação (decisão do Rafael pendente):**
- **A — Migração como projeto de escala/hardening** (não-performance): seguir PLAN-070 pelo valor futuro (transações, concorrência, crescimento do SaaS, features), aceitando que **não** reduz a lentidão atual.
- **B — Pivotar pra latência/rede primeiro** (benefício real agora): datacenter BR, menos round trips (consolidar endpoints), caching/keep-alive/CDN — e estacionar o PLAN-070.
- **C — Ambos**, com B primeiro (wins rápidos) e A depois (escala).

---

## Fase B — Schema PostgreSQL

> **✅ Executada (12/08)** — `src/database.ts` reescrito em `pg-core` (19 tabelas) + `pool`/`rawQuery` + `runMigrations()` (DDL idempotente com identifiers quotados) + `seedBasico()`. Port completos dos repos (operacoes, caixa, cliente-financeiro, contrato, impacto) e G13/G21. **Validação:** `tsc` limpo · vitest 88/88 · **smoke 250/250 contra PG local** · build · docs:audit. Scripts: `create-schema.mjs`/`seed-demo.mjs` em PG, `test-migracao.mjs` removido, `fix-caixa.mjs` arquivado.

**Amendments (decisões ajustadas na execução):**
- **D5 emendado — money = `doublePrecision`, não `numeric`**: o driver `pg` devolve `numeric` como **string** (o typeParser não vale nas leituras do drizzle — validado empiricamente), o que quebrava `valor.toFixed`/comparações. `doublePrecision` (float8) é convertido a number nativamente e **espelha exatamente o `REAL` do SQLite** (comportamento atual preservado, sem retrabalho de mappers). G4 resolvido.
- **Identifiers camelCase quotados no SQL cru**: o PG dobra para minúsculas identificadores sem aspas; o drizzle emite `"camelCase"` correto, então todo SQL cru (rawQuery/seed/seedBasico) usa `"colunaCamelCase"`.
- **`empresas.modulos` ganhou DEFAULT** no DDL (espelha o SQLite) — sem isso `/me` retornava `modulos=null` (MOD-096).
- `rawQuery` converte `?`→`$1..$N` (G22); `count()`/`numeric` normalizados no driver.

### B1. Driver e dialeto

- [ ] `npm i pg` no **root** (npm workspaces já ativo — `workspaces: ["frontend"]`, commit `95d3a53`; instalação única, sem tocar `frontend/package-lock.json`) + `drizzle-orm` (já presente) + `drizzle-kit` (já presente, config no root).
- [ ] `src/database.ts` reescrito com `drizzle-orm/pg-core` (`pgTable`, `text`, `numeric`, `double precision`, `integer`).
- [ ] Pool `pg` com `DATABASE_URL` (env) — sem credenciais em código. `JWT_SECRET` segue obrigatório.

### B2. Mapa de tipos

| SQLite atual | Postgres | Obs |
|---|---|---|
| `REAL` (monetário) | `numeric(12,2)` | D5 — `caixaBase` também |
| `REAL` (lat/lng) | `double precision` | |
| `INTEGER 0/1` (`ativa`, `force`) | `integer` | D4 |
| `TEXT` (datas/IDs) | `text` | D2/D6 |
| `datetime('now')` | **removido** | todo insert deve setar `createdAt` explicitamente (G6) |
| `INSERT OR IGNORE` | `ON CONFLICT DO NOTHING` | seeds |
| `INSERT OR REPLACE` | `ON CONFLICT ... DO UPDATE` | |

### B3. Migrations formais

- [ ] Migrar do boot-caseiro para **`drizzle-kit generate` + `migrate`** — schema reproduzível de banco vazio.
- [ ] Separar **migrations** (estrutura) de **seeds** (`seed-demo`, admin default, empresa "Desenvolvimento") — seeds viram script executável, não migration.
- [ ] **Gate:** `npx tsc --noEmit` limpo **e** `rg "\.(run|get)\(\)" src` sem ocorrências de API sqlite-only (G13) — `pg-core` não expõe `.run()`/`.get()`, retorna o resultado no `await`.

### B4. Arquivos com SQL cru a portar

1. `src/modules/operacoes/infrastructure/repositories/operacoes.repository.impl.ts` — 13 queries (port + reescrita da cobrança do dia, Fase E)
2. `src/modules/caixa/infrastructure/repositories/caixa.repository.impl.ts` — saldo/entradas/saídas/auditoria
3. `src/modules/cliente/infrastructure/queries/cliente-financeiro.query.impl.ts` — 4 queries
4. `src/modules/contrato/infrastructure/repositories/contrato.repository.impl.ts` — `getSaldoAtual` + **transaction crua (G5)**
5. `src/modules/admin/infrastructure/queries/impacto-desativacao.query.impl.ts` — SQL dinâmico + `date()` (G20)
6. `src/modules/health/presentation/controllers/health.controller.ts` — validar `db.select` (sem mudança esperada)
7. **Scripts:** `scripts/seed-demo.mjs` (INSERTs crus, G18) e `scripts/smoke-api.mjs` (helpers que abrem o SQLite cru, G17) portados pro PG; `scripts/fix-caixa.mjs` (legado, importa `drizzle-orm/better-sqlite3`) **arquivado** (G18)

### B5. Tradução SQLite → PG (compatibilidade)

| Expressão SQLite | Tradução PG |
|---|---|
| `date(col, 'localtime') = ?` | `col >= ? AND col < ?` — **instantes UTC das fronteiras do dia local** (`getLocalDateString` + offset), preserva o comportamento atual independente da TZ do VPS (G3) |
| `julianday(?) - julianday(col)` | `(DATE ? - DATE col)` → inteiro (dias) |
| `datetime('now')` | removido (G6) |
| `INSERT OR IGNORE` | `ON CONFLICT DO NOTHING` |
| `LIKE '%x%'` | **`ILIKE '%x%'`** (G7 — preserva case-insensitive atual do SQLite) |
| `ON CONFLICT (...) DO UPDATE SET col = excluded.col` | **igual no PG** (validar) |
| `?` placeholders (bindings posicionais) | **`$1..$N`** (drizzle `db.execute(sql.raw(...))` no pg) — G22 |
| `.run()` / `.get()` do drizzle (sqlite) | **remover** — `pg-core` retorna o resultado no `await` (G13) |
| `sqlite.pragma("foreign_keys = ON")` | default ON no PG |
| `sqlite.pragma("journal_mode = WAL")` | n/a |

---

## Fase C — Migração dos dados

> **✅ Executada (12/08)** — `scripts/migrate-sqlite-to-pg.mjs` criado e **validado no dump real de produção** (`gestao-20260812-120001.db`, 500 registros/19 tabelas): contagens, somas monetárias, amostras (últimos 5 por PK, com normalização G6 na comparação) e órfãos=0 — tudo verde. App bootou sobre os dados migrados (`health ok`). Uso: `SRC_DB=... DATABASE_URL=... npx tsx scripts/migrate-sqlite-to-pg.mjs [--yes]` (TRUNCATE com `--yes`; aborta se o destino já tiver dados).

### C1. Script

- [ ] **`scripts/test-migracao.mjs` fica obsoleto** (validava o caminho de boot-migration ALTER em banco legado — morre com o PG). Criar **`scripts/migrate-sqlite-to-pg.mjs`** (transferência de dados) + **harness próprio de validação** (a matriz C2 vira teste automatizável: contagens/somas/amostras comparadas origem×destino).
- [ ] **Normalizar na cópia (G6):** `createdAt` no formato `YYYY-MM-DD HH:MM:SS` (gerado por `datetime('now')` no SQLite) → converter para ISO com `T` (`YYYY-MM-DDTHH:MM:SS.sssZ`). Sem isso a **ordenação lexical quebra** (espaço `0x20` < `T` `0x54`).
- [ ] Executar dentro da rede do compose (postgres não exposto ao host) — container one-off `migracao`.

### C2. Validação (matriz — além do `COUNT(*)`)

| Tabela | Contagem | Somas | Amostra |
|---|---|---|---|
| empresas | ✓ | — | últimos 5 |
| usuarios | ✓ | — | últimos 5 |
| clientes | ✓ | — | últimos 5 |
| contratos | ✓ | — | últimos 5 |
| parcelas | ✓ | `SUM(saldoPendente)`, `SUM(valorPrevisto)` | últimos 5 |
| pagamentos | ✓ | `SUM(valor)` | últimos 5 |
| movimentacoesFinanceiras | ✓ | `SUM(valor)` | últimos 5 |
| historico_operacional | ✓ | — | últimos 5 |
| caixa_config / auditoria_caixa / gastos / fechamentos_semanais / snapshots_atraso / auth_tokens / anexos / leads / auditoria_modulos / auditoria_estornos / pagamento_parcelas | ✓ | somas aplicáveis | últimos 5 |

- [ ] Relacionamentos: órfãos = 0 (clientes→contratos→parcelas, contratos→pagamentos, pagamento_parcelas).
- [ ] Estado final pós-fix-ups históricos preservado (dataFinal preenchida, movimentações normalizadas, fantasmas deletados) — o copy preserva o estado atual do SQLite.

---

## Fase D — Infra & backup

### D1. Compose

- [ ] `docker-compose.prod.yml`: serviço `postgres:16-alpine`, volume `nxgestao_pgdata`, **sem porta exposta ao host** (rede interna), `healthcheck: pg_isready`.
- [ ] `docker-compose.yml` (dev): serviço postgres local.
- [ ] `.env` VPS (chmod 600): `DATABASE_URL=postgres://${PG_USER}:${PG_PASSWORD}@postgres:5432/nxgest` + `PG_USER`/`PG_PASSWORD` fortes.
- [ ] `.env.example` / `.env.production.example`: adicionar `DATABASE_URL`, `PG_USER`, `PG_PASSWORD`.

### D2. Backup (muda de WAL para pg_dump)

- [ ] `/opt/scripts/backup-nxgest.sh` (fora do repo, no VPS): `pg_dump -Fc` + validação (`pg_restore -l`) + retenção 14d + `uploads.tar.gz` mantido.
- [ ] `scripts/deploy.sh`: backup pré-deploy passa a chamar o `pg_dump`.
- [ ] `docs/engineering/06-PRODUCAO.md`: restauração vira `pg_restore`; rollback documentado; seção WAL removida/aposentada.

### D3. Docs

- [ ] `docs/engineering/01-DATABASE.md` (modelo físico PostgreSQL, tipagem).
- [ ] `docs/engineering/00-ARCHITECTURE.md` (substituição de banco, escalabilidade).
- [ ] `AGENTS.md` (stack: PostgreSQL + pg; comandos).
- [ ] `docs/engineering/TESTES.md` (smoke/CI contra PG).

---

## Fase E — Otimização de consultas

### E1. `listarCobrancasDoDia` (arquivo: `operacoes.repository.impl.ts`) — a query mais cara

Eliminar as 4 subqueries correlacionadas:

- [ ] `diasEmAtraso`: `(DATE ? - MIN(dataVencimento) FILTER (WHERE dataVencimento < ? AND saldoPendente > 0))` dentro do GROUP BY existente.
- [ ] `saldoTotal` / `totalPendente`: agregações `FILTER` no mesmo GROUP BY.
- [ ] `proximaParcela` / `proximoNumeroParcela`: **`LATERAL`** com índice parcial (PG suporta; SQLite não — momento ideal).
- [ ] Join de visitas: `date(h.createdAt,'localtime') = ?` → **range** `[inicio, fim)` em `createdAt` (usa índice `historico_operacional(userId, createdAt)`).
- [ ] Validar com `EXPLAIN ANALYZE` antes/depois no dump de produção.

### E2. N+1 admin/empresa

- [ ] `empresa.repository.impl.ts` (`listarEmpresas`, `findById` com stats): loops de `COUNT` por linha → **uma query** com `GROUP BY` + agregados por tabela, montando `Map` em memória.
- [ ] `admin.repository.impl.ts` (operadores/equipe/stats): mesmo padrão.

### E3. Busca de clientes

- [ ] `LIKE` → `ILIKE` (G7) em `cliente.repository.impl.ts`.
- [ ] Índice `pg_trgm` GIN em `clientes.nome` (Fase F) — medir antes/depois; volume pequeno → manter só `ILIKE` se o plano não justificar.

### E4. `cliente-financeiro` (4 queries por detalhe)

- [ ] Confirmar se o card de lista precisa do resumo. Hoje só o `ClienteDetail` consome → **não mexer** se confirmado; se a lista precisar, agregar numa query única batchada.

### E5. SELECT * e listas

- [ ] Listas (clientes, contratos, leads) retornarem só campos do caso de uso.
- [ ] Paginação: manter offset (volume atual pequeno); keyset documentado como evolução futura. `count()` + select mantido (2 queries, baratas no volume atual).

---

## Fase F — Índices (todos justificados por query real + EXPLAIN)

| Índice | Justificativa |
|---|---|
| `parcelas(contratoId, dataVencimento, saldoPendente, deletedAt)` **parcial** `WHERE saldoPendente > 0 AND deletedAt IS NULL` | cobrança do dia (inclui LATERAL) + financeiro + resumo contrato |
| `historico_operacional(userId, createdAt)` | visitas do dia (range) — já existe, revalidar |
| `usuarios(empresaId, role)` | escopo admin/super (joins empresaId) |
| `fechamentos_semanais(userId, dataInicio, dataFim)` **UNIQUE** | previne fechamento duplicado em liquidação concorrente (G14) — mesmo padrão do `snapshots_atraso` |
| `clientes(userId, nome)` + **GIN `pg_trgm`** | lista ordenada + busca `ILIKE` |
| `clientes(cpf, userId)` **parcial UNIQUE** `WHERE cpf IS NOT NULL AND deletedAt IS NULL` | dedup por operador (porta o índice parcial do SQLite) |
| `pagamentos(userId, data)` · `movimentacoesFinanceiras(userId, data)` · `gastos(userId, data)` · `fechamentos_semanais(userId, dataInicio)` | já existem — revalidar no PG |

Regra: criar → `EXPLAIN ANALYZE` antes/depois com o dump de produção. Nada por suposição.

### Medição (antes/depois — como mede o "depois")

- [ ] Ativar **`pg_stat_statements`** no container postgres para capturar top queries e tempo real no PG.
- [ ] Registrar tempo dos endpoints críticos (curl/`smoke-api`) em SQLite (baseline, Fase A) e no PG pós-cutover — mesma métrica, mesma amostra, mesmo ambiente.

---

## Fase G — Transações e concorrência

- [ ] **Reescrever `ContratoRepository.transaction` (G5):** de `sqlite.exec("BEGIN IMMEDIATE")` cru → `db.transaction(async (tx) => ...)` passando **repo ligado ao `tx`** (o construtor já aceita o drizzle; passar `tx`). Afeta: `CreateContrato`, `UpdateContrato`, `DeleteContrato`, `CreatePagamento`, `EstornarPagamento`.
- [ ] **G21 — `admin.editarOperador` (`admin.repository.impl.ts:116`):** `db.transaction((tx) => {...})` sem `await`/`return` → funciona hoje porque o better-sqlite3 é síncrono (commit dentro da chamada); no PG vira transação assíncrona **disparada e não aguardada** (o `findById` logo abaixo pode ler antes do commit + unhandled rejection). Corrigir: `return db.transaction(async (tx) => {...})` e `await` no caller.
- [ ] **G14 — concorrência exposta pelo pool:** começar o cutover com pool **conservador** (`max: 5–10`), subir com medição. Garantir sob concorrência:
  - `LiquidarSemana` — check-then-insert sem constraint única → fechamento duplicado em 2 requests simultâneos. Correção: **UNIQUE `fechamentos_semanais(userId, dataInicio, dataFim)`** + `ON CONFLICT DO NOTHING` (Fase F);
  - duplo clique de pagamento (`CreatePagamento`) e estorno duplo — guarda transacional real.
- [ ] Validar `db.transaction` de admin/empresa com o driver `pg` (transação real via pool client).
- [ ] Revisar sob concorrência: ajuste de caixa base (`updateCaixaBase` usa `sql` — validar atomicidade), fechamento semanal duplicado.
- [ ] **G4 — `numeric` volta como string no `pg`:** auditar leituras de dinheiro (`getSaldoAtual`, mappers `rowTo*`, caixa, dashboard) e aplicar `Number(...)`; atenção à aritmética JS sobre string.

---

## MCP — preparação futura (fora desta entrega)

A arquitetura deverá ficar preparada para uma futura camada de IA controlada, sem acesso direto e irrestrito ao banco:

```text
IA → MCP → Application Services → Repositories → PostgreSQL
```

Ferramentas futuras possíveis: `consultarResumoOperacional()`, `consultarClientesPendentes()`, `consultarSaldoCliente()`, `consultarHistoricoCliente()`. **Etapa em plano separado.**

## Fora de escopo

MCP funcional · chatbot · agente de IA · pgvector · busca semântica · alteração de regras de negócio · redesign de telas · novos módulos · host/datacenter (latência de rede ~120–180ms é outro problema) · tipar datas (`DATE/TIMESTAMPTZ`) · tipo `uuid` · booleans nativos.

---

## Fase H — Testes

- [ ] `npm test` (vitest) + `npm run build` + `audit:ui` + `audit:styles` + `audit:modules`.
- [ ] Portar `scripts/smoke-api.mjs` (250 cenários) e `scripts/seed-demo.mjs` para PG.
- [ ] Portar os **helpers de verificação direta** do `smoke-api.mjs` (`auditoriaCount`, `authTokensCount`, `inserirAuthToken` — hoje abrem o SQLite cru, G17) para um client `pg`.
- [ ] **Arquivar `scripts/fix-caixa.mjs`** (legado; importa `drizzle-orm/better-sqlite3` — quebra o build quando `database.ts` virar `pg-core`, G18).
- [ ] CI: `services: postgres` no job `smoke` (`.github/workflows/ci.yml`) — **somente após o fix de CI/docker estar na main** (já concluído).
- [ ] Fluxos obrigatórios (mapeando o P16 do rascunho): login/senha/token · cliente CRUD · contrato + geração de parcelas · pagamento + estorno · caixa (saldo, ajuste base, auditoria, fechamento) · operações (cobrança do dia, parcelas hoje/semana, visita, snapshot/histórico de atrasos) · gasto · admin (operadores, equipe, empresa modulos/capacidades, impacto de desativação) · leads/onboarding · anexos (paths em `/data/uploads`, validar FK).
- [ ] `npm run docs:audit` limpo.

---

## Fase I — Cutover (downtime curto) e rollback

0. **Dry-run:** ensaio completo cutover→rollback em staging/dev antes do cutover real (PG-10) — nunca testar o rollback pela primeira vez em produção.
1. Deploy do código com suporte a PG **sem** apontar `DATABASE_URL` (ainda no SQLite — sem risco).
2. Subir `postgres` no compose → rodar `migrate-sqlite-to-pg.mjs` → validar matriz (Fase C).
3. `stop app` → `up -d app` com `DATABASE_URL` → validar: health, login, rota do dia, lista clientes, admin/equipe.
4. **Rollback pronto:** reverter imagem (tag da anterior) + restaurar backup SQLite + voltar `DB_PATH`. Janela de dados perdidos pós-cutover: documentada e aceita (curta).
5. **Manter `better-sqlite3` no package.json** até o pós-cutover estabilizado (G15) — remoção vira limpeza posterior.

---

## Registro de gaps e riscos

| # | Gap/risco | Mitigação |
|---|---|---|
| G1 | Número PLAN-021 colide | virou PLAN-070 |
| G2 | Migrações caseiras no boot com seeds | separar migrations × seeds; fix-ups históricos já aplicados no fonte são preservados pelo copy |
| G3 | Semântica de TZ (`date(...,'localtime')` vs `getLocalDateString`) | verificar TZ do VPS (`date`); documentar premissa UTC; range query equivalente |
| G4 | `numeric` = string no `pg` | `Number(...)` em todas as leituras; auditar aritmética |
| G5 | Transaction crua `BEGIN IMMEDIATE` | reescrever com `db.transaction` ligado ao `tx` |
| G6 | `createdAt` com 2 formatos (`datetime('now')` sem `T`) | normalizar na migração; default DB removido |
| G7 | `LIKE` case-sensitive no PG (SQLite era insensitive) | `ILIKE` + pg_trgm |
| G8 | Ordenação/colation pode divergir | validar listas ordenadas no smoke |
| G9 | Backup/restore muda (WAL → pg_dump) | runbook + script VPS atualizados; validação embutida |
| G10 | `seed-demo`/`smoke-api` dependem de sqlite | portar para PG + CI com service container |
| G11 | `deploy.sh` pré-deploy chama backup antigo | ajustar para pg_dump |
| G12 | Conflito de arquivos com o fix de CI/docker | sequenciar: CI primeiro, depois este plano em branch própria |
| G13 | **18 chamadas `.run()`/`.get()`** (API drizzle SQLite-only) em 5 arquivos (lead, auth-token, auditoria-modulos, empresa, admin) | remover no port — `pg-core` retorna no `await`; gate `tsc` + `rg "\.(run\|get)\(\)" src` |
| G14 | Pool PG expõe concorrência que o SQLite mascarava (fechamento duplicado, pagamento/estorno duplos) | UNIQUE `fechamentos_semanais(userId, dataInicio, dataFim)` + `ON CONFLICT DO NOTHING`; guardas transacionais; pool conservador (`max: 5–10`) no cutover |
| G15 | `better-sqlite3` ainda necessário (migração, backups `.db`, rollback) | **não remover** do package.json até pós-cutover estável |
| G16 | npm workspaces ativo (root `workspaces: ["frontend"]`) | `npm i pg` no root; drizzle-kit config no root |
| G17 | `smoke-api.mjs` abre o SQLite cru (3 helpers: `auditoriaCount`, `authTokensCount`, `inserirAuthToken`) + boot via `DB_PATH` | helpers → client `pg`; boot via `DATABASE_URL` |
| G18 | `seed-demo.mjs` (INSERTs crus) precisa port completo; `fix-caixa.mjs` legado quebra build | port do seed; **arquivar** fix-caixa |
| G19 | `getSaldoAtual` interpola data na string SQL (`'${dataInicio}'`) | parameterizar (`$N`) no port |
| G20 | `impacto-desativacao`: `?` + `date()` + 7 blocos crus com módulos fixos | reescrita com `$N`; range de data; manter allowlist de módulos (sem interpolação de usuário) |
| G21 | `admin.editarOperador`: `db.transaction` **sem `await`** (transação assíncrona disparada e não aguardada no PG) | `return db.transaction(async (tx) => ...)` + `await` no caller |
| G22 | Binding `?` → `$1..$N` em todas as queries cruas portadas (operacoes 13, caixa, cliente-financeiro 4, impacto 7, contrato 2) | tabela B5; padronizar no port |

---

## CTs novos (Dado/Quando/Então)

- **PG-01** Migração de dados — Dado dump de produção | Quando roda `migrate-sqlite-to-pg` e a matriz de validação | Então contagens, somas e amostras idênticas origem×destino (órfãos = 0).
- **PG-02** Formato de data — Dado registros criados por `datetime('now')` | Então `createdAt` no PG segue o mesmo formato ISO com `T` do restante (ordenação lexical consistente).
- **PG-03** Busca case-insensitive — Dado cliente "João" | Quando busca `jao` | Então retorna o cliente (ILIKE preserva o comportamento do SQLite).
- **PG-04** Cobrança do dia sem subqueries — Dado o dump de produção | Quando `EXPLAIN ANALYZE` da query de cobranças | Então sem scans correlacionados; usa os índices parciais.
- **PG-05** N+1 admin — Dado lista de empresas com stats | Quando `GET /api/admin/empresas` | Então número de queries SQL por request é constante (não cresce com N empresas).
- **PG-06** Transação do contrato — Dado criação de contrato que falha na geração de parcelas | Então rollback completo (sem contrato órfão nem parcelas parciais).
- **PG-07** Monetário — Dado leitura de `numeric` | Então valor retorna como número (não string) nos mappers.
- **PG-08** Isolamento multi-tenant — Dado operador da empresa A | Quando acessa listas | Então nenhum registro da empresa B aparece (regressão do smoke).
- **PG-09** Backup/restore — Dado `pg_dump` do dia | Quando `pg_restore` em banco vazio + validação | Então banco íntegro e health ok.
- **PG-10** Rollback — Dado pós-cutover com problema | Quando reverte imagem + restaura SQLite | Então app volta a servir do SQLite sem perda estrutural (ensaio feito em staging antes).
- **PG-11** Transação do operador — Dado edição de operador com rebaixamento + reassign | Quando `PATCH /api/admin/operadores/:id` | Então todas as escritas confirmam juntas; sem estado parcial e sem leitura pré-commit (G21).
- **PG-12** Liquidação concorrente — Dado dois requests simultâneos de liquidar semana | Então exatamente um fechamento é criado (UNIQUE + `ON CONFLICT DO NOTHING`, G14).

---

## Ordem de execução (uma fase por vez)

```text
0. ✅ Concluído: fix de CI/docker na main (95d3a53, df6bb18) — pré-requisito atendido (G12)
 ↓
A. Baseline (dump de produção + medições)
 ↓
B. Schema PostgreSQL (pg-core + migrations + portas de SQL)
 ↓
C. Migração dos dados + validação (matriz)
 ↓
D. Infra & backup (compose, pg_dump, runbook)
 ↓
E. Otimização de consultas (cobranças do dia, N+1, ILIKE)
 ↓
F. Índices justificados
 ↓
G. Transações e concorrência
 ↓
H. Testes (vitest + smoke no PG + CI)
 ↓
I. Cutover + rollback
```

---

## Critérios de aceitação

**Banco:** PG funcionando como banco principal · schema reproduzível por migrations · dados migrados e validados (matriz) · relacionamentos preservados.
**Performance:** cobrança do dia sem subqueries correlacionadas · N+1 admin/empresa corrigido · índices justificados por `EXPLAIN ANALYZE` · ILIKE + pg_trgm medidos.
**Segurança:** isolamento por empresa validado · nenhuma consulta operacional acessa dados de outra empresa · operações sensíveis em transações · `editarOperador` transacional (G21) · liquidação concorrente sem duplicação (G14).
**Qualidade:** smoke 250/250 verde no PG · `docs:audit` 0 divergências · nenhuma regra de negócio alterada acidentalmente · rollback testado.

---

## Entrega final

```text
PostgreSQL
    ├── Schema consistente (pg-core)
    ├── Migrations reproduzíveis (drizzle-kit)
    ├── Dados migrados e validados
    ├── Índices adequados (justificados)
    ├── Queries revisadas (sem N+1 nem subqueries correlacionadas)
    ├── Transações adequadas (db.transaction)
    ├── Isolamento multi-tenant
    └── Performance medida (antes/depois)
```

Próxima evolução (plano separado): camada MCP sobre os Application Services, sem acesso direto ao banco.
