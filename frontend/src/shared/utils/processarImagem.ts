/** Limites de imagem (PLAN-041/Avatar · PLAN-058: qualidade + lightbox). */
export const MAX_ENTRADA_BYTES = 50 * 1024 * 1024 // 50MB — aceita qualquer foto, compacta na saída
export const MAX_LADO = 640 // px — 7-20× o tamanho de exibição; permite "ver maior" no lightbox
export const JPEG_QUALIDADE = 0.8

export type ErroImagem = "tipo" | "tamanho" | "falha"
export type ResultadoImagem = { ok: true; dataUrl: string; bytes: number } | { ok: false; erro: ErroImagem }

const TIPOS_OK = ["image/jpeg", "image/png", "image/webp"]

/**
 * Normaliza uma foto: redimensiona para <= MAX_LADO px, comprime em JPEG
 * (q = JPEG_QUALIDADE) e devolve data URL (~80-150KB). Regra (PLAN-041/058):
 * nunca armazenar o arquivo original.
 */
export async function processarImagem(file: File): Promise<ResultadoImagem> {
  if (!TIPOS_OK.includes(file.type)) return { ok: false, erro: "tipo" }
  if (file.size >= MAX_ENTRADA_BYTES) return { ok: false, erro: "tamanho" }

  try {
    const bitmap = await createImageBitmap(file)
    const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * escala)
    const h = Math.round(bitmap.height * escala)

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return { ok: false, erro: "falha" }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALIDADE)
    return { ok: true, dataUrl, bytes: Math.round((dataUrl.length * 3) / 4) }
  } catch {
    return { ok: false, erro: "falha" }
  }
}

export const formatarBytes = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
