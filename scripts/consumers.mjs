/** Direct consumers of imported UI symbols; shared source walker. */
import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
export function walkSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? walkSourceFiles(file) : entry.isFile() ? [file] : []
  }).sort()
}
async function main() {
  const target = process.argv[2]
  if (!target) { console.error("Uso: node scripts/consumers.mjs <componente>"); process.exitCode = 1 }
  else {
    const { buildInventory } = await import("./ui-inventory.mjs")
    const hits = buildInventory().files.filter(file => file.imports.some(item => item.symbols.some(symbol => symbol.imported === target || symbol.local === target)))
    console.log(`Consumidores diretos de "${target}" (${hits.length}):`)
    for (const file of hits) console.log(`  ${file.path}`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1 })
