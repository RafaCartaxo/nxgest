#!/usr/bin/env node
/**
 * Orquestrador do smoke API — codifica as invariantes da execução isolada:
 *
 *  - Node ≥20 (guarda explícita — o projeto exige; `.nvmrc` = 20).
 *  - `create-schema.mjs` roda via `npx tsx` (importa TS de `src/database.js` — `node` puro falha).
 *  - DB recriado do zero por execução (rate limiters são em memória e tokens de lead são
 *    single-use — re-run no mesmo processo/DB polui: LD-06 token usado, LD-12 429).
 *  - Todas as envs de rate limit ampliadas (LOGIN/USER/PUBLICO/LEADS) — espelha o job smoke do CI.
 *  - Servidor na porta SMOKE_PORT (default 3002) — nunca no 3000 (dev).
 *  - Teardown garantido em `finally` (modo `full`).
 *
 * Uso:
 *   node scripts/smoke.mjs             # full: recria DB → schema → seed → sobe → roda smoke → teardown
 *   node scripts/smoke.mjs up          # só a pilha (schema+seed+servidor), deixa no ar (PID em .smoke.pid)
 *   node scripts/smoke.mjs down        # derruba o servidor (.smoke.pid) e remove o PID
 *   node scripts/smoke.mjs --no-recreate  # full sem DROP/CREATE do DB (depuração)
 *
 * Envs:
 *   DATABASE_URL      conexão da instância (default postgres://nxgest:nxgest-dev@localhost:5433/nxgest_smoke)
 *   SMOKE_PORT        porta do servidor (default 3002)
 *   SMOKE_JWT_SECRET  JWT do smoke (default ci-smoke-secret)
 */
import { spawnSync, spawn } from "node:child_process"
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import pg from "pg"

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://nxgest:nxgest-dev@localhost:5433/nxgest_smoke"
const PORT = process.env.SMOKE_PORT ?? "3002"
const JWT_SECRET = process.env.SMOKE_JWT_SECRET ?? "ci-smoke-secret"
const PID_FILE = path.join(ROOT, ".smoke.pid")
const HEALTH_URL = `http://127.0.0.1:${PORT}/api/health`
const BASE_URL = `http://127.0.0.1:${PORT}`

const RATE_ENVS = {
  LOGIN_RATE_LIMIT_MAX: "10000",
  USER_RATE_LIMIT_MAX: "100000",
  PUBLICO_RATE_LIMIT_MAX: "100000",
  LEADS_RATE_LIMIT_MAX: "100000",
}

const fail = (msg) => {
  console.error(`\n[smoke] ❌ ${msg}`)
  process.exit(1)
}

const sh = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } })
  if (r.status !== 0) fail(`${cmd} ${args.join(" ")} falhou (exit ${r.status ?? "signal"})`)
}

/** Deriva a conexão de manutenção (`postgres`) a partir da DATABASE_URL. */
function adminUrl(databaseUrl) {
  const u = new URL(databaseUrl)
  u.pathname = "/postgres"
  return u.toString()
}

function dbName(databaseUrl) {
  const u = new URL(databaseUrl)
  return decodeURIComponent(u.pathname.replace(/^\//, ""))
}

async function recreateDb() {
  const name = dbName(DATABASE_URL)
  if (name === "postgres") fail("não é seguro recriar o banco 'postgres' — passe um DATABASE_URL com nome próprio (ex.: nxgest_smoke)")
  const client = new pg.Client({ connectionString: adminUrl(DATABASE_URL) })
  try {
    await client.connect()
    console.log(`[smoke] 🔄 Recriando banco "${name}" (isolado, nunca toca no dev)`);
    await client.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`, [name])
    await client.query(`DROP DATABASE IF EXISTS ${quoteIdent(name)}`)
    await client.query(`CREATE DATABASE ${quoteIdent(name)}`)
    console.log("[smoke] ✅ Banco recriado")
  } catch (err) {
    fail(`falha ao recriar banco: ${err.message}`)
  } finally {
    await client.end().catch(() => {})
  }
}

function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`
}

async function healthOk() {
  try {
    const r = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(2000) })
    return r.ok
  } catch {
    return false
  }
}

function startServer() {
  if (existsSync(PID_FILE)) {
    console.warn(`[smoke] ⚠️ PID anterior encontrado (${readFileSync(PID_FILE, "utf8").trim()}) — executando down() primeiro`)
    stopServer()
  }
  if (existsSync(PID_FILE)) rmSync(PID_FILE)

  console.log(`[smoke] 🚀 Subindo servidor em ${BASE_URL} (PID em .smoke.pid)`)
  const child = spawn("npx", ["tsx", "src/main.ts"], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, PORT, JWT_SECRET, DATABASE_URL, ...RATE_ENVS },
  })
  child.unref()
  writeFileSync(PID_FILE, String(child.pid))

  return new Promise((resolve) => {
    const deadline = Date.now() + 20000
    const tick = async () => {
      if (await healthOk()) {
        console.log(`[smoke] ✅ Servidor no ar (PID ${child.pid})`)
        resolve()
        return
      }
      if (Date.now() > deadline) fail(`servidor não respondeu em /api/health em 20s — veja os logs acima`)
      setTimeout(tick, 500)
    }
    tick()
  })
}

function stopServer() {
  if (!existsSync(PID_FILE)) return
  const pid = Number(readFileSync(PID_FILE, "utf8").trim())
  try {
    process.kill(pid, "SIGTERM")
    console.log(`[smoke] 🛑 Servidor (PID ${pid}) encerrado`)
  } catch (err) {
    if (err.code !== "ESRCH") console.warn(`[smoke] ⚠️ falha ao matar PID ${pid}: ${err.message}`)
  }
  rmSync(PID_FILE, { force: true })
}

async function up(recreate) {
  // Nunca subir com um servidor alheio na porta — evita validar contra processo errado.
  if (await healthOk()) fail(`já há um servidor respondendo em ${HEALTH_URL} — pare o processo anterior primeiro (ex.: systemctl --user stop nxgest-smoke)`)
  if (recreate) await recreateDb()
  console.log("[smoke] 📦 create-schema (npx tsx)")
  sh("npx", ["tsx", "scripts/create-schema.mjs"], { DATABASE_URL })
  console.log("[smoke] 🌱 seed-demo")
  sh("node", ["scripts/seed-demo.mjs"], { DATABASE_URL })
  await startServer()
}

async function full(recreate) {
  await up(recreate)
  let code = 0
  try {
    console.log(`[smoke] 🧪 Rodando smoke-api contra ${BASE_URL}`)
    const r = spawnSync("node", ["scripts/smoke-api.mjs", "--baseUrl", BASE_URL], {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL },
    })
    code = r.status ?? 1
  } finally {
    stopServer()
  }
  process.exit(code)
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2)
  const recreate = !rest.includes("--no-recreate")
  const nodeMajor = Number(process.versions.node.split(".")[0])
  if (nodeMajor < 20) fail(`Node ${process.version} detectado — o projeto exige Node ≥20 (veja .nvmrc). Rode: source ~/.nvm/nvm.sh && nvm use`)

  if (cmd === "up") await up(recreate)
  else if (cmd === "down") stopServer()
  else await full(recreate)
}

main().catch((err) => {
  console.error(`\n[smoke] ❌ erro inesperado: ${err.message}`)
  stopServer()
  process.exit(1)
})