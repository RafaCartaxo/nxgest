import { useTranslation } from "react-i18next"
import { formatarData } from "../../../shared/utils/formatarData.js"
import { parseDateLocal } from "../../../shared/utils/parseDateLocal.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { Parcela } from "../services/contrato.service.js"

interface ParcelaListProps {
  parcelas: Parcela[]
  onPagar?: (parcela: Parcela) => void
}

const cardEstiloPorEstado: Record<string, string> = {
  Pendente: "bg-warning-light border-warning",
  Parcial: "bg-info-light border-info",
  Paga: "bg-success-light border-success-border",
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

function getCardEstilo(p: Parcela): string {
  if (isVencida(p)) return "bg-danger-light border-danger"
  if (isVenceHoje(p)) return "bg-info-light border-info"
  return cardEstiloPorEstado[p.estado] || "bg-surface border-border-light"
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {parcelas.map((p) => (
        <button
          type="button"
          key={p.id}
          onClick={() => p.estado !== "Paga" && onPagar?.(p)}
          className={`group flex min-w-0 flex-col overflow-hidden rounded-md border p-3 transition hover:border-blue-300 ${
            getCardEstilo(p)
          } ${
            p.estado !== "Paga" ? "cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="truncate text-xs font-bold tracking-wider text-text-secondary">
              {String(p.numero).padStart(2, "0")}
            </span>
            <span className="truncate text-xs font-medium text-text-muted">
              {formatarData(p.dataVencimento, t)}
            </span>
          </div>
          {p.estado === "Paga" ? (
            <p className="mt-1 text-center text-sm font-medium text-success-text">
              {t("parcela.pago")}
            </p>
          ) : p.estado === "Parcial" ? (
            <>
              <p className="mt-1 text-center">
                <span className="text-sm font-medium text-text-secondary">R$</span>{" "}
                <span className="text-base font-bold">{formatCurrency(p.saldoPendente)}</span>
              </p>
              {isVencida(p) && (
                <p className="mt-0.5 text-center text-[10px] font-medium text-danger-text">
                  {t("parcela.vencida")}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mt-1 text-center">
                <span className="text-sm font-medium text-text-secondary">R$</span>{" "}
                <span className="text-lg font-bold">{formatCurrency(p.valorPrevisto)}</span>
              </p>
              {isVenceHoje(p) && (
                <p className="mt-0.5 text-center text-[10px] font-medium text-info-text">
                  {t("status.venceHoje")}
                </p>
              )}
              {isVencida(p) && (
                <p className="mt-0.5 text-center text-[10px] font-medium text-danger-text">
                  {t("parcela.vencida")}
                </p>
              )}
            </>
          )}
          <div className="mt-auto flex justify-center pt-2">
            <span className={`inline-block h-2 w-2 rounded-full ${getDotEstilo(p)}`} />
          </div>
        </button>
      ))}
    </div>
    </>
  )
}
