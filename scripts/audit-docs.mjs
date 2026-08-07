/**
 * Auditoria de consistência da documentação (SKILL-009).
 *
 * Cruza:
 *   1. Rotas reais (src) ↔ 02-API.md
 *   2. Rotas reais ↔ 07-CASOS-DE-USO-API.md
 *   3. Rotas reais ↔ api-collection.json
 *   4. Rotas front (App.tsx) ↔ 05-MAPEAMENTO-TELAS.md
 *   5. Contagens (telas/módulos) ↔ 04-ROADMAP.md
 *
 * Uso: node scripts/audit-docs.mjs [--strict]
 * Sem --strict: relatório, exit 0. Com --strict: exit 1 se houver divergência.
 */
import { readFileSync, readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")
const strict = process.argv.includes("--strict")

const problems = []
const report = (severity, msg) => problems.push({ severity, msg })

/** Normaliza um path: remove barra final, converte {x}/{{x}}/:x para :param. */
function norm(path) {
  return ("/" + path)
    .replace(/\/+/g, "/")
    .replace(/\{\{?[a-zA-Z0-9]+\}?\}/g, ":param")
    .replace(/:[a-zA-Z0-9]+/g, ":param")
    .replace(/\/$/, "")
}

// ---------- 1. Rotas reais do backend ----------
function realBackendRoutes() {
  const mainSrc = readFileSync(join(root, "src/main.ts"), "utf8")

  // main.ts: mapeia nome do router (authRoutes, clienteRoutes...) → mount (/api/auth, ...)
  // `.*?` atravessa middlewares com parênteses (ex.: requireModule("clientes")).
  const mountByVar = new Map()
  for (const m of mainSrc.matchAll(/app\.use\(\s*"(\/api\/[^"]+)",.*?\b(\w+Routes)\)/g)) {
    mountByVar.set(m[2], m[1])
  }

  const routesDir = join(root, "src/modules")
  const files = []
  const walk = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name)
      if (f.isDirectory()) walk(p)
      else if (/\.routes\.ts$/.test(f.name)) files.push(p)
    }
  }
  walk(routesDir)

  // nome exportado → src (p/ resolver mounts aninhados via router.use)
  const srcByVar = new Map()
  for (const file of files) {
    const src = readFileSync(file, "utf8")
    const name = src.match(/export\s*\{\s*router\s+as\s+(\w+Routes)\s*\}/)?.[1]
    if (name) srcByVar.set(name, src)
  }

  // Sub-routers montados com `router.use(<path>, <NameRoutes>)` dentro de outro
  // router (ex.: anexoRoutes sob `/api/clientes/:id/anexos`). Propaga os mounts.
  let changed = true
  while (changed) {
    changed = false
    for (const [name, src] of srcByVar) {
      const mount = mountByVar.get(name)
      if (!mount) continue
      for (const m of src.matchAll(/router\.use\(\s*"([^"]+)",[\s\S]*?(\w+Routes)\s*\)/g)) {
        const childMount = norm(mount + m[1])
        if (mountByVar.get(m[2]) !== childMount) {
          mountByVar.set(m[2], childMount)
          changed = true
        }
      }
    }
  }

  const out = new Set()
  for (const [name, src] of srcByVar) {
    const mount = mountByVar.get(name)
    if (!mount) continue
    const pats = [...src.matchAll(/router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g)]
    for (const [, method, path] of pats) {
      out.add(`${method.toUpperCase()} ${norm(mount + path)}`)
    }
  }
  return [...out].sort()
}

