import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, FileText } from "lucide-react"
import { useParams, useNavigate } from "react-router-dom"
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
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { Field } from "../../../shared/components/Field/Field.js"
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
        <PageHeader
          icon={FileText}
          title={t("contrato.editar")}
          back={{ onClick: () => navigate(`/contratos/${id}`), title: t("common.back") }}
        />
        <div className="rounded-xl border border-warning bg-warning-light p-6 text-center">
          <p className="font-medium text-warning-text">
            {t("contrato.bloqueioEdicao")}
          </p>
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
        <>
          {contrato?.clienteNome && (
            <div className="mb-4 rounded-xl border border-border bg-surface p-4 text-sm text-text-primary">
              {t("contrato.clienteLabel")}: <span className="font-medium">{contrato.clienteNome}</span>
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-4">
            <SectionHeader title={t("contrato.condicoes")} />

            <Field
              label={t("contrato.valorEmprestado")}
              required
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={maskMonetario(valorBase)}
              onChange={(e) => {
                form.setValue("valorBase", e.target.value.replace(/\D/g, ""))
                form.clearErrors("valorBase")
              }}
              error={errors.valorBase?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label={t("contrato.juros")}
                required
                type="text"
                inputMode="decimal"
                placeholder="20"
                value={form.watch("percentualJuros")}
                onChange={(e) => {
                  form.setValue("percentualJuros", e.target.value.replace(/[^0-9.,]/g, ""))
                  form.clearErrors("percentualJuros")
                }}
                error={errors.percentualJuros?.message}
              />

              <Field
                label={t("contrato.quantidadeParcelas")}
                required
                type="text"
                inputMode="numeric"
                placeholder="12"
                value={form.watch("quantidadeParcelas")}
                onChange={(e) => {
                  form.setValue("quantidadeParcelas", e.target.value.replace(/\D/g, ""))
                  form.clearErrors("quantidadeParcelas")
                }}
                error={errors.quantidadeParcelas?.message}
              />
            </div>

            <Field
              label={t("contrato.dataInicio")}
              required
              type="date"
              error={errors.dataInicio?.message}
              {...form.register("dataInicio")}
            />

            {valorBaseNum > 0 && (
              <div className="rounded-xl bg-surface-secondary p-4 text-center">
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
                <Check className="size-4" /> {t("common.save")}
              </Button>
              <Button
                variant="ghost"
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
