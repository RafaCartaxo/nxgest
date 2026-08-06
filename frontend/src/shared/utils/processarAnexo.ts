/**
 * processarAnexo — regras do PLAN-042 aplicadas no front (UX).
 * Imagem: comprime via canvas (<=1600px, JPEG 0.8) e exige <=1MB depois.
 * PDF: vai como está, limite 5MB. O servidor revalida (nunca confiar no front).
 */

export const MAX_IMAGEM_BYTES = 1024 * 1024 // 1MB
export const MAX_PDF_BYTES = 5 * 1024 * 1024 // 5MB
export const MAX_LADO_ANEXO = 1600 // px

export const MIMES_OK = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

export type ErroAnexo = "ANEXO_TIPO" | "ANEXO_LIMITE" | "FALHA"

export type ResultadoAnexo =
  | { ok: true; nome: string; mime: string; tamanho: number; thumb: string | null }
  | { ok: false; erro: ErroAnexo }

export async function processarAnexo(file: File): Promise<ResultadoAnexo> {
  if (!MIMES_OK.includes(file.type)) return { ok: false, erro: "ANEXO_TIPO" }

  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF_BYTES) return { ok: false, erro: "ANEXO_LIMITE" }
    return { ok: true, nome: file.name, mime: file.type, tamanho: file.size, thumb: null }
  }

  try {
    const bitmap = await createImageBitmap(file)
    const escala = Math.min(1, MAX_LADO_ANEXO / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)
    const ctx = canvas.getContext("2d")
    if (!ctx) return { ok: false, erro: "FALHA" }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
    const tamanho = Math.round((dataUrl.length * 3) / 4)
    if (tamanho > MAX_IMAGEM_BYTES) return { ok: false, erro: "ANEXO_LIMITE" }

    const nome = file.name.replace(/\.(png|webp|jpeg|jpg)$/i, "") + ".jpg"
    return { ok: true, nome, mime: "image/jpeg", tamanho, thumb: dataUrl }
  } catch {
    return { ok: false, erro: "FALHA" }
  }
}

export function formatarBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
