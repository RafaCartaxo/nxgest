/**
 * Templates de e-mail transacional (PLAN-065/071) — pt/en/es, idioma via Accept-Language.
 *
 * Fase 2 (13/08): redesign alinhado à identidade do app (PLAN-email-transacionais-NX-Gest).
 * Cores convertidas dos tokens reais do frontend (`index.css` tema default):
 *   --brand-1 -> #3571eb · --brand-2 -> #2457bf · --foreground -> #1e252e
 *   --muted-foreground -> #6a737e · --border -> #e2e5e8 · --muted -> #f2f5f8
 * Botão em `rounded-xl` (12px) e `min-height:44px` (padrão Button do app), fonte
 * Inter com fallback Arial/Helvetica (Inter não carrega de forma confiável em
 * clients de e-mail). Estrutura única (plano §6): marca → título → saudação →
 * mensagem → CTA → segurança/validade → fallback textual → rodapé.
 * Botão real (anti-spam) mantido.
 */

export type EmailLang = "pt-BR" | "en" | "es"

export function resolverLang(header?: string): EmailLang {
  if (!header) return "pt-BR"
  if (header.includes("en")) return "en"
  if (header.includes("es")) return "es"
  return "pt-BR"
}

const textos = {
  convite: {
    "pt-BR": { assunto: "Defina sua senha — NX Gest", titulo: "Você foi convidado", corpo: "Você recebeu um convite para acessar o NX Gest. Para começar, defina sua senha e ative sua conta.", botao: "Ativar minha conta", seguro: "O link é pessoal e expira em 7 dias. Se você receber mais de um convite, use sempre o último — os anteriores deixam de funcionar." },
    en: { assunto: "Set your password — NX Gest", titulo: "You've been invited", corpo: "You received an invitation to access NX Gest. To get started, set your password and activate your account.", botao: "Activate my account", seguro: "This link is personal and expires in 7 days. If you receive more than one invitation, always use the latest — previous ones stop working." },
    es: { assunto: "Define tu contraseña — NX Gest", titulo: "Has sido invitado", corpo: "Recibiste una invitación para acceder a NX Gest. Para comenzar, define tu contraseña y activa tu cuenta.", botao: "Activar mi cuenta", seguro: "El enlace es personal y vence en 7 días. Si recibes más de una invitación, usa siempre la última: las anteriores dejan de funcionar." },
  },
  reset: {
    "pt-BR": { assunto: "Recuperar senha — NX Gest", titulo: "Redefina sua senha", corpo: "Recebemos uma solicitação para redefinir a senha da sua conta no NX Gest.", botao: "Redefinir minha senha", seguro: "Este link é válido por 30 minutos." },
    en: { assunto: "Reset password — NX Gest", titulo: "Reset your password", corpo: "We received a request to reset the password for your NX Gest account.", botao: "Reset my password", seguro: "This link is valid for 30 minutes." },
    es: { assunto: "Recuperar contraseña — NX Gest", titulo: "Redefine tu contraseña", corpo: "Recibimos una solicitud para redefinir la contraseña de tu cuenta en NX Gest.", botao: "Redefinir mi contraseña", seguro: "Este enlace es válido por 30 minutos." },
  },
  lead: {
    "pt-BR": { assunto: "Confirme seu interesse no NX Gest", titulo: "Confirme seu interesse", corpo: "Recebemos sua solicitação para conhecer o NX Gest. Para confirmar seu interesse, clique no botão abaixo.", botao: "Confirmar meu interesse", seguro: "Se você não realizou esta solicitação, pode ignorar este e-mail." },
    en: { assunto: "Confirm your interest in NX Gest", titulo: "Confirm your interest", corpo: "We received your request to learn more about NX Gest. To confirm your interest, click the button below.", botao: "Confirm my interest", seguro: "If you didn't make this request, you can ignore this email." },
    es: { assunto: "Confirma tu interés en NX Gest", titulo: "Confirma tu interés", corpo: "Recibimos tu solicitud para conocer más sobre NX Gest. Para confirmar tu interés, haz clic en el botón de abajo.", botao: "Confirmar mi interés", seguro: "Si no realizaste esta solicitud, puedes ignorar este correo." },
  },
  verificarEmail: {
    "pt-BR": { assunto: "Confirme seu novo e-mail — NX Gest", titulo: "Confirme seu novo e-mail", corpo: "Você iniciou a troca do e-mail da sua conta no NX Gest. Confirme o novo endereço para concluir a alteração.", botao: "Confirmar novo e-mail", seguro: "O e-mail antigo continua valendo até a confirmação. O link é válido por 24 horas." },
    en: { assunto: "Confirm your new email — NX Gest", titulo: "Confirm your new email", corpo: "You started changing the email of your NX Gest account. Confirm your new address to finish the change.", botao: "Confirm new email", seguro: "Your old email stays valid until confirmation. This link is valid for 24 hours." },
    es: { assunto: "Confirma tu nuevo correo — NX Gest", titulo: "Confirma tu nuevo correo", corpo: "Iniciaste el cambio del correo de tu cuenta en NX Gest. Confirma la nueva dirección para completar el cambio.", botao: "Confirmar nuevo correo", seguro: "Tu correo anterior sigue válido hasta la confirmación. El enlace tiene validez de 24 horas." },
  },
}

/** Fallback textual do CTA (plano §12) — aparência secundária. */
const fallbackLabel: Record<EmailLang, string> = {
  "pt-BR": "Se o botão não funcionar, copie e cole o endereço abaixo no navegador:",
  en: "If the button doesn't work, copy and paste the address below into your browser:",
  es: "Si el botón no funciona, copia y pega la dirección a continuación en tu navegador:",
}

