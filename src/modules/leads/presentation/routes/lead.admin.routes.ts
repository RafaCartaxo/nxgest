import { Router } from "express"
import { LeadController } from "../controllers/lead.controller.js"
import { authMiddleware } from "../../../../shared/middleware/auth.middleware.js"

const router = Router()
const controller = new LeadController()

// Admin de leads — exclusivo do super admin (guard no controller, LD-13).
router.use(authMiddleware)
router.get("/", controller.listar)
router.post("/:id/onboarding", controller.onboarding)
router.post("/:id/converter", controller.converter)
router.post("/:id/descartar", controller.descartar)

export { router as leadAdminRoutes }
