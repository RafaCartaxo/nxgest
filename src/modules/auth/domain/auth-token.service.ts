import { createHash, randomBytes } from "node:crypto"
import type { AuthTokenTipo } from "./auth-token.entity.js"

const EXPIRACAO_MS: Record<AuthTokenTipo, number> = {
  convite: 7 * 24 * 60 * 60 * 1000, // 7d
  reset: 30 * 60 * 1000, // 30min
  lead: 24 * 60 * 60 * 1000, // 24h
}

/** Token aleatório (32 bytes hex). Nunca logar. */
export function gerarToken(): string {
  return randomBytes(32).toString("hex")
}

/** Hash SHA-256 do token — o que fica no banco (SE-01). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function expirarEm(tipo: AuthTokenTipo, agora = new Date()): string {
  return new Date(agora.getTime() + EXPIRACAO_MS[tipo]).toISOString()
}
