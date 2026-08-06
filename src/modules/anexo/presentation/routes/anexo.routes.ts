import { Router } from "express"
import multer from "multer"
import { AnexoController, MAX_PDF_BYTES } from "../controllers/anexo.controller.js"

// mergeParams: o sub-router precisa do `:id` (clienteId) herdado do mount pai.
const router = Router({ mergeParams: true })
const controller = new AnexoController()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_BYTES },
})

router.post("/", (req, res, next) => {
  upload.single("arquivo")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ code: "ANEXO_LIMITE", message: "O arquivo deve ter no máximo 5MB." })
        return
      }
      next(err)
      return
    }
    controller.upload(req, res)
  })
})
router.get("/", controller.list.bind(controller))
router.get("/:anexoId/file", controller.getFile.bind(controller))
router.delete("/:anexoId", controller.remove.bind(controller))

export { router as anexoRoutes }
