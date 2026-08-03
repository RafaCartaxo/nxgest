import type { ReactNode } from "react"

interface SectionHeaderProps {
  title: string
  action?: { label: string; onClick: () => void }
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="mt-6 mb-3 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
      {action && (
        <button type="button" onClick={action.onClick} className="text-sm font-medium text-primary hover:text-primary">
          {action.label}
        </button>
      )}
    </div>
  )
}
