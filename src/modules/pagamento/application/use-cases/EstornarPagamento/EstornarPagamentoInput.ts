import { z } from "zod"

export const estornarPagamentoSchema = z.object({
  motivo: z
    .string({ required_error: "Motivo é obrigatório." })
    .trim()
    .min(1, "Motivo é obrigatório.")
    .max(200, "Motivo deve ter no máximo 200 caracteres."),
})

export type EstornarPagamentoInput = z.infer<typeof estornarPagamentoSchema>
