/**
 * Teste de envio dos templates transacionais reais (Resend/console).
 * Uso: npm run mail:test -- <email> [pt-BR|en|es]
 *
 * Envia os 3 templates (convite, reset, lead) com a identidade NX para validar
 * render, fallback textual, responsividade e entregabilidade (spam).
 */
import { criarMailer, appUrl } from "../src/shared/email/mailers.js"
import { conviteTemplate, resetTemplate, leadTemplate, type EmailLang } from "../src/shared/email/templates.js"

const para = process.argv[2] ?? process.env.MAIL_TEST_TO ?? ""
const lang = (process.argv[3] as EmailLang | undefined) ?? "pt-BR"
if (!para) {
  console.error("Uso: npm run mail:test -- <email-destinatario> [pt-BR|en|es]")
  process.exit(1)
}

const mailer = criarMailer()
const base = appUrl()
const linkConvite = `${base}/ativar?token=teste`
const linkReset = `${base}/resetar-senha?token=teste`
const linkLead = `${base}/quero-conhecer/confirmar?token=teste`

const enviados = [
  { tipo: "convite", ...conviteTemplate({ nome: "Maria", link: linkConvite, lang }) },
  { tipo: "reset", ...resetTemplate({ nome: "Maria", link: linkReset, lang }) },
  { tipo: "lead", ...leadTemplate({ nome: "João", link: linkLead, lang }) },
]

for (const msg of enviados) {
  await mailer.send({ to: para, subject: `[mail:test] ${msg.tipo} — ${msg.subject}`, html: msg.html, text: msg.text })
  console.log(`Template "${msg.tipo}" (${lang}) enviado para ${para}`)
}
