import { useTranslation } from "react-i18next"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { CaixaStatus } from "../services/caixa.service.js"

export type CaixaKpiKey = "caixaBase" | "saldoAtual" | "lucro" | "aReceberHoje" | "recebidoSemana" | "cobradoHoje"

interface CaixaKpisProps {
  caixa: CaixaStatus
  /** Quais KPIs exibir (default: todos). Permite agrupar por seção (ex.: só "Hoje"). */
  kpis?: CaixaKpiKey[]
  /** Callbacks opcionais por KPI (ex.: abertura de modais). Sem cliques quando ausente. */
  onKpiClick?: Partial<Record<CaixaKpiKey, () => void>>
}

const ALL: CaixaKpiKey[] = ["caixaBase", "saldoAtual", "lucro", "aReceberHoje", "recebidoSemana", "cobradoHoje"]

/** KPIs do caixa (Base · Saldo · Lucro · A receber hoje · Recebido semana · Cobrado hoje) — reutilizado na CaixaPage e no OperadorDetail. */
export function CaixaKpis({ caixa, kpis = ALL, onKpiClick }: CaixaKpisProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {kpis.includes("caixaBase") && (
        <KpiCard title={t("caixa.caixaBase")} value={`R$ ${formatCurrency(caixa.caixaBase)}`} variant="info" />
      )}
      {kpis.includes("saldoAtual") && (
        <KpiCard title={t("caixa.saldoAtual")} value={`R$ ${formatCurrency(caixa.saldoAtual)}`} variant="gray" />
      )}
      {kpis.includes("lucro") && (
        <KpiCard
          title={t("caixa.lucro")}
          value={`R$ ${formatCurrency(caixa.lucro)}`}
          variant={caixa.lucro >= 0 ? "green" : "danger"}
          valueClassName={caixa.lucro >= 0 ? "text-success-text" : "text-danger-text"}
        />
      )}
      {kpis.includes("aReceberHoje") && (
        <KpiCard
          title={t("caixa.aReceberHoje")}
          value={`R$ ${formatCurrency(caixa.aReceberHoje)}`}
          variant="info"
          onClick={onKpiClick?.aReceberHoje}
        />
      )}
      {kpis.includes("recebidoSemana") && (
        <KpiCard
          title={t("caixa.recebidoSemana")}
          value={`R$ ${formatCurrency(caixa.recebidoSemana)}`}
          variant="green"
          onClick={onKpiClick?.recebidoSemana}
        />
      )}
      {kpis.includes("cobradoHoje") && (
        <KpiCard
          title={t("caixa.cobradoHoje")}
          value={`R$ ${formatCurrency(caixa.recebidoHoje)}`}
          variant="green"
          onClick={onKpiClick?.cobradoHoje}
        />
      )}
    </div>
  )
}
