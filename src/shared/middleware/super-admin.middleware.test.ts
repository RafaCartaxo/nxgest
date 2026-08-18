import { describe, expect, it, vi } from "vitest"
import type { NextFunction, Request, Response } from "express"
import { superAdminMiddleware } from "./super-admin.middleware.js"

function setup(role: string) {
  const req = { userRole: role } as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response
  const next = vi.fn() as unknown as NextFunction
  superAdminMiddleware(req, res, next)
  return { res, next }
}

describe("superAdminMiddleware (devboard — exclusividade)", () => {
  it("super_admin → chama next() (libera)", () => {
    const { next, res } = setup("super_admin")
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it("admin → 403 FORBIDDEN (não chama next)", () => {
    const { next, res } = setup("admin")
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ code: "FORBIDDEN", message: expect.any(String) })
  })

  it("socio → 403 FORBIDDEN", () => {
    const { next, res } = setup("socio")
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it("operator → 403 FORBIDDEN", () => {
    const { next, res } = setup("operator")
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })
})
