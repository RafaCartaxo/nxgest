import { useTranslation } from "react-i18next"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { PagamentoDoDiaItem } from "../services/operacoes.service.js"

interface PagamentosPeriodoModalProps {
  open: boolean
  items: PagamentoDoDiaItem[]
  dataInicio: string
  dataFim: string
  loading?: boolean
  onClose: () => void
}

export function PagamentosPeriodoModal({ open, items, dataInicio, dataFim, loading, onClose }: PagamentosPeriodoModalProps) {
  const { t } = useTranslation()

  const total = items.reduce((sum, p) => sum + p.valor, 0)

  const inicio = new Date(dataInicio + "T00:00:00").toLocaleDateString("pt-BR")
  const fim = new Date(dataFim + "T00:00:00").toLocaleDateString("pt-BR")

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t("caixa.recebidoSemana")} — ${inicio} a ${fim}`}
      maxWidth="max-w-md"
      footer={
        items.length > 0 ? (
          <div className="w-full text-right text-sm font-semibold text-text-primary">
            Total: R$ {formatCurrency(total)}
          </div>
        ) : undefined
      }
    >
      {loading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-surface-hover" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">{t("operacoes.nenhumPagamentoPeriodo")}</p>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.pagamentoId} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{p.clienteNome}</p>
                <p className="text-xs text-text-muted">{p.data} {p.createdAt.slice(11, 16)}</p>
              </div>
              <p className="ml-3 text-sm font-semibold text-success-text">R$ {formatCurrency(p.valor)}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
