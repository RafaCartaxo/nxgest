import { useTranslation } from "react-i18next"
import { formatCurrency } from "../../../shared/utils/masks.js"
import { CATEGORIA_ICONES } from "../../gasto/schemas/gasto.schema.js"
import type { MovimentacaoItem } from "../services/caixa.service.js"

/** Linha de movimentação (valor/origem/badges/data + cliente/descrição em bloco, sem truncar). */
export function MovimentacaoRow({ movimentacao: m }: { movimentacao: MovimentacaoItem }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={`text-sm font-medium ${m.tipo === "entrada" ? "text-success-text" : "text-danger-text"}`}>
            {m.tipo === "entrada" ? "+" : "-"} R$ {formatCurrency(m.valor)}
          </span>
          <span className="text-xs text-text-secondary">{m.origem}</span>
          {m.origem === "Cancelamento" && (
            <span className="rounded-full bg-warning-light px-2 py-0.5 text-xs font-medium text-warning-text">
              {t("caixa.estornoLabel")}
            </span>
          )}
          {m.origem === "Gasto" && m.categoria && (
            <span className="text-xs text-text-muted">
              {CATEGORIA_ICONES[m.categoria] ?? "📋"} {m.categoria}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs text-text-muted">
          {new Date(m.data + "T00:00:00").toLocaleDateString("pt-BR")}
        </span>
      </div>
      {(m.clienteNome || m.descricao) && (
        <div className="mt-1 space-y-0.5 border-t border-border-light pt-1.5">
          {m.clienteNome && (
            <p className="break-words text-xs text-text-muted">{m.clienteNome}</p>
          )}
          {m.descricao && (
            <p className="break-words text-xs text-text-muted">{m.descricao}</p>
          )}
        </div>
      )}
    </div>
  )
}

interface MovimentacoesListProps {
  movimentacoes: MovimentacaoItem[]
}

/** Lista de movimentações do caixa (linhas reutilizáveis `MovimentacaoRow`). */
export function MovimentacoesList({ movimentacoes }: MovimentacoesListProps) {
  const { t } = useTranslation()

  if (movimentacoes.length === 0) {
    return <p className="mt-4 text-text-secondary">{t("caixa.nenhumaMovimentacao")}</p>
  }

  return (
    <div className="mt-2 space-y-1">
      {movimentacoes.map((m) => (
        <MovimentacaoRow key={m.id} movimentacao={m} />
      ))}
    </div>
  )
}
