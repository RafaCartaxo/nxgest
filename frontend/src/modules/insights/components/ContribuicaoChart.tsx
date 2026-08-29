import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { useChartTheme } from "../../../shared/utils/chartColors.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { ContribuicaoOperador } from "../services/insights.service.js"
import { formatValorEixo } from "../utils/chartFormat.js"

interface ContribuicaoChartProps {
  operadores: ContribuicaoOperador[]
  ariaLabel: string
}

/** Contribuição de operadores — composição do total (classe 1), sem placar/ranking. */
export function ContribuicaoChart({ operadores, ariaLabel }: ContribuicaoChartProps) {
  const { t } = useTranslation()
  const [primary, , , , muted, border] = useChartTheme()
  const data = operadores.map((o) => ({ nome: o.nome, recebido: o.recebido }))

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <XAxis type="number" tickFormatter={formatValorEixo} tick={{ fontSize: 11, fill: muted }} stroke={border} />
          <YAxis type="category" dataKey="nome" width={90} tick={{ fontSize: 11, fill: muted }} stroke={border} />
          <Tooltip formatter={(value) => [`R$ ${formatCurrency(Number(value))}`, t("insights.recebido")]} />
          <Bar dataKey="recebido" fill={primary} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}