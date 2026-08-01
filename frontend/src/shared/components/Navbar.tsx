import { NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Globe, Sun, Moon, Shield, Building, Settings, LogOut } from "lucide-react"
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
  const [langOpen, setLangOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
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
        <div ref={langRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1 px-3 py-3 text-xs font-medium text-text-muted hover:text-text-primary"
          >
            <Globe className="h-3.5 w-3.5" />
            {i18n.language?.startsWith("en") ? "EN" : i18n.language?.startsWith("es") ? "ES" : "PT"}
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 rounded-md border border-border-light bg-surface shadow-lg">
              {locales.map((loc) => (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => { i18n.changeLanguage(loc.code); setLangOpen(false) }}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-surface-hover ${
                    i18n.language === loc.code ? "bg-primary-light font-medium text-primary" : "text-text-primary"
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
                >
                  <Shield className="h-3.5 w-3.5 text-text-muted" />
                  {t("admin.title")}
                </NavLink>
              )}
              {isSuperAdmin && (
                <NavLink
                  to="/admin/empresas"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
                >
                  <Building className="h-3.5 w-3.5 text-text-muted" />
                  {t("superAdmin.navEmpresas")}
                </NavLink>
              )}
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
