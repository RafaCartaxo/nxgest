import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { SectionHeader } from "../SectionHeader/SectionHeader.js"

interface CollapsibleSectionProps<T = unknown> {
  title: string
  /** Contagem exibida no header (ex.: total de itens). */
  count?: number
  /** Itens a listar (com `renderItem`) — habilita limite + "Ver mais". */
  items?: T[]
  renderItem?: (item: T) => ReactNode
  /** Máximo de itens antes do "Ver mais" (default: todos). */
  limit?: number
  /** Começa colapsada (default: false). */
  defaultCollapsed?: boolean
  /** Conteúdo direto (quando não usa items/renderItem). */
  children?: ReactNode
  className?: string
}

/**
 * Seção com header clicável que expande/recolhe o conteúdo (padrão canônico:
 * mesmo estilo do `SectionHeader` + chevron). Quando `items`/`limit` são
 * informados, mostra `limit` itens + "Ver mais" (+limit a cada clique).
 */
export function CollapsibleSection<T = unknown>({
  title,
  count,
  items,
  renderItem,
  limit,
  defaultCollapsed = false,
  children,
  className = "",
}: CollapsibleSectionProps<T>) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [expandido, setExpandido] = useState(false)

  const total = items?.length ?? 0
  const temLimite = items != null && limit != null && total > limit
  const visiveis = temLimite && !expandido ? (limit as number) : total

  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-3">
        <SectionHeader title={count != null ? `${title} (${count})` : title} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="pb-1"
        >
          <ChevronDown
            className={`h-5 w-5 text-text-secondary transition-transform ${collapsed ? "" : "rotate-180"}`}
            aria-hidden
          />
        </button>
      </div>

      {!collapsed && (
        <>
          {items && renderItem
            ? items.slice(0, visiveis).map(renderItem)
            : children}
          {temLimite && (
            <button
              type="button"
              onClick={() => setExpandido((e) => !e)}
              className="mt-2 text-sm font-medium text-primary hover:text-primary"
            >
              {expandido ? t("common.verMenos") : t("common.verMais")}
            </button>
          )}
        </>
      )}
    </section>
  )
}
