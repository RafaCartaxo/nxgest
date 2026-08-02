import { Router } from "express"
import { PagamentoController } from "../controllers/pagamento.controller.js"
import { PagamentoRepository } from "../../infrastructure/repositories/pagamento.repository.impl.js"
import { ContratoRepository } from "../../../contrato/infrastructure/repositories/contrato.repository.impl.js"
import { adminMiddleware } from "../../../../shared/middleware/admin.middleware.js"

const router = Router()
const pagamentoRepo = new PagamentoRepository()
const contratoRepo = new ContratoRepository()
const controller = new PagamentoController(pagamentoRepo, contratoRepo)

router.post("/", controller.create.bind(controller))
router.post("/preview", controller.preview.bind(controller))
router.get("/contrato/:contratoId", controller.listByContrato.bind(controller))
router.post("/:id/estornar", adminMiddleware, controller.estornar.bind(controller))

export { router as pagamentoRoutes }
