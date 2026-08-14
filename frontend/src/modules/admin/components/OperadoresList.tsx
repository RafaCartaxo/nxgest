import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Edit3, Mail, Trash2, Phone } from "lucide-react"
import { Card, type CardTone } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { Avatar } from "../../../shared/components/Avatar/Avatar.js"
import { roleLabel, roleVariant } from "../../../shared/utils/role.js"
import type { OperadorRow } from "../services/admin.service.js"

interface Props {
  operadores: OperadorRow[]
  empresaId?: string
  onEdit: (op: OperadorRow) => void
  onDelete: (id: string) => void
  onReenviarConvite: (id: string) => void
}

const roleRank: Record<string, number> = { super_admin: 0, admin: 1, socio: 2, operator: 3 }

const tonePorRole: Record<string, CardTone> = {
  super_admin: "danger",
  admin: "info",
  socio: "success",
  operator: "neutral",
}

function isAdminRole(role: OperadorRow["role"]): boolean {
  return role === "super_admin" || role === "admin"
}

function isSocioRole(role: OperadorRow["role"]): boolean {
  return role === "socio"
}

export function OperadoresList({ operadores, empresaId, onEdit, onDelete, onReenviarConvite }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const sorted = [...operadores].sort((a, b) => {
    const rankDiff = (roleRank[a.role] ?? 9) - (roleRank[b.role] ?? 9)
    if (rankDiff !== 0) return rankDiff
    return a.nome.localeCompare(b.nome)
  })

  const admins = sorted.filter((op) => isAdminRole(op.role))
  const socios = sorted.filter((op) => isSocioRole(op.role))
  const operators = sorted.filter((op) => !isAdminRole(op.role) && !isSocioRole(op.role))

  type RowDef = { label: string; items: OperadorRow[] }
  const groups: RowDef[] = []
  if (admins.length > 0) groups.push({ label: t("admin.secaoAdministradores"), items: admins })
  if (socios.length > 0) groups.push({ label: t("admin.secaoSocios"), items: socios })
  if (operators.length > 0) groups.push({ label: t("admin.operadores"), items: operators })

  if (sorted.length === 0) {
    return <p className="text-center text-text-secondary py-8">{t("common.empty")}</p>
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-light pb-1">
            {group.label}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((op) => {
              const isSelf = user?.id === op.id
              return (
                <Card.Root key={op.id} variant="list-item" tone={tonePorRole[op.role] ?? "neutral"} className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar nome={op.nome} foto={op.foto ?? null} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-text-primary">{op.nome}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {isSelf && <StatusBadge variant="success" size="sm" label={t("admin.eu")} />}
                        {op.suspensoEm && <StatusBadge variant="danger" size="sm" label={t("admin.statusSuspenso")} />}
                        {op.emailPendente && <StatusBadge variant="warning" size="sm" label={t("admin.verificacaoPendente")} />}
                        {op.status === "convidado" && (
                          <StatusBadge variant="warning" size="sm" label={op.conviteStatus === "EXPIRADO" ? t("admin.conviteExpirado") : op.conviteStatus === "REVOGADO" ? t("admin.conviteRevogado") : t("admin.convitePendente")} />
                        )}
                        <StatusBadge
                          variant={roleVariant(op.role)}
                          size="sm"
                          label={roleLabel(op.role, t)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-text-secondary">
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                      <span className="truncate">{op.email}</span>
                    </p>
                    {op.telefone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                        {op.telefone}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-light pt-3">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[11px] text-text-muted">{t("cliente.title")}</p>
                        <p className="text-lg font-semibold tabular-nums text-text-primary leading-none mt-0.5">{op.totalClientes}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-text-muted">{t("contrato.title")}</p>
                        <p className="text-lg font-semibold tabular-nums text-text-primary leading-none mt-0.5">{op.contratosAtivos}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/operadores/${op.id}${empresaId ? `?empresaId=${empresaId}` : ""}`)}
                        title={t("admin.acessar")}
                        aria-label={t("admin.acessar")}
                        className="grid size-9 place-items-center rounded-lg text-primary-text transition-colors hover:bg-primary-light"
                      >
                        <ArrowRight className="size-4" aria-hidden />
                      </button>
                      {op.status === "convidado" && !isSelf && (
                        <button
                          type="button"
                          onClick={() => onReenviarConvite(op.id)}
                          title={t("admin.reenviarConvite")}
                          aria-label={t("admin.reenviarConvite")}
                          className="grid size-9 place-items-center rounded-lg text-primary-text transition-colors hover:bg-primary-light"
                        >
                          <Mail className="size-4" aria-hidden />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(op)}
                        title={t("admin.editar")}
                        aria-label={t("admin.editar")}
                        disabled={isSelf}
                        className="grid size-9 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-40"
                      >
                        <Edit3 className="size-4" aria-hidden />
                      </button>
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => onDelete(op.id)}
                          title={t("admin.remover")}
                          aria-label={t("admin.remover")}
                          className="grid size-9 place-items-center rounded-lg text-danger-text transition-colors hover:bg-danger-light"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                </Card.Root>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
