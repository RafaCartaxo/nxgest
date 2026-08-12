#!/usr/bin/env node
/**
 * Migração de MODELO v2 (PLAN-070 — "deixar o banco redondo"):
 * ajusta um PostgreSQL existente para o modelo final:
 *
 *  1. RENAME COLUMN: todas as colunas camelCase -> snake_case (algorítmico).
 *  2. timestamps  TEXT -> TIMESTAMPTZ  (created_at/updated_at/deleted_at/expira_em/usado_em/convertido_em/descartado_em).
 *  3. dinheiro    (double precision) -> NUMERIC(12,2)  [já aplicado na v1 — idempotente].
 *  4. datas       date-only TEXT -> DATE               [idempotente].
 *  5. FKs + extension pg_trgm + índice parcial das parcelas (idempotente).
 *
 * Roda com `node` no container de runtime (pg puro, sem TS/tsx):
 *   docker exec nxgestao-app-1 node scripts/migrate-modelo.mjs
 * (a imagem copia `scripts/` e tem `pg`; DATABASE_URL do container aponta para o postgres interno)
 *
 * Idempotente. Exit 0 = ok · Exit 1 = falha (ex.: data fora de 'YYYY-MM-DD' antes do cast).
 */
import pg from "pg"

const { Pool, types } = pg
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)))
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)))
types.setTypeParser(1082, (v) => (v === null ? null : v))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://nxgest:nxgest-dev@localhost:5433/nxgest",
  max: 5,
})

const snake = (n) => n.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").toLowerCase()

const DATE_COLS = {
  movimentacoes_financeiras: ["data"],
  parcelas: ["data_vencimento", "data_quitacao"],
  contratos: ["data_inicio"],
  gastos: ["data"],
  pagamentos: ["data"],
  fechamentos_semanais: ["data_inicio", "data_fim"],
  snapshots_atraso: ["data"],
  historico_operacional: ["data_promessa"],
  auditoria_caixa: ["data"],
  auditoria_estornos: ["data"],
}

const MONEY_COLS = {
  contratos: ["valor_base", "percentual_juros", "valor_final"],
  parcelas: ["valor_previsto", "valor_pago", "saldo_pendente"],
  movimentacoes_financeiras: ["valor"],
  caixa_config: ["caixa_base"],
  auditoria_caixa: ["valor_anterior", "valor_novo"],
  pagamentos: ["valor"],
  auditoria_estornos: ["valor"],
  pagamento_parcelas: ["valor"],
  gastos: ["valor"],
  fechamentos_semanais: ["total_recebido", "total_gasto", "resultado", "caixa_base", "saldo_fechamento"],
  snapshots_atraso: ["valor_atrasado"],
}

const TIMESTAMP_COLS = ["created_at", "updated_at", "deleted_at", "expira_em", "usado_em", "convertido_em", "descartado_em"]

const FKS = [
  ["contratos", "cliente_id", "clientes", "id"],
  ["parcelas", "contrato_id", "contratos", "id"],
  ["pagamentos", "contrato_id", "contratos", "id"],
  ["pagamento_parcelas", "pagamento_id", "pagamentos", "id"],
  ["pagamento_parcelas", "parcela_id", "parcelas", "id"],
  ["historico_operacional", "cliente_id", "clientes", "id"],
  ["historico_operacional", "contrato_id", "contratos", "id"],
  ["anexos", "cliente_id", "clientes", "id"],
  ["auditoria_caixa", "operador_id", "usuarios", "id"],
  ["auditoria_caixa", "admin_id", "usuarios", "id"],
  ["auditoria_estornos", "pagamento_id", "pagamentos", "id"],
  ["auditoria_estornos", "operador_id", "usuarios", "id"],
  ["auditoria_estornos", "admin_id", "usuarios", "id"],
  ["auditoria_modulos", "empresa_id", "empresas", "id"],
  ["caixa_config", "user_id", "usuarios", "id"],
  ["usuarios", "empresa_id", "empresas", "id"],
]

async function colType(table, col) {
  const { rows } = await pool.query(
    "SELECT data_type FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
    [table, col],
  )
  return rows[0]?.data_type ?? null
}

