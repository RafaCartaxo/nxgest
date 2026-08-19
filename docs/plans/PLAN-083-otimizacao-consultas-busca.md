# PLAN-083 — Otimização de consultas, round trips e busca

**Status:** 🔵 Em execução (19/08) — Fases 1–6 concluídas e validadas (smoke 274/274 + CTs novos); Fases 7–9 pendentes

**Versão:** 1.0

**Início:** 18/08/2026

**Origem:** demanda do Rafael — *"as consultas precisam ser otimizadas, como elas são feitas e retornadas. Do jeito que está, não dá."* Refina o PLAN-077 (destravou o sintoma) e questiona o gate do PLAN-070 ("banco não é o gargalo, é a rede").

---

## Tese central

O PLAN-070 mediu o **tempo de execução** da query mais cara (0,42 ms no dump de 500 registros) e concluiu que a lentidão era rede (VPS nos EUA → Brasil, ~400–500 ms). A conclusão está certa **mas incompleta**: com latência alta, o custo dominante por request não é o tempo de CPU do banco — é o **número de round trips** (viagens VPS↔Brasil). Cada query é uma viagem.

Duas consequências práticas:

1. **12 queries = 12 viagens.** `GET /caixa/status` faz 12 queries; `GET /api/admin/dashboard` faz 8. Dois usuários abrindo caixa + admin ao mesmo tempo disparam 20 queries concorrentes contra um pool `max:10` — a 11ª conexão espera `connectionTimeoutMillis` (5s) e falha. É o sintoma "sistema travado" documentado no PLAN-077, agora com causa estrutural explicada.
2. **Reduzir queries/request reduz a latência percebida sem migrar o VPS.** 12→5 queries em caixa é 7 viagens a menos (~7×400ms em sequência). A migração de host (datacenter BR) continua sendo um plano separado e complementar.

**Regra de ouro desta entrega (herdada do PLAN-077): nenhum endpoint muda de shape.** Otimização transparente, validada por smoke + comparação de resultado.

---

## Fase 0 — Baseline (medido 18/08, PG local `nxgest-pg-dev` com dados reais)

Volume local: 201 clientes · 204 contratos · 3.968 parcelas · 1.371 pagamentos · 1.609 movimentações · 29 usuários.

| # | Query / endpoint | Achado (EXPLAIN ANALYZE) | Execução local |
|---|---|---|---|
| 1 | Cobrança do dia (query principal) | `SubPlan 1` (subquery correlacionada `saldo_total`) executado **10×** (1× por contrato) · `Seq Scan on parcelas` varrendo 1.096 linhas para 72 usadas | 5,97 ms |
| 2 | Indicadores cobrança (aReceberHoje/atrasado/aVencer) | 3 varreduras quase idênticas (`Seq Scan on contratos` cada) | 0,23–0,30 ms cada |
| 3 | `listMovimentacoes` | **5 SubPlans** correlacionados por linha (`SubPlan 4` loops=16 em pagamentos; subquery de gasto com `Seq Scan`) | 1,69 ms |
| 4 | `listarPagamentosDoDia` | `SubPlan 1` (array_agg correlacionado) por pagamento | 0,14 ms |
| 5 | Login (`lower(email)`) | **`Seq Scan on usuarios`** — `lower()` na coluna impede o índice `idx_usuarios_email` | 0,07 ms |
| 6 | Admin count por role | `Seq Scan` (ok em 29 usuários; não escala) | 0,05 ms |
| 7 | `cliente-financeiro` atraso | usa `idx_parcelas_venc_partial` (parcial ok) | 0,20 ms |

**Leitura:** os tempos de execução são irrelevantes no volume atual (<6 ms) — confirma o PLAN-070. O problema é **estrutural** (subqueries correlacionadas por linha, seq scans em colunas não-sargáveis) e de **round trips por request** (caixa 12, dashboard 8, cliente-find 8, cobrança 7). Os dois primeiros escalam com os dados; o último é o custo dominante já hoje na rede.

