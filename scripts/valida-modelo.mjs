#!/usr/bin/env node
/**
 * Valida as invariantes do MODELO (PLAN-070 — "banco redondo") num PostgreSQL.
 * Usado no CI (job `migracao`) e localmente, após `create-schema` + `migrate-modelo`:
 *
 *  0 camelCase (tabelas e colunas) · created_at = TIMESTAMPTZ · saldo_pendente = numeric
 *  ≥16 FKs · índice parcial idx_parcelas_venc_partial
 *
 * Roda com `node` (pg puro). Exit 0 = modelo válido · Exit 1 = divergência.
 */
import pg from "pg"

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://nxgest:nxgest-dev@localhost:5433/nxgest",
  max: 3,
})

const q = async (sql, params = []) => (await pool.query(sql, params)).rows
const falhas = []

const colCamel = Number((await q("SELECT COUNT(*)::int c FROM information_schema.columns WHERE table_schema = 'public' AND column_name ~ '[A-Z]'"))[0].c)
if (colCamel !== 0) falhas.push(`colunas camelCase restantes: ${colCamel}`)

const tabCamel = Number((await q("SELECT COUNT(*)::int c FROM pg_tables WHERE schemaname = 'public' AND tablename ~ '[A-Z]'"))[0].c)
if (tabCamel !== 0) falhas.push(`tabelas camelCase restantes: ${tabCamel}`)

const ts = (await q("SELECT data_type FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'created_at'"))[0]?.data_type
if (ts !== "timestamp with time zone") falhas.push(`created_at não é timestamptz: ${ts}`)

const money = (await q("SELECT data_type FROM information_schema.columns WHERE table_name = 'parcelas' AND column_name = 'saldo_pendente'"))[0]?.data_type
if (money !== "numeric") falhas.push(`saldo_pendente não é numeric: ${money}`)

const fks = Number((await q("SELECT COUNT(*)::int c FROM pg_constraint WHERE contype = 'f'"))[0].c)
if (fks < 16) falhas.push(`FKs insuficientes: ${fks}`)

const idx = Number((await q("SELECT COUNT(*)::int c FROM pg_indexes WHERE indexname = 'idx_parcelas_venc_partial'"))[0].c)
if (idx !== 1) falhas.push("índice parcial idx_parcelas_venc_partial ausente")

if (falhas.length > 0) {
  console.error("✗ MODELO INVÁLIDO:")
  for (const f of falhas) console.error(`  - ${f}`)
  await pool.end()
  process.exit(1)
}

console.log("✓ Modelo válido (snake_case · timestamptz · numeric · FKs · índice parcial)")
await pool.end()
