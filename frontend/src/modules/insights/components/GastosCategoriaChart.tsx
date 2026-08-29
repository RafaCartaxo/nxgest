import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { useChartTheme } from "../../../shared/utils/chartColors.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { GastoCategoria } from "../services/insights.service.js"

interface GastosCategoriaChartProps {
  gastos: GastoCategoria[]
  ariaLabel: string
}

/** Gastos por categoria (classe 1 — GROUP BY categoria). */
export function GastosCategoriaChart({ gastos, ariaLabel }: GastosCategoriaChartProps) {
  const [primary, success, warning, danger, muted] = useChartTheme()
  const cores = [primary, success, warning, danger, muted]
  const data = gastos.map((g) => ({ name: g.categoria, value: g.total }))

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={cores[i % cores.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`R$ ${formatCurrency(Number(value))}`, ""]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}