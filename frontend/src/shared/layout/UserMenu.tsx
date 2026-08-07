import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Building2, LogOut, Mail, Settings, ShieldCheck, User, type LucideIcon } from "lucide-react"
import { Avatar } from "../components/Avatar/Avatar.js"
import { PreferenciasModal } from "../theme/PreferenciasModal.js"
import { useAuth } from "../auth/AuthContext.js"
import { roleLabel } from "../utils/role.js"

interface Item {
  chave: string
  icon: LucideIcon
  to?: string
  onClick?: () => void
}

interface UserMenuProps {
  /** desktop: exibe nome + papel ao lado do avatar (rodapé da sidebar) */
  detalhado?: boolean
  /** mobile: inclui Painel Admin / Empresas no menu — a tab bar fica operacional */
  mostrarAdmin?: boolean
  /** para onde o popover cresce no desktop (padrão: acima, rodapé da sidebar) */
  crescer?: "cima" | "baixo"
  className?: string
}

/**
 * Menu do usuário — único ponto de acesso a Perfil, Configurações e Sair
 * (config não fica mais numa engrenagem solta). Mobile: bottom-sheet;
 * desktop: popover ao lado do avatar. Abre o PreferenciasModal já existente.
 */
export function UserMenu({
  detalhado = false,
  mostrarAdmin = false,
  crescer = "cima",
  className = "",
}: UserMenuProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)
  const [prefs, setPrefs] = useState(false)

  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [aberto])

  const role = user?.role
  const itens: Item[] = [
    { chave: "nav.perfil", icon: User, to: "/perfil" },
    { chave: "nav.configuracoes", icon: Settings, onClick: () => setPrefs(true) },
  ]
  if (mostrarAdmin) {
    if (role === "admin" || role === "socio") {
      itens.push({ chave: "admin.painel", icon: ShieldCheck, to: "/admin" })
    }
    if (role === "super_admin") {
      itens.push({ chave: "superAdmin.navEmpresas", icon: Building2, to: "/admin/empresas" })
      itens.push({ chave: "lead.navLeads", icon: Mail, to: "/admin/leads" })
    }
  }
  itens.push({
    chave: "auth.sair",
    icon: LogOut,
    onClick: () => {
      logout()
      navigate("/login")
    },
  })

  const linha =
    "flex min-h-12 w-full items-center gap-3 px-4 text-left text-[15px] font-medium text-text-primary transition-colors hover:bg-surface-hover active:scale-[0.99]"

  const conteudoMenu = (
    <ul className="py-1">
      {itens.map((item) => (
        <li key={item.chave}>
          {item.to ? (
            <Link to={item.to} role="menuitem" onClick={() => setAberto(false)} className={linha}>
              <item.icon className="size-[18px] shrink-0 text-text-muted" aria-hidden />
              {t(item.chave)}
            </Link>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAberto(false)
                item.onClick?.()
              }}
              className={linha}
            >
              <item.icon className="size-[18px] shrink-0 text-text-muted" aria-hidden />
              {t(item.chave)}
            </button>
          )}
        </li>
      ))}
    </ul>
  )

  const cabecalho = (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <Avatar nome={user?.nome ?? "?"} foto={user?.foto ?? null} size="md" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text-primary">{user?.nome}</p>
        <p className="truncate text-xs text-text-secondary">{roleLabel(role, t)}</p>
      </div>
    </div>
  )

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={t("nav.configuracoes")}
        className="flex w-full min-w-0 items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-hover active:scale-[0.99]"
      >
        <Avatar nome={user?.nome ?? "?"} foto={user?.foto ?? null} size="md" />
        {detalhado && (
          <span className="hidden min-w-0 flex-1 leading-tight lg:block">
            <span className="block truncate text-sm font-semibold text-sidebar-foreground">{user?.nome}</span>
            <span className="block truncate text-xs text-sidebar-muted">{roleLabel(role, t)}</span>
          </span>
        )}
      </button>

      {aberto && (
        <>
          {/* desktop: popover in-place (cresce da sidebar — nada o cobre) */}
          <div className="hidden lg:block">
            <button
              type="button"
              aria-label={t("common.cancel")}
              onClick={() => setAberto(false)}
              className="fixed inset-0 z-40 bg-transparent"
            />
            <div
              role="menu"
              aria-label={t("nav.rotulo")}
              className={`absolute inset-x-0 z-50 overflow-hidden rounded-xl border border-border bg-card shadow-lg ${
                crescer === "cima" ? "bottom-full mb-2" : "top-full mt-2"
              }`}
            >
              {conteudoMenu}
            </div>
          </div>

          {/* mobile: bottom-sheet via portal no body — escapa do stacking
              context do header sticky, acima da tab bar */}
          {createPortal(
            <div className="lg:hidden">
              <button
                type="button"
                aria-label={t("common.cancel")}
                onClick={() => setAberto(false)}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
              />
              <div
                role="menu"
                aria-label={t("nav.rotulo")}
                className="animate-slide-in-from-bottom fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-xl border border-border bg-card pb-safe"
              >
                {cabecalho}
                {conteudoMenu}
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      <PreferenciasModal open={prefs} onClose={() => setPrefs(false)} />
    </div>
  )
}
