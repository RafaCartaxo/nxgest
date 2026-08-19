import { z } from "zod"

export const findClientesQuerySchema = z.object({
  nome: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().default("nome"),
  order: z.enum(["asc", "desc"]).default("asc"),
})

export type FindClientesQuery = z.infer<typeof findClientesQuerySchema>
