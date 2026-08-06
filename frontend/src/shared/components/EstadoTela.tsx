import { useTranslation } from "react-i18next"
import { Loader2, AlertTriangle, Inbox } from "lucide-react"
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
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-10 text-center">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-text-secondary">{t("common.loading")}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-10 text-center">
        <span className="mb-1 grid size-11 place-items-center rounded-full bg-danger-light text-danger-text">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <p className="font-semibold text-text-primary">{t("common.erroTitulo")}</p>
        <p className="max-w-sm text-sm text-text-secondary">{error}</p>
        {onRetry && (
          <div className="mt-3">
            <Button onClick={onRetry}>{t("common.retry")}</Button>
          </div>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-10 text-center">
        <span className="mb-1 grid size-11 place-items-center rounded-full bg-muted text-text-muted">
          <Inbox className="size-5" aria-hidden />
        </span>
        <p className="font-semibold text-text-primary">{t("common.empty")}</p>
        {emptyMessage && <p className="max-w-sm text-sm text-text-secondary">{emptyMessage}</p>}
        {emptyAction && (
          <div className="mt-3">
            <ButtonLink to={emptyAction.to}>{emptyAction.label}</ButtonLink>
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}
