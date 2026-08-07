import type { ReactNode } from "react"
import { Link, NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Building2,
  FileText,
  LayoutDashboard,
  Route as RouteIcon,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react"
import { Logo } from "../components/Logo.js"
import { BottomTabBar } from "./BottomTabBar.js"
import { UserMenu } from "./UserMenu.js"
import { FabProvider } from "../fab/FabContext.js"
import { Fab } from "../fab/Fab.js"
import { hasModule } from "../modules/modules.js"
import { useAuth } from "../auth/AuthContext.js"

interface NavItem {
  to: string
  label: string
  icon: typeof Users
  end?: boolean
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
    if (hasModule(modulos, "rota")) items.push({ to: "/rota", label: t("nav.rota"), icon: RouteIcon })
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

function SidebarContent() {
  const { t } = useTranslation()
  const items = useNavItems()
  const adminItems = useAdminNavItems()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <Logo variant="sm" className="h-8 w-8 text-primary" />
        <span className="font-display text-lg font-semibold text-sidebar-foreground">
          NX <span className="text-brand-gradient">Gestão</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
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

      <div className="border-t border-sidebar-border p-2">
        <UserMenu detalhado crescer="cima" />
      </div>
    </div>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <FabProvider>
      <div className="min-h-[100dvh]">
        {/* topo fino — mobile: marca + menu do usuário (sem hamburger, sem engrenagem) */}
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-sidebar-border bg-sidebar px-3 py-2 lg:hidden">
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-2.5">
            <Logo variant="sm" className="h-7 w-7 text-primary" />
            <span className="font-display font-semibold text-sidebar-foreground">
              NX <span className="text-brand-gradient">Gestão</span>
            </span>
          </Link>
          <UserMenu mostrarAdmin className="shrink-0" />
        </header>

        {/* sidebar desktop — fixa, sem header superior duplicado */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar lg:flex">
          <SidebarContent />
        </aside>

        {/* conteúdo — folga inferior para não ficar atrás da tab bar */}
        <main className="min-w-0 pb-28 lg:pl-64 lg:pb-16">{children}</main>

        <BottomTabBar />
        <Fab />
      </div>
    </FabProvider>
  )
}
