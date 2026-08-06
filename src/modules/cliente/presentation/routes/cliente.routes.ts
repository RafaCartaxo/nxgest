import { Router } from "express"
import { ClienteController } from "../controllers/cliente.controller.js"
import { ClienteRepository } from "../../infrastructure/repositories/cliente.repository.impl.js"
import { ContratoCountQuery } from "../../infrastructure/queries/contrato-count.query.impl.js"
import { ClienteSaldoQuery } from "../../infrastructure/queries/cliente-saldo.query.impl.js"
import { ClienteFinanceiroQuery } from "../../infrastructure/queries/cliente-financeiro.query.impl.js"
import { anexoRoutes } from "../../../anexo/presentation/routes/anexo.routes.js"

const router = Router()
const repository = new ClienteRepository()
const contratoCountQuery = new ContratoCountQuery()
const clienteSaldoQuery = new ClienteSaldoQuery()
const clienteFinanceiroQuery = new ClienteFinanceiroQuery()
const controller = new ClienteController(repository, contratoCountQuery, clienteSaldoQuery, clienteFinanceiroQuery)

router.use("/:id/anexos", anexoRoutes)
router.post("/", controller.create.bind(controller))
router.get("/", controller.list.bind(controller))
router.get("/:id", controller.getById.bind(controller))
router.patch("/:id", controller.update.bind(controller))
router.delete("/:id", controller.remove.bind(controller))

export { router as clienteRoutes }
