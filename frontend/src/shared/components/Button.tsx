import { type ButtonHTMLAttributes } from "react"
import { Link, type LinkProps } from "react-router-dom"

type Variant = "primary" | "secondary" | "soft" | "outline" | "ghost" | "danger" | "success"
type Size = "sm" | "md" | "lg" | "block"

const variantStyles: Record<Variant, string> = {
  primary: "bg-primary bg-gradient-accent text-white hover:bg-primary-hover",
  secondary: "border border-border text-text-primary hover:bg-surface-hover",
  soft: "bg-primary-light text-primary-text hover:brightness-95",
  outline: "border border-border-strong bg-surface hover:bg-surface-hover",
  ghost: "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
  danger: "bg-danger text-white hover:bg-danger-hover",
  success: "bg-success text-white hover:bg-success-hover",
}

const sizeStyles: Record<Size, string> = {
  sm: "min-h-9 rounded-lg px-3 text-sm",
  md: "min-h-11 px-4 text-[15px]",
  lg: "min-h-12 px-4 text-base",
  block: "w-full min-h-12 px-4 text-base",
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 disabled:pointer-events-none"

interface ButtonBaseProps {
  variant?: Variant
  size?: Size
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonBaseProps {}

export function Button({
  variant = "primary",
  size = "md",
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface ButtonLinkProps extends Omit<LinkProps, "className">, ButtonBaseProps {
  className?: string
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  to,
  children,
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link to={to} className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
      {children}
    </Link>
  )
}
