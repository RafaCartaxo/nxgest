#!/usr/bin/env node
/**
 * Cria o schema do banco isolado sem subir o servidor (CI/smoke).
 *
 * Equivalente ao boot do `src/main.ts` (que roda `createTables()`), mas sem
 * abrir porta — evita o double-boot que causava `EADDRINUSE` no CI.
 *
 * Uso: DB_PATH=/tmp/nxgest-smoke.db npx tsx scripts/create-schema.mjs
 * Exit 0 = schema criado/atualizado. Exit 1 = falha.
 */
process.env.DB_PATH = process.env.DB_PATH ?? "/tmp/nxgest-smoke.db"

const { createTables } = await import("../src/database.js")
await createTables()
console.log(`Schema criado/atualizado em ${process.env.DB_PATH}`)
