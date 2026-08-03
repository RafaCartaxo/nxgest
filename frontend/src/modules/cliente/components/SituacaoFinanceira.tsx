import { useTranslation } from "react-i18next"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import { formatarData } from "../../../shared/utils/formatarData.js"
import type { Cliente } from "../services/cliente.service.js"

interface SituacaoFinanceiraProps {
  cliente: Cliente
}

export function SituacaoFinanceira({ cliente }: SituacaoFinanceiraProps) {
  const { t } = useTranslation()

  const saldoDevedor = cliente.saldoDevedor ?? 0
  const valorEmAtraso = cliente.valorEmAtraso ?? 0
  const parcelasEmAtraso = cliente.parcelasEmAtraso ?? 0
  const diasEmAtraso = cliente.diasEmAtraso ?? 0
  const valorVenceHoje = cliente.valorVenceHoje ?? 0
  const lucroPrevisto = cliente.lucroPrevisto ?? 0

  return (
    <section aria-label={t("cliente.situacaoFinanceira")}>
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          variant={saldoDevedor > 0 ? "danger" : "green"}
          title={t("cliente.saldoDevedor")}
          value={`R$ ${formatCurrency(saldoDevedor)}`}
          valueClassName={saldoDevedor > 0 ? "text-danger-text" : "text-success-text"}
        />
        <KpiCard
          variant={valorEmAtraso > 0 ? "danger" : "gray"}
          title={t("status.atrasado")}
          value={`R$ ${formatCurrency(valorEmAtraso)}`}
          valueClassName={valorEmAtraso > 0 ? "text-danger-text" : ""}
          subtitle={
            valorEmAtraso > 0
              ? t("cliente.emAtrasoDetalhe", {
                  parcelas: parcelasEmAtraso,
                  dias: diasEmAtraso,
                })
              : undefined
          }
        />
        <KpiCard
          variant={valorVenceHoje > 0 ? "info" : "gray"}
          title={t("status.venceHoje")}
          value={`R$ ${formatCurrency(valorVenceHoje)}`}
          valueClassName={valorVenceHoje > 0 ? "text-info-text" : ""}
        />
        <KpiCard
          variant={lucroPrevisto > 0 ? "green" : "gray"}
          title={t("cliente.lucroPrevisto")}
          value={`R$ ${formatCurrency(lucroPrevisto)}`}
          valueClassName={lucroPrevisto > 0 ? "text-success-text" : ""}
        />
      </div>

      {cliente.ultimoPagamento && (
        <p className="mt-3 text-xs text-text-muted">
          <span className="font-medium text-text-secondary">{t("cliente.ultimoPagamentoLabel")}:</span>{" "}
          {formatarData(cliente.ultimoPagamento.data, t)} · R$ {formatCurrency(cliente.ultimoPagamento.valor)}
        </p>
      )}
    </section>
  )
}
