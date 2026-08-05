import { useState, type ReactNode } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Menu,
  X,
  User,
  LogOut,
  Sun,
  Moon,
  Globe,
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  ShieldCheck,
  Building2,
} from "lucide-react"
import { Logo } from "../components/Logo.js"
import { useTheme } from "../theme/useTheme.js"
import { THEMES } from "../theme/themes.js"
import { hasModule } from "../modules/modules.js"
import { useAuth } from "../auth/AuthContext.js"

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

interface NavItem {
  to: string
  label: string
  icon: typeof Users
  end?: boolean
}

function roleLabel(role: string | undefined, t: (k: string) => string): string {
  if (role === "super_admin") return t("admin.roleSuperAdmin")
  if (role === "admin") return t("admin.roleAdmin")
  if (role === "socio") return t("admin.roleSocio")
  return t("admin.roleOperator")
}

function useNavItems() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const modulos = user?.modulos
  const isTenant = user?.role === "operator" || user?.role === "admin" || user?.role === "socio"

  const items: NavItem[] = []
  if (isTenant) {
    items.push({ to: "/", label: t("nav.central"), icon: LayoutDashboard, end: true })
    if (hasModule(modulos, "clientes")) items.push({ to: "/clientes", label: t("nav.clientes"), icon: Users })
    if (hasModule(modulos, "contratos")) items.push({ to: "/contratos", label: t("nav.contratos"), icon: FileText })
    if (hasModule(modulos, "caixa")) items.push({ to: "/caixa", label: t("nav.caixa"), icon: Wallet })
  }
  return items
}

function useAdminNavItems(): NavItem[] {
  const { t } = useTranslation()
  const { user } = useAuth()
  const items: NavItem[] = []
  if (user?.role === "admin" || user?.role === "socio") {
    items.push({ to: "/admin", label: t("admin.painel"), icon: ShieldCheck })
  }
  if (user?.role === "super_admin") {
    items.push({ to: "/admin/empresas", label: t("superAdmin.navEmpresas"), icon: Building2 })
  }
  return items
}

function SidebarContent({ onNavigate, trailing }: { onNavigate?: () => void; trailing?: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const { palette, isDark, setPalette, toggleDark } = useTheme()
  const navigate = useNavigate()
  const items = useNavItems()
  const adminItems = useAdminNavItems()

  const currentThemeLabel = THEMES.find((th) => th.id === palette)?.labelKey ?? "theme.default"

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <Logo variant="sm" className="h-8 w-8 text-primary" />
        <span className="font-display text-lg font-semibold text-sidebar-foreground">
          NX <span className="text-brand-gradient">Gestão</span>
        </span>
        {trailing && <div className="ml-auto">{trailing}</div>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex min-h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-active text-sidebar-active-foreground"
                      : "text-sidebar-foreground hover:bg-surface-hover"
                  }`
                }
              >
                <item.icon className="size-[18px] shrink-0" aria-hidden />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {adminItems.length > 0 && (
          <>
            <p className="mb-1 mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-sidebar-muted">
              {t("admin.title")}
            </p>
            <ul className="space-y-1">
              {adminItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex min-h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors ${
                        isActive
                          ? "bg-sidebar-active text-sidebar-active-foreground"
                          : "text-sidebar-foreground hover:bg-surface-hover"
                      }`
                    }
                  >
                    <item.icon className="size-[18px] shrink-0" aria-hidden />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-light text-sm font-semibold text-primary-text">
            {(user?.nome ?? "?").split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{user?.nome}</p>
            <p className="truncate text-xs text-sidebar-muted">{roleLabel(user?.role, t)}</p>
          </div>
        </div>

        <div className="rounded-xl bg-surface px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sidebar-muted">{t("nav.temas")}</span>
            <span className="text-xs font-medium text-primary-text">{t(currentThemeLabel)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-1">
            {THEMES.map((th) => (
              <button
                key={th.id}
                type="button"
                title={t(th.labelKey)}
                aria-label={t(th.labelKey)}
                onClick={() => setPalette(th.id)}
                className={`h-7 w-7 rounded-full border transition-transform ${
                  palette === th.id ? "scale-110 border-primary ring-2 ring-primary/30" : "border-border"
                }`}
                style={{ backgroundImage: SWATCHES[th.id] }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface px-3 py-2">
          <button
            type="button"
            onClick={toggleDark}
            aria-label={isDark ? t("nav.temaClaro") : t("nav.temaEscuro")}
            title={isDark ? t("nav.temaClaro") : t("nav.temaEscuro")}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-sidebar-foreground hover:bg-surface-hover"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <div className="flex items-center gap-1">
            <Globe className="size-3.5 text-sidebar-muted" aria-hidden />
            {locales.map((loc) => (
              <button
                key={loc.code}
                type="button"
                onClick={() => i18n.changeLanguage(loc.code)}
                className={`rounded-md px-1.5 py-0.5 text-xs hover:bg-surface-hover ${
                  i18n.language === loc.code ? "bg-primary-light font-medium text-primary" : "text-sidebar-muted"
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="my-1 border-t border-sidebar-border" />

        <div className="flex gap-2">
          <NavLink
            to="/perfil"
            onClick={onNavigate}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-surface-hover"
          >
            <User className="size-4 text-sidebar-muted" aria-hidden />
            {t("perfil.title")}
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-surface-hover"
          >
            <LogOut className="size-4 text-sidebar-muted" aria-hidden />
            {t("auth.sair")}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="min-h-[100dvh]">
      {/* barra de topo mobile */}
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-sidebar-border bg-sidebar px-2 py-2 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={t("nav.configuracoes")}
          className="grid size-11 place-items-center rounded-xl text-sidebar-foreground hover:bg-surface-hover"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <Logo variant="sm" className="h-7 w-7 text-primary" />
        <span className="font-display font-semibold text-sidebar-foreground">
          NX <span className="text-brand-gradient">Gestão</span>
        </span>
      </header>

      {/* drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar">
            <div className="min-h-0 flex-1">
              <SidebarContent
                onNavigate={() => setDrawerOpen(false)}
                trailing={
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Fechar menu"
                    className="grid size-9 place-items-center rounded-lg text-sidebar-foreground hover:bg-surface-hover"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                }
              />
            </div>
          </aside>
        </div>
      )}

      {/* sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="min-h-0 flex-1">
          <SidebarContent />
        </div>
      </aside>

      {/* conteúdo */}
      <main className="min-w-0 lg:pl-64">{children}</main>
    </div>
  )
}
