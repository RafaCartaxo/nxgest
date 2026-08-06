import { type HTMLAttributes } from "react"

type Variant = "success" | "warning" | "danger" | "info" | "neutral"
type Size = "sm" | "md"

const variantStyles: Record<Variant, string> = {
  success: "bg-success-light text-success-text",
  warning: "bg-warning-light text-warning-text",
  danger: "bg-danger-light text-danger-text",
  info: "bg-info-light text-info-text",
  neutral: "bg-surface-secondary text-text-secondary",
}

const dotStyles: Record<Variant, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-border-strong",
}

const sizeStyles: Record<Size, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
}

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: Variant
  label: string
  size?: Size
}

export function StatusBadge({ variant, label, size = "sm", className = "", ...props }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${dotStyles[variant]}`} />
      {label}
    </span>
  )
}
