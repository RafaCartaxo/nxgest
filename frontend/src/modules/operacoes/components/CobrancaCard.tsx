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
 * Card de cobrança (PLAN-047/050/051/052) — estrutura fixa de 4 linhas para altura uniforme:
 *   1. Nome (primário) + Valor (value-lg, nowrap)
 *   2. Bairro (secundário, truncate)
 *   3. Parcela X de Y (secundário, truncate)
 *   4. StatusBadge + dias de atraso (terciário, items-center — centralizados)
 * O "N dias de atraso" fica na linha do badge (verticalmente centralizado com ele),
 * truncando só no extremo estreito (carousel da Central).
 */
export function CobrancaCard({ item, onClick, className = "" }: CobrancaCardProps) {
  const { t } = useTranslation()
  const tone: CardTone = item.situacao === "atrasado" ? "danger" : "info"

  const bairro = item.clienteBairro?.trim() ?? ""
  const parcelaNumero = item.proximoNumeroParcela
  const parcela = parcelaNumero > 0
    ? t("operacoes.parcelaDe", { atual: parcelaNumero, total: item.totalParcelasContrato })
    : ""

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
          <p className="mt-0.5 truncate text-sm text-text-secondary">{bairro}</p>
          <p className="mt-0.5 truncate text-sm text-text-secondary">{parcela}</p>
          <div className="mt-2 flex min-h-6 items-center gap-2">
            <StatusBadge
              variant={tone}
              label={item.situacao === "atrasado" ? t("status.atrasado") : t("status.venceHoje")}
              className="shrink-0"
            />
            {item.diasEmAtraso > 0 && (
              <span className="min-w-0 truncate text-xs text-danger-text">
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
