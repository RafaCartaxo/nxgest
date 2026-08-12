#!/usr/bin/env node
/**
 * Migração de dados SQLite → PostgreSQL (PLAN-070, Fase C).
 *
 * Lê um dump SQLite (`gestao-*.db` ou `gestao.db.backup-*`) e transfere TODOS os
 * registros para o PostgreSQL (via `DATABASE_URL`), preservando UUIDs, timestamps
 * e histórico, com normalização de formato de data (G6) e validação por matriz
 * (contagens + somas + amostras + órfãos = 0) — não depende só de COUNT.
 *
 * Uso:
 *   SRC_DB=/path/gestao.db DATABASE_URL=postgres://... npx tsx scripts/migrate-sqlite-to-pg.mjs [--yes]
 *
 * - `--yes`    — TRUNCATE nas tabelas de destino antes de inserir (destino deve ser
 *               novo/isolado; sem a flag, aborta se o destino já tiver dados).
 * - Exit 0 = migrado e validado · Exit 1 = falha.
 *
 * O schema do destino deve existir (rodar `scripts/create-schema.mjs` antes);
 * este script chama `runMigrations()` por segurança (idempotente).
 */
import Database from "better-sqlite3"
import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { runMigrations, pool } from "../src/database.js"

// ---------------------------------------------------------------- helpers
/** camelCase -> snake_case (SQLite camelCase -> PG snake, PLAN-070). */
const snake = (n) => n.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").toLowerCase()

const TS_RE = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/
const TIMESTAMP_COLS = new Set(["createdAt", "updatedAt"])

function normalizarData(value) {
  if (typeof value !== "string") return value
  const m = TS_RE.exec(value)
  return m ? `${m[1]}T${m[2]}.000Z` : value
}

function latestBackup() {
  const cands = readdirSync(process.cwd())
    .filter((f) => (/^gestao-.*\.db$/.test(f) || /^gestao\.db\.backup-/.test(f)) && !f.endsWith("-shm") && !f.endsWith("-wal"))
    .map((f) => ({ f, m: statSync(join(process.cwd(), f)).mtimeMs }))
    .sort((a, b) => b.m - a.m)
  return cands[0]?.f ?? null
}

// Ordem de inserção (dependências pais → filhos).
const TABLES = [
  "empresas", "usuarios", "leads", "clientes", "contratos", "parcelas",
  "pagamentos", "pagamento_parcelas", "movimentacoesFinanceiras", "caixa_config",
  "auditoria_caixa", "auditoria_estornos", "gastos", "fechamentos_semanais",
  "snapshots_atraso", "historico_operacional", "auth_tokens", "anexos", "auditoria_modulos",
]

/** Colunas por tabela (SQLite) + somas monetárias esperadas. */
function columnsOf(sqlite, table) {
  return sqlite.pragma(`table_info(${table})`).map((c) => snake(c.name))
}

const SUMS = {"parcelas": ["saldo_pendente", "valor_previsto"], "pagamentos": ["valor"], "movimentacoesFinanceiras": ["valor"], "caixa_config": ["caixa_base"], "gastos": ["valor"], "fechamentos_semanais": ["total_recebido", "total_gasto", "resultado", "caixa_base", "saldo_fechamento"], "auditoria_caixa": ["valor_anterior", "valor_novo"], "auditoria_estornos": ["valor"], "pagamento_parcelas": ["valor"], "snapshots_atraso": ["valor_atrasado"], "contratos": ["valor_base", "valor_final", "percentual_juros"]}


// Órfãos: FK → pai. (movimentacoes.origemId é polimórfico; auth_tokens.subjectId é polimórfico.)
const ORPHAOS = [
  ["contratos", "cliente_id", "clientes"],
  ["parcelas", "contrato_id", "contratos"],
  ["pagamentos", "contrato_id", "contratos"],
  ["pagamento_parcelas", "pagamento_id", "pagamentos"],
  ["pagamento_parcelas", "parcela_id", "parcelas"],
  ["historico_operacional", "cliente_id", "clientes"],
  ["historico_operacional", "contrato_id", "contratos"],
  ["anexos", "cliente_id", "clientes"],
  ["auditoria_caixa", "operador_id", "usuarios"],
  ["auditoria_caixa", "admin_id", "usuarios"],
  ["auditoria_estornos", "pagamento_id", "pagamentos"],
  ["auditoria_estornos", "operador_id", "usuarios"],
  ["auditoria_estornos", "admin_id", "usuarios"],
  ["auditoria_modulos", "empresa_id", "empresas"],
]

// ---------------------------------------------------------------- migração
const SRC = process.env.SRC_DB || latestBackup()
if (!SRC) {
  console.error("✗ Nenhum dump SQLite encontrado. Defina SRC_DB=<arquivo>")
  process.exit(1)
}
const FORCE = process.argv.includes("--yes")
console.log(`Fonte : ${SRC}`)

await runMigrations()

