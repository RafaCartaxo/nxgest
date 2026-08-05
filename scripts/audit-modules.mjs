/**
 * Auditoria de módulos (PLAN-045) — valida o Module Manifest do whitelabel.
 *
 * Checa, sem compilar TS (lê os fontes):
 *   1. IDs e dependências do backend batem com o espelho do frontend;
 *   2. grafo de dependências NÃO tem ciclo;
 *   3. todo `dependsOn` aponta para um módulo válido;
 *   4. cada widget da Central tem UM único módulo dono.
 *
 * Uso: node scripts/audit-modules.mjs
 * Exit 0 = limpo. Exit 1 = incoerência no manifest.
 */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")

const backend = readFileSync(join(root, "src/modules/admin/domain/modules.ts"), "utf8")
const frontend = readFileSync(join(root, "frontend/src/shared/modules/modules.ts"), "utf8")

const errors = []
const ok = (msg) => console.log(`  ✓ ${msg}`)
const fail = (msg) => errors.push(msg)

// 1) Backend: id -> dependsOn (do MODULE_MANIFEST)
const backendDeps = new Map()
for (const m of backend.matchAll(/(\w+):\s*\{\s*labelKey[\s\S]*?dependsOn:\s*\[([^\]]*)\]/g)) {
  backendDeps.set(m[1], m[2].split(",").map((s) => s.trim().replace(/["']/g, "")).filter(Boolean))
}
if (backendDeps.size === 0) fail("backend: MODULE_MANIFEST não parseado (estrutura mudou?)")

// 2) Frontend: id -> dependsOn (do MODULES)
const frontendDeps = new Map()
for (const m of frontend.matchAll(/\{ id: "(\w+)", labelKey: "[^"]+", dependsOn: \[([^\]]*)\]/g)) {
  frontendDeps.set(m[1], m[2].split(",").map((s) => s.trim().replace(/["']/g, "")).filter(Boolean))
}
if (frontendDeps.size === 0) fail("frontend: MODULES não parseado (estrutura mudou?)")

// 3) Frontend: MODULE_WIDGETS (dono por módulo)
const widgetsByModule = new Map()
const wm = frontend.match(/MODULE_WIDGETS[^{]*=\s*\{([\s\S]*?)\n\}/)
if (wm) {
  for (const line of wm[1].split("\n")) {
    const mm = line.match(/(\w+):\s*\[([^\]]*)\]/)
    if (mm) widgetsByModule.set(mm[1], mm[2].split(",").map((s) => s.trim().replace(/["']/g, "")).filter(Boolean))
  }
} else {
  fail("frontend: MODULE_WIDGETS não encontrado")
}

// --- Verificações ---
const backendIds = [...backendDeps.keys()].sort()
const frontendIds = [...frontendDeps.keys()].sort()

console.log(`Módulos backend (${backendIds.length}): ${backendIds.join(", ")}`)
console.log(`Módulos frontend (${frontendIds.length}): ${frontendIds.join(", ")}`)

if (JSON.stringify(backendIds) !== JSON.stringify(frontendIds)) {
  fail(`IDs divergem: backend=[${backendIds}] × frontend=[${frontendIds}]`)
} else {
  ok("IDs backend = frontend")
}

// Deps espelham
const diffDeps = backendIds.filter((id) => JSON.stringify(backendDeps.get(id) ?? []) !== JSON.stringify(frontendDeps.get(id) ?? []))
if (diffDeps.length > 0) fail(`dependsOn divergem em: ${diffDeps.join(", ")}`)
else ok("dependências backend = frontend")

// Deps válidas
for (const [id, deps] of backendDeps) {
  const invalid = deps.filter((d) => !backendDeps.has(d))
  if (invalid.length) fail(`módulo "${id}" depende de módulo inválido: ${invalid.join(", ")}`)
}
ok("dependências apontam para módulos válidos")

// Ciclo no grafo
const seen = new Set()
function visit(id, trail) {
  if (seen.has(id)) return
  if (trail.includes(id)) throw new Error(`ciclo: ${[...trail, id].join(" -> ")}`)
  trail.push(id)
  for (const d of backendDeps.get(id) ?? []) visit(d, trail)
  trail.pop()
  seen.add(id)
}
try {
  for (const id of backendIds) visit(id, [])
  ok("grafo de dependências sem ciclo")
} catch (e) {
  fail(e.message)
}

// Widgets: um dono por widget
const allWidgets = new Map()
for (const [mod, widgets] of widgetsByModule) {
  for (const w of widgets) {
    if (allWidgets.has(w)) fail(`widget "${w}" tem mais de um dono: ${allWidgets.get(w)} e ${mod}`)
    else allWidgets.set(w, mod)
  }
}
if (allWidgets.size > 0) ok(`widgets da Central registrados (${allWidgets.size}, ${[...allWidgets.values()].filter((v, i, a) => a.indexOf(v) === i).join(", ")})`)

if (errors.length > 0) {
  console.error(`\n✗ audit:modules — ${errors.length} incoerência(s):`)
  for (const e of errors) console.error(`  ${e}`)
  console.error("\n→ Corrija o Module Manifest (docs/plans/PLAN-045 + UI-COVERAGE).")
  process.exit(1)
}
console.log("\n✓ audit:modules — manifest coerente (PLAN-045)")
