import type { IMailer, EmailMessage } from "./mailer.port.js"

/** Dev/sem chave: loga o link no console (não quebra o fluxo — EM-01). */
export class ConsoleMailer implements IMailer {
  async send({ to, subject, html }: EmailMessage): Promise<void> {
    console.log(`\n[EMAIL · dev] Para: ${to}\n[EMAIL · dev] Assunto: ${subject}\n[EMAIL · dev] Conteúdo: ${html}\n`)
  }
}

/** Envio via Resend (REST, sem dependência npm). */
export class ResendMailer implements IMailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send({ to, subject, html, text }: EmailMessage): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: this.from, to, subject, html, text }),
    })
    if (!res.ok) {
      throw new Error(`Falha no envio (Resend HTTP ${res.status}).`)
    }
  }
}

export function criarMailer(): IMailer {
  const key = process.env.RESEND_API_KEY
  if (key) {
    return new ResendMailer(key, process.env.MAIL_FROM ?? "no-reply@nxgest.com.br")
  }
  return new ConsoleMailer()
}

export function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000"
}
