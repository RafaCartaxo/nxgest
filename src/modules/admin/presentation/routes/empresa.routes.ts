import { Router } from "express"
import { EmpresaController } from "../controllers/empresa.controller.js"
import { EmpresaRepository } from "../../infrastructure/repositories/empresa.repository.impl.js"
import { ImpactoDesativacaoQuery } from "../../infrastructure/queries/impacto-desativacao.query.impl.js"
import { AuditoriaModulosRepository } from "../../infrastructure/repositories/auditoria-modulos.repository.impl.js"
import { superAdminMiddleware } from "../../../../shared/middleware/super-admin.middleware.js"
import { AuthRepository } from "../../../../modules/auth/infrastructure/repositories/auth.repository.impl.js"

const router = Router()
const repository = new EmpresaRepository(new AuthRepository())
const controller = new EmpresaController(repository, new ImpactoDesativacaoQuery(), new AuditoriaModulosRepository())

router.use(superAdminMiddleware)

router.get("/", controller.list)
router.get("/:id", controller.getById)
router.post("/", controller.create)
router.patch("/:id", controller.update)
router.patch("/:id/modulos", controller.updateModulos)
router.patch("/:id/capacidades", controller.updateCapacidades)
router.get("/:id/impacto", controller.getImpacto)

export { router as empresaRoutes }