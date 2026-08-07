import type { IEmpresaRepository } from "../../ports/empresa.repository.js"
import type { IImpactoDesativacaoQuery } from "../../ports/impacto-desativacao.port.js"
import type { IAuditoriaModulosWriter } from "../../ports/auditoria-modulos.port.js"
import type { AtualizarModulosInput } from "./AtualizarModulosInput.js"
import { validateModulos, serializeModulos, DEFAULT_MODULOS, type ModuleId } from "../../../domain/modules.js"
import { EmpresaNaoEncontradaError } from "../../../domain/errors/empresa.error.js"
import { ModulosInvalidosError, MotivoObrigatorioError, ModuloComDadosEmAbertoError } from "../../../domain/errors/modulos.error.js"

const MAX_MOTIVO = 200

/**
 * Guard de desativação com dados (BR-105): valida o grafo, calcula o impacto
 * (inclui cascata), bloqueia 409 quando há dado financeiro em aberto (caixa
 * nunca é forcável) e registra a trilha em `auditoria_modulos`.
 */
export class AtualizarModulosUseCase {
  constructor(
    private readonly repository: IEmpresaRepository,
    private readonly impactoQuery: IImpactoDesativacaoQuery,
    private readonly auditoria: IAuditoriaModulosWriter,
  ) {}

  async execute(input: AtualizarModulosInput) {
    const valid = validateModulos(input.modulos)
    if (!valid.ok) throw new ModulosInvalidosError(valid.message)

    const empresa = await this.repository.findById(input.empresaId)
    if (!empresa) throw new EmpresaNaoEncontradaError()

    const atuais = (empresa.modulos ?? [...DEFAULT_MODULOS]) as ModuleId[]
    const impacto = await this.impactoQuery.calcular(input.empresaId, atuais, valid.value)

    const forcar = input.force === true
    // Caixa aberto NUNCA é forcável (BR-105): fecha o dia antes.
    const caixaBloqueada = impacto.impacto.some((i) => i.modulo === "caixa" && i.bloqueia)
    if (impacto.bloqueado && (!forcar || caixaBloqueada)) {
      throw new ModuloComDadosEmAbertoError(impacto)
    }

    let motivo: string | null = null
    if (forcar) {
      motivo = typeof input.motivo === "string" && input.motivo.trim() ? input.motivo.trim() : null
      if (!motivo) throw new MotivoObrigatorioError()
      if (motivo.length > MAX_MOTIVO) throw new MotivoObrigatorioError(`O motivo deve ter no máximo ${MAX_MOTIVO} caracteres.`)
    }

    const result = await this.repository.updateModulos(input.empresaId, valid.value)
    const antes = empresa.modulos ? serializeModulos(empresa.modulos) : null
    const depois = serializeModulos(valid.value)
    // Idempotente: sem mudança real, não polui a auditoria.
    if (antes !== depois) {
      await this.auditoria.registrar({
        empresaId: input.empresaId,
        adminId: input.adminId,
        tipo: "modulos",
        antes,
        depois,
        force: forcar,
        motivo,
      })
    }

    return { ...result, impacto }
  }
}
