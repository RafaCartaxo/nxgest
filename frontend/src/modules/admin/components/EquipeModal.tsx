import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import type { OperadorRow } from "../services/admin.service.js"

interface EquipeModalProps {
  open: boolean
  role: "admin" | "operator"
  operadores: OperadorRow[]
  empresaId?: string
  onClose: () => void
}

export function EquipeModal({ open, role, operadores, empresaId, onClose }: EquipeModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!open) return null

  const filtered = operadores
    .filter((op) => op.role === role)
    .sort((a, b) => a.nome.localeCompare(b.nome))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={role === "admin" ? t("admin.modalAdmins") : t("admin.modalOperadores")}
      maxWidth="max-w-md"
    >
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">{t("common.empty")}</p>
        ) : (
          <>
            {filtered.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => navigate(`/admin/operadores/${op.id}${empresaId ? `?empresaId=${empresaId}` : ""}`)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-text-primary">{op.nome}</p>
                    <StatusBadge
                      variant={role === "admin" ? "info" : "neutral"}
                      size="sm"
                      label={role === "admin" ? t("admin.roleAdmin") : t("admin.roleOperator")}
                    />
                  </div>
                  <p className="truncate text-xs text-text-muted">{op.email}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {op.totalClientes} {t("cliente.title")} · {op.contratosAtivos} {t("contrato.title")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
              </button>
            ))}
          </>
        )}
      </div>
    </Modal>
  )
}
