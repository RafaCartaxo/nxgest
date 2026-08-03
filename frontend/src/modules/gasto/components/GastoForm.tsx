import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { getGastoSchema, CATEGORIAS_GASTO, CATEGORIA_ICONES, type GastoFormData } from "../schemas/gasto.schema.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { createGasto, type CreateGastoInput } from "../services/gasto.service.js"
import { maskMonetario, unmaskMonetario } from "../../../shared/utils/masks.js"
import { ChevronDown } from "lucide-react"
import { getLocalDateString } from "../../../shared/utils/parseDateLocal.js"
import { ApiError } from "../../../api/client.js"

interface GastoFormProps {
  onSuccess: () => void
}

export function GastoForm({ onSuccess }: GastoFormProps) {
  const { t } = useTranslation()
  const feedback = useFeedback()

  const hoje = getLocalDateString(new Date())

  const form = useForm<GastoFormData>({
    shouldFocusError: true,
    resolver: zodResolver(getGastoSchema(t)),
    defaultValues: {
      valor: "",
      categoria: "",
      data: hoje,
      observacao: "",
    },
  })

  const errors = form.formState.errors

  async function onSubmit(data: GastoFormData) {
    const payload: CreateGastoInput = {
      valor: unmaskMonetario(data.valor),
      categoria: data.categoria,
      data: data.data,
    }
    if (data.observacao) {
      payload.observacao = data.observacao
    }
    await feedback.run({
      loading: t("common.saving"),
      success: t("gasto.sucesso"),
      error: t("gasto.erroCriar"),
      action: async () => {
        try {
          await createGasto(payload)
          form.reset({
            valor: "",
            categoria: "",
            data: hoje,
            observacao: "",
          })
          onSuccess()
        } catch (err) {
          if (err instanceof ApiError && err.details) {
            const fieldMap: Record<string, string> = {
              valor: "valor",
              categoria: "categoria",
              data: "data",
              observacao: "observacao",
            }
            for (const d of err.details) {
              const formField = fieldMap[d.field]
              if (formField) {
                form.setError(formField as keyof GastoFormData, { message: d.message })
              }
            }
            const firstField = fieldMap[err.details[0]?.field]
            if (firstField) form.setFocus(firstField as keyof GastoFormData)
            throw err
          }
          throw err
        }
      },
    })
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">{t("gasto.valor")}</label>
        <input
          type="text"
          inputMode="decimal"
          value={form.watch("valor")}
          onChange={(e) => {
            form.setValue("valor", maskMonetario(e.target.value))
            form.clearErrors("valor")
          }}
          placeholder="R$ 0,00"
          className="block w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
        {errors.valor?.message && (
          <p className="mt-1 text-xs text-danger">{errors.valor.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t("gasto.categoria")}</label>
        <div className="relative">
            <select
            {...form.register("categoria")}
            className="block w-full min-w-0 appearance-none rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="" disabled hidden>{t("gasto.categoria")}</option>
            {CATEGORIAS_GASTO.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORIA_ICONES[cat]} {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        </div>
        {errors.categoria?.message && (
          <p className="mt-1 text-xs text-danger">{errors.categoria.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t("gasto.data")}</label>
        <div className="overflow-hidden rounded-md border border-border">
          <input
            type="date"
            {...form.register("data")}
            className="block w-full min-w-0 border-0 bg-surface px-3 py-2 text-text-primary focus:outline-none [color-scheme:light]"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t("gasto.observacao")}</label>
        <input
          type="text"
          {...form.register("observacao")}
          className="block w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        {t("gasto.registrar")}
      </button>
    </form>
  )
}
