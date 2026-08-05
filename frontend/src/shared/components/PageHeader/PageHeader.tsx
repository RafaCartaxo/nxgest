import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronLeft } from "lucide-react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  /** linha pequena acima do título (ex.: data do dia) */
  eyebrow?: string
  action?: ReactNode
  back?: { onClick: () => void; title?: string }
}

export function PageHeader({ icon: Icon, title, subtitle, eyebrow, action, back }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {back && (
        <button
          type="button"
          onClick={back.onClick}
          title={back.title}
          aria-label={back.title}
          className="mb-1 flex items-center gap-1 rounded-md p-1 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          {back.title && <span>{back.title}</span>}
        </button>
      )}
      {eyebrow && <p className="text-sm text-text-muted">{eyebrow}</p>}
      <div className="mt-1 flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-light text-primary-text">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[24px] font-semibold leading-tight sm:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
