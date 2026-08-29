import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { useChartTheme } from "../../../shared/utils/chartColors.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { SerieItem } from "../services/insights.service.js"
import { formatDataEixo, formatValorEixo } from "../utils/chartFormat.js"

interface TendenciaChartProps {
  serie: SerieItem[]
  /** aria-label descritivo (a11y — F1-f4). */
  ariaLabel: string
}

/** Tendência de recebimentos (série de classe 1). */
export function TendenciaChart({ serie, ariaLabel }: TendenciaChartProps) {
  const { t } = useTranslation()
  const [, success, , , muted, border] = useChartTheme()

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={border} />
          <XAxis dataKey="data" tickFormatter={formatDataEixo} tick={{ fontSize: 11, fill: muted }} stroke={border} />
          <YAxis tickFormatter={formatValorEixo} tick={{ fontSize: 11, fill: muted }} stroke={border} width={72} />
          <Tooltip
            labelFormatter={(label) => formatDataEixo(String(label))}
            formatter={(value) => [`R$ ${formatCurrency(Number(value))}`, t("insights.recebido")]}
          />
          <Area type="monotone" dataKey="recebido" stroke={success} fill={success} fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}