import type { Request, Response, NextFunction } from "express"
import { verifyToken, type JwtPayload } from "../utils/jwt.js"
import { db, usuarios, empresas } from "../../database.js"
import { eq, and, isNull } from "drizzle-orm"

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Token de autenticação ausente." })
    return
  }

  try {
    const token = header.slice(7)
    const payload = verifyToken(token)

    const [usuario] = await db.select().from(usuarios).where(
      and(eq(usuarios.id, payload.userId), isNull(usuarios.deletedAt))
    ).limit(1)

    if (!usuario) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Usuário não encontrado ou removido." })
      return
    }

    // Role/empresa resolvidos do BANCO, não da claim do token (que pode estar stale
    // até 7 dias após promoção/rebaixamento — PLAN "roles"). A claim ainda autentica.
    req.userId = usuario.id
    req.userRole = usuario.role as JwtPayload["role"]
    req.empresaId = usuario.empresaId

    // Empresa suspensa (ativa = 0) bloqueia todas as rotas operacionais (BR-106).
    // super_admin (empresaId null) nunca é bloqueado — gestão global.
    if (usuario.empresaId) {
      const [empresa] = await db.select({ ativa: empresas.ativa }).from(empresas).where(eq(empresas.id, usuario.empresaId)).limit(1)
      if (empresa && empresa.ativa === 0) {
        res.status(403).json({ code: "EMPRESA_INATIVA", message: "A empresa está inativa." })
        return
      }
    }

    next()
  } catch {
    res.status(401).json({ code: "TOKEN_EXPIRED", message: "Token inválido ou expirado." })
  }
}
