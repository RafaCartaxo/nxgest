import { z } from "zod"

export const ajustarCaixaBaseSchema = z.object({
  valor: z.number({ required_error: "Valor é obrigatório." }).positive("Valor deve ser positivo."),
  motivo: z
    .string({ required_error: "Motivo é obrigatório." })
    .trim()
    .min(1, "Motivo é obrigatório.")
    .max(100, "Motivo deve ter no máximo 100 caracteres."),
})

export type AjustarCaixaBaseInput = z.infer<typeof ajustarCaixaBaseSchema>
