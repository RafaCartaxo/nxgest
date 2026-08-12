#!/usr/bin/env node
/**
 * Cria o schema do banco isolado sem subir o servidor (CI/smoke) — versão PostgreSQL (PLAN-070).
 *
 * Equivalente ao boot do `src/main.ts` (que roda `runMigrations()` + `seedBasico()`), mas sem
 * abrir porta — evita o double-boot que causava `EADDRINUSE` no CI.
 *
 * Uso: DATABASE_URL=postgres://... npx tsx scripts/create-schema.mjs
 * Exit 0 = schema criado/atualizado. Exit 1 = falha.
 */
const { runMigrations, seedBasico } = await import("../src/database.js")
await runMigrations()
await seedBasico()
console.log(`Schema criado/atualizado em ${process.env.DATABASE_URL ?? "(DATABASE_URL default)"}`)
