import { NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Globe, Sun, Moon, Settings, LogOut, User } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useTheme } from "../theme/useTheme.js"
import { useAuth } from "../auth/AuthContext.js"

const locales = [
  { code: "pt-BR", label: "PT" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
]

export function Navbar() {
  const { t, i18n } = useTranslation()
  const { theme, toggle } = useTheme()
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

  const isAdmin = user?.role === "admin" || user?.role === "super_admin"
  const isSuperAdmin = user?.role === "super_admin"

  const links = [
    { to: "/", label: t("nav.central") },
    { to: "/clientes", label: t("nav.clientes") },
    { to: "/contratos", label: t("nav.contratos") },
    { to: "/caixa", label: t("nav.caixa") },
  ]
  if (isAdmin) links.push({ to: "/admin", label: t("admin.title") })
  if (isSuperAdmin) links.push({ to: "/admin/empresas", label: t("superAdmin.navEmpresas") })

  return (
    <nav className="sticky top-0 z-40 border-b border-border-light bg-surface">
      <div className="mx-auto flex max-w-2xl items-center px-4">
        <div className="flex min-w-0 overflow-x-auto hide-scrollbar">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `border-b-2 px-4 py-3 text-base font-medium transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
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
              <button
                type="button"
                onClick={toggle}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover"
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-text-muted" /> : <Moon className="h-3.5 w-3.5 text-text-muted" />}
                {theme === "dark" ? t("nav.temaClaro") : t("nav.temaEscuro")}
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
