import { useTranslation } from "react-i18next"
import { Bot } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import type { DependabotPR } from "../services/devboard.service.js"

export function DependabotList({ dependabot, loading, error, onRetry }: {
  dependabot: DependabotPR[]
  loading: boolean
  error: string | null
  onRetry?: () => void
}) {
  const { t } = useTranslation()

  return (
    <EstadoTela loading={loading} error={error} empty={dependabot.length === 0} onRetry={onRetry}
      emptyMessage={t("devboard.semDependabot")}>
      <div className="space-y-2">
        {dependabot.map((pr) => (
          <Card.Root key={pr.number} variant="list-item">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-accent-light text-accent-text">
                  <Bot className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">
                    <span className="text-text-secondary">#{pr.number}</span> {pr.title}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-text-secondary">{pr.branch}</p>
                </div>
              </div>
              <StatusBadge variant="info" label="dependabot" />
            </div>
          </Card.Root>
        ))}
      </div>
    </EstadoTela>
  )
}
