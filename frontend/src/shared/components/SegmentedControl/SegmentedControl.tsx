import type { ReactNode } from "react"

interface Item<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (v: T) => void
  items: Item<T>[]
  label: string
  className?: string
}

/** Controle segmentado compacto (pills) — port do kit Lovable (PLAN-069). */
export function SegmentedControl<T extends string>({ value, onChange, items, label, className = "" }: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className={`inline-flex w-full gap-1 rounded-xl border border-border bg-surface p-1 ${className}`}>
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(it.value)}
            className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              active ? "bg-primary text-primary-foreground" : "text-text-muted hover:bg-surface-hover"
            }`}
          >
            {it.icon}
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
