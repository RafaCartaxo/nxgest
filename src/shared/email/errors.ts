/** Falha no envio do e-mail transacional (Resend/console). Mapeado → 503 EMAIL_UNAVAILABLE. */
export class EmailEnvioFalhouError extends Error {
  constructor(motivo?: string) {
    super(motivo ?? "Falha no envio do e-mail.")
    this.name = "EmailEnvioFalhouError"
  }
}