### Contagem de queries por request (estado atual)

| Endpoint | Queries/request | Após Fase 1/2 | Redundância identificada |
|---|---|---|---|
| `GET /caixa/status` | **12** | **6** | `getSaldoAtual` + `getLucro` = 4 SUMs onde 1 `GROUP BY tipo` basta · `getRecebidoSemana`+`getGastoSemana` = 2 queries onde 1 `GROUP BY origem` basta · `caixa_config` lida 3× |
| `GET /api/admin/dashboard` | **8** | **2** | 3 COUNTs de `usuarios` por role (→ 1 `FILTER`) · 2 SUMs de `movimentacoes_financeiras` (→ 1 `GROUP BY tipo`) |
| `GET /operacoes/cobrancas` | **7** | **2** | subquery `saldo_total` por linha + 4 indicadores separados (→ 1 query `FILTER`) + snapshot gravado em todo GET (removido — Fase 1.4) |
| `GET /api/clientes/:id` | **8** | **6** | `sumLucroPorEstado` ×2 quase idênticas (→ 1 `GROUP BY estado`) · atraso/venceHoje em 2 scans (→ 1 `FILTER`) · queries em série (→ paralelizar) |
| `GET /api/caixa/movimentacoes` | 2 + subscans | **2** (Fase 2) | 5 subqueries correlacionadas por linha (→ LEFT JOINs) + `COUNT` separado (→ `COUNT(*) OVER()` na Fase 4.4) |
| `PATCH /api/admin/operadores/:id` | **~20** | **~8** (Fase 2) | `findById` (4 queries com counts) repetido 4× no mesmo request (→ `getOperadorContexto` 1 query + reuso) |
| `POST /api/contratos` | 4 + N | **4 + 1** (Fase 3) | 1 INSERT por parcela (→ 1 bulk insert) |
| `POST /api/pagamentos` | 4 + 2N | **4 + 2** (Fase 3) | UPDATE + INSERT por parcela em loop (→ `UPDATE ... FROM (VALUES)` + bulk) |
| `POST /api/estornos` | 2 + N | **2 + 1** (Fase 3) | N UPDATEs em loop (→ `UPDATE ... FROM (VALUES)`) |

---

## Fase 1 — Consolidar agregados por request (backend)

Objetivo: cortar o número de viagens nos endpoints mais quentes. Nenhuma mudança de shape.

### Executado em 18/08 (validado em runtime contra PG local)

| Item | Antes | Depois | Como |
|---|---|---|---|
| **1.1 `caixa/status`** | 12 | **6** | `getFluxoConsolidado` (1 query `SUM(...) FILTER` em `movimentacoes_financeiras`) substitui `getSaldoAtual`(2)+`getLucro`(2)+`getRecebidoSemana`(1)+`getGastoSemana`(1). Mantidos: `caixa_config`, `ultima_liquidacao`, `getAReceberHoje`, `getRecebidoHoje`, `getVendasSemana`. Métodos antigos do port **preservados** (LiquidarSemana + testes continuam usando-os). |
| **1.2 `admin/dashboard`** | 8 | **2** | 5 contagens de dados (clientes/contratos/entradas/saídas/recebido) → 1 query com subselects não-correlacionados (todas escopam por `user_id`); 3 COUNTs por role → 1 `COUNT(*) FILTER (WHERE role=...)`. Escopos `userId`/`empresaId`/subárvore testados. |
| **1.3 Cobrança do dia** | 5 | **2** | Subquery correlacionada `saldo_total` (1 scan/contrato na query principal) removida → agregada por `GROUP BY contrato_id`; 4 indicadores (aReceberHoje/atrasado/aVencer/recebidoHoje) → 1 query com `SUM(...) FILTER` + subselect `recebido_hoje`. |
| **1.4 Snapshot de atraso** | +2 em todo GET | **0 no GET** | `registrarSnapshotAtraso` saiu do `ListarCobrancasDoDiaUseCase` (era escrita em leitura) e passa a rodar **sob demanda** no `ListarHistoricoAtrasosUseCase` (mesma rede de segurança try/catch). Upsert `ON CONFLICT (user_id, data)` mantém 1 registro/dia. O dado não é exibido em nenhuma tela hoje (rota só no manifest) — QP-09 sem regressão. |
| **1.5 `clientes/:id`** | 8 | **6** (3 janelas) | `sumLucroPorEstado` ×2 → 1 query `FILTER`; atraso+venceHoje → 1 scan com `FILTER`; `countByClienteId`/`sumByClienteId`/`resumoByClienteId` agora em `Promise.all` (eram séries) → o endpoint cai de 8 round trips sequenciais pra ~3. |

