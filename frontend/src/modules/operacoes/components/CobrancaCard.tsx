import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { Card, type CardTone } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { CobrancaItem } from "../services/operacoes.service.js"

interface CobrancaCardProps {
  item: CobrancaItem
  onClick?: () => void
  className?: string
}

/**
 * Card de cobrança (PLAN-047/050) — estrutura fixa de 3 linhas para altura uniforme:
 *   1. Nome (primário) + Valor (value-lg, nowrap)
 *   2. Bairro · Parcela X de Y (secundário, truncate)
 *   3. StatusBadge + dias de atraso (terciário, 1 linha fixa)
 */
export function CobrancaCard({ item, onClick, className = "" }: CobrancaCardProps) {
  const { t } = useTranslation()
  const tone: CardTone = item.situacao === "atrasado" ? "danger" : "info"

  const bairro = item.clienteBairro?.trim() ?? ""
  const parcelaNumero = item.proximoNumeroParcela
  const parcela = parcelaNumero > 0
    ? t("operacoes.parcelaDe", { atual: parcelaNumero, total: item.totalParcelasContrato })
    : ""
  const subtitulo = [bairro, parcela].filter(Boolean).join(" · ")

  return (
    <Card.Root
      variant="collection"
      tone={tone}
      interactive={!!onClick}
      as={onClick ? "button" : "div"}
      onClick={onClick}
      className={`w-full p-4 pl-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-text-primary">{item.clienteNome}</p>
          <p className="mt-0.5 truncate text-sm text-text-secondary">{subtitulo}</p>
          <div className="mt-2 flex min-h-6 items-center gap-2">
            <StatusBadge
              variant={tone}
              label={item.situacao === "atrasado" ? t("status.atrasado") : t("status.venceHoje")}
              className="shrink-0"
            />
            {item.diasEmAtraso > 0 && (
              <span className="truncate text-xs text-danger-text">
                {t("operacoes.diasAtraso", { count: item.diasEmAtraso })}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-right">
          <span className="value-lg whitespace-nowrap text-text-primary">
            R$ {formatCurrency(item.totalPendente)}
          </span>
          {onClick && <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden />}
        </div>
      </div>
    </Card.Root>
  )
}

export type { CobrancaCardProps }
