import { eq } from "drizzle-orm"
import { db, empresas, usuarios } from "../../../../database.js"
import type { IEmpresaRepository } from "../../application/ports/empresa.repository.js"
import type { Empresa } from "../../domain/empresa.entity.js"
import type { IAuthRepository } from "../../../../modules/auth/application/ports/auth.repository.js"
import { v4 as uuid } from "uuid"
import { EmailDuplicadoError } from "../../../../modules/auth/domain/errors/auth.error.js"

export class EmpresaRepository implements IEmpresaRepository {
  constructor(private readonly authRepository: IAuthRepository) {}

  async findAll(): Promise<Empresa[]> {
    return db.select().from(empresas).orderBy(empresas.createdAt)
  }

  async findById(id: string): Promise<Empresa | null> {
    const [row] = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1)
    return row ?? null
  }

  async create(input: { nome: string; adminNome: string; adminEmail: string; adminSenhaHash: string }) {
    const existente = await this.authRepository.findByEmail(input.adminEmail)
    if (existente) {
      throw new EmailDuplicadoError()
    }

    const empresaId = uuid()
    const adminId = uuid()

    await db.insert(empresas).values({
      id: empresaId,
      nome: input.nome,
      createdAt: new Date().toISOString(),
    })

    await db.insert(usuarios).values({
      id: adminId,
      nome: input.adminNome,
      email: input.adminEmail,
      senhaHash: input.adminSenhaHash,
      role: "admin",
      empresaId: empresaId,
      createdAt: new Date().toISOString(),
    })

    return {
      empresa: { id: empresaId, nome: input.nome, createdAt: new Date().toISOString() },
      admin: { id: adminId, nome: input.adminNome, email: input.adminEmail },
    }
  }
}