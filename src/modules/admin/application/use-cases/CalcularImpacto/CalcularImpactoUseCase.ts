import type { IEmpresaRepository } from "../../ports/empresa.repository.js"
import type { IImpactoDesativacaoQuery } from "../../ports/impacto-desativacao.port.js"
import { validateModulos, DEFAULT_MODULOS, type ModuleId } from "../../../domain/modules.js"
import { EmpresaNaoEncontradaError } from "../../../domain/errors/empresa.error.js"
import { ModulosInvalidosError } from "../../../domain/errors/modulos.error.js"

export interface CalcularImpactoInput {
  empresaId: string
  /** Conjunto de módulos (já parseado do JSON da query). */
  modulos: unknown
}

/** Prévia do impacto de desativar um conjunto de módulos (GET /impacto). */
export class CalcularImpactoUseCase {
  constructor(
    private readonly repository: IEmpresaRepository,
    private readonly impactoQuery: IImpactoDesativacaoQuery,
  ) {}

  async execute(input: CalcularImpactoInput) {
    const valid = validateModulos(input.modulos)
    if (!valid.ok) throw new ModulosInvalidosError(valid.message)

    const empresa = await this.repository.findById(input.empresaId)
    if (!empresa) throw new EmpresaNaoEncontradaError()

    const atuais = (empresa.modulos ?? [...DEFAULT_MODULOS]) as ModuleId[]
    return this.impactoQuery.calcular(input.empresaId, atuais, valid.value)
  }
}
