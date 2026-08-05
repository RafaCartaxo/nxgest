import { useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Moon, Sun, Globe, Palette, Check } from "lucide-react"
import { useTheme } from "../theme/useTheme.js"
import { THEMES } from "../theme/themes.js"

const SWATCHES: Record<string, string> = {
  default: "linear-gradient(135deg,#2563EB,#7C3AED)",
  aurora: "linear-gradient(135deg,#4F46E5,#DB2777)",
  ocean: "linear-gradient(135deg,#0EA5E9,#14B8A6)",
  grape: "linear-gradient(135deg,#7C3AED,#C026D3)",
  sunset: "linear-gradient(135deg,#F97316,#EC4899)",
}

const locales = [
  { code: "pt-BR", label: "PT" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
]

function Dropdown({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-lg border border-border bg-surface text-sidebar-foreground transition-colors hover:bg-surface-hover"
      >
        {trigger}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 min-w-44 rounded-xl border border-border bg-card p-1 shadow-lg">
          {children}
        </div>
      )}
    </div>
  )
}

interface TopbarProps {
  className?: string
}

export function Topbar({ className = "" }: TopbarProps) {
  const { t, i18n } = useTranslation()
  const { palette, isDark, setPalette, toggleDark } = useTheme()
  const currentThemeLabel = THEMES.find((th) => th.id === palette)?.labelKey ?? "theme.default"

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Tema claro/escuro */}
      <Dropdown
        trigger={isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      >
        <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-text-muted">
          {t("nav.temas")}
        </div>
        {[{ id: "light" as const, labelKey: "nav.temaClaro", icon: Sun }, { id: "dark" as const, labelKey: "nav.temaEscuro", icon: Moon }].map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="menuitem"
            onClick={() => {
              if ((opt.id === "dark") !== isDark) toggleDark()
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
          >
            <opt.icon className="size-4 text-text-muted" />
            {t(opt.labelKey)}
            {(opt.id === "dark") === isDark && <Check className="ml-auto size-4 text-primary" />}
          </button>
        ))}
      </Dropdown>

      {/* Cores (paletas) */}
      <Dropdown trigger={<Palette className="size-4" />}>
        <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-text-muted">
          {t("nav.temas")}
        </div>
        {THEMES.map((th) => (
          <button
            key={th.id}
            type="button"
            role="menuitem"
            onClick={() => setPalette(th.id)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
          >
            <span
              className="size-4 shrink-0 rounded-full border border-border"
              style={{ backgroundImage: SWATCHES[th.id] }}
            />
            {t(th.labelKey)}
            {palette === th.id && <Check className="ml-auto size-4 text-primary" />}
          </button>
        ))}
      </Dropdown>

      {/* Idioma */}
      <Dropdown trigger={<Globe className="size-4" />}>
        <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-text-muted">
          {t("nav.idioma")}
        </div>
        {locales.map((loc) => (
          <button
            key={loc.code}
            type="button"
            role="menuitem"
            onClick={() => i18n.changeLanguage(loc.code)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
          >
            <span>{loc.label}</span>
            {i18n.language === loc.code && <Check className="size-4 text-primary" />}
          </button>
        ))}
      </Dropdown>

      <span className="hidden pl-1 text-xs font-medium text-sidebar-muted sm:inline">
        {t(currentThemeLabel)}
      </span>
    </div>
  )
}
