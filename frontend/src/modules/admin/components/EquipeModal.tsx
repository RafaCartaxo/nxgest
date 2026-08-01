import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import type { OperadorRow } from "../services/admin.service.js"

interface EquipeModalProps {
  open: boolean
  role: "admin" | "operator"
  operadores: OperadorRow[]
  onClose: () => void
}

export function EquipeModal({ open, role, operadores, onClose }: EquipeModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = ""
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const filtered = operadores
    .filter((op) => op.role === role)
    .sort((a, b) => a.nome.localeCompare(b.nome))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-md bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
          <h3 className="text-lg font-semibold">
            {role === "admin" ? t("admin.modalAdmins") : t("admin.modalOperadores")}
          </h3>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">{t("common.empty")}</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((op) => (
                <div key={op.id} className="flex items-center justify-between rounded-md border border-border-light bg-surface p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{op.nome}</p>
                    <p className="truncate text-xs text-text-muted">{op.email}</p>
                  </div>
                  <StatusBadge
                    variant={role === "admin" ? "info" : "neutral"}
                    size="sm"
                    label={role === "admin" ? t("admin.roleAdmin") : t("admin.roleOperator")}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
