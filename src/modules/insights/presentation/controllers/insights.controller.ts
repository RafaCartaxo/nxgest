import type { Request, Response } from "express"
import { AdminRepository } from "../../../admin/infrastructure/repositories/admin.repository.impl.js"
import { InsightsRepository } from "../../infrastructure/repositories/insights.repository.impl.js"
import { ResumoInsightsUseCase } from "../../application/use-cases/ResumoInsightsUseCase.js"
import { resumoInsightsSchema } from "../../application/use-cases/ResumoInsightsInput.js"
import { resolveUsuarioAlvo } from "../../../../shared/utils/scope.js"

/**
 * Insights (PLAN-080 F1): módulo read-only — endpoint único `/api/insights/resumo?periodo=`.
 * Escopo por `resolveUsuarioAlvo` (operador = próprio; admin/sócio/super = ?usuarioId= ou
 * próprio — mesmo padrão dos demais módulos).
 */
export class InsightsController {
  async resumo(req: Request, res: Response) {
    try {
      const parsed = resumoInsightsSchema.safeParse({ periodo: req.query.periodo })
      if (!parsed.success) {
        res.status(422).json({
          code: "VALIDATION_ERROR",
          message: "Dados inválidos.",
          details: parsed.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        })
        return
      }

      const adminRepo = new AdminRepository()
      const userId = await resolveUsuarioAlvo(req, adminRepo)

      const useCase = new ResumoInsightsUseCase(new InsightsRepository())
      const result = await useCase.execute(userId, parsed.data.periodo)

      res.json(result)
    } catch (error) {
      console.error("Erro ao montar resumo de insights:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao montar resumo de insights." })
    }
  }
}