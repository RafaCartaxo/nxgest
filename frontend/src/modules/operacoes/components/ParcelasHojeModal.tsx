import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { ParcelaHojeCliente } from "../services/operacoes.service.js"

interface ParcelasHojeModalProps {
  open: boolean
  items: ParcelaHojeCliente[]
  loading?: boolean
  title?: string
  onClose: () => void
}

export function ParcelasHojeModal({ open, items, loading, title, onClose }: ParcelasHojeModalProps) {
  const { t } = useTranslation()

  const totalGeral = items.reduce(
    (sum, c) => sum + c.parcelas.reduce((s, p) => s + p.saldoPendente, 0),
    0,
  )

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
        <h3 className="text-lg font-semibold">{title ?? t("caixa.aReceberHoje")}</h3>
        <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-surface-hover" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">{t("operacoes.nenhumaParcelaHoje")}</p>
        ) : (
          <>
            <div className="space-y-4">
              {items.map((cliente) => (
                <div key={`${cliente.clienteId}-${cliente.contratoId}`} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-medium text-text-primary">{cliente.clienteNome}</p>
                  <div className="mt-2 space-y-1">
                    {cliente.parcelas.map((p) => (
                      <div key={p.numero} className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">
                          Parcela {p.numero}
                        </span>
                        <span>
                          <span className="text-text-primary font-medium">
                            R$ {formatCurrency(p.saldoPendente)}
                          </span>
                          <span className="text-text-muted ml-1 text-xs">
                            de R$ {formatCurrency(p.valorPrevisto)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-border-light pt-3 text-right text-sm font-semibold text-text-primary">
              Total: R$ {formatCurrency(totalGeral)}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