/** Rodapé institucional por idioma (plano §13) — padrão único. */
const rodape: Record<EmailLang, { enviado: string; ignore: string; marca: string }> = {
  "pt-BR": { enviado: "Este e-mail foi enviado pelo NX Gest.", ignore: "Se você não solicitou esta ação, pode ignorar esta mensagem.", marca: "NX Gest — plataforma de gestão operacional" },
  en: { enviado: "This email was sent by NX Gest.", ignore: "If you didn't request this action, you can ignore this message.", marca: "NX Gest — operational management platform" },
  es: { enviado: "Este correo fue enviado por NX Gest.", ignore: "Si no solicitaste esta acción, puedes ignorar este mensaje.", marca: "NX Gest — plataforma de gestión operacional" },
}

// Cores da marca NX — equivalentes hex dos tokens do tema default (`index.css`).
// E-mails não suportam oklch/var(), então usamos hex estável.
const COR_PRIMARIA = "#3571eb"
const COR_PRIMARIA_HOVER = "#2457bf"
const COR_TEXTO = "#1e252e"
const COR_TEXTO_SEC = "#6a737e"
const COR_FUNDO = "#f2f5f8"
const COR_BORDA = "#e2e5e8"

function saudacao(nome: string, lang: EmailLang, entusiasmo = false): string {
  const base = lang === "pt-BR" ? `Olá, ${nome}` : lang === "en" ? `Hi, ${nome}` : `Hola, ${nome}`
  return `${base}${entusiasmo ? "!" : "."}`
}

function montar(
  subject: string,
  titulo: string,
  saudacaoTexto: string,
  corpo: string,
  botao: string,
  link: string,
  lang: EmailLang,
  seguro: string,
): { subject: string; html: string; text: string } {
  const r = rodape[lang]
  const fallback = fallbackLabel[lang]
  const html = `<div style="background:${COR_FUNDO};padding:24px 12px">
  <div style="font-family:Inter,Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border:1px solid ${COR_BORDA};border-radius:12px;padding:32px 24px">
    <p style="margin:0 0 24px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:${COR_PRIMARIA};letter-spacing:-0.01em">
      NX Gest
    </p>
    <h2 style="margin:0 0 12px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:20px;line-height:1.3;color:${COR_TEXTO}">${titulo}</h2>
    ${saudacaoTexto ? `<p style="margin:0 0 8px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${COR_TEXTO}">${saudacaoTexto}</p>` : ""}
    <p style="margin:0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${COR_TEXTO_SEC}">${corpo}</p>
    <p style="margin:24px 0 0">
      <a href="${link}" style="display:inline-block;background:${COR_PRIMARIA};color:#ffffff;text-decoration:none;font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;padding:14px 24px;border-radius:12px;min-width:200px;text-align:center">${botao}</a>
    </p>
    <p style="margin:16px 0 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${COR_TEXTO_SEC}">${seguro}</p>
    <p style="margin:12px 0 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${COR_TEXTO_SEC}">
      ${fallback}<br>
      <a href="${link}" style="color:${COR_TEXTO_SEC}">${link}</a>
    </p>
  </div>
  <p style="margin:16px auto 0;max-width:520px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${COR_TEXTO_SEC};text-align:center">
    ${r.enviado}<br>${r.ignore}<br>${r.marca}
  </p>
</div>`
  return {
    subject,
    html,
    text: `${titulo}\n\n${saudacaoTexto ? `${saudacaoTexto}\n\n` : ""}${corpo}\n\n${botao}: ${link}\n\n${seguro}\n\n${r.enviado}\n${r.ignore}\n${r.marca}`,
  }
}

export function conviteTemplate({ nome, link, lang, empresaNome, convidadoPor }: { nome: string; link: string; lang: EmailLang; empresaNome?: string | null; convidadoPor?: string | null }) {
  const t = textos.convite[lang]
  const ctx: string[] = []
  if (empresaNome) ctx.push(empresaNome)
  if (convidadoPor) ctx.push(lang === "pt-BR" ? `Convidado por ${convidadoPor}` : lang === "en" ? `Invited by ${convidadoPor}` : `Invitado por ${convidadoPor}`)
  const corpo = ctx.length > 0 ? `${t.corpo} (${ctx.join(" · ")})` : t.corpo
  return montar(t.assunto, t.titulo, saudacao(nome, lang), corpo, t.botao, link, lang, t.seguro)
}

export function resetTemplate({ nome, link, lang }: { nome: string; link: string; lang: EmailLang }) {
  const t = textos.reset[lang]
  return montar(t.assunto, t.titulo, saudacao(nome, lang), t.corpo, t.botao, link, lang, t.seguro)
}

export function leadTemplate({ nome, link, lang }: { nome?: string; link: string; lang: EmailLang }) {
  const t = textos.lead[lang]
  const saudacaoTexto = nome ? saudacao(nome, lang, true) : ""
  return montar(t.assunto, t.titulo, saudacaoTexto, t.corpo, t.botao, link, lang, t.seguro)
}

export function verificarEmailTemplate({ link, lang, novoEmail }: { link: string; lang: EmailLang; novoEmail?: string | null }) {
  const t = textos.verificarEmail[lang]
  const corpo = novoEmail ? `${t.corpo} Novo endereço: ${novoEmail}.` : t.corpo
  return montar(t.assunto, t.titulo, "", corpo, t.botao, link, lang, t.seguro)
}
