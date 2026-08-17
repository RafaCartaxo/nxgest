import type { Request } from "express"

export function getParam(req: Request, name: string): string {
  const value = req.params[name]
  if (typeof value !== "string") {
    throw new TypeError(`Route param "${name}" não é string (Express 5: params podem ser string[]).`)
  }
  return value
}
