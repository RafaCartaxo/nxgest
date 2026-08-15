import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { FileText } from "lucide-react"
import { useParams, useNavigate } from "react-router-dom"
import { getContrato, updateContrato } from "../services/contrato.service.js"
import type { Contrato } from "../services/contrato.service.js"
import { ApiError } from "../../../api/client.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { ContratoForm, type ContratoSubmit } from "../components/ContratoForm.js"

export function ContratoEdit() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const feedback = useFeedback()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contrato, setContrato] = useState<Contrato | null>(null)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      setContrato(await getContrato(id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("contrato.erroCarregarContrato"))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    fetch()
  }, [fetch])

  const temPagamentos = contrato?.parcelas?.some((p) => p.valorPago > 0) ?? false

  async function handleSubmit(data: ContratoSubmit) {
    if (!id) return
    await feedback.run({
      loading: t("common.saving"),
      success: "Contrato atualizado.",
      error: t("contrato.erroAtualizar"),
      action: async () => {
        try {
          const updated = await updateContrato(id, {
            valorBase: data.valorBase,
            percentualJuros: data.percentualJuros,
            quantidadeParcelas: data.quantidadeParcelas,
            periodicidade: data.periodicidade,
            dataInicio: data.dataInicio,
          })
          navigate(`/contratos/${updated.id}`)
        } catch (err) {
          if (err instanceof ApiError && err.message) {
            throw new Error(err.message)
          }
          throw err
        }
      },
    })
  }

  if (temPagamentos) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <PageHeader
          icon={FileText}
          title={t("contrato.editar")}
          back={{ onClick: () => navigate(`/contratos/${id}`), title: t("common.back") }}
        />
        <div className="rounded-xl border border-warning bg-warning-light p-6 text-center">
          <p className="font-medium text-warning-text">{t("contrato.bloqueioEdicao")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={FileText}
        title={t("contrato.editar")}
        back={{ onClick: () => navigate(`/contratos/${id}`), title: t("common.back") }}
      />

      <EstadoTela loading={loading} error={error} empty={!contrato} onRetry={fetch}>
        {contrato && (
          <ContratoForm
            mode="editar"
            clienteFixado={contrato.clienteNome ? { id: contrato.clienteId, nome: contrato.clienteNome } : undefined}
            initial={{
              valorBase: String(Math.round(contrato.valorBase * 100)),
              percentualJuros: String(contrato.percentualJuros),
              quantidadeParcelas: String(contrato.quantidadeParcelas),
              periodicidade: contrato.periodicidade ?? "diaria",
              dataInicio: contrato.dataInicio,
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/contratos/${id}`)}
          />
        )}
      </EstadoTela>
    </div>
  )
}
