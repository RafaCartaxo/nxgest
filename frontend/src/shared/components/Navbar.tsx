import { NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Globe, Sun, Moon, Settings, LogOut, User } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useTheme } from "../theme/useTheme.js"
import { THEMES } from "../theme/themes.js"
import { hasModule, type ModuleId } from "../modules/modules.js"
import { useAuth } from "../auth/AuthContext.js"

const locales = [
  { code: "pt-BR", label: "PT" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
]

const SWATCHES: Record<string, string> = {
  default: "linear-gradient(135deg,#2563EB,#7C3AED)",
  aurora: "linear-gradient(135deg,#4F46E5,#DB2777)",
  ocean: "linear-gradient(135deg,#0EA5E9,#14B8A6)",
  grape: "linear-gradient(135deg,#7C3AED,#C026D3)",
  sunset: "linear-gradient(135deg,#F97316,#EC4899)",
}

const themes = THEMES.map((th) => ({ id: th.id, labelKey: th.labelKey, swatch: SWATCHES[th.id] }))

export function Navbar() {
  const { t, i18n } = useTranslation()
  const { palette, isDark, setPalette, toggleDark } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleLogout() {
    logout()
    navigate("/login")
  }

  const isAdmin = user?.role === "admin"
  const isSuperAdmin = user?.role === "super_admin"
  const isTenant = user?.role === "operator" || user?.role === "admin"
  const modulos = user?.modulos

  const links: { to: string; label: string; mod?: ModuleId }[] = []
  if (isTenant) {
    links.push({ to: "/", label: t("nav.central") })
    links.push({ to: "/clientes", label: t("nav.clientes"), mod: "clientes" })
    links.push({ to: "/contratos", label: t("nav.contratos"), mod: "contratos" })
    links.push({ to: "/caixa", label: t("nav.caixa"), mod: "caixa" })
  }
  const visible = links.filter((l) => (l.mod ? hasModule(modulos, l.mod) : true))
  if (isAdmin) visible.push({ to: "/admin", label: t("admin.title") })
  if (isSuperAdmin) visible.push({ to: "/admin/empresas", label: t("superAdmin.navEmpresas") })

  return (
    <nav className="sticky top-0 z-40 border-b border-border-light bg-surface">
      <div className="mx-auto flex max-w-2xl items-center px-4">
        <div className="flex min-w-0 overflow-x-auto hide-scrollbar">
          {visible.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `border-b-2 px-4 py-3 text-base font-medium transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="flex-1" />
        <div ref={settingsRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            title={t("nav.configuracoes")}
            className="flex items-center px-3 py-3 text-text-muted hover:text-text-primary"
          >
            <Settings className="h-4 w-4" />
          </button>
          {settingsOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-md border border-border-light bg-surface py-1 shadow-lg">
              <NavLink
                to="/perfil"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
              >
                <User className="h-3.5 w-3.5 text-text-muted" />
                {t("perfil.title")}
              </NavLink>
              <div className="my-1 border-t border-border-light" />
              <div className="px-4 py-1 text-xs font-medium uppercase tracking-wider text-text-muted">
                {t("nav.temas")}
              </div>
              <div className="flex items-center gap-2 px-4 py-2">
                {themes.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    title={t(th.labelKey)}
                    aria-label={t(th.labelKey)}
                    onClick={() => setPalette(th.id)}
                    className={`h-6 flex-1 rounded-full border transition-transform ${
                      palette === th.id ? "scale-110 border-primary ring-2 ring-primary/30" : "border-border"
                    }`}
                    style={{ backgroundImage: th.swatch }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={toggleDark}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover"
              >
                {isDark ? <Sun className="h-3.5 w-3.5 text-text-muted" /> : <Moon className="h-3.5 w-3.5 text-text-muted" />}
                {isDark ? t("nav.temaClaro") : t("nav.temaEscuro")}
              </button>
              <div className="my-1 border-t border-border-light" />
              <div className="px-4 py-1 text-xs font-medium uppercase tracking-wider text-text-muted">
                {t("nav.idioma")}
              </div>
              <div className="flex items-center gap-1 px-4 py-2">
                <Globe className="h-3.5 w-3.5 text-text-muted" />
                {locales.map((loc) => (
                  <button
                    key={loc.code}
                    type="button"
                    onClick={() => { i18n.changeLanguage(loc.code); setSettingsOpen(false) }}
                    className={`flex-1 rounded-md px-2 py-1 text-sm hover:bg-surface-hover ${
                      i18n.language === loc.code ? "bg-primary-light font-medium text-primary" : "text-text-primary"
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
              <div className="my-1 border-t border-border-light" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover"
              >
                <LogOut className="h-3.5 w-3.5 text-text-muted" />
                {t("auth.sair")}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
