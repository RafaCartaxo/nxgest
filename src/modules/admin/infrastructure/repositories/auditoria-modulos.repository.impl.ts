import { v4 as uuid } from "uuid"
import { db, auditoriaModulos } from "../../../../database.js"
import type { IAuditoriaModulosWriter, AuditoriaModulosInput } from "../../application/ports/auditoria-modulos.port.js"

/** Trilha de mudanças de módulos/capacidades (padrão auditoria_caixa/estornos). */
export class AuditoriaModulosRepository implements IAuditoriaModulosWriter {
  async registrar(input: AuditoriaModulosInput): Promise<void> {
    await db.insert(auditoriaModulos).values({
      id: uuid(),
      empresaId: input.empresaId,
      adminId: input.adminId,
      tipo: input.tipo,
      antes: input.antes,
      depois: input.depois,
      force: input.force ? 1 : 0,
      motivo: input.motivo ?? null,
      createdAt: new Date().toISOString(),
    })
  }
}
