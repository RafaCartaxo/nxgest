/** Templates de e-mail transacional (PLAN-065) — pt/en/es, idioma via Accept-Language. */

export type EmailLang = "pt-BR" | "en" | "es"

export function resolverLang(header?: string): EmailLang {
  if (!header) return "pt-BR"
  if (header.includes("en")) return "en"
  if (header.includes("es")) return "es"
  return "pt-BR"
}

const textos = {
  convite: {
    "pt-BR": { assunto: "Defina sua senha — NX Gest", titulo: "Bem-vindo(a)!", corpo: "Seu acesso ao NX Gest foi criado. Defina sua senha para ativar a conta.", botao: "Definir senha" },
    en: { assunto: "Set your password — NX Gest", titulo: "Welcome!", corpo: "Your NX Gest access was created. Set your password to activate your account.", botao: "Set password" },
    es: { assunto: "Define tu contraseña — NX Gest", titulo: "¡Bienvenido!", corpo: "Se creó tu acceso a NX Gest. Define tu contraseña para activar la cuenta.", botao: "Definir contraseña" },
  },
  reset: {
    "pt-BR": { assunto: "Recuperar senha — NX Gest", titulo: "Recuperar senha", corpo: "Recebemos um pedido para redefinir sua senha. Use o link abaixo (válido por 30 minutos).", botao: "Redefinir senha" },
    en: { assunto: "Reset password — NX Gest", titulo: "Reset password", corpo: "We received a request to reset your password. Use the link below (valid for 30 minutes).", botao: "Reset password" },
    es: { assunto: "Recuperar contraseña — NX Gest", titulo: "Recuperar contraseña", corpo: "Recibimos una solicitud para redefinir tu contraseña. Usa el enlace de abajo (válido por 30 minutos).", botao: "Redefinir contraseña" },
  },
  lead: {
    "pt-BR": { assunto: "Confirme seu interesse no NX Gest", titulo: "Confirme seu interesse", corpo: "Para avançar com o seu interesse, confirme seu e-mail.", botao: "Confirmar interesse" },
    en: { assunto: "Confirm your interest in NX Gest", titulo: "Confirm your interest", corpo: "To move forward with your interest, confirm your email.", botao: "Confirm interest" },
    es: { assunto: "Confirma tu interés en NX Gest", titulo: "Confirma tu interés", corpo: "Para avanzar con el interés, confirma tu correo.", botao: "Confirmar interés" },
  },
}

function montar(subject: string, titulo: string, corpo: string, botao: string, link: string): { subject: string; html: string; text: string } {
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
    <h2 style="margin:0 0 12px">${titulo}</h2>
    <p style="color:#374151;line-height:1.5">${corpo}</p>
    <p style="margin:20px 0"><a href="${link}" style="background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px">${botao}</a></p>
    <p style="color:#9ca3af;font-size:12px">Se não foi você, ignore este e-mail.</p>
  </div>`
  return { subject, html, text: `${titulo}\n\n${corpo}\n\n${botao}: ${link}` }
}

export function conviteTemplate({ nome, link, lang }: { nome: string; link: string; lang: EmailLang }) {
  const t = textos.convite[lang]
  return montar(t.assunto, t.titulo, `${t.corpo}`, t.botao, link)
}

export function resetTemplate({ link, lang }: { link: string; lang: EmailLang }) {
  const t = textos.reset[lang]
  return montar(t.assunto, t.titulo, t.corpo, t.botao, link)
}

export function leadTemplate({ nome, link, lang }: { nome?: string; link: string; lang: EmailLang }) {
  const t = textos.lead[lang]
  const saudacao = nome
    ? lang === "pt-BR" ? `Olá, ${nome}! `
    : lang === "en" ? `Hi, ${nome}! `
    : `Hola, ${nome}! `
    : ""
  return montar(t.assunto, t.titulo, `${saudacao}${t.corpo}`, t.botao, link)
}
