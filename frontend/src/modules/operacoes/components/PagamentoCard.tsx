import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { PagamentoDoDiaItem } from "../services/operacoes.service.js"

interface PagamentoCardProps {
  item: PagamentoDoDiaItem
  onClick?: () => void
  className?: string
}

/**
 * Card de pagamento do dia (padrão do `CobrancaCard`, adaptado p/ pago).
 * Estrutura fixa de 4 linhas, altura uniforme:
 *
 *   1. Nome (primário) + Valor (value-lg, success)
 *   2. Bairro (secundário, truncate — largura total)
 *   3. "Parcela X de Y" ou "X parcelas" (secundário, truncate)
 *   4. StatusBadge "Pago" (success)
 *
 * `onClick` opcional — quando presente, o card vira botão e navega ao contrato.
 */
export function PagamentoCard({ item, onClick, className = "" }: PagamentoCardProps) {
  const { t } = useTranslation()

  const bairro = item.clienteBairro?.trim() ?? ""
  const nParcelas = item.parcelasPagas.length
  const parcela = nParcelas > 0
    ? nParcelas === 1
      ? t("operacoes.parcelaDe", { atual: item.parcelasPagas[0], total: item.totalParcelasContrato })
      : t("operacoes.parcelasPagas", { count: nParcelas })
    : ""

  return (
    <Card.Root
      variant="collection"
      tone="success"
      interactive={!!onClick}
      as={onClick ? "button" : "div"}
      onClick={onClick}
      className={`w-full p-4 pl-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 truncate font-semibold text-text-primary">{item.clienteNome}</p>
        <div className="flex shrink-0 items-center gap-1 text-right">
          <span className="value-lg whitespace-nowrap text-success-text">
            R$ {formatCurrency(item.valor)}
          </span>
          {onClick && <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden />}
        </div>
      </div>
      {bairro && <p className="mt-0.5 truncate text-sm text-text-secondary">{bairro}</p>}
      {parcela && <p className="mt-0.5 truncate text-sm text-text-secondary">{parcela}</p>}
      <div className="mt-2 flex min-h-6 items-center gap-2">
        <StatusBadge variant="success" label={t("operacoes.resumo.pagos")} className="shrink-0" />
      </div>
    </Card.Root>
  )
}

export type { PagamentoCardProps }
