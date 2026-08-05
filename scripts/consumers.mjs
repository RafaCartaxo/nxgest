/**
 * Lista os arquivos que importam um componente/arquivo compartilhado (PLAN-044).
 *
 * Uso: node scripts/consumers.mjs <nome-do-componente>
 * Ex.: node scripts/consumers.mjs PageHeader   → lista quem usa o PageHeader
 *      node scripts/consumers.mjs Field         → lista quem usa o Field
 *      node scripts/consumers.mjs Card          → lista quem usa o Card
 *
 * Serve ao protocolo "mudou componente compartilhado → varre consumidores no
 * mesmo PR" (ver docs/engineering/design/02-DESIGN-SYSTEM.md / AGENTS.md).
 */
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, relative } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")
const srcDir = join(root, "frontend", "src")

const target = process.argv[2]
if (!target) {
  console.error("Uso: node scripts/consumers.mjs <componente>")
  process.exit(1)
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full)
  }
  return acc
}

const files = walk(srcDir)
const hits = []

for (const file of files) {
  const src = readFileSync(file, "utf8")
  // import { X } from "..."; / import X from "..."
  if (src.includes(`} from`)) {
    const re = new RegExp(`\\b${target}\\b`)
    if (re.test(src) && /^import/m.test(src)) hits.push(relative(root, file))
  }
}

if (hits.length === 0) {
  console.log(`Nenhum consumidor de "${target}".`)
  process.exit(0)
}
console.log(`Consumidores de "${target}" (${hits.length}):`)
for (const h of hits) console.log(`  ${h}`)
