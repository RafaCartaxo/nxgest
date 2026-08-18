import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import path from "path"
import { fileURLToPath } from "url"
import { runMigrations, seedBasico } from "./database.js"
import { healthRoutes } from "./modules/health/presentation/routes/health.routes.js"
import { authRoutes } from "./modules/auth/presentation/routes/auth.routes.js"
import { authMiddleware } from "./shared/middleware/auth.middleware.js"
import { userRateLimit } from "./shared/middleware/userRateLimit.middleware.js"
import { requireModule } from "./shared/middleware/module.middleware.js"
import { adminRoutes } from "./modules/admin/presentation/routes/admin.routes.js"
import { clienteRoutes } from "./modules/cliente/presentation/routes/cliente.routes.js"
import { contratoRoutes } from "./modules/contrato/presentation/routes/contrato.routes.js"
import { pagamentoRoutes } from "./modules/pagamento/presentation/routes/pagamento.routes.js"
import { operacoesRoutes } from "./modules/operacoes/presentation/routes/operacoes.routes.js"
import { caixaRoutes } from "./modules/caixa/presentation/routes/caixa.routes.js"
import { empresaRoutes } from "./modules/admin/presentation/routes/empresa.routes.js"
import { gastoRoutes } from "./modules/gasto/presentation/routes/gasto.routes.js"
import { leadPublicRoutes } from "./modules/leads/presentation/routes/lead.routes.js"
import { leadAdminRoutes } from "./modules/leads/presentation/routes/lead.admin.routes.js"
import { devboardRoutes } from "./modules/devboard/presentation/routes/devboard.routes.js"
import { superAdminMiddleware } from "./shared/middleware/super-admin.middleware.js"
import { garantirUploadsDir } from "./shared/utils/uploads.js"

await runMigrations()
await seedBasico()
garantirUploadsDir()

const app = express()

// PLAN-066 (P0): o único proxy externo é o Caddy → confiar no X-Forwarded-For p/ rate limit real por IP.
app.set("trust proxy", 1)

// PLAN-066 (P0): security headers (helmet) + CSP. Estilos inline (React style attr) + Google Fonts permitidos.
// blob: no frame-src (viewer de PDF) e nominatim no connect-src (reverse geocode) — senão CSP quebra o app.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'", "blob:"],
      connectSrc: ["'self'", "https://nominatim.openstreetmap.org"],
      frameAncestors: ["'none'"],
    },
  },
}))

// PLAN-066 (P0): CORS fail-closed — produção sem CORS_ORIGIN recusa origens cruzadas (não reflete).
const corsOrigin = process.env.CORS_ORIGIN
if (process.env.NODE_ENV === "production" && !corsOrigin) {
  console.error("[CORS] NODE_ENV=production sem CORS_ORIGIN → fail-closed (origin: false). Defina CORS_ORIGIN para liberar origens.")
}
app.use(cors(corsOrigin ? { origin: corsOrigin } : { origin: false }))

// Limite maior de body: fotos/avatares chegam como data URL base64 (PLAN-041).
// Fotos normalizadas ≤500KB decodificados (~667KB de texto) — 2mb cobre com folga.
app.use(express.json({ limit: "2mb" }))

app.use("/api/health", healthRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/admin", authMiddleware, userRateLimit, adminRoutes)
app.use("/api/admin/empresas", authMiddleware, userRateLimit, empresaRoutes)
app.use("/api/leads", leadPublicRoutes)
app.use("/api/admin/leads", authMiddleware, userRateLimit, leadAdminRoutes)

app.use("/api/clientes", authMiddleware, userRateLimit, requireModule("clientes"), clienteRoutes)
app.use("/api/contratos", authMiddleware, userRateLimit, requireModule("contratos"), contratoRoutes)
app.use("/api/pagamentos", authMiddleware, userRateLimit, requireModule("contratos"), pagamentoRoutes)
app.use("/api/operacoes", authMiddleware, userRateLimit, operacoesRoutes)
app.use("/api/caixa", authMiddleware, userRateLimit, requireModule("caixa"), caixaRoutes)
app.use("/api/gastos", authMiddleware, userRateLimit, requireModule("gastos"), gastoRoutes)

// Devboard: visibilidade de git/CI (exclusivo do super_admin — proxy da GitHub API, token no servidor).
app.use("/api/devboard", authMiddleware, superAdminMiddleware, devboardRoutes)

if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const frontendDist = path.resolve(__dirname, "../frontend/dist")
  app.use(express.static(frontendDist))
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"))
  })
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if ((err as { type?: string }).type === "entity.too.large") {
    res.status(413).json({ code: "PAYLOAD_TOO_LARGE", message: "Corpo da requisição muito grande." })
    return
  }
  console.error("Erro não tratado:", err)
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
})

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
