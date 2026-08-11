/**
 * processarAnexo — regras do PLAN-042 aplicadas no front (UX).
 * Imagem: comprime via canvas (<=1600px, JPEG 0.8) e exige <=1MB depois.
 * PDF: vai como está, limite 5MB. O servidor revalida (nunca confiar no front).
 *
 * A imagem retorna um Blob (não data URL): o `fetch(dataUrl)` no upload era
 * bloqueado pela CSP (`connectSrc` sem `data:`) e o anexo nunca chegava ao
 * servidor. Com Blob direto, o `File` é montado sem fetch.
 */

export const MAX_IMAGEM_BYTES = 1024 * 1024 // 1MB
export const MAX_PDF_BYTES = 5 * 1024 * 1024 // 5MB
export const MAX_LADO_ANEXO = 1600 // px

const MIMES_IMAGEM = ["image/jpeg", "image/png", "image/webp"]
const MIMES_OK = [...MIMES_IMAGEM, "application/pdf"]
// HEIC/HEIF (iPhone "Alta eficiência") e tipos sem rótulo do browser: tentar decodificar
// e converter p/ JPEG — o servidor revalida por magic bytes.
const MIMES_DECODIFICAVEIS = [...MIMES_IMAGEM, "image/heic", "image/heif", "application/octet-stream", ""]

export type ErroAnexo = "ANEXO_TIPO" | "ANEXO_LIMITE" | "FALHA"

export type ResultadoAnexo =
  | { ok: true; nome: string; mime: string; tamanho: number; blob: Blob | null }
  | { ok: false; erro: ErroAnexo }

function canvasParaBlob(canvas: HTMLCanvasElement, mime: string, qualidade: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), mime, qualidade))
}

export async function processarAnexo(file: File): Promise<ResultadoAnexo> {
  const tipo = file.type || "application/octet-stream"

  if (tipo === "application/pdf") {
    if (file.size > MAX_PDF_BYTES) return { ok: false, erro: "ANEXO_LIMITE" }
    return { ok: true, nome: file.name, mime: tipo, tamanho: file.size, blob: null }
  }

  // Imagens conhecidas OU HEIC/HEIF/desconhecidas (iPhone) → tenta converter p/ JPEG.
  if (!MIMES_DECODIFICAVEIS.includes(tipo)) return { ok: false, erro: "ANEXO_TIPO" }

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

    const blob = await canvasParaBlob(canvas, "image/jpeg", 0.8)
    if (!blob) return { ok: false, erro: "FALHA" }
    if (blob.size > MAX_IMAGEM_BYTES) return { ok: false, erro: "ANEXO_LIMITE" }

    const nome = file.name.replace(/\.(png|webp|jpeg|jpg|heic|heif)$/i, "") + ".jpg"
    return { ok: true, nome, mime: "image/jpeg", tamanho: blob.size, blob }
  } catch {
    // Não decodificou (ex.: HEIC num browser sem suporte) → orienta o usuário.
    return { ok: false, erro: "ANEXO_TIPO" }
  }
}

export function formatarBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
