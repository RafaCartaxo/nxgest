import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { FileText, LayoutDashboard, Route, Users, Wallet, type LucideIcon } from "lucide-react"
import { useAuth } from "../auth/AuthContext.js"
import { hasModule, type ModuleId } from "../modules/modules.js"

type ChaveNav = "nav.central" | "nav.clientes" | "nav.contratos" | "nav.caixa" | "nav.rota"

interface Aba {
  modulo: ModuleId
  chave: ChaveNav
  to: string
  icon: LucideIcon
  /** rota exata (Central). As demais ativam por prefixo via NavLink. */
  end?: boolean
}

/** Central sempre presente; as abas operacionais entram gated por módulo (whitelabel). */
const ABAS: Aba[] = [
  { modulo: "clientes", chave: "nav.clientes", to: "/clientes", icon: Users },
  { modulo: "contratos", chave: "nav.contratos", to: "/contratos", icon: FileText },
  { modulo: "caixa", chave: "nav.caixa", to: "/caixa", icon: Wallet },
  { modulo: "rota", chave: "nav.rota", to: "/rota", icon: Route },
]

const CENTRAL = { chave: "nav.central" as const, to: "/", icon: LayoutDashboard, end: true }

/**
 * Tab bar inferior do mobile (app-first) — substitui hamburger + drawer.
 * Aba ativa por prefixo (NavLink): em /clientes/1/editar a aba Clientes segue acesa.
 * `central` sempre presente; super_admin vê só a Central (admin fica no menu do usuário).
 */
export function BottomTabBar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isTenant = user?.role === "operator" || user?.role === "admin" || user?.role === "socio"
  const operacionais = isTenant ? ABAS.filter((a) => hasModule(user?.modulos, a.modulo)) : []
  const visiveis = [CENTRAL, ...operacionais]

  if (visiveis.length === 0) return null

  return (
    <nav
      role="navigation"
      aria-label={t("nav.rotulo")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar pb-safe lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {visiveis.map((aba) => (
          <li key={aba.to} className="flex-1">
            <NavLink
              to={aba.to}
              end={aba.end}
              className="flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-center transition-colors active:scale-95"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid size-8 place-items-center rounded-lg transition-colors ${
                      isActive ? "bg-primary-light text-primary-text" : "text-text-muted"
                    }`}
                  >
                    <aba.icon className="size-5" strokeWidth={isActive ? 2.4 : 2} aria-hidden />
                  </span>
                  <span
                    className={`w-full truncate text-[11px] leading-none font-semibold ${
                      isActive ? "text-primary" : "text-text-muted"
                    }`}
                  >
                    {t(aba.chave)}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
