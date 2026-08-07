import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, Check } from "lucide-react"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { FieldSelect } from "../../../shared/components/Field/FieldSelect.js"
import { roleLabel } from "../../../shared/utils/role.js"
import type { OperadorRow } from "../services/admin.service.js"

export interface ReassignState {
  operador: OperadorRow
  roleDesejado: "admin" | "socio" | "operator"
  subordinados: number
}

interface Props {
  open: boolean
  reassign: ReassignState | null
  /** Chefes válidos (admins da empresa, excluindo o alvo). */
  chefes: OperadorRow[]
  saving?: boolean
  onConfirm: (novoChefeId: string) => void
  onClose: () => void
}

export function ReassignModal({ open, reassign, chefes, saving, onConfirm, onClose }: Props) {
  const { t } = useTranslation()
  const [novoChefe, setNovoChefe] = useState("")

  if (!open || !reassign) return null

  const validos = chefes.filter((c) => c.id !== reassign.operador.id)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("admin.reassignTitulo")}
      descricao={t("admin.reassignDesc", { n: reassign.subordinados, nome: reassign.operador.nome })}
      maxWidth="max-w-md"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={saving || !novoChefe} onClick={() => onConfirm(novoChefe)}>
            <Check className="size-4" /> {t("admin.reassignConfirmar")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-light p-3">
          <AlertTriangle className="size-4 shrink-0 text-warning-text" aria-hidden />
          <div className="text-sm text-text-primary">
            <p className="font-medium">{t("admin.reassignAviso")}</p>
            <p className="mt-0.5 text-xs text-text-secondary">{t("admin.reassignRole", { role: roleLabel(reassign.roleDesejado, t) })}</p>
          </div>
        </div>

        <FieldSelect
          label={t("admin.reassignNovoChefe")}
          value={novoChefe}
          onChange={(e) => setNovoChefe(e.target.value)}
          options={[
            { value: "", label: t("admin.reassignSelecione") },
            ...validos.map((c) => ({ value: c.id, label: `${c.nome} · ${roleLabel(c.role, t)}` })),
          ]}
        />
      </div>
    </Modal>
  )
}
