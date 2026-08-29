import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { useChartTheme } from "../../../shared/utils/chartColors.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { SerieItem } from "../services/insights.service.js"
import { formatDataEixo, formatValorEixo } from "../utils/chartFormat.js"

interface PrevistoRecebidoChartProps {
  serie: SerieItem[]
  /** aria-label descritivo (a11y — F1-f4). */
  ariaLabel: string
}

/** Previsto × Recebido por dia (classe 2 + classe 1). */
export function PrevistoRecebidoChart({ serie, ariaLabel }: PrevistoRecebidoChartProps) {
  const { t } = useTranslation()
  const [primary, success, , , muted, border] = useChartTheme()

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={border} />
          <XAxis dataKey="data" tickFormatter={formatDataEixo} tick={{ fontSize: 11, fill: muted }} stroke={border} />
          <YAxis tickFormatter={formatValorEixo} tick={{ fontSize: 11, fill: muted }} stroke={border} width={72} />
          <Tooltip
            labelFormatter={(label) => formatDataEixo(String(label))}
            formatter={(value, name) => [`R$ ${formatCurrency(Number(value))}`, name === "previsto" ? t("insights.previsto") : t("insights.recebido")]}
          />
          <Legend />
          <Bar dataKey="previsto" fill={muted} name={t("insights.previsto")} radius={[3, 3, 0, 0]} />
          <Bar dataKey="recebido" fill={primary} name={t("insights.recebido")} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}