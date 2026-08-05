import type { ReactNode } from "react"
import { Card, type CardTone } from "../Card/Card.js"

type KpiVariant = "blue" | "green" | "yellow" | "gray" | "danger" | "info"

const toneByVariant: Record<KpiVariant, CardTone> = {
  blue: "info",
  info: "info",
  green: "success",
  yellow: "warning",
  danger: "danger",
  gray: "neutral",
}

interface KpiCardProps {
  title: string
  value: ReactNode
  variant?: KpiVariant
  onClick?: () => void
  valueClassName?: string
  subtitle?: ReactNode
}

export function KpiCard({ title, value, variant = "info", onClick, valueClassName, subtitle }: KpiCardProps) {
  return (
    <Card.Root
      tone={toneByVariant[variant]}
      as={onClick ? "button" : "div"}
      onClick={onClick}
      interactive={!!onClick}
      className="p-4 pl-5"
    >
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`value-lg mt-1 ${valueClassName ?? ""}`}>{value}</p>
      {subtitle !== undefined && <p className="mt-1 text-xs text-subtle-foreground">{subtitle}</p>}
    </Card.Root>
  )
}
