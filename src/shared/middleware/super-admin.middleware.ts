import type { Request, Response, NextFunction } from "express"

export function superAdminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== "super_admin") {
    res.status(403).json({ code: "FORBIDDEN", message: "Acesso restrito ao super administrador." })
    return
  }

  next()
}