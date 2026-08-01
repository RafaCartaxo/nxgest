import type { ReactNode } from "react"

type KpiVariant = "blue" | "green" | "yellow" | "gray" | "danger" | "info"

const variantStyles: Record<KpiVariant, { bg: string; label: string; value: string; hover: string }> = {
  blue:   { bg: "bg-primary-light",   label: "text-primary",   value: "text-primary-text",   hover: "hover:brightness-95" },
  green:  { bg: "bg-success-light",  label: "text-success",  value: "text-success-text",  hover: "hover:brightness-95" },
  yellow: { bg: "bg-warning-light",  label: "text-warning",  value: "text-warning-text",  hover: "hover:brightness-95" },
  gray:   { bg: "bg-surface-secondary",   label: "text-text-secondary",   value: "text-text-primary",   hover: "hover:bg-surface-hover" },
  danger: { bg: "bg-danger-light",   label: "text-danger",   value: "text-danger-text",   hover: "hover:brightness-95" },
  info:   { bg: "bg-info-light",   label: "text-info",   value: "text-info-text",   hover: "hover:brightness-95" },
}

interface KpiCardProps {
  title: string
  value: ReactNode
  variant: KpiVariant
  onClick?: () => void
  valueClassName?: string
  tooltip?: string
  subtitle?: ReactNode
}

export function KpiCard({ title, value, variant, onClick, valueClassName, tooltip, subtitle }: KpiCardProps) {
  const s = variantStyles[variant]
  const Wrapper = onClick ? "button" : "div"
  const clickable = onClick ? `cursor-pointer ${s.hover}` : ""

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={tooltip}
      className={`rounded-md ${s.bg} p-4 text-left ${clickable}`}
    >
      <p className={`text-xs font-medium uppercase tracking-wider ${s.label}`}>{title}</p>
      <p className={`mt-1 text-2xl font-bold ${valueClassName ?? s.value}`}>{value}</p>
      {subtitle !== undefined && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
    </Wrapper>
  )
}
