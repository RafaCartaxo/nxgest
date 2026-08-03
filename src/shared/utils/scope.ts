import type { Request } from "express"
import type { IAdminRepository } from "../../modules/admin/application/ports/admin.repository.js"
import { OperadorNaoEncontradoError } from "../../modules/admin/domain/errors/admin.error.js"

/**
 * Resolve o userId alvo de uma operação com escopo hierárquico (PLAN-032).
 *
 * - operator: sempre req.userId (ignora ?usuarioId= — bloqueia forgery)
 * - admin: usa ?usuarioId= se presente e válido dentro da própria empresa
 *   (findById com o empresaId do token retorna null se não pertencer); sem
 *   ?usuarioId=, opera sobre o próprio req.userId.
 * - socio: usa ?usuarioId= se presente e pertencer à **subárvore** do sócio
 *   (ele + operadores sob ele); fora dela → 404. Sem ?usuarioId=, o próprio.
 * - super_admin: usa ?usuarioId= se presente e existir (findById com filtro
 *   opcional de ?empresaId=); sem ?usuarioId=, o próprio req.userId.
 *
 * A validação é feita no banco (findById), não no JWT — robusto a tokens antigos.
 */
export async function resolveUsuarioAlvo(
  req: Request,
  adminRepo: IAdminRepository
): Promise<string> {
  const role = req.userRole ?? "operator"

  if (role === "operator") {
    return req.userId!
  }

  const usuarioId = req.query.usuarioId as string | undefined
  if (!usuarioId) {
    return req.userId!
  }

  if (role === "socio") {
    const subarvore = await adminRepo.subarvoreIds(req.userId!)
    if (!subarvore.includes(usuarioId)) {
      throw new OperadorNaoEncontradoError()
    }
    return usuarioId
  }

  const targetEmpresaId = role === "super_admin"
    ? (req.query.empresaId as string | undefined)
    : req.empresaId

  const alvo = await adminRepo.findById(usuarioId, targetEmpresaId)
  if (!alvo) {
    throw new OperadorNaoEncontradoError()
  }

  return alvo.id
}
