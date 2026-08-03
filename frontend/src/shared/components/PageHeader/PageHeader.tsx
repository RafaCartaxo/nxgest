import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronLeft } from "lucide-react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: ReactNode
  back?: { onClick: () => void; title?: string }
}

export function PageHeader({ icon: Icon, title, subtitle, action, back }: PageHeaderProps) {
  return (
    <div className={`relative mb-6 overflow-hidden rounded-lg bg-gradient-accent px-5 text-white shadow-sm ${back ? "pb-6 pt-9" : "py-6"}`}>
      {back && (
        <button
          type="button"
          onClick={back.onClick}
          title={back.title}
          aria-label={back.title}
          className="absolute left-3 top-2 rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="flex items-center gap-3">
        <Icon className="h-8 w-8 shrink-0 opacity-90" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