Detalhe de implementação: parâmetros de data com cast explícito `?::date` (o `OR ? IS NULL` sem cast faz o PG falhar com `42P18 could not determine data type of parameter`).

### Restante da Fase 1 (pendente)

- Nada — Fase 1 concluída.

## Fase 2 — Eliminar N+1 / subqueries correlacionadas restantes

### Executado em 18/08 (validado em runtime contra PG local)

| Item | Antes | Depois | Como |
|---|---|---|---|
| **2.1 `listMovimentacoes`** | 2 + ~5 SubPlans/linha | **2, sem SubPlan** | `CASE` com 5 subqueries correlacionadas (cliente_nome por origem + categoria) → LEFT JOINs (`pagamentos`→`contratos`→`clientes`, `contratos`→`clientes`, `gastos`) com `COALESCE(cl_pg.nome, cl.nome)` reproduzindo o fallback pagamento→contrato do 'Cancelamento'. `COUNT` separado permanece (fusão `OVER()` é Fase 4.4). |
| **2.2 `listarPagamentosDoDia`** | 1 + SubPlan/linha | **1, sem SubPlan** | `array_agg` correlacionado → `LEFT JOIN pagamento_parcelas + parcelas` + `GROUP BY` com `array_agg(...) FILTER (WHERE par.id IS NOT NULL)` (mantém `'{}'` p/ pagamento sem parcelas). |
| **2.3 `PATCH operadores/:id`** | **~20** | **~8** | `findById` (4 queries) rodava 4× no mesmo request (controller, use case, update-entrada, update-saída). Novo `getOperadorContexto` (1 query — linha de `usuarios`, sem counts/convite) usado por controller/use case/`validarChefe`; `update()` aceita `existing` opcional e pula o reload. `findById` permanece só na resposta final (shape completo). Medido via contador no pool: ~17 → ~6 (excl. transação, que usa client dedicado). |

Detalhe de implementação (2.1): os JOINs **não** filtram `deleted_at` (espelham as subqueries originais), exceto `gastos` que já tinha `g.deleted_at IS NULL` na subquery.

### Restante da Fase 2 (pendente)

- Nada — Fase 2 concluída.

## Fase 3 — Bulk operations

### Executado em 19/08 (validado em runtime + smoke 274/274)

| Item | Antes | Depois | Como |
|---|---|---|---|
| **3.1 `CreateContrato`/`UpdateContrato`** | 1 + N INSERTs | **1 INSERT bulk** | `saveParcela` → `saveParcelas(userId, Parcela[])` no port/impl: `db.insert(parcelas).values([...])` num statement. CreateContrato com 90 parcelas: ~92 queries → ~6 (medido: o pool reporta 2 pré-tx; o loop virou 1 statement dentro da tx). Fecha o débito adiado do PLAN-077. |
| **3.2 `CreatePagamento`** | 4 + 2N (UPDATE+INSERT por parcela) | **4 + 2** | Loop → `updateParcelasEmLote` (1 `UPDATE ... FROM (VALUES)` com casts `::numeric`/`::date`/`::timestamptz` por valor — gotcha: o alias do VALUES não aceita tipos no PG, e sem cast o PG infere `text` e falha com "column ... is of type numeric but expression is of type text") + `savePagamentoParcelas` (1 bulk INSERT). |
| **3.3 `EstornarPagamento`** | 2 + N UPDATEs | **2 + 1** | Loop de `updateParcela` → 1 `updateParcelasEmLote`. |

