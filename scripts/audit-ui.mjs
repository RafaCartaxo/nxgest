/**
 * Auditoria de UI (PLAN-044/048/049) — falha se padrões legado ou fora-do-canônico aparecerem.
 *
 * O redesign (PLAN-038/039/040/043/047/048) migrou para componentes canônicos e tokens
 * (PageHeader limpo, Card rounded-xl bg-card, Field/FieldSelect/FieldTextarea rounded-xl border-strong,
 * Modal com title/descricao/footer, Tabs, Switch, StatusBadge com dot). Padrões ANTIGOS ou
 * divergentes não podem voltar — este script é a regressão mecânica do anti-drift.
 *
 * Uso: node scripts/audit-ui.mjs
 * Exit 0 = limpo. Exit 1 = padrão legado/fora-do-canônico encontrado.
 */
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, relative } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")
const srcDir = join(root, "frontend", "src")

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full)
  }
  return acc
}

const files = walk(srcDir)
const matches = []
const rel = (f) => relative(root, f)

function check(file, re, msg, lineFilter) {
  const lines = readFileSync(file, "utf8").split("\n")
  lines.forEach((line, i) => {
    if (lineFilter && !lineFilter(line)) return
    re.lastIndex = 0
    if (re.test(line)) matches.push(`${rel(file)}:${i + 1} → ${msg}`)
  })
}

const inModules = (f) => f.includes(`${join("frontend", "src", "modules")}`) || f.includes("frontend/src/modules")
const notSkeleton = (line) => !line.includes("animate-pulse")
const notButtonFile = (f) => !f.includes("shared/components/Button.tsx")
const notTabsFile = (f) => !f.includes("shared/components/Tabs/")
const notFieldDir = (f) => !f.includes("shared/components/Field/")

for (const file of files) {
  // 1) rounded-md fora de skeleton em módulos (inputs/rows antigos)
  if (inModules(file)) check(file, /\brounded-md\b/, "rounded-md (padrão antigo) — usar rounded-xl / Field", notSkeleton)

  // 2) token antigo de skeleton/superfície
  check(file, /\bbg-secondary-light\b/, "bg-secondary-light (token antigo) — usar bg-surface-hover")

  // 3) barra lateral antiga de card
  check(file, /\bborder-l-(danger|info|success|warning|primary)\b/, "border-l-* (barra lateral antiga) — usar tone do Card")

  // 4) variante removida do Button
  check(file, /variant=["']onDark["']/, "variant=\"onDark\" (removido no PLAN-038)")

  // 5) componente removido da Central
  check(file, /\bRotaCobrancaSection\b/, "RotaCobrancaSection (removida no PLAN-038) — usar ação rápida 'Minha rota'")

  // 6) gradiente de marca fora do Button primário
  if (notButtonFile(file)) check(file, /\bbg-gradient-accent\b/, "bg-gradient-accent fora do Button (banner antigo)")

  // 7) grid fixo antigo do QuickActions
  check(file, /grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4/, "grid fixo antigo do QuickActions — usar grade adaptativa")

  // 8) select/textarea cru fora do Field (PLAN-048)
  if (inModules(file) && notFieldDir(file)) {
    check(file, /<select\b/, "<select> cru — usar FieldSelect (PLAN-048)")
    check(file, /<textarea\b/, "<textarea> cru — usar FieldTextarea (PLAN-048)")
  }

  // 9) header inline de modal (PLAN-048) — title/descricao/footer são do Modal
  check(file, /flex items-center justify-between border-b border-border-light px-4 py-3/, "header inline de modal — usar title do Modal (PLAN-048)")

  // 10) pills cruas fora do Tabs (PLAN-048)
  if (notTabsFile(file)) check(file, /role="tab"/, "role=\"tab\" fora do Tabs — usar Tabs (PLAN-048)")
}

// 11) <Modal> sem title (PLAN-048) — assinatura Lovable obrigatória
for (const file of files) {
  if (file.includes("shared/components/Modal/Modal.tsx")) continue
  const lines = readFileSync(file, "utf8").split("\n")
  lines.forEach((line, i) => {
    if (!line.includes("<Modal")) return
    const window = lines.slice(i, i + 12).join("\n")
    if (!window.includes("title=")) matches.push(`${rel(file)}:${i + 1} → <Modal> sem title (PLAN-048)`)
  })
}

if (matches.length > 0) {
  console.error(`✗ audit:ui — ${matches.length} ocorrência(s) de padrão legado/fora-do-canônico:\n`)
  for (const m of matches) console.error(`  ${m}`)
  console.error("\n→ Migre para o padrão canônico (Card/Field/FieldSelect/Modal title/Tabs/Switch). Ver docs/engineering/design/UI-COVERAGE.md.")
  process.exit(1)
}

console.log(`✓ audit:ui — ${files.length} arquivos varridos, nenhum padrão legado/fora-do-canônico (PLAN-044/048/049)`)