// ---------- 2. Endpoints em 02-API.md ----------
function docEndpoints() {
  const src = readFileSync(join(root, "docs/engineering/02-API.md"), "utf8")
  const out = new Set()
  for (const m of src.matchAll(/^# (GET|POST|PUT|PATCH|DELETE) (\S+)/gm)) {
    out.add(`${m[1].toUpperCase()} ${norm(m[2])}`)
  }
  // fallback: tabelas de endpoints (| GET | `/api/...` |)
  for (const m of src.matchAll(/\|\s*(GET|POST|PUT|PATCH|DELETE)\s*\|\s*`(\/api\/[^`]+)`/g)) {
    out.add(`${m[1].toUpperCase()} ${norm(m[2])}`)
  }
  return [...out].sort()
}

// ---------- 3. UCs/CTs em 07-CASOS-DE-USO-API.md ----------
function apiUseCases() {
  const src = readFileSync(join(root, "docs/product/07-CASOS-DE-USO-API.md"), "utf8")
  const out = new Set()
  for (const m of src.matchAll(/\*\*Endpoint:\*\*\s*`(GET|POST|PUT|PATCH|DELETE) ([^`]+)`/g)) {
    out.add(`${m[1].toUpperCase()} ${norm(m[2].split("·")[0].trim())}`)
  }
  return [...out].sort()
}

// ---------- 4. Requests da collection ----------
function collectionRequests() {
  const data = JSON.parse(readFileSync(join(root, "docs/api-collection.json"), "utf8"))
  const out = new Set()
  const walk = (items) => {
    for (const it of items) {
      if (it.request) {
        const path = "/" + it.request.url.path.join("/")
        out.add(`${it.request.method.toUpperCase()} ${norm(path)}`)
      }
      if (it.item) walk(it.item)
    }
  }
  walk(data.item)
  return [...out].sort()
}

// ---------- 5. Rotas do frontend (App.tsx) ----------
function frontRoutes() {
  const src = readFileSync(join(root, "frontend/src/App.tsx"), "utf8")
  const out = new Set()
  for (const m of src.matchAll(/<Route\s+path="([^"]+)"/g)) {
    if (m[1] === "*") continue
    out.add(norm(m[1]))
  }
  return [...out].sort()
}

// ---------- 6. Rotas no mapeamento de telas ----------
function mappingRoutes() {
  const src = readFileSync(join(root, "docs/engineering/05-MAPEAMENTO-TELAS.md"), "utf8")
  const out = new Set()
  for (const m of src.matchAll(/^\|\s*\d+[a-z]?\s*\|.*\| `([^`]+)` \|/gm)) {
    out.add(norm(m[1]))
  }
  return [...out].sort()
}

// ---------- Contagens ----------
function screensInApp() {
  const routes = frontRoutes()
  return routes.filter((r) => r !== "/login").length
}
// ---------- Execução ----------
const back = realBackendRoutes()
const doc = docEndpoints()
const ucs = apiUseCases()
const col = collectionRequests()
const front = frontRoutes()
const map = mappingRoutes()

// 1) código ↔ 02-API
for (const r of back) if (!doc.includes(r)) report("warn", `ROTA SEM DOC em 02-API.md: ${r}`)
for (const r of doc) if (!back.includes(r)) report("warn", `DOC SEM ROTA no código (02-API.md): ${r}`)

// 2) código ↔ 07
for (const r of back) if (!ucs.includes(r)) report("warn", `ROTA SEM UC/CT em 07-CASOS-DE-USO-API.md: ${r}`)
for (const r of ucs) if (!back.includes(r)) report("error", `UC REFERENCIA ENDPOINT INEXISTENTE (07): ${r}`)

// 3) código ↔ collection
for (const r of back) if (!col.includes(r)) report("warn", `ROTA SEM COLLECTION (api-collection.json): ${r}`)
for (const r of col) if (!back.includes(r)) report("warn", `COLLECTION COM ROTA INEXISTENTE: ${r}`)

// 4) front ↔ mapeamento
for (const r of front) if (!map.includes(r)) report("warn", `TELA FORA DO MAPEAMENTO (05): ${r}`)
for (const r of map) if (!front.includes(r)) report("error", `MAPEAMENTO COM TELA INEXISTENTE (05): ${r}`)

// 5) contagens
const screenCount = screensInApp()
const mapCount = map.filter((r) => r !== "/login").length
if (screenCount !== mapCount) {
  report("warn", `CONTAGEM DE TELAS DIVERGENTE: App.tsx=${screenCount} × 05-MAPEAMENTO=${mapCount}`)
}

console.log("=== AUDITORIA DE DOCUMENTAÇÃO (SKILL-009) ===\n")
console.log(`Rotas backend reais   : ${back.length}`)
console.log(`Endpoints em 02-API   : ${doc.length}`)
console.log(`UCs/CTs em 07         : ${ucs.length}`)
console.log(`Requests collection   : ${col.length}`)
console.log(`Rotas frontend        : ${front.length}`)
console.log(`Telas mapeadas        : ${map.length}`)
console.log("")

if (problems.length === 0) {
  console.log("✅ Nenhuma divergência encontrada.")
} else {
  const errs = problems.filter((p) => p.severity === "error")
  const warns = problems.filter((p) => p.severity === "warn")
  for (const p of problems) console.log(`${p.severity === "error" ? "🔴" : "🟡"} [${p.severity.toUpperCase()}] ${p.msg}`)
  console.log(`\n${warns.length} avisos · ${errs.length} erros`)
  if (strict && errs.length > 0) process.exit(1)
}
