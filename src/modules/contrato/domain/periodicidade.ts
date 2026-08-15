import type { Periodicidade } from "./contrato.entity.js"

/** Valores aceitos de periodicidade (PLAN-076) — diária (default) e semanal. */
export const PERIODICIDADES = ["diaria", "semanal"] as const

export function isPeriodicidade(value: unknown): value is Periodicidade {
  return (
    typeof value === "string" &&
    (PERIODICIDADES as readonly string[]).includes(value)
  )
}