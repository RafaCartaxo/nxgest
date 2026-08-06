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
 * Card de cobrança (PLAN-047/050/051) — estrutura fixa de 4 linhas para altura uniforme:
 *   1. Nome (primário) + Valor (value-lg, nowrap) + [dias de atraso sob o valor]
 *   2. Bairro (secundário, truncate)
 *   3. Parcela X de Y (secundário, truncate)
 *   4. StatusBadge (terciário, 1 linha fixa)
 * Bairro e parcela em linhas próprias (sem truncamento mútuo); "N dias de atraso"
 * alocado na coluna direita (linha própria, nunca trunca) e a coluna esquerda
 * (sempre mais alta) garante altura idêntica entre atrasado e vence hoje.
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
          <div className="mt-2 flex min-h-6 items-center">
            <StatusBadge
              variant={tone}
              label={item.situacao === "atrasado" ? t("status.atrasado") : t("status.venceHoje")}
              className="shrink-0"
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end self-stretch text-right">
          <div className="flex items-center gap-1">
            <span className="value-lg whitespace-nowrap text-text-primary">
              R$ {formatCurrency(item.totalPendente)}
            </span>
            {onClick && <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden />}
          </div>
          {item.diasEmAtraso > 0 && (
            <span className="mt-auto text-xs text-danger-text">
              {t("operacoes.diasAtraso", { count: item.diasEmAtraso })}
            </span>
          )}
        </div>
      </div>
    </Card.Root>
  )
}

export type { CobrancaCardProps }
