import { useTranslation } from "react-i18next"
import type { AuditoriaCaixaItem } from "../services/caixa.service.js"

/** Linha do histórico de ajustes (valor em destaque + "por {Nome}" + motivo + data). */
export function AjusteRow({ ajuste: a }: { ajuste: AuditoriaCaixaItem }) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0 space-y-0.5">
        <span className="value-lg block text-text-primary">
          R$ {a.valorAnterior.toFixed(2)} → R$ {a.valorNovo.toFixed(2)}
        </span>
        {a.adminNome && (
          <span className="block text-xs text-text-secondary">
            {t("caixa.ajustePor")}{" "}
            <span className="font-semibold text-text-primary">{a.adminNome}</span>
          </span>
        )}
        {a.motivo && (
          <span className="block text-xs text-text-muted">{a.motivo}</span>
        )}
      </div>
      <span className="text-xs text-text-muted sm:text-right">
        {new Date(a.createdAt).toLocaleDateString("pt-BR")}
      </span>
    </div>
  )
}

interface AjusteHistoricoProps {
  auditoria: AuditoriaCaixaItem[]
}

/** Histórico de ajustes da caixa base (linhas reutilizáveis `AjusteRow`) — reutilizado na CaixaPage e no OperadorDetail. */
export function AjusteHistorico({ auditoria }: AjusteHistoricoProps) {
  const { t } = useTranslation()

  if (auditoria.length === 0) {
    return <p className="text-text-secondary">{t("caixa.ajusteSemRegistros")}</p>
  }

  return (
    <div className="mt-2 space-y-1">
      {auditoria.map((a) => (
        <AjusteRow key={a.id} ajuste={a} />
      ))}
    </div>
  )
}
