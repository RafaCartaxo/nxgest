import { Router } from "express"
import { AdminController } from "../controllers/admin.controller.js"
import { AdminRepository } from "../../infrastructure/repositories/admin.repository.impl.js"
import { adminMiddleware } from "../../../../shared/middleware/admin.middleware.js"

const router = Router()
const repository = new AdminRepository()
const controller = new AdminController(repository)

router.use(adminMiddleware)

router.get("/operadores", controller.list)
router.get("/operadores/:id", controller.getOperador)
router.post("/operadores", controller.create)
router.patch("/operadores/:id", controller.update)
router.patch("/operadores/:id/reenviar-convite", controller.reenviarConvite)
router.patch("/operadores/:id/revogar-convite", controller.revogarConvite)
router.patch("/operadores/:id/suspender", (req, res) => controller.suspender(req, res, true))
router.patch("/operadores/:id/reativar", (req, res) => controller.suspender(req, res, false))
router.delete("/operadores/:id", controller.remove)
router.get("/dashboard", controller.dashboard)
router.get("/equipe", controller.equipe)

export { router as adminRoutes }
