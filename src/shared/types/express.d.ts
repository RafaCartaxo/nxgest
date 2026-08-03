export {}

declare global {
  namespace Express {
    interface Request {
      userId?: string
      userRole?: "super_admin" | "admin" | "socio" | "operator"
      empresaId?: string | null
    }
  }
}
