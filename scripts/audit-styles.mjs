/**
 * Auditoria de estilos (PLAN-035) — proíbe cores fixas da paleta no frontend.
 *
 * O tema é 100% dirigido por CSS variables (--color-*, gradientes). Classes
 * Tailwind hardcoded da paleta (blue/red/green/yellow/gray/...) contornam os
 * tokens e fazem o tema "não pegar". Este script falha se encontrar qualquer
 * uma delas em `frontend/src`.
 *
 *   blue → primary     (segue a paleta)
 *   red  → danger      (semântico)
 *   green→ success     (semântico)
 *   yellow→warning     (semântico)
 *   gray → text-muted / surface-secondary
 *
 * Uso: node scripts/audit-styles.mjs
 * Exit 0 = limpo. Exit 1 = ocorrência(s) encontrada(s).
 */
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, relative } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")
const srcDir = join(root, "frontend", "src")

const PALETTE = ["blue", "indigo", "violet", "purple", "teal", "emerald", "orange", "red", "green", "gray", "slate", "zinc", "yellow", "amber"]
const PREFIXES = ["bg", "text", "border", "ring", "focus:ring", "focus:border"]
const RE = new RegExp(`\\b(${PREFIXES.join("|")})-(?:${PALETTE.join("|")})-[0-9]{2,3}\\b`, "g")

/** Lista recursiva de .ts/.tsx em frontend/src. */
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, acc)
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full)
    }
  }
  return acc
}

const files = walk(srcDir)
const matches = []

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n")
  lines.forEach((line, i) => {
    RE.lastIndex = 0
    const found = line.match(RE)
    if (found) {
      matches.push(`${relative(root, file)}:${i + 1} → ${found.join(", ")}`)
    }
  })
}

if (matches.length > 0) {
  console.error(`✗ ${matches.length} classe(s) fixa(s) da paleta encontrada(s) — usar tokens (primary/danger/success/warning/text-muted):\n`)
  for (const m of matches) console.error(`  ${m}`)
  console.error("\n→ Corrija ou o tema continuará não refletindo nesses componentes.")
  process.exit(1)
}

// PLAN-080 (D14): gráficos devem usar cor do tema via `resolveChartColor` — nunca
// literal de cor no arquivo de gráfico (Recharts não aceita `var()` no path SVG, e
// hex fixo burlaria os tokens). A fonte autorizada é `utils/chartColors.ts` (fallbacks).
const HEX_RE = /(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\()/gi
const chartScope = file => /(modules[\\/]insights[\\/]|components[\\/]ChartCard[\\/])/.test(file)
const hexMatches = []
for (const file of files) {
  if (!chartScope(file)) continue
  const lines = readFileSync(file, "utf8").split("\n")
  lines.forEach((line, i) => {
    HEX_RE.lastIndex = 0
    const found = line.match(HEX_RE)
    if (found) hexMatches.push(`${relative(root, file)}:${i + 1} → ${found.join(", ")}`)
  })
}
if (hexMatches.length > 0) {
  console.error(`✗ ${hexMatches.length} cor(es) literal(is) em arquivo de gráfico — usar resolveChartColor() do tema (PLAN-080):\n`)
  for (const m of hexMatches) console.error(`  ${m}`)
  console.error("\n→ Corrija ou o gráfico não seguirá o tema (dark/paletas/whitelabel).")
  process.exit(1)
}

console.log(`✓ audit:styles — ${files.length} arquivos varridos, nenhuma cor fixa da paleta nem hex em gráficos (PLAN-035/080)`)
