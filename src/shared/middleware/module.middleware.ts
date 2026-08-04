import type { Request, Response, NextFunction } from "express"
import { db, empresas } from "../../database.js"
import { eq } from "drizzle-orm"
import { parseModulos, type ModuleId } from "../../modules/admin/domain/modules.js"

/**
 * Enforcement de módulos no backend (PLAN-036 / P024).
 *
 * Complementa o gating de UI (PLAN-031): módulo desativado na empresa devolve
 * 403 também na API. Usado no mount das rotas e/ou por endpoint.
 *
 * Regras (BR-093):
 * - `empresas.modulos` ausente/`null` → empresa opera com TODOS os módulos;
 * - módulo fora da lista → 403 `MODULE_DISABLED`;
 * - super_admin sem `?empresaId=` → sem empresa-alvo → segue (gestão global);
 *   com `?empresaId=` → valida os módulos da empresa-alvo (mesma regra do
 *   `resolveUsuarioAlvo`).
 */
export function requireModule(moduleId: ModuleId) {
  return async function moduleMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const empresaId =
      req.userRole === "super_admin"
        ? (req.query.empresaId as string | undefined) || req.empresaId || null
        : req.empresaId ?? null

    if (!empresaId) {
      next()
      return
    }

    const [empresa] = await db
      .select({ modulos: empresas.modulos })
      .from(empresas)
      .where(eq(empresas.id, empresaId))
      .limit(1)

    if (!empresa) {
      res.status(404).json({ code: "EMPRESA_NOT_FOUND", message: "Empresa não encontrada." })
      return
    }

    const modulos = parseModulos(empresa.modulos)
    if (modulos !== null && !modulos.includes(moduleId)) {
      res.status(403).json({
        code: "MODULE_DISABLED",
        message: `O módulo "${moduleId}" está desativado para esta empresa.`,
      })
      return
    }

    next()
  }
}
