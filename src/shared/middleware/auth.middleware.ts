import type { Request, Response, NextFunction } from "express"
import { verifyToken } from "../utils/jwt.js"
import { db, usuarios } from "../../database.js"
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

    req.userId = payload.userId
    req.userRole = payload.role
    req.empresaId = payload.empresaId

    next()
  } catch {
    res.status(401).json({ code: "TOKEN_EXPIRED", message: "Token inválido ou expirado." })
  }
}
