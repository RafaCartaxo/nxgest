import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { X, ChevronRight } from "lucide-react"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { Contrato } from "../../contrato/services/contrato.service.js"

interface ContratosSemanaModalProps {
  open: boolean
  items: Contrato[]
  loading?: boolean
  onClose: () => void
}

export function ContratosSemanaModal({ open, items, loading, onClose }: ContratosSemanaModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const total = items.reduce((sum, c) => sum + c.valorBase, 0)

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
        <h3 className="text-lg font-semibold">{t("caixa.vendasSemana")}</h3>
        <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-surface-hover" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">{t("operacoes.nenhumContratoPeriodo")}</p>
        ) : (
          <>
            <div className="space-y-2">
              {items.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    onClose()
                    navigate(`/contratos/${c.id}`)
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left hover:bg-surface-hover"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {c.clienteNome ?? c.clienteId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(c.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">R$ {formatCurrency(c.valorBase)}</p>
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-border-light pt-3 text-right text-sm font-semibold text-text-primary">
              Total: R$ {formatCurrency(total)}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
