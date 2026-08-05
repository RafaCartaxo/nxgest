import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { QuickActions } from "../QuickActions/QuickActions.js"
import { StatusBadge } from "../StatusBadge/StatusBadge.js"

type CardVariant = "list-item" | "detail" | "collection"

export type CardTone = "info" | "success" | "warning" | "danger" | "neutral"

const toneBar: Record<CardTone, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-border-strong",
}

const rootStyles: Record<CardVariant, string> = {
  "list-item":  "relative block rounded-xl border border-border bg-card text-card-foreground p-4 transition hover:border-primary",
  "detail":     "relative rounded-xl border border-border bg-card text-card-foreground p-4",
  "collection": "relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground",
}

interface CardRootProps {
  variant?: CardVariant
  as?: "link" | "button" | "div"
  to?: string
  onClick?: () => void
  tone?: CardTone
  interactive?: boolean
  className?: string
  children: ReactNode
}

function CardRoot({ variant = "detail", as = "div", to, onClick, tone, interactive, className = "", children }: CardRootProps) {
  const interactiveCls = interactive ? "cursor-pointer transition-colors hover:bg-surface-hover" : ""
  const base = `${rootStyles[variant]} ${interactiveCls}`

  const inner = (
    <>
      {tone && <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${toneBar[tone]}`} />}
      {children}
    </>
  )

  if (as === "link" && to) {
    return <Link to={to} className={`${base} ${className}`}>{inner}</Link>
  }

  if (as === "button") {
    return (
      <button type="button" onClick={onClick} className={`${base} text-left ${className}`}>
        {inner}
      </button>
    )
  }

  return <div className={`${base} ${className}`}>{inner}</div>
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

function CardTitle({ children, className = "" }: CardTitleProps) {
  return <p className={`text-base font-semibold ${className}`}>{children}</p>
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
  border?: boolean
}

function CardHeader({ children, className = "", border }: CardHeaderProps) {
  return (
    <div className={`flex items-center gap-2 ${border ? "border-b border-border-light pb-4 mb-4" : ""} ${className}`}>
      {children}
    </div>
  )
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

function CardBody({ children, className = "" }: CardBodyProps) {
  return <div className={`min-w-0 flex-1 ${className}`}>{children}</div>
}

interface CardDotProps {
  color: "red" | "blue" | "green" | "yellow" | "gray"
  size?: "sm" | "md"
}

const dotColors: Record<string, string> = {
  red: "bg-danger",
  blue: "bg-primary",
  green: "bg-success",
  yellow: "bg-warning",
  gray: "bg-text-muted",
}

const dotSizes: Record<string, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
}

function CardDot({ color, size = "sm" }: CardDotProps) {
  return <span className={`mt-1 flex-shrink-0 rounded-full ${dotSizes[size]} ${dotColors[color]}`} />
}

interface CardIndicatorProps {
  label: string
  value: string
}

function CardIndicator({ label, value }: CardIndicatorProps) {
  return (
    <div>
      <span className="text-xs text-text-secondary">{label}</span>
      <p className="text-sm font-semibold text-text-primary">{value}</p>
    </div>
  )
}

interface CardIndicatorsProps {
  children: ReactNode
  className?: string
}

function CardIndicators({ children, className = "" }: CardIndicatorsProps) {
  return (
    <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 ${className}`}>
      {children}
    </div>
  )
}

interface CardBadgeProps {
  variant: "success" | "warning" | "danger" | "info" | "neutral"
  label: string
}

function CardBadge({ variant, label }: CardBadgeProps) {
  return <StatusBadge variant={variant} label={label} />
}

interface CardActionsProps {
  actions: Array<{
    icon?: LucideIcon
    label: string
    onClick: () => void
    variant?: "blue" | "green" | "gray" | "warning" | "danger"
    show?: boolean
  }>
  layout?: "horizontal" | "vertical"
  disabled?: boolean
  size?: "sm" | "md"
}

function CardActions({ actions, layout = "horizontal", disabled, size }: CardActionsProps) {
  return <QuickActions actions={actions} layout={layout} disabled={disabled} size={size} />
}

export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Body: CardBody,
  Dot: CardDot,
  Indicator: CardIndicator,
  Indicators: CardIndicators,
  Badge: CardBadge,
  Actions: CardActions,
}
