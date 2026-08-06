import { useTranslation } from "react-i18next"
import { Card } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { ButtonLink } from "../../../shared/components/Button.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import { formatarData } from "../../../shared/utils/formatarData.js"
import { parseDateLocal } from "../../../shared/utils/parseDateLocal.js"
import type { Contrato } from "../services/contrato.service.js"

interface ContratoCardProps {
  contrato: Contrato
  variant: "list-item" | "detail"
}

function ContratoCard({ contrato: c, variant }: ContratoCardProps) {
  const { t, i18n } = useTranslation()

  if (variant === "list-item") {
    return (
      <Card.Root variant="list-item">
        <Card.Title className="mb-1 truncate">{c.clienteNome || "..."}</Card.Title>
        <Card.Body>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p>
              <span className="text-text-secondary">{t("contrato.valorEmprestado")}:</span>{" "}
              <span className="font-semibold">{formatCurrency(c.valorBase)}</span>
            </p>
            <p className="text-right">
              <span className="text-text-secondary">{t("contrato.jurosLabel")}</span>{" "}
              <span className="font-semibold">{c.percentualJuros}%</span>
            </p>
            <p>
              <span className="text-text-secondary">{t("contrato.saldoDevedor")}:</span>{" "}
              <span className="font-semibold">{formatCurrency(c.saldoPendente ?? c.valorFinal)}</span>
            </p>
            <p className="text-right">
              <span className="text-text-secondary">{t("contrato.totalAReceber")}:</span>{" "}
              <span className="font-semibold">{formatCurrency(c.valorFinal)}</span>
            </p>
          </div>
        </Card.Body>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-text-muted">
            {(c.parcelasPagas ?? 0) >= c.quantidadeParcelas
              ? t("contrato.parcelasTemplate", { atual: c.quantidadeParcelas, total: c.quantidadeParcelas })
              : t("contrato.parcelaTemplate", { num: (c.parcelasPagas ?? 0) + 1, total: c.quantidadeParcelas })
            }
            {" • "}
            {formatarData(c.dataInicio, t)} → {formatarData(c.dataFinal, t)}
          </p>
          <StatusBadge
            variant={c.estado === "Ativo" ? "success" : c.estado === "Finalizado" ? "info" : "neutral"}
            label={c.estado === "Finalizado" ? t("status.finalizado") : c.estado === "Ativo" ? t("status.ativo") : c.estado}
          />
        </div>
        {(c.parcelasEmAtraso ?? 0) > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger-text">
            <span className="inline-block h-2 w-2 rounded-full bg-danger" />
            {t("contrato.emAtrasoDetalhe", {
              parcelas: c.parcelasEmAtraso,
              valor: formatCurrency(c.emAtraso ?? 0),
            })}
            {(c.diasEmAtraso ?? 0) > 0 && (
              <span className="text-danger-text/70">
                · {t("contrato.diasEmAtraso", { dias: c.diasEmAtraso })}
              </span>
            )}
          </p>
        )}
      </Card.Root>
    )
  }

  const saldoDevedor =
    c.parcelas?.reduce((s, p) => s + p.saldoPendente, 0) ??
    c.valorFinal

  const valorRecebido =
    c.parcelas?.reduce((s, p) => s + p.valorPago, 0) ?? 0

  return (
    <Card.Root variant="detail">
      <Card.Header>
        <Card.Title className="text-lg font-semibold">{t("contrato.resumo")}</Card.Title>
      </Card.Header>
      <Card.Body>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-text-secondary">{t("contrato.saldoDevedor")}</span>
              <p className="text-xl font-bold">
                <span className="text-sm font-medium text-text-secondary">R$</span>{" "}
                {formatCurrency(saldoDevedor)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-text-secondary">{t("contrato.recebido")}</span>
              <p className="text-sm text-text-secondary">
                <span className="text-sm font-medium text-text-secondary">R$</span>{" "}
                {formatCurrency(valorRecebido)}
              </p>
            </div>
          </div>

          <hr className="border-border-light" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-secondary">{t("contrato.valorEmprestado")}</span>
              <p className="font-semibold">
                <span className="text-sm font-medium text-text-secondary">R$</span>{" "}
                {formatCurrency(c.valorBase)}
              </p>
            </div>
            <div>
              <span className="text-text-secondary">{t("contrato.totalAReceber")}</span>
              <p className="font-semibold">
                <span className="text-sm font-medium text-text-secondary">R$</span>{" "}
                {formatCurrency(c.valorFinal)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-secondary">{t("contrato.parcelasLabel")}</span>
              <p className="font-semibold">{c.quantidadeParcelas}x</p>
            </div>
            <div>
              <span className="text-text-secondary">{t("contrato.valorParcela")}</span>
              <p className="font-semibold">
                <span className="text-sm font-medium text-text-secondary">R$</span>{" "}
                {c.parcelas && c.parcelas.length > 0
                  ? formatCurrency(c.parcelas[0].valorPrevisto)
                  : formatCurrency(c.valorFinal / c.quantidadeParcelas)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-secondary">{t("contrato.dataInicio")}</span>
              <p className="font-semibold">
                {parseDateLocal(c.dataInicio).toLocaleDateString(i18n.language)}
              </p>
            </div>
            <div>
              <span className="text-text-secondary">{t("contrato.terminoLabel")}</span>
              <p className="font-semibold">
                {parseDateLocal(c.dataFinal).toLocaleDateString(i18n.language)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-secondary">{t("contrato.jurosLabel")}</span>
              <p className="font-semibold">{c.percentualJuros}%</p>
            </div>
            <div>
              <span className="text-text-secondary">{t("contrato.status")}</span>
              <p>
                <StatusBadge
                  variant={c.estado === "Ativo" ? "success" : c.estado === "Finalizado" ? "info" : "neutral"}
                  label={c.estado === "Finalizado" ? t("status.finalizado") : c.estado === "Ativo" ? t("status.ativo") : c.estado}
                  size="md"
                />
              </p>
            </div>
          </div>

          <ButtonLink variant="soft" to={`/clientes/${c.clienteId}`}>
            {t("contrato.verCliente")}
          </ButtonLink>
        </div>
      </Card.Body>
    </Card.Root>
  )
}

export { ContratoCard, type ContratoCardProps }
