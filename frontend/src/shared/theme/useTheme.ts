import { useContext } from "react"
import { ThemeContext } from "./ThemeProvider.js"
import type { ThemeMode } from "./ThemeProvider.js"

export { type ThemeMode }

export function useTheme() {
  return useContext(ThemeContext)
}
