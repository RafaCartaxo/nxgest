import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { useTranslation } from "react-i18next"
import { useChartTheme } from "../../../shared/utils/chartColors.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { CarteiraSnapshot } from "../services/insights.service.js"

interface CarteiraChartProps {
  carteira: CarteiraSnapshot
  ariaLabel: string
}

/** Envelhecimento da carteira — snapshot do presente (classe 3), nunca série. */
export function CarteiraChart({ carteira, ariaLabel }: CarteiraChartProps) {
  const { t } = useTranslation()
  const [, success, warning, danger] = useChartTheme()
  const data = [
    { name: t("insights.carteiraEmAtraso"), value: carteira.emAtraso, fill: danger },
    { name: t("insights.carteiraAVencer"), value: carteira.aVencer, fill: warning },
    { name: t("insights.carteiraQuitadas"), value: carteira.pagas, fill: success },
  ]

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} strokeWidth={0}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`R$ ${formatCurrency(Number(value))}`, ""]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}