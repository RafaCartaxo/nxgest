import type { IMailer, EmailMessage } from "./mailer.port.js"
import { EmailEnvioFalhouError } from "./errors.js"

/** Dev/sem chave: loga o link no console (não quebra o fluxo — EM-01). */
export class ConsoleMailer implements IMailer {
  async send({ to, subject, html }: EmailMessage): Promise<void> {
    console.log(`\n[EMAIL · dev] Para: ${to}\n[EMAIL · dev] Assunto: ${subject}\n[EMAIL · dev] Conteúdo: ${html}\n`)
  }
}

/** Ambiente sem envio configurado: NÃO envia de verdade → falha tratada (503 EMAIL_UNAVAILABLE). Nunca mentir "sucesso". */
export class FailingMailer implements IMailer {
  async send(): Promise<void> {
    throw new EmailEnvioFalhouError("Envio de e-mail não configurado para este ambiente.")
  }
}

/** Envio via Resend (REST, sem dependência npm). Falha → EmailEnvioFalhouError (503 EMAIL_UNAVAILABLE). */
export class ResendMailer implements IMailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send({ to, subject, html, text, replyTo }: EmailMessage): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to,
        subject,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })
    if (!res.ok) {
      // Ex.: domínio não verificado (403) / destinatário inválido (422). Causa vai pro log do controller.
      throw new EmailEnvioFalhouError(`Resend HTTP ${res.status}`)
    }
  }
}

let avisoFailClosedLogado = false

/**
 * Endereço de origem com display name (PLAN-071): `NX Gest <no-reply@nxgest.com.br>`.
 * Sem aspas literais no display name — o Hotmail renderiza aspas de forma visível
 * (`"NX Geste"`); o nome limpo evita isso (PLAN-email-transacionais-NX-Gest).
 * Fallbacks: `MAIL_FROM` legado como endereço, e `no-reply@nxgest.com.br` como último recurso.
 */
export function fromAddress(): string {
  const address = process.env.MAIL_FROM_ADDRESS?.trim() || process.env.MAIL_FROM || "no-reply@nxgest.com.br"
  const name = process.env.MAIL_FROM_NAME?.trim()
  return name ? `${name} <${address}>` : address
}

/**
 * Política de envio (PLAN-071) — explícita por ambiente:
 *
 * - `NODE_ENV=development` → **nunca** envia e-mail real (`ConsoleMailer`), mesmo com `RESEND_API_KEY`.
 * - `MAIL_PROVIDER=resend`  → `ResendMailer` (exige chave; sem chave → fail-closed).
 * - `MAIL_PROVIDER=console` → `ConsoleMailer` · `MAIL_PROVIDER=fail` → `FailingMailer`.
 * - Default (sem `MAIL_PROVIDER`): `production` → resend se houver chave, senão fail-closed; demais → console.
 */
export function criarMailer(): IMailer {
  if (process.env.NODE_ENV === "development") {
    return new ConsoleMailer()
  }

  const provider = process.env.MAIL_PROVIDER
  const key = process.env.RESEND_API_KEY

  if (provider === "console") {
    return new ConsoleMailer()
  }

  if (provider === "resend") {
    if (!key) {
      if (!avisoFailClosedLogado) {
        avisoFailClosedLogado = true
        console.error("[EMAIL] MAIL_PROVIDER=resend sem RESEND_API_KEY — envios falharão (503 EMAIL_UNAVAILABLE). Configure o Resend antes do go-live de e-mail.")
      }
      return new FailingMailer()
    }
    return new ResendMailer(key, fromAddress())
  }

  if (provider === "fail") {
    return new FailingMailer()
  }

  if (process.env.NODE_ENV === "production") {
    if (!key) {
      if (!avisoFailClosedLogado) {
        avisoFailClosedLogado = true
        console.error("[EMAIL] NODE_ENV=production sem RESEND_API_KEY — envios falharão (503 EMAIL_UNAVAILABLE). Configure o Resend antes do go-live de e-mail.")
      }
      return new FailingMailer()
    }
    return new ResendMailer(key, fromAddress())
  }

  return new ConsoleMailer()
}

export function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000"
}
