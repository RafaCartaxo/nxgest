#!/usr/bin/env node
/**
 * Teste de migração incremental (pré-deploy).
 *
 * Roda as migrações do boot (`createTables`) contra uma CÓPIA de um banco
 * populado (backup) e valida:
 *   1. coluna `empresas.capacidades` criada (ALTER em banco legado);
 *   2. tabela `auditoria_modulos` criada;
 *   3. dados preservados (contagens de empresas/clientes inalteradas);
 *   4. `capacidades` NULL nas empresas existentes (= todas ativas).
 *
 * O smoke cobre o caminho "banco novo" (CREATE TABLE IF NOT EXISTS); este
 * script cobre o caminho "banco legado" (ALTER), que é o caso de produção.
 *
 * Uso: npm run migracao:test
 * Exit 0 = ok (ou sem backup disponível — aviso). Exit 1 = migração quebrada.
 */
import { copyFileSync, readdirSync, rmSync, statSync } from "node:fs"
import { join } from "node:path"

const root = join(process.cwd())
const DST = "/tmp/nxgest-migracao-test.db"

function latestBackup() {
  const candidates = readdirSync(root)
    .filter((f) => /^gestao\.db\.backup-/.test(f) && !f.endsWith("-shm") && !f.endsWith("-wal"))
    .map((f) => ({ f, m: statSync(join(root, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m)
  return candidates[0]?.f ?? null
}

const SRC = process.env.SRC_DB || latestBackup()
if (!SRC) {
  console.log("⚠ nenhum backup encontrado — migração validada apenas em banco novo (smoke).")
  process.exit(0)
}
console.log(`Fonte: ${SRC}`)

const Database = (await import("better-sqlite3")).default

for (const suf of ["", "-wal", "-shm"]) rmSync(DST + suf, { force: true })
copyFileSync(join(root, SRC), DST)

const before = new Database(DST, { readonly: true })
const empresasAntes = before.prepare("SELECT COUNT(*) c FROM empresas").get().c
const clientesAntes = before.prepare("SELECT COUNT(*) c FROM clientes").get().c
before.close()

process.env.DB_PATH = DST
const { createTables } = await import("../src/database.js")
await createTables()

const after = new Database(DST, { readonly: true })
const cols = after.pragma("table_info(empresas)").map((c) => c.name)
const temAuditoria = after.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='auditoria_modulos'").get()
const empresasDepois = after.prepare("SELECT COUNT(*) c FROM empresas").get().c
const clientesDepois = after.prepare("SELECT COUNT(*) c FROM clientes").get().c
const naoNulos = after.prepare("SELECT COUNT(*) c FROM empresas WHERE capacidades IS NOT NULL").get().c
after.close()

const falhas = []
if (!cols.includes("capacidades")) falhas.push("coluna empresas.capacidades não criada")
if (!temAuditoria) falhas.push("tabela auditoria_modulos não criada")
if (empresasAntes !== empresasDepois || clientesAntes !== clientesDepois) falhas.push("dados alterados pela migração")
if (naoNulos !== 0) falhas.push("empresas existentes deveriam ter capacidades NULL")

if (falhas.length > 0) {
  console.error(`✗ migração: ${falhas.join(" · ")}`)
  process.exit(1)
}

console.log(`✓ migração ok: capacidades + auditoria_modulos criados, dados preservados (empresas=${empresasDepois}, clientes=${clientesDepois})`)
for (const suf of ["", "-wal", "-shm"]) rmSync(DST + suf, { force: true })
