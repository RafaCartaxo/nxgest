import { z } from "zod"
import type { TFunction } from "i18next"
import { unmaskMonetario } from "../../../shared/utils/masks.js"

export function getContratoSchema(t: TFunction) {
  return z
    .object({
      valorBase: z
        .string()
        .min(1, t("contrato.validacao.valorPositivo"))
        .refine((val) => unmaskMonetario(val) > 0, t("contrato.validacao.valorPositivo")),
      percentualJuros: z
        .string()
        .refine((val) => parseFloat(val.replace(",", ".")) >= 0, t("contrato.validacao.jurosNaoNegativo")),
      quantidadeParcelas: z
        .string()
        .min(1, t("contrato.validacao.minimo1Parcela"))
        .refine((val) => parseInt(val) >= 1, t("contrato.validacao.minimo1Parcela")),
      periodicidade: z.enum(["diaria", "semanal"]),
      dataInicio: z
        .string()
        .min(1, t("contrato.validacao.informeDataInicio")),
    })
    .superRefine((val, ctx) => {
      if (val.periodicidade === "semanal" && val.dataInicio) {
        const dia = new Date(val.dataInicio + "T12:00:00Z").getUTCDay()
        if (dia === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["dataInicio"],
            message: t("contrato.validacao.semanalSemDomingo"),
          })
        }
      }
    })
}

export type ContratoFormData = z.infer<ReturnType<typeof getContratoSchema>>
