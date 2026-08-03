import { X } from "lucide-react"
import { useTranslation } from "react-i18next"

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function ErrorBanner({ message, onRetry, onDismiss, className = "" }: ErrorBannerProps) {
  const { t } = useTranslation()

  return (
    <div className={`flex items-start gap-2 rounded-md border border-danger bg-danger-light p-3 text-sm text-danger-text ${className}`}>
      <p className="flex-1">{message}</p>
      <div className="flex flex-shrink-0 items-center gap-2">
        {onRetry && (
          <button type="button" onClick={onRetry} className="underline whitespace-nowrap">
            {t("common.retry")}
          </button>
        )}
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="text-danger hover:text-danger">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
