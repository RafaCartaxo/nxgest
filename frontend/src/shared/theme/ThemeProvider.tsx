import { createContext, useCallback, useEffect, useState, type ReactNode } from "react"
import { isThemeId, type ThemeId } from "./themes.js"
import { atualizarFavicon } from "./favicon.js"

export type ThemeMode = "light" | "dark" | "system"

const PALETTE_KEY = "nxgest_palette"
const MODE_KEY = "nxgest_mode"

interface ThemeContextValue {
  /** Paleta ativa (default/violeta/ocean/grape/sunset). */
  palette: ThemeId
  /** Modo de tema: claro/escuro/sistema (preferência do SO). */
  mode: ThemeMode
  /** Escuro efetivo (derivado do modo). */
  isDark: boolean
  setPalette: (id: ThemeId) => void
  setMode: (m: ThemeMode) => void
  toggleDark: () => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  palette: "default",
  mode: "system",
  isDark: false,
  setPalette: () => {},
  setMode: () => {},
  toggleDark: () => {},
})

function systemIsDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
}

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem(MODE_KEY)
  if (stored === "light" || stored === "dark" || stored === "system") return stored
  // compat com as chaves antigas de tema (PLAN-013/PLAN-046)
  const legacy = localStorage.getItem("nxgest_dark") ?? localStorage.getItem("theme")
  if (legacy === "dark" || legacy === "light") return legacy
  return "system"
}

function getInitialPalette(): ThemeId {
  let stored = localStorage.getItem(PALETTE_KEY)
  // migração legado: tema "aurora" -> "violeta" (padronização de nomenclatura)
  if (stored === "aurora") stored = "violeta"
  if (isThemeId(stored)) return stored
  return "default"
}

function applyTheme(palette: ThemeId, isDark: boolean) {
  const root = document.documentElement
  root.dataset.theme = palette
  root.classList.toggle("dark", isDark)
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [palette, setPaletteState] = useState<ThemeId>(getInitialPalette)
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode)
  const [systemDark, setSystemDark] = useState<boolean>(systemIsDark)

  const isDark = mode === "dark" ? true : mode === "light" ? false : systemDark

  useEffect(() => {
    applyTheme(palette, isDark)
    atualizarFavicon()
    localStorage.setItem(PALETTE_KEY, palette)
    localStorage.setItem(MODE_KEY, mode)
  }, [palette, mode, isDark])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    function handleChange(e: MediaQueryListEvent) {
      setSystemDark(e.matches)
    }
    mq.addEventListener("change", handleChange)
    return () => mq.removeEventListener("change", handleChange)
  }, [])

  const setPalette = useCallback((id: ThemeId) => setPaletteState(id), [])
  const setMode = useCallback((m: ThemeMode) => setModeState(m), [])
  const toggleDark = useCallback(() => {
    setModeState((prev) => {
      const darkNow = prev === "dark" || (prev === "system" && systemDark)
      return darkNow ? "light" : "dark"
    })
  }, [systemDark])

  return (
    <ThemeContext.Provider value={{ palette, mode, isDark, setPalette, setMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}
