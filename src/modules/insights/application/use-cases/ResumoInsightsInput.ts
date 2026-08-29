import { z } from "zod"

export const resumoInsightsSchema = z.object({
  periodo: z.enum(["dia", "semana", "mes"]).default("semana"),
})

export type ResumoInsightsInput = z.infer<typeof resumoInsightsSchema>