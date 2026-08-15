/** Contrato semanal não pode iniciar em domingo (BR-040-A/BR-042 — PLAN-076). */
export class ContratoSemanalDomingoError extends Error {
  public readonly code = "VALIDATION_ERROR"
  constructor() {
    super("Contrato semanal não pode iniciar em domingo.")
    this.name = "ContratoSemanalDomingoError"
  }
}
