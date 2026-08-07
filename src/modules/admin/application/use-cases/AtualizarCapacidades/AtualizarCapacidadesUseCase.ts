import type { IEmpresaRepository } from "../../ports/empresa.repository.js"
import type { IAuditoriaModulosWriter } from "../../ports/auditoria-modulos.port.js"
import { validateCapacidades, serializeCapacidades, capacidadesComDonoDesativado } from "../../../domain/capacidades.js"
import { EmpresaNaoEncontradaError } from "../../../domain/errors/empresa.error.js"
import { CapacidadesInvalidasError } from "../../../domain/errors/modulos.error.js"

export interface AtualizarCapacidadesInput {
  empresaId: string
  /** Array de capacidades, ou `null` para limpar o override (todas ativas). */
  capacidades: unknown
  adminId: string
}

export class AtualizarCapacidadesUseCase {
  constructor(
    private readonly repository: IEmpresaRepository,
    private readonly auditoria: IAuditoriaModulosWriter,
  ) {}

  async execute(input: AtualizarCapacidadesInput) {
    const empresa = await this.repository.findById(input.empresaId)
    if (!empresa) throw new EmpresaNaoEncontradaError()

    let novo: string[] | null
    if (input.capacidades === null) {
      novo = null
    } else {
      const valid = validateCapacidades(input.capacidades)
      if (!valid.ok) throw new CapacidadesInvalidasError(valid.message)

      const donoOff = capacidadesComDonoDesativado(valid.value, empresa.modulos ?? null)
      if (donoOff.length > 0) {
        throw new CapacidadesInvalidasError(`Capacidade exige módulo ativo: ${donoOff.join(", ")}.`)
      }
      novo = valid.value
    }

    const result = await this.repository.updateCapacidades(input.empresaId, novo)
    await this.auditoria.registrar({
      empresaId: input.empresaId,
      adminId: input.adminId,
      tipo: "capacidades",
      antes: empresa.capacidades ? serializeCapacidades(empresa.capacidades) : null,
      depois: novo === null ? null : serializeCapacidades(novo),
      force: false,
      motivo: null,
    })

    return result
  }
}
