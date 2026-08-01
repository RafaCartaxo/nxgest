import { Router } from "express"
import { EmpresaController } from "../controllers/empresa.controller.js"
import { EmpresaRepository } from "../../infrastructure/repositories/empresa.repository.impl.js"
import { superAdminMiddleware } from "../../../../shared/middleware/super-admin.middleware.js"
import { AuthRepository } from "../../../../modules/auth/infrastructure/repositories/auth.repository.impl.js"

const router = Router()
const repository = new EmpresaRepository(new AuthRepository())
const controller = new EmpresaController(repository)

router.use(superAdminMiddleware)

router.get("/", controller.list)
router.get("/:id", controller.getById)
router.post("/", controller.create)

export { router as empresaRoutes }