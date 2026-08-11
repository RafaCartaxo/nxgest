import { z } from "zod"
import type { TFunction } from "i18next"

/**
 * Schema do formulário de ajuste da Caixa Base (front).
 * Espelha o backend (`AjustarCaixaBaseInput`): valor positivo · motivo
 * obrigatório (trim, máx 200). O valor chega como string mascarada e é
 * convertido com `unmaskMonetario` antes do envio.
 */
export function getAjusteCaixaSchema(t: TFunction) {
  return z.object({
    valor: z
      .string({ required_error: t("caixa.ajustarValorInvalido") })
      .refine(
        (v) => {
          const cleaned = v.replace(/\./g, "").replace(",", ".")
          return parseFloat(cleaned) > 0
        },
        { message: t("caixa.ajustarValorInvalido") },
      ),
    motivo: z
      .string({ required_error: t("caixa.motivoObrigatorio") })
      .trim()
      .min(1, t("caixa.motivoObrigatorio"))
      .max(200, t("caixa.motivoMaximo")),
  })
}

export type AjusteCaixaFormData = z.infer<ReturnType<typeof getAjusteCaixaSchema>>
