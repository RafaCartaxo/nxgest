import type { Request, Response, NextFunction } from "express"
import { verifyToken } from "../utils/jwt.js"

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Token de autenticação ausente." })
    return
  }

  try {
    const token = header.slice(7)
    const payload = verifyToken(token)

    req.userId = payload.userId
    req.userRole = payload.role

    next()
  } catch {
    res.status(401).json({ code: "TOKEN_EXPIRED", message: "Token inválido ou expirado." })
  }
}
