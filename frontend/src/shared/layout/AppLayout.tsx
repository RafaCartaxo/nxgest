import { useState, type ReactNode } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  ShieldCheck,
  Building2,
} from "lucide-react"
import { Logo } from "../components/Logo.js"
import { Avatar } from "../components/Avatar/Avatar.js"
import { Topbar } from "./Topbar.js"
import { hasModule } from "../modules/modules.js"
import { useAuth } from "../auth/AuthContext.js"

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
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = useNavItems()
  const adminItems = useAdminNavItems()

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
          <Avatar nome={user?.nome ?? "?"} size="sm" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{user?.nome}</p>
            <p className="truncate text-xs text-sidebar-muted">{roleLabel(user?.role, t)}</p>
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
      {/* barra de topo (mobile + desktop) */}
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-sidebar-border bg-sidebar px-3 py-2">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={t("nav.configuracoes")}
          className="grid size-11 place-items-center rounded-xl text-sidebar-foreground hover:bg-surface-hover lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <Logo variant="sm" className="h-7 w-7 text-primary" />
        <span className="font-display font-semibold text-sidebar-foreground">
          NX <span className="text-brand-gradient">Gestão</span>
        </span>
        <div className="flex-1" />
        <Topbar />
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
