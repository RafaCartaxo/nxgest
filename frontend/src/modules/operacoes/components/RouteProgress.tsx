import { useTranslation } from "react-i18next"

interface RouteProgressProps {
  total: number
  completed: number
  pending: number
  visitados?: number
  promessas?: number
  naoEncontrados?: number
  pagos?: number
}

export function RouteProgress({ total, completed, pending, visitados = 0, promessas = 0, pagos = 0 }: RouteProgressProps) {
  const { t } = useTranslation()
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  const itens = [
    { label: t("operacoes.progresso.pagos"), value: pagos },
    { label: t("operacoes.progresso.promessas"), value: promessas },
    { label: t("operacoes.progresso.visitados"), value: visitados },
    { label: t("operacoes.progresso.pendentes"), value: pending },
  ]

  return (
    <div className="space-y-3 px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-primary">{t("operacoes.progresso")}</p>
        <p className="text-sm font-semibold tabular-nums text-primary">{percent}%</p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={t("operacoes.progresso")}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-hover"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {itens.map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="font-display text-lg font-semibold leading-tight tabular-nums text-text-primary">{value}</p>
            <p className="text-[11px] leading-tight text-text-muted">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
