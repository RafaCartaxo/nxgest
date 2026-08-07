/** Teste de envio de e-mail transacional (Resend/console). Uso: npm run mail:test -- <email> */
import { criarMailer } from "../src/shared/email/mailers.js"

const para = process.argv[2] ?? process.env.MAIL_TEST_TO ?? ""
if (!para) {
  console.error("Uso: npm run mail:test -- <email-destinatario>")
  process.exit(1)
}

const mailer = criarMailer()
await mailer.send({
  to: para,
  subject: "NX Gestão — teste de envio",
  html: "<p>E-mail de teste do NX Gestão. Se você recebeu isto, o Resend está funcionando.</p>",
  text: "E-mail de teste do NX Gestão. Se você recebeu isto, o Resend está funcionando.",
})

console.log(`E-mail de teste enviado para ${para}`)
