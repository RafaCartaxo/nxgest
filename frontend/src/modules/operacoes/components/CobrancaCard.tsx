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

export function CobrancaCard({ item, onClick, className = "" }: CobrancaCardProps) {
  const { t } = useTranslation()
  const tone: CardTone = item.situacao === "atrasado" ? "danger" : "info"

  const bairro = item.clienteBairro?.trim() ?? ""
  const parcela = t("operacoes.parcelaDe", { atual: item.proximaParcela, total: item.totalParcelasContrato })
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
        <div className="min-w-0">
          <p className="truncate font-semibold text-text-primary">{item.clienteNome}</p>
          <p className="mt-0.5 text-sm text-text-secondary">{subtitulo}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge
              variant={tone}
              label={item.situacao === "atrasado" ? t("status.atrasado") : t("status.venceHoje")}
            />
            {item.diasEmAtraso > 0 && (
              <span className="text-xs text-danger-text">
                {t("operacoes.diasAtraso", { count: item.diasEmAtraso })}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-right">
          <span className="value-lg text-text-primary">
            R$ {formatCurrency(item.totalPendente)}
          </span>
          {onClick && <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden />}
        </div>
      </div>
    </Card.Root>
  )
}

export type { CobrancaCardProps }
