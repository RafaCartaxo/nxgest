interface TabsProps<T extends string> {
  value: T
  onChange: (v: T) => void
  items: Array<{ value: T; label: string }>
  className?: string
}

/** Tabs/pills canônicos — container rounded-xl border bg-card + aba ativa bg-primary-light. */
export function Tabs<T extends string>({ value, onChange, items, className = "" }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 ${className}`}
    >
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-colors ${
              active ? "bg-primary-light text-primary-text" : "text-text-muted hover:bg-surface-hover"
            }`}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
