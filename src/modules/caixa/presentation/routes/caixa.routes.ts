import { Router } from "express"
import { CaixaRepository } from "../../infrastructure/repositories/caixa.repository.impl.js"
import { CaixaController } from "../controllers/caixa.controller.js"
import { adminMiddleware } from "../../../../shared/middleware/admin.middleware.js"

const router = Router()
const repository = new CaixaRepository()
const controller = new CaixaController(repository)

router.get("/", controller.getStatus.bind(controller))
router.post("/ajuste", adminMiddleware, controller.ajustar.bind(controller))
router.get("/movimentacoes", controller.listMovimentacoes.bind(controller))
router.get("/auditoria", controller.listAuditoria.bind(controller))
router.post("/liquidar", controller.liquidar.bind(controller))

export { router as caixaRoutes }
