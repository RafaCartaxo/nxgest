import { createContext, useCallback, useEffect, useState, type ReactNode } from "react"
import { isThemeId, type ThemeId } from "./themes.js"

const PALETTE_KEY = "nxgestao_palette"
const DARK_KEY = "nxgestao_dark"

interface ThemeContextValue {
  /** Paleta ativa (default/aurora/ocean/grape/sunset). */
  palette: ThemeId
  isDark: boolean
  setPalette: (id: ThemeId) => void
  toggleDark: () => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  palette: "default",
  isDark: false,
  setPalette: () => {},
  toggleDark: () => {},
})

function getInitialPalette(): ThemeId {
  const stored = localStorage.getItem(PALETTE_KEY)
  if (isThemeId(stored)) return stored
  return "default"
}

function getInitialDark(): boolean {
  const stored = localStorage.getItem(DARK_KEY)
  if (stored === "dark" || stored === "light") return stored === "dark"
  // compat com a chave antiga de tema (PLAN-013)
  const legacy = localStorage.getItem("theme")
  if (legacy === "dark" || legacy === "light") return legacy === "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function applyTheme(palette: ThemeId, isDark: boolean) {
  const root = document.documentElement
  root.dataset.theme = palette
  if (isDark) {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [palette, setPaletteState] = useState<ThemeId>(getInitialPalette)
  const [isDark, setIsDark] = useState<boolean>(getInitialDark)

  useEffect(() => {
    applyTheme(palette, isDark)
    localStorage.setItem(PALETTE_KEY, palette)
    localStorage.setItem(DARK_KEY, isDark ? "dark" : "light")
  }, [palette, isDark])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    function handleChange(e: MediaQueryListEvent) {
      const stored = localStorage.getItem(DARK_KEY)
      if (!stored) setIsDark(e.matches)
    }
    mq.addEventListener("change", handleChange)
    return () => mq.removeEventListener("change", handleChange)
  }, [])

  const setPalette = useCallback((id: ThemeId) => setPaletteState(id), [])
  const toggleDark = useCallback(() => setIsDark((prev) => !prev), [])

  return (
    <ThemeContext.Provider value={{ palette, isDark, setPalette, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}
