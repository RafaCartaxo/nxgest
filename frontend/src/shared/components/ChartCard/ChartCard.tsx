import type { ReactNode } from "react"
import { Card } from "../Card/Card.js"

interface ChartCardProps {
  /** Título do gráfico (i18n). */
  title: string
  className?: string
  /** Conteúdo do gráfico (ResponsiveContainer/Recharts) ou estados (EstadoTela). */
  children: ReactNode
}

/**
 * Card canônico de gráfico (PLAN-080/082) — entrega só o "chrome": Card + título.
 * O conteúdo decide o próprio estado: `EstadoTela` (loading/erro/empty) ou o
 * gráfico Recharts. Só tokens → `audit:styles` limpo.
 */
export function ChartCard({ title, className, children }: ChartCardProps) {
  return (
    <Card.Root className={className}>
      <Card.Header>
        <Card.Title className="text-base font-semibold">{title}</Card.Title>
      </Card.Header>
      <Card.Body className="mt-3 h-64">{children}</Card.Body>
    </Card.Root>
  )
}