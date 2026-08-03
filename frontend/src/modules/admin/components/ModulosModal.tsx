import { useState } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { MODULES } from "../../../shared/modules/modules.js"

interface Props {
  open: boolean
  empresaNome: string
  initial: string[] | null | undefined
  saving?: boolean
  onSave: (modulos: string[]) => void
  onClose: () => void
}

export function ModulosModal({ open, empresaNome, initial, saving, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string[]>(() => initial ?? MODULES.map((m) => m.id))

  if (!open) return null

  const current = selected
  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  const disabled = (id: string, dependsOn: readonly string[]): boolean => dependsOn.some((d) => !current.includes(d))

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
        <h3 className="text-lg font-semibold">{t("superAdmin.modulosTitle", { empresa: empresaNome })}</h3>
        <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto p-4">
        <p className="mb-3 text-sm text-text-secondary">{t("superAdmin.modulosHint")}</p>
        <div className="space-y-2">
          {MODULES.map((m) => {
            const off = disabled(m.id, m.dependsOn)
            const active = current.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                disabled={off}
                onClick={() => toggle(m.id)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors ${
                  off ? "cursor-not-allowed border-border-light opacity-50" : active ? "border-primary bg-primary-light" : "border-border-light bg-surface hover:border-primary"
                }`}
              >
                <span className={`text-sm font-medium ${active ? "text-primary" : "text-text-primary"}`}>{t(m.labelKey)}</span>
                <span className="text-xs text-text-muted">
                  {off ? t("superAdmin.modulosDependencia") : active ? t("superAdmin.modulosAtivo") : t("superAdmin.modulosInativo")}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border-light p-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="button" disabled={saving} onClick={() => onSave(current)}>
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </Modal>
  )
}