// Destino deve estar vazio (ou --yes)
const probe = await pool.query("SELECT COUNT(*)::int AS c FROM usuarios")
if (Number(probe.rows[0].c) > 0 && !FORCE) {
  console.error("✗ Destino já tem usuários. Use --yes para TRUNCATE (destino isolado) ou aponte outro banco.")
  await pool.end()
  process.exit(1)
}
if (FORCE) {
  for (const t of TABLES) await pool.query(`TRUNCATE TABLE "${t}" CASCADE`)
  console.log("==> TRUNCATE (CASCADE) nas tabelas de destino")
}

const sqlite = new Database(SRC, { readonly: true })
const insert = (table, rows) => {
  if (rows.length === 0) return
  const cols = columnsOf(sqlite, table)
  const per = cols.length
  const ph = Array.from({ length: rows.length }, (_, i) =>
    `(${cols.map((_, j) => `$${i * per + j + 1}`).join(",")})`
  ).join(",")
  const sql = `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(",")}) VALUES ${ph}`
  const values = []
  for (const r of rows) {
    for (const c of cols) {
      let v = r[c]
      if (v !== null && TIMESTAMP_COLS.has(c)) v = normalizarData(v)
      values.push(v)
    }
  }
  return pool.query(sql, values)
}

const BATCH = 500
for (const table of TABLES) {
  const cols = columnsOf(sqlite, table)
  const stmt = sqlite.prepare(`SELECT ${cols.map((c) => `"${c}"`).join(",")} FROM "${table}"`)
  const all = stmt.all()
  for (let i = 0; i < all.length; i += BATCH) {
    await insert(table, all.slice(i, i + BATCH))
  }
  console.log(`  ${table.padEnd(26)} ${all.length}`)
}
sqlite.close()

// ---------------------------------------------------------------- validação
const falhas = []

// Contagens
for (const table of TABLES) {
  const s = new Database(SRC, { readonly: true })
  const cS = Number(s.prepare(`SELECT COUNT(*) AS c FROM "${table}"`).get().c)
  s.close()
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM "${table}"`)
  const cP = Number(rows[0].c)
  if (cS !== cP) falhas.push(`contagem ${table}: origem=${cS} destino=${cP}`)
}

// Somas monetárias
for (const [table, cols] of Object.entries(SUMS)) {
  const s = new Database(SRC, { readonly: true })
  for (const col of cols) {
    const qS = Number(s.prepare(`SELECT COALESCE(SUM("${col}"), 0) AS v FROM "${table}"`).get().v)
    const { rows } = await pool.query(`SELECT COALESCE(SUM("${col}"), 0) AS v FROM "${table}"`)
    const qP = Number(rows[0].v)
    if (Math.abs(qS - qP) > 0.01) falhas.push(`soma ${table}.${col}: origem=${qS} destino=${qP}`)
  }
  s.close()
}

// Amostras (últimos 5 por PK)
function pkOf(table) {
  return table === "caixa_config" ? "user_id" : "id"
}
function deepEq(a, b, path = "") {
  if (typeof a === "number" && typeof b === "number") {
    if (Math.abs(a - b) > 1e-6) return `${path}: ${a} ≠ ${b}`
    return null
  }
  if (a === b) return null
  return `${path}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`
}
for (const table of TABLES) {
  const pk = pkOf(table)
  const s = new Database(SRC, { readonly: true })
  const sampleS = s.prepare(`SELECT * FROM "${table}" ORDER BY "${pk}" DESC LIMIT 5`).all()
  s.close()
  const { rows: sampleP } = await pool.query(`SELECT * FROM "${table}" ORDER BY "${pk}" DESC LIMIT 5`)
  for (let i = 0; i < sampleS.length; i++) {
    for (const key of Object.keys(sampleS[i])) {
      // G6: fonte pode ter formato `YYYY-MM-DD HH:MM:SS` (datetime('now')); destino normalizado para ISO.
      const sv = TIMESTAMP_COLS.has(key) ? normalizarData(sampleS[i][key]) : sampleS[i][key]
      const err = deepEq(sv, sampleP[i]?.[key], `${table}.${pk}=${sampleS[i][pk]}.${key}`)
      if (err) falhas.push(err)
    }
  }
}

// G6: nenhum timestamp no formato com espaço deve ter sobrado no destino
{
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM empresas WHERE "created_at" LIKE '% %'`,
  )
  if (Number(rows[0].c) > 0) falhas.push(`G6: empresas."createdAt" com formato espaço (${rows[0].c})`)
}

// Órfãos = 0
for (const [table, fk, parent] of ORPHAOS) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM "${table}" t WHERE NOT EXISTS (SELECT 1 FROM "${parent}" p WHERE p."id" = t."${fk}")`,
  )
  if (Number(rows[0].c) > 0) falhas.push(`órfãos ${table}.${fk} → ${parent}: ${rows[0].c}`)
}

if (falhas.length > 0) {
  console.error("\n✗ VALIDAÇÃO FALHOU:")
  for (const f of falhas) console.error(`  - ${f}`)
  await pool.end()
  process.exit(1)
}

console.log("\n✓ Migração + validação OK (contagens · somas · amostras · órfãos=0)")
await pool.end()
