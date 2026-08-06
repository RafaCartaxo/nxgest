import { useTranslation } from "react-i18next"
import { CobrancaCard } from "./CobrancaCard.js"
import type { CobrancaItem } from "../services/operacoes.service.js"

interface CobrancaListProps {
  items: CobrancaItem[]
  onCardClick?: (item: CobrancaItem) => void
  emptyMessageKey?: string
}

export function CobrancaList({ items, onCardClick, emptyMessageKey }: CobrancaListProps) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-text-muted">
        {t(emptyMessageKey ?? "operacoes.nenhumaCobranca")}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <CobrancaCard
          key={`${item.clienteId}-${item.contratoId}`}
          item={item}
          onClick={onCardClick ? () => onCardClick(item) : undefined}
        />
      ))}
    </div>
  )
}
