import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Edit3, Trash2 } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import type { OperadorRow } from "../services/admin.service.js"

interface Props {
  operadores: OperadorRow[]
  empresaId?: string
  onEdit: (op: OperadorRow) => void
  onDelete: (id: string) => void
}

const roleRank: Record<string, number> = { super_admin: 0, admin: 1, operator: 2 }

function roleLabel(t: (k: string) => string, role: OperadorRow["role"]): string {
  if (role === "super_admin") return t("admin.roleSuperAdmin")
  if (role === "admin") return t("admin.roleAdmin")
  return t("admin.roleOperator")
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

  if (sorted.length === 0) {
    return <p className="text-center text-text-secondary py-8">{t("common.empty")}</p>
  }

  return (
    <div className="space-y-3">
      {sorted.map((op) => {
        const isSelf = user?.id === op.id
        return (
          <Card.Root key={op.id} variant="list-item">
            <Card.Header className="flex-wrap">
              <span className="min-w-0 flex-1 truncate text-base font-semibold">{op.nome}</span>
              {isSelf && <StatusBadge variant="success" size="sm" label={t("admin.eu")} />}
              <StatusBadge
                variant={op.role === "operator" ? "neutral" : "info"}
                size="sm"
                label={roleLabel(t, op.role)}
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
                  variant: "gray",
                },
              ]}
            />
          </Card.Root>
        )
      })}
    </div>
  )
}
