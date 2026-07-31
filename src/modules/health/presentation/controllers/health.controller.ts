import type { Request, Response } from "express"
import { db, usuarios } from "../../../../database.js"

export class HealthController {
  check = async (_req: Request, res: Response) => {
    try {
      await db.select().from(usuarios).limit(1)
      res.status(200).json({
        status: "ok",
        db: "connected",
        timestamp: new Date().toISOString(),
      })
    } catch {
      res.status(503).json({
        status: "error",
        db: "disconnected",
        timestamp: new Date().toISOString(),
      })
    }
  }
}
