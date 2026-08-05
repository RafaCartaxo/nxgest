import { type ButtonHTMLAttributes } from "react"
import { Link, type LinkProps } from "react-router-dom"

type Variant = "primary" | "secondary" | "danger" | "ghost"

const variantStyles: Record<Variant, string> = {
  primary: "bg-primary bg-gradient-accent text-white hover:bg-primary-hover",
  secondary: "border border-border text-text-primary hover:bg-surface-hover",
  danger: "bg-danger text-white hover:bg-danger-hover",
  ghost: "text-primary hover:underline",
}

const base =
  "inline-flex items-center justify-center rounded-md px-4 py-2 min-h-[44px] text-base font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"

interface ButtonBaseProps {
  variant?: Variant
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonBaseProps {}

export function Button({
  variant = "primary",
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`${base} ${variantStyles[variant]} ${className}`}
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
  to,
  children,
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link to={to} className={`${base} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </Link>
  )
}


