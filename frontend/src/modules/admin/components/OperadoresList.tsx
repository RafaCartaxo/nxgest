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

export function OperadoresList({ operadores, empresaId, onEdit, onDelete }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const visible = user?.role === "admin" ? operadores.filter((op) => op.id !== user.id) : operadores

  if (visible.length === 0) {
    return <p className="text-center text-text-secondary py-8">{t("common.empty")}</p>
  }

  return (
    <div className="space-y-2">
      {visible.map((op) => (
        <Card.Root key={op.id} variant="list-item">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">{op.nome}</p>
              <p className="text-sm text-text-secondary">{op.email}</p>
              <div className="mt-1 flex gap-4">
                <span className="text-xs text-text-secondary">{op.totalClientes} {t("cliente.title").toLowerCase()}</span>
                <span className="text-xs text-text-secondary">{op.contratosAtivos} {t("contrato.title").toLowerCase()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge
                variant={op.role === "operator" ? "neutral" : "info"}
                size="sm"
                label={op.role === "super_admin" ? t("admin.roleSuperAdmin") : op.role === "admin" ? t("admin.roleAdmin") : t("admin.roleOperator")}
              />
              <button
                onClick={() => navigate(`/admin/operadores/${op.id}${empresaId ? `?empresaId=${empresaId}` : ""}`)}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-surface-hover text-text-muted"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => onEdit(op)} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-surface-hover text-text-muted">
                <Edit3 className="h-4 w-4" />
              </button>
              <button onClick={() => onDelete(op.id)} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-red-50 text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card.Root>
      ))}
    </div>
  )
}
