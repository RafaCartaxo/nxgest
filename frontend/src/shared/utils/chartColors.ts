import { useContext, useMemo } from "react"
import { ThemeContext } from "../theme/ThemeProvider.js"

const FALLBACKS: Record<string, string> = {
  "--color-primary": "#1D3F9E",
  "--color-success": "#16a34a",
  "--color-warning": "#d97706",
  "--color-danger": "#dc2626",
  "--color-text-muted": "#5b626f",
}

/**
 * Resolve a cor EFETIVA de um token do tema para uso em gráficos (PLAN-080).
 *
 * Recharts precisa de cor concreta no `stroke`/`fill` (não aceita `var(--x)`
 * no path SVG). Técnica de sonda (precedente: `shared/theme/favicon.ts`):
 * um `<span>` com `color: var(--x)` lido via `getComputedStyle` — o valor
 * devolvido é o EFETIVO após `applyTheme` (dark + 5 paletas + `--tenant-primary`).
 *
 * jsdom não resolve `var()`/`color-mix()` sem CSS (getComputedStyle devolve ""),
 * então o CT deve asserir o FALLBACK — nunca a cor real.
 */
export function resolveChartColor(token: string, fallback?: string): string {
  const fb = fallback ?? FALLBACKS[token] ?? "#1D3F9E"
  if (typeof document === "undefined") return fb
  try {
    const probe = document.createElement("span")
    probe.style.display = "none"
    probe.style.color = `var(${token})`
    document.body.appendChild(probe)
    const resolved = getComputedStyle(probe).color
    probe.remove()
    // jsdom não resolve `var()`/`color-mix()` sem CSS — devolve o literal `var(...)`
    // (ou ""/transparent). Só valores resolvidos contam; o resto cai no fallback.
    if (
      resolved &&
      !resolved.includes("var(") &&
      resolved !== "rgba(0, 0, 0, 0)" &&
      resolved !== "transparent"
    ) {
      return resolved
    }
    return fb
  } catch {
    return fb
  }
}

/**
 * Hook de cores de série para gráficos (F1-f7): assina o `ThemeContext`
 * (palette/modo) e re-resolve as cores quando o tema muda — a troca de
 * paleta/dark re-renderiza e o `resolveChartColor` lê o valor EFETIVO.
 */
export function useChartTheme(): string[] {
  const theme = useContext(ThemeContext)
  return useMemo(
    () => [
      resolveChartColor("--color-primary"),
      resolveChartColor("--color-success"),
      resolveChartColor("--color-warning"),
      resolveChartColor("--color-danger"),
      resolveChartColor("--color-text-muted"),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme.palette, theme.mode, theme.isDark],
  )
}