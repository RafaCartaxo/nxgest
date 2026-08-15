import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { ApiError } from "../../../api/client.js"
import { updateOperador, type OperadorRow } from "../services/admin.service.js"
import type { ReassignState } from "../components/ReassignModal.js"

export interface EditarOperadorData {
  nome?: string
  email?: string
  role?: "admin" | "socio" | "operator"
  chefeId?: string | null
  foto?: string | null
  telefone?: string | null
}

interface Options {
  empresaId?: string
  onSaved?: () => void
}

/**
 * Edição de operador (PLAN-061): update + reassign guiado no rebaixamento com
 * subordinados (`OPERATOR_HAS_SUBORDINATES`). Compartilhado entre AdminPage
 * (lista) e OperadorDetail (botão Editar) — fonte única do fluxo de edição.
 */
export function useEditarOperador({ empresaId, onSaved }: Options = {}) {
  const { t } = useTranslation()
  const feedback = useFeedback()

  const [reassignState, setReassignState] = useState<ReassignState | null>(null)
  const [saving, setSaving] = useState(false)

  const handleUpdate = useCallback(
    async (operador: OperadorRow, data: EditarOperadorData): Promise<boolean> => {
      setSaving(true)
      try {
        await updateOperador(operador.id, data, empresaId)
        feedback.show({ status: "success", message: t("admin.editarSucesso") })
        setReassignState(null)
        onSaved?.()
        return true
      } catch (err) {
        if (err instanceof ApiError && err.code === "OPERATOR_HAS_SUBORDINATES") {
          // Rebaixamento com subordinados → reassign guiado (PLAN-061).
          setReassignState({
            operador,
            roleDesejado: (data.role ?? operador.role) as "admin" | "socio" | "operator",
            subordinados: typeof (err.payload as { subordinados?: number } | undefined)?.subordinados === "number" ? (err.payload as { subordinados: number }).subordinados : 0,
          })
          return true
        }
        feedback.show({ status: "error", message: err instanceof ApiError ? err.message : t("admin.erroCarregar") })
        return false
      } finally {
        setSaving(false)
      }
    },
    [empresaId, feedback, onSaved, t],
  )

  const handleReassignConfirm = useCallback(
    async (novoChefeId: string): Promise<boolean> => {
      if (!reassignState) return false
      setSaving(true)
      try {
        await updateOperador(reassignState.operador.id, { role: reassignState.roleDesejado, reatribuirParaChefeId: novoChefeId }, empresaId)
        feedback.show({ status: "success", message: t("admin.editarSucesso") })
        setReassignState(null)
        onSaved?.()
        return true
      } catch (err) {
        feedback.show({ status: "error", message: err instanceof ApiError ? err.message : t("admin.erroCarregar") })
        return false
      } finally {
        setSaving(false)
      }
    },
    [empresaId, feedback, onSaved, reassignState, t],
  )

  return { saving, reassignState, handleUpdate, handleReassignConfirm, closeReassign: () => setReassignState(null) }
}
