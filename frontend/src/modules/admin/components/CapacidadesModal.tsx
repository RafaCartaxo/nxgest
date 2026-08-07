import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ToggleLeft } from "lucide-react"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { Switch } from "../../../shared/components/Switch/Switch.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { CAPABILITIES, ALL_CAPABILITIES, capacidadesAplicaveis, type CapabilityId } from "../../../shared/modules/capacidades.js"
import { MODULES, type ModuleId } from "../../../shared/modules/modules.js"

interface Props {
  open: boolean
  empresaNome: string
  /** `null` = todas ativas (ausência de override). */
  initial: string[] | null | undefined
  /** Módulos ativos — capacidade com dono off fica desativada. */
  modulos: string[] | null | undefined
  saving?: boolean
  onSave: (capacidades: string[] | null) => void
  onClose: () => void
}

const moduloLabelKey = (id: ModuleId): string => MODULES.find((m) => m.id === id)?.labelKey ?? `modules.${id}`

export function CapacidadesModal({ open, empresaNome, initial, modulos, saving, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Set<string> | null>(() =>
    initial ? new Set(initial) : initial === null ? null : new Set()
  )

  if (!open) return null

  const current = selected

  function alternar(id: string, v: boolean) {
    setSelected((prev) => {
      const base = prev ?? new Set(ALL_CAPABILITIES)
      const next = new Set(base)
      if (v) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function save() {
    if (current === null) {
      onSave(null)
      return
    }
    // Fix D: exclui capacidades com módulo dono desativado (backend rejeita 422).
    const aplicaveis = capacidadesAplicaveis([...current], modulos)
    if (aplicaveis.length === 0) {
      onSave(null)
      return
    }
    const tudo = aplicaveis.length === ALL_CAPABILITIES.length
    onSave(tudo ? null : aplicaveis)
  }

  const donoOff = (id: CapabilityId): boolean => {
    const owner = CAPABILITIES.find((c) => c.id === id)?.moduleOwner
    if (!owner) return false
    return Array.isArray(modulos) && !modulos.includes(owner)
  }

  const grupos = [...new Set(CAPABILITIES.map((c) => c.moduleOwner))]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("capacidades.titulo", { empresa: empresaNome })}
      descricao={t("capacidades.hint")}
      maxWidth="max-w-md"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={saving} onClick={save}>
            <Check className="size-4" /> {saving ? t("common.saving") : t("common.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {initial === null && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary-light p-3">
            <ToggleLeft className="size-5 text-primary-text" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary-text">{t("capacidades.todasAtivas")}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{t("capacidades.todasAtivasDesc")}</p>
            </div>
            <StatusBadge variant="info" label={t("capacidades.recursos")} />
          </div>
        )}

        {grupos.map((mod) => {
          const caps = CAPABILITIES.filter((c) => c.moduleOwner === mod)
          return (
            <div key={mod}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {t(moduloLabelKey(mod))}
              </p>
              <div className="space-y-2">
                {caps.map((c) => {
                  const on = current !== null ? current.has(c.id) : true
                  const bloqueado = donoOff(c.id)
                  const motivo = bloqueado ? t("capacidades.requerModulo", { modulo: t(moduloLabelKey(c.moduleOwner)) }) : undefined
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${
                        on && !bloqueado ? "border-primary/40 bg-primary-light" : "border-border bg-card"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${on && !bloqueado ? "text-primary-text" : "text-text-primary"}`}>
                          {t(c.labelKey)}
                        </p>
                      </div>
                      <Switch
                        label={t(c.labelKey)}
                        checked={on && !bloqueado}
                        disabled={bloqueado}
                        motivo={motivo}
                        onChange={(v) => alternar(c.id, v)}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
