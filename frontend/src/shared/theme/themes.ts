export const THEMES = [
  { id: "default", labelKey: "theme.default" },
  { id: "violeta", labelKey: "theme.violeta" },
  { id: "ocean", labelKey: "theme.ocean" },
  { id: "grape", labelKey: "theme.grape" },
  { id: "sunset", labelKey: "theme.sunset" },
] as const

export type ThemeId = (typeof THEMES)[number]["id"]

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && THEMES.some((t) => t.id === value)
}
