import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { getAjusteCaixaSchema, type AjusteCaixaFormData } from "../schemas/ajusteCaixa.schema.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { maskMonetario, unmaskMonetario, formatCurrency } from "../../../shared/utils/masks.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { FieldTextarea } from "../../../shared/components/Field/FieldTextarea.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { ApiError } from "../../../api/client.js"
import { Button } from "../../../shared/components/Button.js"

interface AjusteCaixaFormProps {
  caixaBase: number
  saldoAtual: number
  onAjustar: (valor: number, motivo: string) => Promise<void>
  onSuccess?: () => void
}

/**
 * Formulário reutilizável de ajuste da Caixa Base — mesmo padrão do `GastoForm`
 * (react-hook-form + zod + useFeedback). Usado pelo modal (CaixaPage) e pelo
 * card do OperadorDetail; o alvo do ajuste é definido pelo container via prop.
 */
export function AjusteCaixaForm({ caixaBase, saldoAtual, onAjustar, onSuccess }: AjusteCaixaFormProps) {
  const { t } = useTranslation()
  const feedback = useFeedback()

  const form = useForm<AjusteCaixaFormData>({
    shouldFocusError: true,
    resolver: zodResolver(getAjusteCaixaSchema(t)),
    defaultValues: {
      valor: maskMonetario(caixaBase.toFixed(2)),
      motivo: "",
    },
  })

  const errors = form.formState.errors

  async function onSubmit(data: AjusteCaixaFormData) {
    await feedback.run({
      loading: t("common.saving"),
      success: t("caixa.ajustarSucesso"),
      error: t("caixa.ajustarErro"),
      action: async () => {
        try {
          await onAjustar(unmaskMonetario(data.valor), data.motivo.trim())
          form.reset({ valor: maskMonetario(caixaBase.toFixed(2)), motivo: "" })
          onSuccess?.()
        } catch (err) {
          if (err instanceof ApiError && err.details) {
            const fieldMap: Record<string, keyof AjusteCaixaFormData> = { valor: "valor", motivo: "motivo" }
            for (const d of err.details) {
              const formField = fieldMap[d.field]
              if (formField) form.setError(formField, { message: d.message })
            }
            const first = fieldMap[err.details[0]?.field]
            if (first) form.setFocus(first)
            throw err
          }
          throw err
        }
      },
    })
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard title={t("caixa.caixaBase")} value={`R$ ${formatCurrency(caixaBase)}`} variant="blue" />
        <KpiCard title={t("caixa.saldoAtual")} value={`R$ ${formatCurrency(saldoAtual)}`} variant="gray" />
      </div>

      <Field
        label={t("caixa.ajustarValor")}
        inputMode="decimal"
        value={form.watch("valor")}
        onChange={(e) => {
          form.setValue("valor", maskMonetario(e.target.value))
          form.clearErrors("valor")
        }}
        placeholder="R$ 0,00"
        error={errors.valor?.message}
      />

      <FieldTextarea
        label={t("caixa.motivo")}
        placeholder={t("caixa.ajustarMotivoPlaceholder")}
        rows={2}
        error={errors.motivo?.message}
        {...form.register("motivo")}
      />

      <Button type="submit" className="w-full">
        <Check className="size-4" aria-hidden />
        {t("caixa.ajustarSalvar")}
      </Button>
    </form>
  )
}
