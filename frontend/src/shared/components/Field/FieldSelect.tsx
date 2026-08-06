import { forwardRef, type SelectHTMLAttributes } from "react"
import { fieldControl, fieldError } from "./fieldClasses.js"

interface FieldSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
  /** Option placeholder (value vazio, disabled + hidden). */
  placeholder?: string
  options: Array<{ value: string; label: string }>
}

/** Campo select canônico — mesmo visual do `Field` (rounded-xl min-h-12 border-strong). */
export const FieldSelect = forwardRef<HTMLSelectElement, FieldSelectProps>(function FieldSelect(
  { label, error, hint, placeholder, options, className, ...props },
  ref,
) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label}
        {props.required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <div className="relative min-w-0">
        <select
          ref={ref}
          {...props}
          className={`${fieldControl} ${error ? fieldError : ""} pr-9 ${className ?? ""}`}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {hint && <span className="mt-1 block text-xs text-text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-danger-text">{error}</span>}
    </div>
  )
})
