import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  right?: ReactNode
}

/**
 * Campo de entrada canônico (DS v2 / PLAN-039).
 * Input `rounded-xl min-h-12 border-strong` + label + erro. Usar em todos os formulários.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, right, className, ...props },
  ref,
) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label}
        {props.required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <div className="relative min-w-0">
        <input
          ref={ref}
          {...props}
          className={`min-h-12 w-full min-w-0 max-w-full rounded-xl border border-border-strong bg-surface px-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary ${className ?? ""}`}
        />
        {right}
      </div>
      {hint && <span className="mt-1 block text-xs text-text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-danger-text">{error}</span>}
    </div>
  )
})
