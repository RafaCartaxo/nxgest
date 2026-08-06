interface SwitchProps {
  checked: boolean
  onChange?: (v: boolean) => void
  disabled?: boolean
  label: string
  /** Tooltip exibido quando desabilitado (motivo). */
  motivo?: string
}

/** Switch canônico (identidade "Nexus") — track h-7 w-12 + knob centralizado. */
export function Switch({ checked, onChange, disabled, label, motivo }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={disabled ? motivo : undefined}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        checked ? "border-primary bg-primary" : "border-border-strong bg-muted"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        aria-hidden
        className={`size-5 rounded-full bg-surface shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}
