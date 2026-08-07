import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, Check, ChevronRight, Lock } from "lucide-react"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { FieldTextarea } from "../../../shared/components/Field/FieldTextarea.js"
import type { ImpactoDesativacao } from "../services/empresa.service.js"
import { MODULES } from "../../../shared/modules/modules.js"

interface Props {
  open: boolean
  impacto: ImpactoDesativacao | null
  canForce: boolean
  saving?: boolean
  onConfirm: (force: boolean, motivo: string) => void
  onClose: () => void
}

const moduloLabelKey = (id: string): string => MODULES.find((m) => m.id === id)?.labelKey ?? `modules.${id}`

export function ImpactConfirmModal({ open, impacto, canForce, saving, onConfirm, onClose }: Props) {
  const { t } = useTranslation()
  const [motivo, setMotivo] = useState("")

  useEffect(() => {
    if (open) setMotivo("")
  }, [open])

  if (!open || !impacto) return null

  const bloqueados = impacto.impacto.filter((i) => i.bloqueia)
  const permitidos = impacto.impacto.filter((i) => !i.bloqueia)
  const temDado = impacto.impacto.some((i) => i.contagem > 0)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("superAdmin.impactoTitulo")}
      descricao={t("superAdmin.impactoDescricao")}
      maxWidth="max-w-md"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("superAdmin.impactoCancelar")}
          </Button>
          <Button
            type="button"
            disabled={saving || (!canForce && bloqueados.length > 0) || (bloqueados.length > 0 && canForce && !motivo.trim())}
            onClick={() => onConfirm(bloqueados.length > 0, motivo)}
          >
            <Check className="size-4" />
            {bloqueados.length > 0 ? t("superAdmin.impactoForcar") : t("superAdmin.impactoConfirmar")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {bloqueados.length > 0 && (
          <div className="rounded-xl border border-danger/40 bg-danger-light p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-danger-text">
              <AlertTriangle className="size-4" aria-hidden /> {t("superAdmin.impactoBloqueado")}
            </p>
            <ul className="mt-2 space-y-1">
              {bloqueados.map((b) => (
                <li key={b.modulo} className="flex items-start justify-between gap-2 text-sm text-text-primary">
                  <span className="flex items-center gap-1 font-medium">
                    <Lock className="size-3 text-danger-text" aria-hidden /> {t(moduloLabelKey(b.modulo))}
                  </span>
                  <span className="text-right text-xs text-text-secondary">{b.detalhe}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {permitidos.length > 0 && (
          <div className="rounded-xl border border-warning/40 bg-warning-light p-3">
            <p className="text-sm font-medium text-warning-text">{t("superAdmin.impactoOculta")}</p>
            <ul className="mt-2 space-y-1">
              {permitidos.map((p) => (
                <li key={p.modulo} className="flex items-start justify-between gap-2 text-sm text-text-primary">
                  <span className="flex items-center gap-1">
                    <ChevronRight className="size-3 text-text-muted" aria-hidden /> {t(moduloLabelKey(p.modulo))}
                  </span>
                  <span className="text-right text-xs text-text-secondary">
                    {p.contagem > 0 ? `${p.contagem} · ${p.detalhe}` : p.detalhe}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!temDado && bloqueados.length === 0 && (
          <p className="text-sm text-text-secondary">{t("superAdmin.impactoVazio")}</p>
        )}

        {bloqueados.length > 0 && canForce && (
          <FieldTextarea
            label={t("superAdmin.impactoMotivo")}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder={t("superAdmin.impactoMotivoPlaceholder")}
          />
        )}
      </div>
    </Modal>
  )
}
