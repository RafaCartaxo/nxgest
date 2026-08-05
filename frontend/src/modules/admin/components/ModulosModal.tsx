import { useState } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { MODULES, type ModuleId } from "../../../shared/modules/modules.js"

interface Props {
  open: boolean
  empresaNome: string
  initial: string[] | null | undefined
  saving?: boolean
  onSave: (modulos: string[]) => void
  onClose: () => void
}

const GRUPOS: Array<{ key: string; ids: ModuleId[] }> = [
  { key: "superAdmin.modulosGrupoBase", ids: ["clientes", "contratos"] },
  { key: "superAdmin.modulosGrupoFinanceiro", ids: ["caixa", "gastos"] },
  { key: "superAdmin.modulosGrupoCobranca", ids: ["rota", "cobrancas", "atendidos"] },
]

function Switch({ active, disabled, onClick }: { active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors ${
        active ? "bg-primary" : "bg-border-strong"
      } ${disabled ? "opacity-40" : "cursor-pointer"}`}
    >
      <span
        className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          active ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

export function ModulosModal({ open, empresaNome, initial, saving, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string[]>(() => initial ?? MODULES.map((m) => m.id))

  if (!open) return null

  const current = selected
  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  const depsFaltando = (id: string): string[] =>
    MODULES.find((m) => m.id === id)?.dependsOn.filter((d) => !current.includes(d)) ?? []

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
        <h3 className="text-lg font-semibold">{t("superAdmin.modulosTitle", { empresa: empresaNome })}</h3>
        <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto p-4">
        <p className="mb-4 text-sm text-text-secondary">{t("superAdmin.modulosHint")}</p>
        {GRUPOS.map((grupo) => (
          <div key={grupo.key} className="mb-4 last:mb-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{t(grupo.key)}</p>
            <div className="space-y-2">
              {grupo.ids.map((id) => {
                const mod = MODULES.find((m) => m.id === id)
                if (!mod) return null
                const faltando = depsFaltando(id)
                const off = faltando.length > 0
                const active = current.includes(id)
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                      active ? "border-primary bg-primary-light" : "border-border bg-card"
                    } ${off ? "opacity-60" : ""}`}
                  >
                    <Switch active={active} disabled={off} onClick={() => toggle(id)} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${active ? "text-primary-text" : "text-text-primary"}`}>
                        {t(mod.labelKey)}
                      </p>
                      {off ? (
                        <p className="text-xs text-danger-text">
                          {t("superAdmin.modulosRequer", { modulos: faltando.map((d) => t(MODULES.find((m) => m.id === d)?.labelKey ?? d)).join(", ") })}
                        </p>
                      ) : (
                        <p className="text-xs text-text-muted">
                          {active ? t("superAdmin.modulosAtivo") : t("superAdmin.modulosInativo")}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
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