async function hasFk(table, col) {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.key_column_usage kcu
     JOIN information_schema.table_constraints tc
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema AND tc.table_name = kcu.table_name
     WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1 AND kcu.column_name = $2
     LIMIT 1`,
    [table, col],
  )
  return rows.length > 0
}

await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm")

// ---- 1) RENAME: tabelas e colunas camelCase -> snake_case (algorítmico) ----
{
  const { rows: tabs } = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename ~ '[A-Z]'",
  )
  for (const r of tabs) {
    const to = snake(r.tablename)
    await pool.query(`ALTER TABLE "${r.tablename}" RENAME TO "${to}"`)
    console.log(`  rename table ${r.tablename} -> ${to}`)
  }
  const { rows } = await pool.query(
    "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name ~ '[A-Z]'",
  )
  for (const r of rows) {
    const to = snake(r.column_name)
    if (to === r.column_name) continue
    await pool.query(`ALTER TABLE "${r.table_name}" RENAME COLUMN "${r.column_name}" TO "${to}"`)
    console.log(`  rename ${r.table_name}.${r.column_name} -> ${to}`)
  }
}

// Índice parcial (usa os nomes snake — após o RENAME)
await pool.query(
  'CREATE INDEX IF NOT EXISTS "idx_parcelas_venc_partial" ON "parcelas"("contrato_id", "data_vencimento", "saldo_pendente") WHERE "saldo_pendente" > 0 AND "deleted_at" IS NULL',
)

// ---- 2) timestamps TEXT -> TIMESTAMPTZ ----
{
  const { rows } = await pool.query(
    `SELECT table_name, column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND column_name = ANY($1) AND data_type = 'text'`,
    [TIMESTAMP_COLS],
  )
  for (const r of rows) {
    await pool.query(`ALTER TABLE "${r.table_name}" ALTER COLUMN "${r.column_name}" TYPE TIMESTAMPTZ USING "${r.column_name}"::timestamptz`)
    console.log(`  ts ${r.table_name}.${r.column_name} -> timestamptz`)
  }
}

// ---- G4: pre-check de datas (não castar valor inválido) ----
const falhas = []
for (const [table, cols] of Object.entries(DATE_COLS)) {
  for (const col of cols) {
    const t = await colType(table, col)
    if (t === "date") continue
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "${table}" WHERE "${col}" IS NOT NULL AND "${col}" !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`,
    )
    if (Number(rows[0].c) > 0) falhas.push(`data inválida em ${table}.${col}: ${rows[0].c} registro(s)`)
  }
}
if (falhas.length > 0) {
  console.error("✗ PRE-CHECK de datas falhou:")
  for (const f of falhas) console.error(`  - ${f}`)
  await pool.end()
  process.exit(1)
}

// ---- 3) dinheiro -> numeric(12,2) (idempotente) ----
for (const [table, cols] of Object.entries(MONEY_COLS)) {
  for (const col of cols) {
    const t = await colType(table, col)
    if (t === "numeric") continue
    await pool.query(`ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE NUMERIC(12,2) USING "${col}"::numeric(12,2)`)
    console.log(`  money ${table}.${col}: ${t} -> numeric(12,2)`)
  }
}

// ---- 4) datas date-only -> date (idempotente) ----
for (const [table, cols] of Object.entries(DATE_COLS)) {
  for (const col of cols) {
    const t = await colType(table, col)
    if (t === "date") continue
    await pool.query(`ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE DATE USING "${col}"::date`)
    console.log(`  date ${table}.${col}: ${t} -> date`)
  }
}

// ---- 5) FKs (idempotente) ----
for (const [table, col, parent, parentCol] of FKS) {
  if (await hasFk(table, col)) continue
  const name = `fk_${table}_${col}`
  await pool.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${name}" FOREIGN KEY ("${col}") REFERENCES "${parent}"("${parentCol}")`)
  console.log(`  fk ${table}.${col} -> ${parent}.${parentCol}`)
}

console.log("\n✓ Migração de modelo v2 concluída (snake_case · timestamps TIMESTAMPTZ · money/date/FKs)")
await pool.end()
