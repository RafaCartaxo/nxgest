import { useTranslation } from "react-i18next"
import { formatarData } from "../../../shared/utils/formatarData.js"
import { parseDateLocal } from "../../../shared/utils/parseDateLocal.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import type { Parcela } from "../services/contrato.service.js"

interface ParcelaListProps {
  parcelas: Parcela[]
  onPagar?: (parcela: Parcela) => void
}

const dotEstiloPorEstado: Record<string, string> = {
  Pendente: "bg-warning",
  Parcial: "bg-info",
  Paga: "bg-success",
}

function isVencida(p: Parcela): boolean {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return (p.estado === "Pendente" || p.estado === "Parcial") && parseDateLocal(p.dataVencimento) < hoje
}

function isVenceHoje(p: Parcela): boolean {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return p.estado === "Pendente" && parseDateLocal(p.dataVencimento).getTime() === hoje.getTime()
}

function getDotEstilo(p: Parcela): string {
  if (isVencida(p)) return "bg-danger"
  if (isVenceHoje(p)) return "bg-info"
  return dotEstiloPorEstado[p.estado] || "bg-secondary"
}

export function ParcelaList({ parcelas, onPagar }: ParcelaListProps) {
  const { t } = useTranslation()
  if (parcelas.length === 0) {
    return <p className="text-text-secondary">{t("parcela.nenhumaEncontrada")}</p>
  }

  const venceHoje = parcelas.filter((p) => isVenceHoje(p)).length
  const pendentes = parcelas.filter((p) => p.estado === "Pendente" && !isVencida(p) && !isVenceHoje(p)).length
  const parciais = parcelas.filter((p) => p.estado === "Parcial" && !isVencida(p)).length
  const pagas = parcelas.filter((p) => p.estado === "Paga").length
  const vencidas = parcelas.filter((p) => isVencida(p)).length

  function getStatus(p: Parcela): { variant: "success" | "warning" | "danger" | "info" | "neutral"; label: string } {
    if (isVencida(p)) return { variant: "danger", label: t("parcela.vencida") }
    if (isVenceHoje(p)) return { variant: "info", label: t("status.venceHoje") }
    if (p.estado === "Paga") return { variant: "success", label: t("parcela.pago") }
    if (p.estado === "Parcial") return { variant: "info", label: t("status.parcial") }
    return { variant: "warning", label: t("status.pendente") }
  }

  return (
    <>
      {(pagas > 0 || parciais > 0 || pendentes > 0 || venceHoje > 0) && (
        <div className="mb-2 flex flex-wrap gap-4 text-xs text-text-secondary">
          {pagas > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-success" />
              {t("parcela.pagas")}: {pagas}
            </span>
          )}
          {parciais > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-info" />
              {t("parcela.parciais")}: {parciais}
            </span>
          )}
          {pendentes > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-warning" />
              {t("parcela.pendentes")}: {pendentes}
            </span>
          )}
          {venceHoje > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-info" />
              {t("parcela.venceHoje")}: {venceHoje}
            </span>
          )}
          {vencidas > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-danger" />
              {t("parcela.vencidas")}: {vencidas}
            </span>
          )}
        </div>
      )}
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {parcelas.map((p) => {
          const status = getStatus(p)
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => p.estado !== "Paga" && onPagar?.(p)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  p.estado !== "Paga" ? "cursor-pointer hover:bg-surface-hover" : "cursor-default"
                }`}
              >
                <span aria-hidden className={`size-2 shrink-0 rounded-full ${getDotEstilo(p)}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {String(p.numero).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-text-muted">
                    {t("parcela.venceEm", { data: formatarData(p.dataVencimento, t) })}
                  </p>
                </div>
                <span className="tabular shrink-0 text-sm font-semibold text-text-primary">
                  R$ {formatCurrency(p.estado === "Parcial" ? p.saldoPendente : p.valorPrevisto)}
                </span>
                <StatusBadge variant={status.variant} label={status.label} />
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