Detalhe de implementação: o `UPDATE ... FROM (VALUES)` roda via `this.drizzle.execute(sql\`...\`)` — **não** via `rawQuery`, que usa o pool global e ficaria fora da transação (os repos dentro de `transaction()` recebem o client da tx).

## Fase 4 — Dados retornados (como as listas "retornam")

### Executado em 19/08 (validado em runtime + smoke 274/274 + tsc + 154 testes + docs:audit)

| Item | Antes | Depois | Como |
|---|---|---|---|
| **4.1 `usuarios` sem `senha_hash`** | `db.select()` traz o hash em toda listagem/operador | hash **nunca trafega** | Projeção `colunasUsuarioPublicas` (colunas públicas explícitas) + `ativo` derivado no PG (`CASE WHEN senha_hash IS NOT NULL THEN true ELSE false END`) em `findAllOperadores`/`findById`/`findByEmail`/`getOperadorContexto`/`listEquipe` (admin). `auth.login` preserva o hash (necessário pra verificação). |
| **4.2 `anexos.listByCliente` sem `caminho`** | `db.select()` trazia o path físico | path não sai da API | Projeção explícita (id/nome/tipo/mime/tamanho/createdAt); `findById` (download) mantém o select completo. |
| **4.3 `leads.list` paginado** | retornava a tabela inteira, sem limite | `{ data, pagination }` com `LIMIT`/`OFFSET` | 1 query com `COUNT(*) OVER()`; controller parseia `page` (default 1) / `limit` (default 50, máx 100); frontend com botões Anterior/Próximo (`leads.service.ts` + `LeadsAdminPage`) + i18n pt/en/es. |
| **4.4 `COUNT(*)` → `COUNT(*) OVER()`** | count separado por listagem (2 queries) | 1 query por listagem | Fusão do total no SELECT paginado de `listMovimentacoes` e `listAuditoriaCaixa` (caixa) — 1 round trip a menos em cada. |

### Restante da Fase 4 (pendente)

- Nada — Fase 4 concluída.

## Fase 5 — Índices

### Executado em 19/08 (validado em runtime + EXPLAIN + smoke 274/274)

| Item | Antes | Depois | Como |
|---|---|---|---|
| **5.1 Índice funcional `lower(email)`/`lower(email_pendente)`** | `Seq Scan` no login e no dedup (`lower()` na coluna impede o uso do btree comum) | índice funcional disponível | 2 `CREATE INDEX` não-parciais no `runMigrations` (`idx_usuarios_email_lower` + `idx_usuarios_email_pendente_lower`). **Não-parciais de propósito**: o login NÃO filtra `deleted_at` (a validação de soft-delete é posterior no fluxo), então um índice parcial não seria usado. EXPLAIN com `enable_seqscan=off` confirma: login → `Index Scan using idx_usuarios_email_lower`; dedup OR → `BitmapOr` (ambos os índices). No volume atual (29 usuários) o planner segue preferindo Seq Scan (custo menor em tabela minúscula) — o índice entra em ação quando a tabela cresce. |
| **5.2 Cobertura validada** | — | confirmado | `idx_parcelas_venc_partial`: **`Index Only Scan`** confirmado no financeiro/atraso (cobre os LATERALs) · `idx_clientes_nome_trgm`: existe e é usado com `enable_seqscan=off` (`Bitmap Index Scan` na busca ILIKE) — em 201 clientes o planner prefere Seq Scan; muda em volume e a Fase 6 substituirá por índice funcional `unaccent`. |

### Restante da Fase 5 (pendente)

- Nada — Fase 5 concluída.

## Fase 6 — Busca com acentuação e cenários

### Executado em 19/08 (validado em runtime + EXPLAIN + smoke 274/274 + CTs novos)

