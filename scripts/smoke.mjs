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
 *   SMOKE_DATABASE_URL conexão explícita para banco local dedicado nxgest_smoke[_sufixo]
 *   SMOKE_PORT        porta do servidor (default 3002)
 *   SMOKE_JWT_SECRET  JWT do smoke (default ci-smoke-secret)
 */
import { spawnSync, spawn } from "node:child_process"
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import pg from "pg"

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DATABASE_URL = process.env.SMOKE_DATABASE_URL
const PORT = process.env.SMOKE_PORT ?? "3002"
const JWT_SECRET = process.env.SMOKE_JWT_SECRET ?? "ci-smoke-secret"
const PID_FILE = path.join(ROOT, ".smoke.pid")
let ownedProcess = false
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
  throw new Error(msg)
}

const sh = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } })
  if (r.status !== 0) fail(`${cmd} ${args.join(" ")} falhou (exit ${r.status ?? "signal"})`)
}

/** Deriva a conexão de manutenção (`postgres`) a partir da DATABASE_URL. */
function validateTarget(databaseUrl) {
  if (!databaseUrl) fail("defina SMOKE_DATABASE_URL para um banco de teste local dedicado")
  let url
  try { url = new URL(databaseUrl) } catch { fail("SMOKE_DATABASE_URL inválida") }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^nxgest_smoke(?:_[a-z0-9]+)*$/.test(decodeURIComponent(url.pathname.slice(1))) || !url.port || ["5432", "5433"].includes(url.port)) {
    fail("alvo recusado: use PostgreSQL local, porta dedicada diferente de 5432/5433 e banco nxgest_smoke[_sufixo]")
  }
}

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
  if (existsSync(PID_FILE)) fail("arquivo PID existente: inspecione a instância anterior antes de iniciar")

  console.log(`[smoke] 🚀 Subindo servidor em ${BASE_URL} (PID em .smoke.pid)`)
  const child = spawn("npx", ["tsx", "src/main.ts"], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, PORT, JWT_SECRET, DATABASE_URL, ...RATE_ENVS },
  })
  child.unref()
  const stat = readFileSync(`/proc/${child.pid}/stat`, "utf8")
  const start = stat.slice(stat.lastIndexOf(")") + 2).split(" ")[19]
  writeFileSync(PID_FILE, JSON.stringify({ pid: child.pid, start }))
  ownedProcess = true

  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 20000
    const tick = async () => {
      if (await healthOk()) {
        console.log(`[smoke] ✅ Servidor no ar (PID ${child.pid})`)
        resolve()
        return
      }
      if (Date.now() > deadline) { reject(new Error("servidor não respondeu em /api/health em 20s")); return }
      setTimeout(tick, 500)
    }
    tick()
  })
}

function stopServer() {
  if (!existsSync(PID_FILE)) return
  let entry
  try {
    entry = JSON.parse(readFileSync(PID_FILE, "utf8"))
    if (!Number.isSafeInteger(entry.pid) || entry.pid <= 1 || !/^\d+$/.test(entry.start)) throw new Error("PID inválido")
    const stat = readFileSync(`/proc/${entry.pid}/stat`, "utf8")
    const start = stat.slice(stat.lastIndexOf(")") + 2).split(" ")[19]
    if (start !== entry.start) throw new Error("identidade do processo não confere")
    process.kill(-entry.pid, "SIGTERM")
    console.log(`[smoke] 🛑 Grupo de processos próprio ${entry.pid} encerrado`)
  } catch (err) {
    if (err.code !== "ENOENT" && err.code !== "ESRCH") fail(`PID não verificado; nenhum processo sinalizado: ${err.message}`)
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
  let code = 0
  try {
    await up(recreate)
    console.log(`[smoke] 🧪 Rodando smoke-api contra ${BASE_URL}`)
    const r = spawnSync("node", ["scripts/smoke-api.mjs", "--baseUrl", BASE_URL], {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL },
    })
    code = r.status ?? 1
  } finally {
    if (ownedProcess) stopServer()
  }
  process.exit(code)
}

export function parseArgs(args) {
  const commands = args.filter(arg => !arg.startsWith("--"))
  if (commands.length > 1 || commands.some(arg => !["up", "down", "full"].includes(arg)) || args.some(arg => arg.startsWith("--") && arg !== "--no-recreate") || args.filter(arg => arg === "--no-recreate").length > 1) fail("argumentos inválidos")
  const cmd = commands[0] ?? "full"
  if (cmd === "down" && args.includes("--no-recreate")) fail("opção inválida para down")
  const recreate = !args.includes("--no-recreate")
  return { cmd, recreate }
}

async function main() {
  const { cmd, recreate } = parseArgs(process.argv.slice(2))
  if (cmd !== "down") validateTarget(DATABASE_URL)
  const nodeMajor = Number(process.versions.node.split(".")[0])
  if (nodeMajor < 20) fail(`Node ${process.version} detectado — o projeto exige Node ≥20 (veja .nvmrc). Rode: source ~/.nvm/nvm.sh && nvm use`)

  if (cmd === "up") {
    try { await up(recreate) } catch (error) { if (ownedProcess) stopServer(); throw error }
  }
  else if (cmd === "down") stopServer()
  else await full(recreate)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((err) => {
  console.error(`\n[smoke] ❌ erro inesperado: ${err.message}`)
  process.exit(1)
})