import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft } from "lucide-react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getContrato, updateContrato } from "../services/contrato.service.js"
import type { Contrato } from "../services/contrato.service.js"
import { calcularDataFinal } from "../utils/calcularDataFinal.js"
import { parseDateLocal } from "../../../shared/utils/parseDateLocal.js"
import { formatCurrency, maskMonetario, unmaskMonetario } from "../../../shared/utils/masks.js"
import { ApiError } from "../../../api/client.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { Button } from "../../../shared/components/Button.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { getContratoSchema, type ContratoFormData } from "../schemas/contrato.schema.js"

export function ContratoEdit() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const feedback = useFeedback()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contrato, setContrato] = useState<Contrato | null>(null)

  const form = useForm<ContratoFormData>({
    shouldFocusError: true,
    resolver: zodResolver(getContratoSchema(t)),
    defaultValues: {
      valorBase: "",
      percentualJuros: "",
      quantidadeParcelas: "",
      dataInicio: "",
    },
  })

  const errors = form.formState.errors
  const valorBase = form.watch("valorBase")
  const percentualJuros = form.watch("percentualJuros")
  const quantidadeParcelas = form.watch("quantidadeParcelas")
  const dataInicio = form.watch("dataInicio")

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const result = await getContrato(id)
      setContrato(result)
      form.reset({
        valorBase: String(Math.round(result.valorBase * 100)),
        percentualJuros: String(result.percentualJuros),
        quantidadeParcelas: String(result.quantidadeParcelas),
        dataInicio: result.dataInicio,
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(t("contrato.erroCarregarContrato"))
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetch()
  }, [fetch])

  const temPagamentos =
    contrato?.parcelas?.some((p) => p.valorPago > 0) ?? false

  const valorBaseNum = unmaskMonetario(valorBase)
  const jurosNum = parseFloat(percentualJuros.replace(",", ".")) || 0
  const valorFinal = valorBaseNum * (1 + jurosNum / 100)

  async function handleSubmit(data: ContratoFormData) {
    if (!id) return

    await feedback.run({
      loading: t("common.saving"),
      success: "Contrato atualizado.",
      error: t("contrato.erroAtualizar"),
      action: async () => {
        try {
          const vb = unmaskMonetario(data.valorBase)
          const jr = parseFloat(data.percentualJuros.replace(",", ".")) || 0
          const updated = await updateContrato(id, {
            valorBase: vb,
            percentualJuros: jr,
            quantidadeParcelas: parseInt(data.quantidadeParcelas),
            dataInicio: data.dataInicio,
          })
          navigate(`/contratos/${updated.id}`)
        } catch (err) {
          if (err instanceof ApiError && err.details) {
            const fieldMap: Record<string, string> = {
              valorBase: "valorBase",
              percentualJuros: "percentualJuros",
              quantidadeParcelas: "quantidadeParcelas",
              dataInicio: "dataInicio",
            }
            for (const d of err.details) {
              const formField = fieldMap[d.field]
              if (formField) {
                form.setError(formField as keyof ContratoFormData, { message: d.message })
              }
            }
            const firstField = fieldMap[err.details[0]?.field]
            if (firstField) form.setFocus(firstField as keyof ContratoFormData)
            throw err
          }
          if (err instanceof ApiError) {
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
        <div className="mb-6 flex items-center gap-2">
          <Link to={`/contratos/${id}`} className="text-text-muted hover:text-text-primary">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 text-3xl font-semibold">{t("contrato.editar")}</h1>
        </div>
        <div className="rounded-md border border-warning bg-warning-light p-6 text-center">
          <p className="font-medium text-warning-text">
            {t("contrato.bloqueioEdicao")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6 flex items-center gap-2">
        <Link to={`/contratos/${id}`} className="text-text-muted hover:text-text-primary">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-3xl font-semibold">{t("contrato.editar")}</h1>
      </div>

      <EstadoTela loading={loading} error={error} empty={!contrato} onRetry={fetch}>
        <>
          {contrato?.clienteNome && (
            <div className="mb-4 rounded-md border border-border-light bg-surface p-4 text-sm text-text-primary">
              {t("contrato.clienteLabel")}: <span className="font-medium">{contrato.clienteNome}</span>
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-4">
            <SectionHeader title={t("contrato.condicoes")} />

            <div>
              <label className="block text-sm font-medium">
                {t("contrato.valorEmprestado")} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={maskMonetario(valorBase)}
                onChange={(e) => {
                  form.setValue("valorBase", e.target.value.replace(/\D/g, ""))
                  form.clearErrors("valorBase")
                }}
                className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0,00"
              />
              {errors.valorBase?.message && <p className="mt-1 text-xs text-danger">{errors.valorBase.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">
                  {t("contrato.juros")} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.watch("percentualJuros")}
                  onChange={(e) => {
                    form.setValue("percentualJuros", e.target.value.replace(/[^0-9.,]/g, ""))
                    form.clearErrors("percentualJuros")
                  }}
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="20"
                />
                {errors.percentualJuros?.message && <p className="mt-1 text-xs text-danger">{errors.percentualJuros.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">
                  {t("contrato.quantidadeParcelas")} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.watch("quantidadeParcelas")}
                  onChange={(e) => {
                    form.setValue("quantidadeParcelas", e.target.value.replace(/\D/g, ""))
                    form.clearErrors("quantidadeParcelas")
                  }}
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="12"
                />
                {errors.quantidadeParcelas?.message && <p className="mt-1 text-xs text-danger">{errors.quantidadeParcelas.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">
                {t("contrato.dataInicio")} <span className="text-danger">*</span>
              </label>
              <div className="mt-1 overflow-hidden rounded-md border border-border">
                <input
                  type="date"
                  {...form.register("dataInicio")}
                  className="block w-full border-0 px-3 py-2 text-base  "
                />
              </div>
              {errors.dataInicio?.message && <p className="mt-1 text-xs text-danger">{errors.dataInicio.message}</p>}
            </div>

            {valorBaseNum > 0 && (
              <div className="rounded-md bg-surface-secondary p-4 text-center">
                <p className="text-sm text-text-secondary">{t("contrato.totalAReceber")}</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {formatCurrency(valorFinal)}
                </p>
                {parseInt(quantidadeParcelas) > 0 && (
                  <p className="text-sm text-text-secondary">
                    {quantidadeParcelas}x de R${" "}
                    {formatCurrency(valorFinal / parseInt(quantidadeParcelas))}
                  </p>
                )}
                {dataInicio && parseInt(quantidadeParcelas) > 0 && (
                  <p className="text-sm text-text-secondary">
                    {t("contrato.termino")}:{" "}
                    {parseDateLocal(
                      calcularDataFinal(dataInicio, parseInt(quantidadeParcelas))
                    ).toLocaleDateString(i18n.language)}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                {t("common.save")}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(`/contratos/${id}`)}
                className="flex-1"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </>
      </EstadoTela>
    </div>
  )
}
