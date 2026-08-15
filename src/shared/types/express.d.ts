export {}

declare global {
  namespace Express {
    /** Shape mínimo do usuário autenticado resolvido no authMiddleware (PLAN-077). */
    interface RequestAuthUsuario {
      id: string
      role: "super_admin" | "admin" | "socio" | "operator"
      empresaId: string | null
      senhaHash: string | null
      suspensoEm: string | null
    }
    /** Shape mínimo da empresa resolvida no authMiddleware (PLAN-077). */
    interface RequestAuthEmpresa {
      id: string
      ativa: number
      modulos: string | null
    }
    interface Request {
      userId?: string
      userRole?: "super_admin" | "admin" | "socio" | "operator"
      empresaId?: string | null
      /** PLAN-077: usuário autenticado resolvido no authMiddleware (evita re-query por request). */
      authUsuario?: RequestAuthUsuario | null
      /** PLAN-077: empresa do usuário resolvida no authMiddleware (evita re-query por request). */
      authEmpresa?: RequestAuthEmpresa | null
    }
  }
}
