import { z } from "zod"

export const findContratosQuerySchema = z.object({
  clienteId: z.string().uuid().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
})

export type FindContratosQuery = z.infer<typeof findContratosQuerySchema>
