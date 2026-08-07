import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Lock, ToggleLeft } from "lucide-react"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { Switch } from "../../../shared/components/Switch/Switch.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { MODULES, completarDependencias, type ModuleId } from "../../../shared/modules/modules.js"

interface Props {
  open: boolean
  empresaNome: string
  initial: string[] | null | undefined
  saving?: boolean
  onSave: (modulos: string[]) => void
  onOpenCapacidades?: () => void
  onClose: () => void
}

const GRUPOS: Array<{ key: string; ids: ModuleId[] }> = [
  { key: "superAdmin.modulosGrupoBase", ids: ["clientes", "contratos"] },
  { key: "superAdmin.modulosGrupoFinanceiro", ids: ["caixa", "gastos"] },
  { key: "superAdmin.modulosGrupoCobranca", ids: ["rota", "cobrancas", "atendidos"] },
]

export function ModulosModal({ open, empresaNome, initial, saving, onSave, onOpenCapacidades, onClose }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string[]>(() => {
    const base = initial ?? MODULES.map((m) => m.id)
    return completarDependencias(base)
  })

  if (!open) return null

  const current = selected

  function alternar(id: string, v: boolean) {
    setSelected((prev) => {
      if (v) return completarDependencias([...prev, id])
      const remover = new Set<string>([id])
      let mudou = true
      while (mudou) {
        mudou = false
        for (const m of MODULES) {
          if (remover.has(m.id)) continue
          if (m.dependsOn.some((d) => remover.has(d))) {
            remover.add(m.id)
            mudou = true
          }
        }
      }
      return prev.filter((x) => !remover.has(x))
    })
  }

  const depsFaltando = (id: string): string[] =>
    MODULES.find((m) => m.id === id)?.dependsOn.filter((d) => !current.includes(d)) ?? []

  const labelDe = (id: string) => t(MODULES.find((m) => m.id === id)?.labelKey ?? id)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("superAdmin.modulosTitle", { empresa: empresaNome })}
      descricao={t("superAdmin.modulosHint")}
      maxWidth="max-w-md"
      footer={
        <>
          {onOpenCapacidades && (
            <Button type="button" variant="soft" onClick={onOpenCapacidades}>
              <ToggleLeft className="size-4" /> {t("superAdmin.capacidadesButton")}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={saving} onClick={() => onSave(current)}>
            <Check className="size-4" /> {saving ? t("common.saving") : t("common.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("superAdmin.modulosGrupoBase")}
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary-light p-3">
            <Switch checked disabled label={t("modules.central")} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-text-primary">{t("modules.central")}</p>
                <StatusBadge variant="info" label={t("superAdmin.sempreAtivo")} />
              </div>
              <p className="mt-0.5 text-xs text-text-secondary">{t("modules.central.descricao")}</p>
            </div>
          </div>
        </div>

        {GRUPOS.map((grupo) => (
          <div key={grupo.key}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{t(grupo.key)}</p>
            <div className="space-y-2">
              {grupo.ids.map((id) => {
                const mod = MODULES.find((m) => m.id === id)
                if (!mod) return null
                const faltando = depsFaltando(id)
                const on = current.includes(id)
                const bloqueado = !on && faltando.length > 0
                const motivo = t("superAdmin.modulosRequer", { modulos: faltando.map(labelDe).join(", ") })
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      on ? "border-primary/40 bg-primary-light" : "border-border bg-card"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${on ? "text-primary-text" : "text-text-primary"}`}>
                        {t(mod.labelKey)}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">{t(mod.descricaoKey)}</p>
                      {bloqueado && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-warning-text">
                          <Lock className="size-3" aria-hidden />
                          {motivo}
                        </p>
                      )}
                    </div>
                    <Switch
                      label={t(mod.labelKey)}
                      checked={on}
                      disabled={bloqueado}
                      motivo={motivo}
                      onChange={(v) => alternar(id, v)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
