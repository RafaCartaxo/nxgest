import { useTranslation } from "react-i18next"
import { ApiError } from "../../api/client.js"
import { Button, ButtonLink } from "./Button.js"


interface EstadoTelaProps {
  loading: boolean
  error: string | null
  empty: boolean
  emptyMessage?: string
  emptyAction?: { label: string; to: string }
  onRetry?: () => void
  children: React.ReactNode
}

export function EstadoTela({
  loading,
  error,
  empty,
  emptyMessage,
  emptyAction,
  onRetry,
  children,
}: EstadoTelaProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-6 w-48 rounded bg-surface-hover" />
        <div className="h-4 w-96 rounded bg-surface-hover" />
        <div className="h-4 w-80 rounded bg-surface-hover" />
        <div className="h-4 w-64 rounded bg-surface-hover" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-danger font-medium">{error}</p>
        {onRetry && (
          <Button onClick={onRetry}>
            {t("common.retry")}
          </Button>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-text-secondary">{emptyMessage ?? t("common.empty")}</p>
        {emptyAction && (
          <ButtonLink to={emptyAction.to}>
            {emptyAction.label}
          </ButtonLink>
        )}
      </div>
    )
  }

  return <>{children}</>
}
