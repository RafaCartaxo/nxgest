import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { GitBranch } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import type { RunInfo, RunConclusion } from "../services/devboard.service.js"

function conclusionVariant(conclusion: RunConclusion | null): "success" | "danger" | "warning" | "neutral" {
  switch (conclusion) {
    case "success": return "success"
    case "failure": return "danger"
    case "cancelled": case "timed_out": return "warning"
    default: return "neutral"
  }
}

function formatDuration(sec: number | null): string {
  if (sec === null) return "—"
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

function formatAgo(iso: string, t: TFunction): string {
  const diffSec = (Date.now() - new Date(iso).getTime()) / 1000
  if (diffSec < 60) return t("devboard.agora")
  const mins = Math.floor(diffSec / 60)
  if (mins < 60) return t("devboard.minAtras", { n: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t("devboard.horaAtras", { n: hours })
  const days = Math.floor(hours / 24)
  return t("devboard.diaAtras", { n: days })
}

export function RunsList({ runs, loading, error, onRetry }: {
  runs: RunInfo[]
  loading: boolean
  error: string | null
  onRetry?: () => void
}) {
  const { t } = useTranslation()

  return (
    <EstadoTela loading={loading} error={error} empty={runs.length === 0} onRetry={onRetry}
      emptyMessage={t("devboard.semRuns")}>
      <div className="space-y-2">
        {runs.map((run) => {
          const running = run.status === "in_progress"
          return (
            <Card.Root key={run.id} variant="list-item">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">{run.workflowName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-text-secondary">
                    <GitBranch className="size-3.5" aria-hidden />
                    <span className="truncate">{run.branch}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge
                    variant={running ? "info" : conclusionVariant(run.conclusion)}
                    label={running ? t("devboard.rodando") : (run.conclusion ?? "—")}
                  />
                  <span className="text-xs text-subtle-foreground">
                    {formatAgo(run.createdAt, t)} · {formatDuration(run.durationSec)}
                  </span>
                </div>
              </div>
            </Card.Root>
          )
        })}
      </div>
    </EstadoTela>
  )
}
