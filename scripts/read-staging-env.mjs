#!/usr/bin/env node
// Lê o arquivo como dados dotenv. Aceita o nome legado sem aspas e nunca avalia shell.
import { readFileSync } from "node:fs"
import { parse } from "dotenv"

try {
  const text = readFileSync(process.argv[2], "utf8")
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue
    if (!/^\s*[A-Za-z_][A-Za-z0-9_]*\s*=/.test(line)) throw new Error("Linha de configuração inválida")
  }
  const allowed = new Set(["DOMAIN", "CORS_ORIGIN", "JWT_SECRET", "ADMIN_DEFAULT_PASSWORD", "SUPER_ADMIN_EMAIL", "SUPER_ADMIN_DEFAULT_PASSWORD", "PG_DB", "PG_USER", "PG_PASSWORD", "MAIL_PROVIDER", "RESEND_API_KEY", "MAIL_FROM_NAME", "MAIL_FROM_ADDRESS", "APP_URL", "LOGIN_RATE_LIMIT_MAX", "PUBLICO_RATE_LIMIT_MAX", "USER_RATE_LIMIT_MAX", "LEADS_RATE_LIMIT_MAX", "GITHUB_TOKEN"])
  for (const [key, value] of Object.entries(parse(text))) {
    if (!allowed.has(key)) throw new Error(`Chave staging não suportada: ${key}`)
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new Error("Chave inválida")
    console.log(`${key}:${Buffer.from(value).toString("base64")}`)
  }
} catch (error) {
  console.error(`Configuração staging inválida: ${error.message}`)
  process.exitCode = 1
}
