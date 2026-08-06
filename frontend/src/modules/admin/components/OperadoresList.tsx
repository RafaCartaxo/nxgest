import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Edit3, Trash2 } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
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
}

const roleRank: Record<string, number> = { super_admin: 0, admin: 1, socio: 2, operator: 3 }

function isAdminRole(role: OperadorRow["role"]): boolean {
  return role === "super_admin" || role === "admin"
}

function isSocioRole(role: OperadorRow["role"]): boolean {
  return role === "socio"
}

export function OperadoresList({ operadores, empresaId, onEdit, onDelete }: Props) {
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
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">{group.label}</p>
          <div className="space-y-3">
            {group.items.map((op) => {
              const isSelf = user?.id === op.id
              return (
                <Card.Root key={op.id} variant="list-item">
                  <Card.Header className="flex-wrap">
                    <Avatar nome={op.nome} foto={op.foto ?? null} size="md" />
                    <span className="min-w-0 flex-1 truncate text-base font-semibold">{op.nome}</span>
                    {isSelf && <StatusBadge variant="success" size="sm" label={t("admin.eu")} />}
                    <StatusBadge
                      variant={roleVariant(op.role)}
                      size="sm"
                      label={roleLabel(op.role, t)}
                    />
                  </Card.Header>
                  <Card.Body>
                    <p className="truncate text-sm text-text-secondary">{op.email}</p>
                    <Card.Indicators>
                      <Card.Indicator label={`${t("cliente.title")}`} value={`${op.totalClientes}`} />
                      <Card.Indicator label={`${t("contrato.title")}`} value={`${op.contratosAtivos}`} />
                    </Card.Indicators>
                  </Card.Body>
                  <Card.Actions
                    actions={[
                      {
                        icon: ArrowRight,
                        label: t("admin.acessar"),
                        onClick: () => navigate(`/admin/operadores/${op.id}${empresaId ? `?empresaId=${empresaId}` : ""}`),
                      },
                      {
                        icon: Edit3,
                        label: t("admin.editar"),
                        onClick: () => onEdit(op),
                        show: !isSelf,
                      },
                      {
                        icon: Trash2,
                        label: t("admin.remover"),
                        onClick: () => onDelete(op.id),
                        show: !isSelf,
                        variant: "danger",
                      },
                    ]}
                  />
                </Card.Root>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
