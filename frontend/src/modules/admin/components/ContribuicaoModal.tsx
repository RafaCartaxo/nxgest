import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { X, ArrowRight } from "lucide-react"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import type { EquipeResult, ContribuicaoMetric } from "../services/admin.service.js"

interface Props {
  open: boolean
  metric: ContribuicaoMetric
  equipe: EquipeResult | null
  empresaId?: string
  onClose: () => void
}

export function ContribuicaoModal({ open, metric, equipe, empresaId, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!open) return null

  const valueOf = (op: EquipeResult["operadores"][number]): number =>
    metric === "clientes" ? op.totalClientes : metric === "contratos" ? op.contratosAtivos : op.recebidoHoje

  const total = equipe?.totais
    ? metric === "clientes" ? equipe.totais.totalClientes : metric === "contratos" ? equipe.totais.contratosAtivos : equipe.totais.recebidoHoje
    : 0

  const isMoney = metric === "recebido"
  const fmt = (v: number) => (isMoney ? `R$ ${formatCurrency(v)}` : `${v}`)

  const title =
    metric === "clientes" ? t("admin.contribuicaoClientes") : metric === "contratos" ? t("admin.contribuicaoContratos") : t("admin.contribuicaoRecebido")

  const sorted = equipe ? [...equipe.operadores].sort((a, b) => valueOf(b) - valueOf(a) || a.nome.localeCompare(b.nome)) : []

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between rounded-xl bg-surface-secondary px-3.5 py-2 text-sm">
          <span className="text-text-secondary">{t("admin.contribuicaoTotal")}</span>
          <span className="text-base font-semibold text-text-primary">{fmt(total)}</span>
        </div>

        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">{t("common.empty")}</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => navigate(`/admin/operadores/${op.id}${empresaId ? `?empresaId=${empresaId}` : ""}`)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-text-primary">{op.nome}</p>
                    <StatusBadge
                      variant={op.role === "admin" ? "info" : "neutral"}
                      size="sm"
                      label={op.role === "admin" ? t("admin.roleAdmin") : t("admin.roleOperator")}
                    />
                  </div>
                  <p className="truncate text-xs text-text-muted">{op.email}</p>
                </div>
                <span className={`text-sm font-semibold ${isMoney ? (op.recebidoHoje > 0 ? "text-success-text" : "text-text-muted") : "text-text-primary"}`}>
                  {fmt(valueOf(op))}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
