import { useTranslation } from "react-i18next"
import { formatCurrency } from "../../../shared/utils/masks.js"
import { CATEGORIA_ICONES } from "../schemas/gasto.schema.js"
import type { GastoItem } from "../services/gasto.service.js"

interface GastoListProps {
  items: GastoItem[]
  totalPeriodo: number
  onDelete: (id: string) => void
}

export function GastoList({ items, totalPeriodo, onDelete }: GastoListProps) {
  const { t } = useTranslation()

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm text-text-secondary">
        {t("gasto.totalPeriodo")}: <span className="font-semibold text-danger-text">R$ {formatCurrency(totalPeriodo)}</span>
      </p>

      {items.length === 0 ? (
        <p className="text-text-secondary">{t("gasto.nenhumGasto")}</p>
      ) : (
        <div className="space-y-2">
          {items.map((gasto) => (
            <div
              key={gasto.id}
              className="flex items-center justify-between rounded-md border border-border-light bg-surface px-3 py-2"
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
              <button
                type="button"
                onClick={() => onDelete(gasto.id)}
                className="ml-3 flex-shrink-0 rounded p-1 text-text-muted hover:bg-surface-hover hover:text-danger"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
