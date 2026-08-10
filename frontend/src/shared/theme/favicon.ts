/**
 * Favicon theme-aware (PLAN-058) — a marca NX é re-renderizada no ícone do site
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
 * Geometria idêntica ao `Logo.tsx` (variant mono — "N" primário centralizado +
 * hub, sem malha) e ao `public/favicon.svg`, com as cores EFETIVAS do tema.
 * Full-bleed: viewBox quadrado sem `rx`, para não deixar cantos transparentes.
 */
export function atualizarFavicon(): void {
  if (typeof document === "undefined") return
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) return

  const primary = cor("--color-primary", "#1D3F9E")
  const fg = cor("--color-primary-foreground", "#F3F6FF")
  const accent = cor("--color-accent", "#2DD4BF")

  // Nós do "N" (variant mono) — [x, y]
  const nos = [
    [20, 18],
    [20, 46],
    [44, 18],
    [44, 46],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4"/>`)
    .join("")

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">`,
    `<rect width="64" height="64" fill="${primary}"/>`, // full-bleed, sem rx (sem cantos transparentes)
    `<path d="M20 46 L20 18 L44 46 L44 18" stroke="${fg}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`, // o "N"
    `<g fill="${fg}">${nos}</g>`,
    `<circle cx="32" cy="32" r="8" fill="${accent}"/>`, // hub central (o Nexus)
    `<circle cx="32" cy="32" r="4.6" fill="${fg}"/>`,
    `</svg>`,
  ].join("")

  link.type = "image/svg+xml"
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
}
