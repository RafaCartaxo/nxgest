import { useTranslation } from "react-i18next"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import { CATEGORIA_ICONES } from "../../gasto/schemas/gasto.schema.js"
import type { GastoItem } from "../../gasto/services/gasto.service.js"

interface GastosPeriodoModalProps {
  open: boolean
  items: GastoItem[]
  dataInicio: string
  dataFim: string
  loading?: boolean
  onClose: () => void
}

export function GastosPeriodoModal({ open, items, dataInicio, dataFim, loading, onClose }: GastosPeriodoModalProps) {
  const { t } = useTranslation()

  const total = items.reduce((sum, g) => sum + g.valor, 0)

  const inicio = new Date(dataInicio + "T00:00:00").toLocaleDateString("pt-BR")
  const fim = new Date(dataFim + "T00:00:00").toLocaleDateString("pt-BR")

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t("gasto.title")} — ${inicio} a ${fim}`}
      maxWidth="max-w-md"
      footer={
        items.length > 0 ? (
          <div className="w-full text-right text-sm font-semibold text-text-primary">
            {t("gasto.totalPeriodo")}: R$ {formatCurrency(total)}
          </div>
        ) : undefined
      }
    >
      {loading ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-surface-hover" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">{t("operacoes.nenhumGastoPeriodo")}</p>
      ) : (
        <div className="space-y-2">
          {items.map((gasto) => (
            <div
              key={gasto.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CATEGORIA_ICONES[gasto.categoria] ?? "📋"}</span>
                  <span className="text-sm font-medium">{gasto.categoria}</span>
                  <span className="text-sm font-semibold text-danger-text">
                    R$ {formatCurrency(gasto.valor)}
                  </span>
                </div>
                {gasto.observacao && (
                  <p className="mt-0.5 text-xs text-text-secondary">{gasto.observacao}</p>
                )}
                <p className="mt-0.5 text-xs text-text-muted">
                  {new Date(gasto.data + "T00:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
