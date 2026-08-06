import { eq } from "drizzle-orm"
import { db, anexos } from "../../../../database.js"
import { v4 as uuid } from "uuid"
import type { Anexo, AnexoDto, TipoAnexo } from "../../domain/anexo.entity.js"

export interface CriarAnexoInput {
  clienteId: string
  tipo: TipoAnexo
  nomeOriginal: string
  mime: string
  tamanho: number
  caminho: string
  criadoPor: string
}

export class AnexoRepository {
  async listByCliente(clienteId: string): Promise<AnexoDto[]> {
    const rows = await db.select().from(anexos).where(eq(anexos.clienteId, clienteId)).orderBy(anexos.createdAt)
    return rows.map((r) => ({
      id: r.id,
      nome: r.nomeOriginal,
      tipo: r.tipo as TipoAnexo,
      mime: r.mime,
      tamanho: r.tamanho,
      createdAt: r.createdAt,
    }))
  }

  async findById(id: string): Promise<Anexo | null> {
    const rows = await db.select().from(anexos).where(eq(anexos.id, id))
    if (rows.length === 0) return null
    const r = rows[0]
    return {
      id: r.id,
      clienteId: r.clienteId,
      tipo: r.tipo as TipoAnexo,
      nomeOriginal: r.nomeOriginal,
      mime: r.mime,
      tamanho: r.tamanho,
      caminho: r.caminho,
      criadoPor: r.criadoPor,
      createdAt: r.createdAt,
    }
  }

  async create(input: CriarAnexoInput): Promise<Anexo> {
    const id = uuid()
    const now = new Date().toISOString()
    await db.insert(anexos).values({
      id,
      clienteId: input.clienteId,
      tipo: input.tipo,
      nomeOriginal: input.nomeOriginal,
      mime: input.mime,
      tamanho: input.tamanho,
      caminho: input.caminho,
      criadoPor: input.criadoPor,
      createdAt: now,
    })
    return {
      id,
      clienteId: input.clienteId,
      tipo: input.tipo,
      nomeOriginal: input.nomeOriginal,
      mime: input.mime,
      tamanho: input.tamanho,
      caminho: input.caminho,
      criadoPor: input.criadoPor,
      createdAt: now,
    }
  }

  async remove(id: string): Promise<void> {
    await db.delete(anexos).where(eq(anexos.id, id))
  }
}
