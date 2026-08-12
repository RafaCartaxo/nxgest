#!/usr/bin/env node
/**
 * Migração de MODELO (PLAN-070 — "deixar o banco redondo"): ajusta um PostgreSQL
 * existente (criado na fase doublePrecision/TEXT) para o modelo final:
 *
 *  - dinheiro  double precision → NUMERIC(12,2)
 *  - datas     date-only TEXT    → DATE   (timestamps createdAt/updatedAt... permanecem TEXT)
 *  - FKs       adiciona constraints (idempotente) nas relações conhecidas
 *  - extension pg_trgm + índice parcial das parcelas
 *
 * Conexão direta via `pg` (sem TS/tsx) para rodar com `node` no container de runtime:
 *   docker exec nxgestao-app-1 node scripts/migrate-modelo.mjs
 * (a imagem copia `scripts/` e tem `pg`; DATABASE_URL do container aponta para o postgres interno)
 *
 * Idempotente (verifica information_schema). Exit 0 = ok · Exit 1 = falha.
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

const DATE_COLS = {
  movimentacoesFinanceiras: ["data"],
  parcelas: ["dataVencimento", "dataQuitacao"],
  contratos: ["dataInicio"],
  gastos: ["data"],
  pagamentos: ["data"],
  fechamentos_semanais: ["dataInicio", "dataFim"],
  snapshots_atraso: ["data"],
  historico_operacional: ["dataPromessa"],
  auditoria_caixa: ["data"],
  auditoria_estornos: ["data"],
}

const MONEY_COLS = {
  contratos: ["valorBase", "percentualJuros", "valorFinal"],
  parcelas: ["valorPrevisto", "valorPago", "saldoPendente"],
  movimentacoesFinanceiras: ["valor"],
  caixa_config: ["caixaBase"],
  auditoria_caixa: ["valorAnterior", "valorNovo"],
  pagamentos: ["valor"],
  auditoria_estornos: ["valor"],
  pagamento_parcelas: ["valor"],
  gastos: ["valor"],
  fechamentos_semanais: ["totalRecebido", "totalGasto", "resultado", "caixaBase", "saldoFechamento"],
  snapshots_atraso: ["valorAtrasado"],
}

const FKS = [
  ["contratos", "clienteId", "clientes", "id"],
  ["parcelas", "contratoId", "contratos", "id"],
  ["pagamentos", "contratoId", "contratos", "id"],
  ["pagamento_parcelas", "pagamentoId", "pagamentos", "id"],
  ["pagamento_parcelas", "parcelaId", "parcelas", "id"],
  ["historico_operacional", "clienteId", "clientes", "id"],
  ["historico_operacional", "contratoId", "contratos", "id"],
  ["anexos", "clienteId", "clientes", "id"],
  ["auditoria_caixa", "operadorId", "usuarios", "id"],
  ["auditoria_caixa", "adminId", "usuarios", "id"],
  ["auditoria_estornos", "pagamentoId", "pagamentos", "id"],
  ["auditoria_estornos", "operadorId", "usuarios", "id"],
  ["auditoria_estornos", "adminId", "usuarios", "id"],
  ["auditoria_modulos", "empresaId", "empresas", "id"],
  ["caixa_config", "userId", "usuarios", "id"],
  ["usuarios", "empresaId", "empresas", "id"],
]

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

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

// Extension + índice parcial (espelham o runMigrations para banco existente)
await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm")
await pool.query(
  'CREATE INDEX IF NOT EXISTS "idx_parcelas_venc_partial" ON "parcelas"("contratoId", "dataVencimento", "saldoPendente") WHERE "saldoPendente" > 0 AND "deletedAt" IS NULL',
)

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

// ---- dinheiro -> numeric(12,2) ----
for (const [table, cols] of Object.entries(MONEY_COLS)) {
  for (const col of cols) {
    const t = await colType(table, col)
    if (t === "numeric") continue
    await pool.query(`ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE NUMERIC(12,2) USING "${col}"::numeric(12,2)`)
    console.log(`  money ${table}.${col}: ${t} -> numeric(12,2)`)
  }
}

// ---- datas date-only -> date ----
for (const [table, cols] of Object.entries(DATE_COLS)) {
  for (const col of cols) {
    const t = await colType(table, col)
    if (t === "date") continue
    await pool.query(`ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE DATE USING "${col}"::date`)
    console.log(`  date ${table}.${col}: ${t} -> date`)
  }
}

// ---- FKs (idempotente) ----
for (const [table, col, parent, parentCol] of FKS) {
  if (await hasFk(table, col)) continue
  const name = `fk_${table}_${col}`
  await pool.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${name}" FOREIGN KEY ("${col}") REFERENCES "${parent}"("${parentCol}")`)
  console.log(`  fk ${table}.${col} -> ${parent}.${parentCol}`)
}

console.log("\n✓ Migração de modelo concluída (money numeric · datas DATE · FKs · índice parcial)")
await pool.end()
