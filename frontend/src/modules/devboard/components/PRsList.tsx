import { useTranslation } from "react-i18next"
import { GitPullRequest } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import type { PRInfo } from "../services/devboard.service.js"

export function PRsList({ prs, loading, error, onRetry }: {
  prs: PRInfo[]
  loading: boolean
  error: string | null
  onRetry?: () => void
}) {
  const { t } = useTranslation()

  return (
    <EstadoTela loading={loading} error={error} empty={prs.length === 0} onRetry={onRetry}
      emptyMessage={t("devboard.semPRs")}>
      <div className="space-y-2">
        {prs.map((pr) => (
          <Card.Root key={pr.number} variant="list-item">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary-light text-primary-text">
                  <GitPullRequest className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">
                    <span className="text-text-secondary">#{pr.number}</span> {pr.title}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-text-secondary">{pr.branch}</p>
                </div>
              </div>
              {pr.isDraft && (
                <StatusBadge variant="neutral" label={t("devboard.rascunho")} />
              )}
            </div>
          </Card.Root>
        ))}
      </div>
    </EstadoTela>
  )
}
