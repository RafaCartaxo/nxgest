# HANDOFF — 13/08/2026 — Banco (SQLite → PostgreSQL) + e-mail

**De:** sessão de banco/dados (PLAN-070 + PLAN-071 + batch de produto)
**Para:** próxima sessão / outro agente
**Projeto:** NX Gest (`RafaCartaxo/nxgest`) — VPS único, MVP, sem clientes reais.

---

## 1. Contexto

Objetivo da sessão: migrar o banco de **SQLite → PostgreSQL** com boas práticas, e tratar deliverability de e-mail. **Hoje: app 100% PostgreSQL em produção e staging, CI/CD verdes.**

## 2. O que foi entregue

### PLAN-071 (e-mail) — commitado (`d19540c`)
- Display name "NX Gest" · `MAIL_PROVIDER` real (`console|resend|fail`) · **dev nunca envia** (regra dura) · `reply_to` · assuntos menos phishing · compose passthrough · testes 11.

### PLAN-070 (SQLite → PostgreSQL) — completo, em produção
| Fase | Entrega |
|---|---|
| Baseline | Dump real de prod; gate go/no-go: **DB <1ms, gargalo = rede (~500ms)** |
| B | Schema `pg-core` (19 tabelas) · port de repos · G13/G21/G5 · money/date |
| C | `migrate-sqlite-to-pg` + **matriz de validação** (contagens/somas/amostras/órfãos=0) no dump real |
| D | Compose `postgres` (prod/staging/dev) · backup `pg_dump` · `UPLOADS_DIR` |
| H | CI com `services.postgres` · staging em PG · seed com `node` puro |
| Revisão | **Atomicidade pagamento/estorno** (tx cobrindo contrato+pagamento) · **timezone** (range do dia local; VPS = EDT) · runbook |
| E/F/G | ILIKE (busca case-insensitive) · **anti-N+1** admin/empresa · `pg_trgm` GIN · guarda do fechamento (UNIQUE) |
| Cutover | Janela: backup SQLite fresco → migração → `pg_restore` → deploy · **dados preservados** |
| Débitos 1–3 | Timestamps `TIMESTAMPTZ` · **snake_case** total · node 20 (`.nvmrc`) |

### Batch pós-migração — deployado (`199a904`)
- **KPI "Lucro Realizado"** no detalhe do cliente (contratos quitados) · **tema "Violeta"** (rename `aurora`→`violeta` + migração de storage) · refactor de caixa · docs (PLAN-072/074/075, STATUS, CHECKLIST).

## 3. Estado atual (verificado ao vivo)

- **Produção:** `nxgest.com.br` → PG `db:connected` · **0 erros** · app up · postgres healthy.
- **Staging:** `nxgestao.duckdns.org` → PG.
- **Modelo final:** snake_case · `numeric(12,2)` (money) · `DATE` (date-only) · `TIMESTAMPTZ` (timestamps) · **16 FKs** · índices (parcial, pg_trgm).
- **Dados prod:** 8 usuários · 3 empresas · 14 clientes · 14 contratos · 278 parcelas · 33 pagamentos.
- **CI/CD:** verdes · smoke **250/250** · vitest **91/91** · build · docs:audit 0.

## 4. Decisões

- Migração como **escala/hardening** (não-performance — o DB não era o gargalo).
- Manter host atual (latência/rede adiada) · **MCP = plano futuro** (fora) · **K8s/load balancer = ainda não** (MVP + VPS único).
- money `numeric(12,2)` via custom type · datas date-only `DATE` · timestamps `TIMESTAMPTZ` · snake_case total.
- `better-sqlite3` mantido como devDep (rollback manual) até estabilizar.

## 5. Pendências

| # | Item | Estado |
|---|---|---|
| P1 | Estabilização (monitorar prod) | em curso |
| P2 | **CI — teste de migração** | ⏳ próximo (item 2 do plano 13/08) |
| P3 | Limpeza SQLite residual (better-sqlite3 + `gestao.db` legado) | após estabilizar |
| P4 | Node 20 local (`nvm use`) | ação do Rafael |
| P5–P7 | E-mail: display name em prod + DMARC (`rua=`→`quarantine`) + deliverability | **com o Rafael (outro chat)** |
| P8 | KPI Lucro Realizado | ✅ concluído |

## 6. Operação

- **Backups PG:** `/opt/backups/v2-prod.dump` (pós-débitos), `pre-modelo-prod.dump` (pré-modelo) · cron 12h (`pg_dump`) · **off-site criptografado pendente**.
- **Rollback PG→SQLite:** `/opt/backups/gestao-precutover-*.db` + restore de `.env` + imagem anterior.
- **Infra:** VPS `172.245.152.223` · compose prod/staging com postgres interno (sem porta exposta) · Caddy.

## 7. Próximos passos (execução em andamento na própria sessão)

1. **Teste de restore do PG** — `pg_dump` fresco de prod → PG descartável local → `pg_restore` → validar matriz. Garantia de recuperação de desastre.
2. **CI — teste de migração (P2)** — job que roda `create-schema` → `migrate-modelo` → valida invariantes do modelo (snake, TIMESTAMPTZ, numeric, FKs, índice parcial).
3. Observabilidade (`pg_stat_statements`) — **descartado** (risco agora menor que antes; BD mais saudável).
