/**
 * Port do envio de e-mail transacional (PLAN-065). Implementações trocáveis
 * (Resend, SES, console em dev) sem afetar os use-cases.
 */
export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
}

export interface IMailer {
  send(msg: EmailMessage): Promise<void>
}
