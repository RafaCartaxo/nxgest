/**
 * Auditoria de links e referências da documentação (PLAN-084 · Bloco 5).
 *
 * Verifica:
 *   1. Links internos Markdown (`](alvo)`) em docs/** + README.md + AGENTS.md
 *      — o arquivo alvo existe e a âncora (#secao) bate com um header;
 *   2. Wikilinks Obsidian (`[[alvo]]`), se houver;
 *   3. Arquivos .md órfãos (não referenciados por nenhum outro doc) — warn.
 *
 * Uso: node scripts/audit-links.mjs [--strict]
 * Sem --strict: relatório, exit 0 se só houver warns. Com --strict: exit 1
 * em qualquer problema (mesmo severidade warn).
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, resolve, relative } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")
const strict = process.argv.includes("--strict")

const problems = []
const report = (severity, msg) => problems.push({ severity, msg })

const mdFiles = []
const walk = (p) => {
  if (!existsSync(p)) return
  if (!statSync(p).isDirectory()) {
    if (p.endsWith(".md")) mdFiles.push(p)
    return
  }
  for (const e of readdirSync(p, { withFileTypes: true })) {
    const child = join(p, e.name)
    if (e.isDirectory()) walk(child)
    else if (e.name.endsWith(".md")) mdFiles.push(child)
  }
}
for (const d of ["docs", "README.md", "AGENTS.md"]) {
  walk(join(root, d))
}

const sourceFiles = mdFiles.filter((f) => f.endsWith(".md"))

function normalizeAnchor(raw) {
  return raw
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

function headersOf(file) {
  if (!existsSync(file) || !statSync(file).isFile()) return []
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => /^#{1,6}\s+/.test(l))
    .map((l) => normalizeAnchor(l.replace(/^#+\s+/, "")))
}

for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8")
  const base = dirname(file)

  const checkTarget = (raw) => {
    raw = raw.trim()
    if (!raw || /^(https?:|mailto:|data:)/.test(raw)) return
    const [pathPart, anchorPart] = raw.split("#")
    const isAnchorOnly = !pathPart.trim()
    let targetFile = file
    if (!isAnchorOnly) {
      targetFile = resolve(base, pathPart.split("?")[0])
      if (!existsSync(targetFile)) {
        report("error", `${relative(root, file)} -> link quebrado: ${raw}`)
        return
      }
      if (statSync(targetFile).isDirectory()) return
      if (!statSync(targetFile).isFile()) {
        report("error", `${relative(root, file)} -> link quebrado: ${raw}`)
        return
      }
    }
    if (anchorPart && !normalizeAnchor(anchorPart).length) return
    const anchors = isAnchorOnly ? headersOf(file) : headersOf(targetFile)
    if (anchorPart && !anchors.includes(normalizeAnchor(anchorPart))) {
      report("error", `${relative(root, file)} -> âncora não encontrada: ${raw}`)
    }
  }

  for (const m of text.matchAll(/\]\(([^)]+)\)/g)) checkTarget(m[1])
  for (const m of text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)) checkTarget(m[1])
}

// ---------- Órfãos: .md em docs/ nunca referenciado por outro .md ----------
const referenced = new Set()
for (const f of sourceFiles) {
  const base = dirname(f)
  const text = readFileSync(f, "utf8")
  for (const m of text.matchAll(/\]\(([^)#]+)/g)) {
    const t = m[1].split("?")[0].trim()
    if (!t || /^(https?:|mailto:|data:)/.test(t)) continue
    referenced.add(resolve(base, t))
  }
  for (const m of text.matchAll(/\[\[([^\]|#]+)/g)) {
    const t = m[1].split("?")[0].trim()
    if (!t || /^(https?:|mailto:|data:)/.test(t)) continue
    referenced.add(resolve(base, t))
  }
}
for (const f of mdFiles) {
  if (f.startsWith(join(root, "docs")) && !referenced.has(f)) {
    report("warn", `arquivo órfão (não referenciado): ${relative(root, f)}`)
  }
}

const errors = problems.filter((p) => p.severity === "error")
const warns = problems.filter((p) => p.severity === "warn")
for (const p of problems) console.log(`${p.severity === "error" ? "✗" : "⚠"} ${p.msg}`)
console.log(
  `audit:links — ${errors.length} erro(s), ${warns.length} warn(s), ${sourceFiles.length} arquivos varridos`
)
if (errors.length || (strict && warns.length)) process.exit(1)