import type { Request, Response } from "express"
import { getParam } from "../../../../shared/utils/routeParam.js"
import fs from "node:fs"
import path from "node:path"
import { v4 as uuid } from "uuid"
import { eq, and, isNull } from "drizzle-orm"
import { db, clientes } from "../../../../database.js"
import { resolveUsuarioAlvo } from "../../../../shared/utils/scope.js"
import { AdminRepository } from "../../../admin/infrastructure/repositories/admin.repository.impl.js"
import { AnexoRepository } from "../../infrastructure/repositories/anexo.repository.impl.js"
import { TIPOS_ANEXO, type TipoAnexo } from "../../domain/anexo.entity.js"
import { UPLOADS_DIR, pastaDeCliente, sanitizarNome } from "../../../../shared/utils/uploads.js"

export const MIMES_ANEXO = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
export const MAX_IMAGEM_BYTES = 1024 * 1024 // 1MB (pós-compressão no front)
export const MAX_PDF_BYTES = 5 * 1024 * 1024 // 5MB (também é o guarda global do multer)

/** Detecta o MIME real pelos magic bytes — não confia no content-type do cliente. */
function detectarMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg"
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png"
  if (buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp"
  if (buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf"
  return null
}

export class AnexoController {
  private repo = new AnexoRepository()
  private adminRepository = new AdminRepository()

  /** Garante que o cliente existe e está no escopo do usuário (mesma regra do restante do módulo). */
  private async verificarAcesso(req: Request, clienteId: string): Promise<boolean> {
    const userId = await resolveUsuarioAlvo(req, this.adminRepository)
    const [cliente] = await db.select({ id: clientes.id }).from(clientes).where(
      and(eq(clientes.id, clienteId), eq(clientes.userId, userId), isNull(clientes.deletedAt))
    ).limit(1)
    return !!cliente
  }

  upload = async (req: Request, res: Response) => {
    const file = req.file
    try {
      if (!file) {
        res.status(400).json({ code: "ANEXO_VAZIO", message: "Nenhum arquivo enviado (campo 'arquivo')." })
        return
      }

      const clienteId = getParam(req, "id")
      const okAcesso = await this.verificarAcesso(req, clienteId)
      if (!okAcesso) {
        res.status(404).json({ code: "CLIENT_NOT_FOUND", message: "Cliente não encontrado." })
        return
      }

      const mime = detectarMime(file.buffer)
      if (!mime || !MIMES_ANEXO.includes(mime)) {
        res.status(422).json({ code: "ANEXO_TIPO", message: "Formato não aceito. Envie JPEG, PNG, WebP ou PDF." })
        return
      }

      if (mime === "application/pdf") {
        if (file.size > MAX_PDF_BYTES) {
          res.status(413).json({ code: "ANEXO_LIMITE", message: "O PDF deve ter no máximo 5MB." })
          return
        }
      } else if (file.size > MAX_IMAGEM_BYTES) {
        res.status(422).json({ code: "ANEXO_LIMITE", message: "A imagem deve ter no máximo 1MB." })
        return
      }

      const tipoRaw = (req.body.tipo ?? "outro") as string
      const tipo: TipoAnexo = (TIPOS_ANEXO as string[]).includes(tipoRaw) ? (tipoRaw as TipoAnexo) : "outro"

      const dir = pastaDeCliente(clienteId)
      fs.mkdirSync(dir, { recursive: true })
      const nomeDisco = `${uuid()}-${sanitizarNome(file.originalname)}`
      const caminhoAbs = path.join(dir, nomeDisco)
      fs.writeFileSync(caminhoAbs, file.buffer)

      const relativo = path.join(clienteId, nomeDisco)
      const anexo = await this.repo.create({
        clienteId,
        tipo,
        nomeOriginal: file.originalname,
        mime,
        tamanho: file.size,
        caminho: relativo,
        criadoPor: req.userId!,
      })

      res.status(201).json({
        id: anexo.id,
        nome: anexo.nomeOriginal,
        tipo: anexo.tipo,
        mime: anexo.mime,
        tamanho: anexo.tamanho,
        createdAt: anexo.createdAt,
      })
    } catch (err) {
      console.error("Erro ao enviar anexo:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao enviar anexo." })
    }
  }

  list = async (req: Request, res: Response) => {
    try {
      const okAcesso = await this.verificarAcesso(req, getParam(req, "id"))
      if (!okAcesso) {
        res.status(404).json({ code: "CLIENT_NOT_FOUND", message: "Cliente não encontrado." })
        return
      }
      const itens = await this.repo.listByCliente(getParam(req, "id"))
      res.json(itens)
    } catch (err) {
      console.error("Erro ao listar anexos:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao listar anexos." })
    }
  }

  getFile = async (req: Request, res: Response) => {
    try {
      const okAcesso = await this.verificarAcesso(req, getParam(req, "id"))
      if (!okAcesso) {
        res.status(404).json({ code: "CLIENT_NOT_FOUND", message: "Cliente não encontrado." })
        return
      }
      const anexo = await this.repo.findById(getParam(req, "anexoId"))
      if (!anexo) {
        res.status(404).json({ code: "ANEXO_NOT_FOUND", message: "Anexo não encontrado." })
        return
      }
      const caminhoAbs = path.resolve(UPLOADS_DIR, anexo.caminho)
      if (!fs.existsSync(caminhoAbs)) {
        res.status(404).json({ code: "ANEXO_NOT_FOUND", message: "Arquivo não encontrado." })
        return
      }
      const ehPdf = anexo.mime === "application/pdf"
      res.setHeader("Content-Type", anexo.mime)
      res.setHeader("Content-Disposition", `${ehPdf ? "inline" : "inline"}; filename="${sanitizarNome(anexo.nomeOriginal)}"`)
      res.sendFile(caminhoAbs)
    } catch (err) {
      console.error("Erro ao servir anexo:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao servir anexo." })
    }
  }

  remove = async (req: Request, res: Response) => {
    try {
      const okAcesso = await this.verificarAcesso(req, getParam(req, "id"))
      if (!okAcesso) {
        res.status(404).json({ code: "CLIENT_NOT_FOUND", message: "Cliente não encontrado." })
        return
      }
      const anexo = await this.repo.findById(getParam(req, "anexoId"))
      if (!anexo) {
        res.status(404).json({ code: "ANEXO_NOT_FOUND", message: "Anexo não encontrado." })
        return
      }
      const caminhoAbs = path.resolve(UPLOADS_DIR, anexo.caminho)
      try { fs.unlinkSync(caminhoAbs) } catch { /* arquivo já ausente */ }
      await this.repo.remove(anexo.id)
      res.status(204).send()
    } catch (err) {
      console.error("Erro ao remover anexo:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao remover anexo." })
    }
  }
}
