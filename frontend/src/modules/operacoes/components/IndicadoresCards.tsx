import { useTranslation } from "react-i18next"
import { formatCurrency } from "../../../shared/utils/masks.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"

interface IndicadoresCardsProps {
  aReceberHoje: number
  recebidoHoje: number
  clientesParaCobrar: number
  resultadoDoDia: number
  atrasado: number
  aVencer: number
  gastosHoje?: number
  hideGastos?: boolean
  hideCobrancas?: boolean
  onRecebidoClick?: () => void
  onAReceberClick?: () => void
  onPendentesClick?: () => void
  onAtrasadoClick?: () => void
  onAVencerClick?: () => void
  onGastosClick?: () => void
}

export function IndicadoresCards({
  aReceberHoje,
  recebidoHoje,
  clientesParaCobrar,
  resultadoDoDia,
  atrasado,
  aVencer,
  gastosHoje,
  hideGastos = false,
  hideCobrancas = false,
  onRecebidoClick,
  onAReceberClick,
  onPendentesClick,
  onAtrasadoClick,
  onAVencerClick,
  onGastosClick,
}: IndicadoresCardsProps) {
  const { t } = useTranslation()
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <KpiCard
        variant="info"
        title={t("operacoes.aReceberHoje")}
        value={`R$ ${formatCurrency(aReceberHoje)}`}
        onClick={onAReceberClick}
      />
      <KpiCard
        variant="green"
        title={t("operacoes.recebidoHoje")}
        value={`R$ ${formatCurrency(recebidoHoje)}`}
        onClick={onRecebidoClick}
      />
      <KpiCard
        variant={resultadoDoDia >= 0 ? "green" : "danger"}
        title={t("operacoes.resultadoDoDia")}
        value={`R$ ${formatCurrency(Math.abs(resultadoDoDia))}`}
        valueClassName={resultadoDoDia >= 0 ? "text-success-text" : "text-danger-text"}
      />
      {!hideCobrancas && (
        <KpiCard
          variant="yellow"
          title={t("operacoes.clientesParaCobrar")}
          value={clientesParaCobrar}
          onClick={onPendentesClick}
        />
      )}
      <KpiCard
        variant="danger"
        title={t("operacoes.atrasado")}
        value={`R$ ${formatCurrency(atrasado)}`}
        onClick={onAtrasadoClick}
      />
      <KpiCard
        variant="info"
        title={t("operacoes.aVencer")}
        value={`R$ ${formatCurrency(aVencer)}`}
        onClick={onAVencerClick}
      />
      {!hideGastos && (
        <KpiCard
          variant="gray"
          title={t("gasto.totalHoje")}
          value={`R$ ${formatCurrency(gastosHoje ?? 0)}`}
          onClick={onGastosClick}
        />
      )}
    </div>
  )
}
