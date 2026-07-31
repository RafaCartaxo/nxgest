import { Router } from "express"
import { AdminController } from "../controllers/admin.controller.js"
import { AdminRepository } from "../../infrastructure/repositories/admin.repository.impl.js"
import { adminMiddleware } from "../../../../shared/middleware/admin.middleware.js"

const router = Router()
const repository = new AdminRepository()
const controller = new AdminController(repository)

router.use(adminMiddleware)

router.get("/operadores", controller.list)
router.post("/operadores", controller.create)
router.patch("/operadores/:id", controller.update)
router.delete("/operadores/:id", controller.remove)
router.get("/dashboard", controller.dashboard)

export { router as adminRoutes }
