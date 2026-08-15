import { z } from "zod"
import { PERIODICIDADES } from "../../../domain/periodicidade.js"

export const updateContratoSchema = z
  .object({
    valorBase: z.number().positive("Valor base deve ser positivo").optional(),
    percentualJuros: z.number().min(0).optional(),
    quantidadeParcelas: z.number().int().positive().optional(),
    periodicidade: z
      .enum(PERIODICIDADES, {
        message: "Periodicidade deve ser 'diaria' ou 'semanal'",
      })
      .optional(),
    dataInicio: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD")
      .refine((val) => !isNaN(new Date(val + "T12:00:00Z").getTime()), {
        message: "Data inválida.",
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.periodicidade === "semanal" && val.dataInicio) {
      const dia = new Date(val.dataInicio + "T12:00:00Z").getUTCDay()
      if (dia === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dataInicio"],
          message: "Contrato semanal não pode iniciar em domingo.",
        })
      }
    }
  })

export type UpdateContratoInput = z.infer<typeof updateContratoSchema>
