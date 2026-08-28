import type { Periodicidade } from "./contrato.entity.js"

/** Valores aceitos de periodicidade (PLAN-076/085) — diária (default), semanal e alternada. */
export const PERIODICIDADES = ["diaria", "semanal", "alternada"] as const

export function isPeriodicidade(value: unknown): value is Periodicidade {
  return (
    typeof value === "string" &&
    (PERIODICIDADES as readonly string[]).includes(value)
  )
}