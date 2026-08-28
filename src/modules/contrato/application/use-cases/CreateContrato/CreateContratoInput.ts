import { z } from "zod"
import { PERIODICIDADES } from "../../../domain/periodicidade.js"

export const createContratoSchema = z.object({
  clienteId: z.string().uuid("Cliente inválido"),
  valorBase: z.number().positive("Valor base deve ser positivo"),
  percentualJuros: z.number().min(0).default(20),
  quantidadeParcelas: z
    .number()
    .int()
    .positive("Quantidade de parcelas deve ser positiva"),
  periodicidade: z
    .enum(PERIODICIDADES, { message: "Periodicidade deve ser 'diaria', 'semanal' ou 'alternada'" })
    .default("diaria"),
  dataInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD")
    .refine((val) => !isNaN(new Date(val + "T12:00:00Z").getTime()), {
      message: "Data inválida.",
    }),
}).superRefine((val, ctx) => {
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

export type CreateContratoInput = z.infer<typeof createContratoSchema>
