/**
 * Favicon theme-aware (PLAN-058) — a marca NX é re-renderizada no ícone do site
 * com as cores EFETIVAS do tema (dark/light + 5 paletas + whitelabel), lidas do
 * `getComputedStyle` após o `applyTheme`. Fallback: o `favicon.svg` estático até
 * o JS rodar. Segurança: o SVG é construído só com valores de tokens internos
 * (nenhum input de usuário) via `encodeURIComponent`.
 *
 * Cores resolvidas para `rgb(...)` (probe element) de propósito: o rasterizador
 * de ícone do Android/shortcut não aceita `oklch()`/`var()` no SVG — só valores
 * concretos como `rgb(r, g, b)` (precedente: favicon "N solto com fundo branco").
 *
 * Geometria: variante `sm` do `Logo.tsx` — a LOGO (N + malha de nós + hub), não
 * o "N" isolado (`mono`). Full-bleed: viewBox quadrado sem `rx`.
 */

function cor(name: string, fallback: string): string {
  try {
    const probe = document.createElement("span")
    probe.style.display = "none"
    probe.style.color = `var(${name})`
    document.body.appendChild(probe)
    const resolved = getComputedStyle(probe).color
    probe.remove()
    return resolved && resolved !== "rgba(0, 0, 0, 0)" ? resolved : fallback
  } catch {
    return fallback
  }
}

/** Nós do "N" (variant sm) — [x, y]. */
const NOS_N = [
  [20, 18],
  [20, 46],
  [44, 18],
  [44, 46],
]

/** Nós de malha decorativos (variant sm) — fill accent. */
const NOS_MALHA_SM = [
  [9, 27],
  [55, 25],
  [32, 57],
]

/** Arestas da malha: do nó de malha até o vértice do N mais próximo. */
const MALHA_EDGES_SM: Array<[number, number, number, number]> = [
  [9, 27, 20, 18],
  [55, 25, 44, 18],
  [32, 57, 20, 46],
  [32, 57, 44, 46],
]

export function atualizarFavicon(): void {
  if (typeof document === "undefined") return
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]')
  if (!link) return

  const primary = cor("--color-primary", "#1D3F9E")
  const fg = cor("--color-primary-foreground", "#F3F6FF")
  const accent = cor("--color-accent", "#2DD4BF")

  const nosN = NOS_N.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6"/>`).join("")
  const nosMalha = NOS_MALHA_SM.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4"/>`).join("")
  const arestas = MALHA_EDGES_SM.map(
    ([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`,
  ).join("")

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">`,
    `<rect width="64" height="64" fill="${primary}"/>`, // full-bleed, sem rx (sem cantos transparentes)
    `<g stroke="${fg}" stroke-width="2.8" stroke-linecap="round" opacity="0.32">${arestas}</g>`, // malha
    `<path d="M20 46 L20 18 L44 46 L44 18" stroke="${fg}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`, // o "N"
    `<g fill="${accent}">${nosMalha}</g>`, // nós de malha (accent)
    `<g fill="${fg}">${nosN}</g>`, // nós do N
    `<circle cx="32" cy="32" r="7" fill="${accent}"/>`, // hub central (o Nexus)
    `<circle cx="32" cy="32" r="3.6" fill="${fg}"/>`,
    `</svg>`,
  ].join("")

  link.type = "image/svg+xml"
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
}
