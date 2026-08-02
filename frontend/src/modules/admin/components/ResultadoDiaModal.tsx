import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { formatCurrency } from "../../../shared/utils/masks.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { listarMovimentacoes, type MovimentacaoItem } from "../../caixa/services/caixa.service.js"
import { getLocalDateString } from "../../../shared/utils/parseDateLocal.js"

interface ResultadoDiaModalProps {
  open: boolean
  onClose: () => void
}

export function ResultadoDiaModal({ open, onClose }: ResultadoDiaModalProps) {
  const { t } = useTranslation()
  const [items, setItems] = useState<MovimentacaoItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const hoje = getLocalDateString(new Date())
    listarMovimentacoes({ dataInicio: hoje, dataFim: hoje }, undefined)
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  const entradas = items.filter((m) => m.tipo === "entrada")
  const saidas = items.filter((m) => m.tipo === "saida")
  const totalEntradas = entradas.reduce((s, m) => s + m.valor, 0)
  const totalSaidas = saidas.reduce((s, m) => s + m.valor, 0)
  const resultado = totalEntradas - totalSaidas

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
        <h3 className="text-lg font-semibold">{t("admin.modalResultadoDia")}</h3>
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
            <p className="py-8 text-center text-sm text-text-muted">{t("caixa.nenhumaMovimentacao")}</p>
          ) : (
            <>
              <div className="space-y-2">
                {items.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-md border border-border-light bg-surface p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{m.origem}</p>
                      {m.descricao && <p className="truncate text-xs text-text-muted">{m.descricao}</p>}
                    </div>
                    <p className={`ml-3 text-sm font-semibold ${m.tipo === "entrada" ? "text-success-text" : "text-danger-text"}`}>
                      {m.tipo === "entrada" ? "+" : "-"} R$ {formatCurrency(m.valor)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 border-t border-border-light pt-3 text-sm">
                <div className="flex items-center justify-between text-text-secondary">
                  <span>{t("caixa.entradas")}:</span>
                  <span className="font-medium text-success-text">R$ {formatCurrency(totalEntradas)}</span>
                </div>
                <div className="flex items-center justify-between text-text-secondary">
                  <span>{t("caixa.saidas")}:</span>
                  <span className="font-medium text-danger-text">R$ {formatCurrency(totalSaidas)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-text-primary">
                  <span>{t("admin.resultadoDia")}:</span>
                  <span className={resultado >= 0 ? "text-success-text" : "text-danger-text"}>
                    R$ {formatCurrency(Math.abs(resultado))}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
    </Modal>
  )
}
