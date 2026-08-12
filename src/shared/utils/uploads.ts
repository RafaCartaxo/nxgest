import path from "node:path"
import fs from "node:fs"

/**
 * Diretório base dos uploads (PLAN-042/070).
 *
 * - Docker/compose: `UPLOADS_DIR=/data/uploads` (volume persistente).
 * - Dev local: default `./uploads`.
 * Sempre sobrescrevível por `UPLOADS_DIR`.
 */
export const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "uploads"

export function garantirUploadsDir(): void {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

/** Pasta de anexos de um cliente: `<UPLOADS_DIR>/<clienteId>/`. */
export function pastaDeCliente(clienteId: string): string {
  return path.join(UPLOADS_DIR, clienteId)
}

/** Sanitiza o nome original (só o basename, sem separadores) para compor o nome no disco. */
export function sanitizarNome(nomeOriginal: string): string {
  const base = path.basename(nomeOriginal).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100)
  return base || "arquivo"
}
