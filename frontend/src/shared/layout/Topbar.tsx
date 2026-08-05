import { useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Moon, Sun, Palette, Check, Settings } from "lucide-react"
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
        className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-sidebar-foreground transition-colors hover:bg-surface-hover"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pb-1 pt-1.5 text-xs font-medium uppercase tracking-wider text-text-muted">
      {children}
    </div>
  )
}

interface TopbarProps {
  className?: string
}

export function Topbar({ className = "" }: TopbarProps) {
  const { t, i18n } = useTranslation()
  const { palette, isDark, setPalette, toggleDark } = useTheme()
  const currentLang = locales.find((l) => l.code === i18n.language)?.label ?? "PT"

  return (
    <div className={className}>
      <Dropdown
        trigger={
          <>
            <Settings className="size-4 shrink-0" />
            <span className="hidden text-xs font-medium text-sidebar-muted sm:inline">{currentLang}</span>
          </>
        }
      >
        {/* Tema (claro/escuro — clica e alterna) */}
        <SectionLabel>{t("nav.temas")}</SectionLabel>
        <button
          type="button"
          role="menuitem"
          onClick={() => toggleDark()}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-text-primary hover:bg-surface-hover"
        >
          {isDark ? <Moon className="size-4 shrink-0 text-text-muted" /> : <Sun className="size-4 shrink-0 text-text-muted" />}
          {isDark ? t("nav.temaEscuro") : t("nav.temaClaro")}
          <Check className="ml-auto size-4 shrink-0 text-primary" />
        </button>

        {/* Cores (paletas) */}
        <SectionLabel>{t("nav.cores")}</SectionLabel>
        {THEMES.map((th) => (
          <button
            key={th.id}
            type="button"
            role="menuitem"
            onClick={() => setPalette(th.id)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-text-primary hover:bg-surface-hover"
          >
            <span
              className="size-4 shrink-0 rounded-full border border-border"
              style={{ backgroundImage: SWATCHES[th.id] }}
            />
            {t(th.labelKey)}
            {palette === th.id && <Check className="ml-auto size-4 shrink-0 text-primary" />}
          </button>
        ))}

        {/* Idioma */}
        <SectionLabel>{t("nav.idioma")}</SectionLabel>
        {locales.map((loc) => (
          <button
            key={loc.code}
            type="button"
            role="menuitem"
            onClick={() => i18n.changeLanguage(loc.code)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-text-primary hover:bg-surface-hover"
          >
            <span>{loc.label}</span>
            {i18n.language === loc.code && <Check className="size-4 shrink-0 text-primary" />}
          </button>
        ))}
      </Dropdown>
    </div>
  )
}
