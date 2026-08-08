/**
 * Favicon theme-aware (PLAN-058) — a marca Nexus é re-renderizada no ícone do site
 * com as cores EFETIVAS do tema (dark/light + 5 paletas + whitelabel), lidas do
 * `getComputedStyle` após o `applyTheme`. Fallback: o `favicon.svg` estático até
 * o JS rodar. Segurança: o SVG é construído só com valores de tokens internos
 * (nenhum input de usuário) via `encodeURIComponent`.
 */

function cor(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

/**
 * Geometria idêntica ao `Logo.tsx` (variant sm — marca Nexus real: malha + hub + haste + "N")
 * e ao `public/favicon.svg`, com as cores EFETIVAS do tema.
 */
export function atualizarFavicon(): void {
  if (typeof document === "undefined") return
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) return

  const primary = cor("--color-primary", "#2563EB")
  const fg = cor("--color-primary-foreground", "#F3F6FF")
  const accent = cor("--color-accent", "#2DD4BF")

  // Arestas da malha reduzida (Logo.tsx variant sm) — [x1, y1, x2, y2]
  const edges: Array<[number, number, number, number]> = [
    [46, 30, 22, 46], [46, 30, 50, 72], [46, 30, 76, 40], [22, 46, 30, 84],
    [30, 84, 50, 72], [50, 72, 86, 78], [76, 40, 92, 34], [76, 40, 86, 78],
    [50, 72, 64, 108], [86, 78, 64, 108],
  ]
  const lines = edges
    .map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`)
    .join("")

  // Nós não-destaque (fill fg) vs destaque (fill accent)
  const nodesFg = [[46, 30], [30, 84], [76, 40], [86, 78]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`)
    .join("")

  const nodesAccent = [[22, 46], [50, 72], [92, 34], [64, 108]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`)
    .join("")

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 124" fill="none">`,
    `<rect width="112" height="124" rx="26" fill="${primary}"/>`,
    `<g stroke="${fg}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${lines}` +
      `<path d="M66 108 L74 118 Q76 124 70 124 L54 124 Q48 124 50 118 L50 102"/>` + // haste inferior (tronco)
      `<path d="M22 46 L22 84 M22 46 L50 72 M50 72 L50 34" opacity="0.28"/>` + // traço do "N"
      `</g>`,
    `<g fill="${fg}">${nodesFg}</g>`,
    `<g fill="${accent}">${nodesAccent}<circle cx="40" cy="58" r="12.5"/></g>`, // hub central (Nexus)
    `<circle cx="40" cy="58" r="7" fill="${fg}" opacity="0.85"/>`,
    `</svg>`,
  ].join("")

  link.type = "image/svg+xml"
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
}
