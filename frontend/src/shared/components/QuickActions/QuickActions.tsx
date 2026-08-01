import type { LucideIcon } from "lucide-react"

interface QuickAction {
  icon?: LucideIcon
  label: string
  onClick: () => void
  variant?: "blue" | "green" | "gray" | "warning" | "danger"
  show?: boolean
}

interface QuickActionsProps {
  actions: QuickAction[]
  layout?: "horizontal" | "vertical"
  disabled?: boolean
  size?: "sm" | "md"
}

const variantStyles = {
  blue:  { color: "text-primary-text",  hover: "hover:bg-primary-light",  bg: "bg-primary-light" },
  green: { color: "text-success-text", hover: "hover:bg-success-light", bg: "bg-success-light" },
  gray:  { color: "text-text-primary",  hover: "hover:bg-surface-hover", bg: "bg-surface-secondary" },
  warning: { color: "text-warning-text", hover: "hover:bg-warning-light", bg: "bg-warning-light" },
  danger: { color: "text-danger-text", hover: "hover:bg-danger-light", bg: "bg-danger-light" },
}

export function QuickActions({ actions, layout = "horizontal", disabled, size = "sm" }: QuickActionsProps) {
  const iconSize = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"
  const padding = size === "md" ? "px-3 py-1.5" : "px-2 py-1"

  return (
    <div className={layout === "horizontal" ? "flex flex-shrink-0 flex-wrap gap-1" : "flex gap-2"}>
      {actions.map((action) => {
        if (action.show === false) return null
        const Icon = action.icon
        const s = variantStyles[action.variant ?? "gray"]

        if (layout === "horizontal") {
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={disabled}
              title={action.label}
              className={`rounded ${padding} text-xs font-medium ${s.color} ${s.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {Icon ? <Icon className={`inline ${iconSize}`} /> : action.label}
            </button>
          )
        }

        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={disabled}
            title={action.label}
            className={`flex flex-1 flex-col items-center gap-1 rounded-md px-1 py-3 text-xs font-medium ${s.bg} ${s.color} ${s.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {Icon && <Icon className="h-5 w-5" />}
            {action.label}
          </button>
        )
      })}
    </div>
  )
}
