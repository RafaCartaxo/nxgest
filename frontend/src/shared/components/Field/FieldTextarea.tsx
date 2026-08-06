import { forwardRef, type TextareaHTMLAttributes } from "react"
import { fieldControl, fieldError } from "./fieldClasses.js"

interface FieldTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

/** Campo textarea canônico — mesmo visual do `Field` (rounded-xl min-h-12 border-strong). */
export const FieldTextarea = forwardRef<HTMLTextAreaElement, FieldTextareaProps>(function FieldTextarea(
  { label, error, hint, className, rows = 3, ...props },
  ref,
) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label}
        {props.required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <div className="relative min-w-0">
        <textarea
          ref={ref}
          rows={rows}
          {...props}
          className={`${fieldControl} ${error ? fieldError : ""} py-2.5 ${className ?? ""}`}
        />
      </div>
      {hint && <span className="mt-1 block text-xs text-text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-danger-text">{error}</span>}
    </div>
  )
})