| Item | Antes | Depois | Como |
|---|---|---|---|
| **6.1 Busca sem acento em `clientes.nome`** | `nome ILIKE %x%` — não achava "joao" em "João", sem índice | `f_unaccent(nome) ILIKE '%' \|\| f_unaccent(termo) \|\| '%'` | `CREATE EXTENSION unaccent` + wrapper `f_unaccent(text)` `IMMUTABLE STRICT PARALLEL SAFE` + `idx_clientes_nome_unaccent_trgm` (GIN funcional) no `runMigrations`. `f_unaccent('João Gomes Açaí')` → `Joao Gomes Acai`. EXPLAIN com `enable_seqscan=off` confirma o GIN (no volume atual o planner prefere Seq Scan — mesmo caso da Fase 5). |
| **6.2 Busca por CPF / telefone / comércio** | inexistente (só nome) | coberto pelo multi-campo | `f_unaccent` não altera dígitos → CPF/telefone por substring também funcionam. **Normalização de dígitos (máscara) fica como evolução** (backlog do plano). |
| **6.3 Busca em leads** (nome/empresa/email/telefone) | só filtro por status | `?q=` sem acento + status + paginação | `ListLeadsParams.q`; OR `f_unaccent(nome_responsavel/empresa/email/telefone)`; controller parseia `q`; frontend `LeadsAdminPage` + `SearchBar` (debounce 300ms, reseta página) + `leads.service.listarLeads(q, status, page, limit)`. |
| **6.4 Multi-campo no `ListClientes`** | só `nome` | `?q=` OR em nome/comércio/cpf/telefone/telefone_comercio | `findClientesQuerySchema` + `q`; `ClienteRepository.findAll` OR com `f_unaccent`; `nome` mantido (back-compat, agora sem acento); frontend `ClienteList` migra pro `q`. |

### CTs novos (smoke)

- **BUS-PREP** cria clientes de busca · **BUS-UNACCENT** (`?q=joao` e `?q=João` acham "João Gomes") · **BUS-MULTI** (`?q=acai` por comércio, `?q=<CPF>` por CPF) · **LD-BUS** (`?q=` por nome/email em leads, mantendo status + paginação).

### Restante da Fase 6 (pendente)

- Nada — Fase 6 concluída.

## Fase 7 — Consistência transacional

- **7.1 `rawQuery` fora da transação:** `ContratoRepository.getSaldoAtual` usa `rawQuery` (pool direto) e é chamado **dentro** de `CreateContratoUseCase.repository.transaction` — a leitura de saldo que valida `SaldoInsuficienteError` roda em outra conexão, fora da transação. Corrigir com variante transacional (`tx` ligado à conexão).

## Fase 8 — Frontend (parceria — não re-golpear o backend otimizado)

- **8.1 React Query nas telas operacionais** (Dashboard/Cobranças/Atendidos/Rota): cache + dedup + staleTime curto + invalidação direcionada pós-mutação. Hoje o React Query só existe no devboard; o resto é fetch manual em `useEffect` com zero cache.
- **8.2 Cooldown no `visibilitychange`** (4 páginas re-disparam 2–3 requests a cada volta à aba).
- **8.3 Remover requests inúteis:** `GastoPage` (request descartado) · `CaixaPage` seções colapsadas · `ContratoDetail.getCliente` (redundante — `contrato.clienteNome` já vem) · `OperadorDetail.listOperadores` no mount (só para modal sob demanda) · dropdown de clientes sob demanda no `ContratoList`/`ContratoNovo`.

## Fase 9 — Verificação final

- `npx tsc --noEmit` · `npm run build` · `npm test` · `npm run smoke:api` (PG isolado, node 20) · `audit:styles`/`audit:ui`/`audit:modules` (se UI mudou) · `npm run docs:audit` (SKILL-009, matriz de propagação).
- Re-medir: contagem de queries/request por endpoint (tabela da Fase 0) + `EXPLAIN` da cobrança do dia sem `SubPlan`.
- CHECKLIST diário (`docs/engineering/tasks/2026-08-18/CHECKLIST-PLAN083.md`) + docs propagadas (02-API se houver mudança de rota; 07 CASOS DE USO se comportamento).

