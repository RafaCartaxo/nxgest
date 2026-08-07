import type { Request, Response, NextFunction } from "express"
import { db, empresas } from "../../database.js"
import { eq } from "drizzle-orm"
import { parseModulos } from "../../modules/admin/domain/modules.js"
import { parseCapacidades, CAPABILITY_MANIFEST, type CapabilityId } from "../../modules/admin/domain/capacidades.js"

/**
 * Enforcement de CAPACIDADE no backend (recursos finos do whitelabel).
 *
 * Mesma resolução de empresa do `requireModule`: super_admin sem `?empresaId=`
 * segue (gestão global); com `?empresaId=` valida a empresa-alvo.
 *
 * Regra (BR-104): capacidade off na empresa → 403 `CAPABILITY_DISABLED`;
 * módulo dono desativado → 403 (a capacidade fica implicitamente inativa).
 */
export function requireCapability(capabilityId: CapabilityId) {
  return async function capabilityMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const empresaId =
      req.userRole === "super_admin"
        ? (req.query.empresaId as string | undefined) || req.empresaId || null
        : req.empresaId ?? null

    if (!empresaId) {
      next()
      return
    }

    let row: { modulos: string | null; capacidades: string | null } | undefined
    try {
      ;[row] = await db
        .select({ modulos: empresas.modulos, capacidades: empresas.capacidades })
        .from(empresas)
        .where(eq(empresas.id, empresaId))
        .limit(1)
    } catch (err) {
      next(err as Error)
      return
    }

    if (!row) {
      res.status(404).json({ code: "EMPRESA_NOT_FOUND", message: "Empresa não encontrada." })
      return
    }

    const entry = CAPABILITY_MANIFEST[capabilityId]
    const modulos = parseModulos(row.modulos)
    if (modulos !== null && entry && !modulos.includes(entry.moduleOwner)) {
      res.status(403).json({
        code: "CAPABILITY_DISABLED",
        message: `A capacidade "${capabilityId}" está desativada para esta empresa (módulo "${entry.moduleOwner}" desativado).`,
      })
      return
    }

    const capacidades = parseCapacidades(row.capacidades)
    if (capacidades !== null && !capacidades.includes(capabilityId)) {
      res.status(403).json({
        code: "CAPABILITY_DISABLED",
        message: `A capacidade "${capabilityId}" está desativada para esta empresa.`,
      })
      return
    }

    next()
  }
}
