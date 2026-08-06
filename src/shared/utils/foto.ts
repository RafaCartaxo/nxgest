/**
 * Validação de foto em data URL (PLAN-058 — segurança by-design).
 *
 * Regras:
 * - MIME na allowlist (`image/jpeg|png|webp|gif`) — **exclui `svg`** (vetor de XSS
 *   armazenado se o valor sair do contexto `<img>`).
 * - Tamanho decodificado ≤ `MAX_FOTO_BYTES` (teto duro — nunca confiar no cliente).
 * - Magic bytes do base64 decodificado (JPEG/PNG/WebP/GIF) — impede "imagem" com
 *   conteúdo arbitrário (ex.: HTML/zip mascarado).
 */

export const MAX_FOTO_BYTES = 1024 * 1024 // 1MB decodificados (~1.4M chars base64)

const MIME_FOTO_RE = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/

function magicOk(mime: string, buf: Buffer): boolean {
  if (mime === "image/jpeg") return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  if (mime === "image/png") return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mime === "image/webp") return buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP"
  if (mime === "image/gif") return buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "GIF8"
  return false
}

export type FotoValidacao = { ok: true } | { ok: false; motivo: "tipo" | "tamanho" }

export function validarFoto(foto: string): FotoValidacao {
  const m = MIME_FOTO_RE.exec(foto)
  if (!m) return { ok: false, motivo: "tipo" }
  const [, mime, b64] = m

  let buf: Buffer
  try {
    buf = Buffer.from(b64, "base64")
  } catch {
    return { ok: false, motivo: "tipo" }
  }
  if (buf.length === 0) return { ok: false, motivo: "tipo" }
  if (buf.length > MAX_FOTO_BYTES) return { ok: false, motivo: "tamanho" }
  if (!magicOk(mime, buf)) return { ok: false, motivo: "tipo" }
  return { ok: true }
}
