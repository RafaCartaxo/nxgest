import type { Request, Response, NextFunction } from "express"

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== "admin") {
    res.status(403).json({ code: "FORBIDDEN", message: "Acesso restrito a administradores." })
    return
  }

  next()
}
