// PLAN-079 (F4): verifica consistência do build de frontend — todo asset (js/css)
// referenciado pelo index.html existe de fato em dist/. Evita deploy com
// index.html/assets divergentes (cenário que misturou hashes de chunks).
//
// Uso: node scripts/check-dist.mjs [caminho-do-dist]
// Saída: 0 se ok, 1 se algum asset faltar.

import { readFileSync, existsSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = process.argv[2] ?? path.resolve(__dirname, "../frontend/dist")

const indexHtml = path.join(dist, "index.html")
if (!existsSync(indexHtml)) {
  console.error(`[check-dist] index.html não encontrado em ${indexHtml}`)
  process.exit(1)
}

const html = readFileSync(indexHtml, "utf8")
const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])

const missing = refs.filter((ref) => !existsSync(path.join(dist, ref.replace(/^\//, ""))))

if (missing.length > 0) {
  console.error(`[check-dist] ${missing.length} asset(s) referenciado(s) e ausente(s):`)
  for (const m of missing) console.error(`  - ${m}`)
  process.exit(1)
}

console.log(`[check-dist] OK — ${refs.length} asset(s) referenciado(s) em index.html, todos presentes em ${dist}`)