---

## CTs novos (Dado/Quando/Então)

- **QP-01** `GET /caixa/status` — Dado qualquer operador | Quando dispara o endpoint | Então executa ≤6 queries SQL (instrumentação) com shape idêntico.
- **QP-02** `GET /api/admin/dashboard` — Dado um admin | Quando dispara | Então executa ≤2 queries com shape idêntico.
- **QP-03** Cobrança do dia — Dado `EXPLAIN` da query principal | Então não há `SubPlan` correlacionado por linha (apenas subselects/LATERAL não-correlacionados) e o resultado é idêntico.
- **QP-04** `POST /api/contratos` com 90 parcelas — Então 1 statement bulk de INSERT (não N round trips) e resultado idêntico.
- **QP-05** `listMovimentacoes` — Então `EXPLAIN` sem subquery correlacionada por linha; paginação e shape idênticos.
- **QP-06** `GET /api/leads` — Então retorna paginado (LIMIT) com shape do payload preservado.
- **QP-07** Login — Então `EXPLAIN` usa o índice funcional `lower(email)` (`Index Scan`, sem `Seq Scan`) e o fluxo de login/dedup segue idêntico.
- **QP-08** Shape — Dado `smoke:api` (274 cenários) + comparação de payloads dos endpoints alterados | Então 0 divergências.
- **QP-09** Snapshot de atraso — Dado GET de cobranças sem disparar snapshot | Então o histórico de atrasos continua sendo registrado no fluxo correto (fechamento/sob demanda), sem regressão do dado exibido.
- **QP-10** Frontend — Dado navegação Dashboard→Cobranças→Rota | Então `/operacoes/cobrancas` e `/operacoes/pagamentos-hoje` não são re-buscados em duplicidade (cache React Query; network tab).
- **QP-11** Busca sem acento — Dado cliente "João Gomes" | Quando busca `joao` | Então retorna o cliente (e `João` busca `joao` também).
- **QP-12** Busca multi-campo — Dado cliente com comércio "Padaria Açaí" | Quando busca `acai` ou parte do CPF/telefone | Então retorna o cliente.

---

## Backlog documentado (fora desta entrega)

- **Busca fuzzy** (tolerância a erro de digitação — `pg_trgm similarity`/`%`): média-alta dificuldade, exige calibrar threshold + UX de ranking. **Decidido em 18/08: não entra.**
- Migração de host/datacenter BR (latência de rede) — plano separado (complementar, não substitui isto).
- Índice de dígitos para CPF/telefone (normalização) — se o volume crescer além do ILIKE.
- Busca full-text (tsvector) em descrições — não recomendada para o domínio.

---

## Decisões

- **Métrica:** queries/request (round trips) é a métrica de sucesso — não ms de execução do banco (já provado irrelevante no volume atual).
- **Transparência:** nenhum endpoint muda de shape (herdado do PLAN-077); smoke 274 é o guarda-corpo.
- **Um plano, fases commitáveis à parte:** backend (Fases 1–7) primeiro; frontend (Fase 8) como fase final parável — evita fragmentar em dois planos sem comprometer o backend.
- **Snapshot fora do GET** é mudança de comportamento de efeito colateral — tratada com CT dedicado (QP-09).
- **Busca sem fuzzy** — escopo travado com o Rafael em 18/08 (baixa/baixa-média apenas).

---

## Critérios de aceitação

- Nenhum endpoint alterado de shape (smoke 274 + comparação de payloads).
- Contagem de queries/request reduzida: caixa ≤5 · dashboard ≤4 · cobrança do dia ≤4 (sem snapshot no GET) · cliente-find ≤4.
- `EXPLAIN` da cobrança do dia sem subquery correlacionada; login sem `Seq Scan`.
- Bulk inserts no lugar dos loops de contrato/pagamento/estorno.
- Busca sem acento + multi-campo funcionando (QP-11/12).
- `docs:audit` 0 divergências; CHECKLIST do dia preenchido.