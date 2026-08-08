import { describe, expect, it, vi, afterEach } from "vitest"
import { signToken, verifyToken } from "./jwt.js"

const envBackup = { ...process.env }

afterEach(() => {
  process.env = { ...envBackup }
})

describe("jwt (PLAN-066 · fail-closed)", () => {
  it("sign → verify devolve o payload", () => {
    process.env.JWT_SECRET = "teste-secret-123"
    const token = signToken({ userId: "u1", role: "operator", empresaId: "e1" })
    const payload = verifyToken(token)
    expect(payload.userId).toBe("u1")
    expect(payload.role).toBe("operator")
  })

  it("fail-closed: sem JWT_SECRET → sign lança", () => {
    delete process.env.JWT_SECRET
    expect(() => signToken({ userId: "u1", role: "operator", empresaId: null })).toThrow(/JWT_SECRET/)
  })

  it("token adulterado → verify lança", () => {
    process.env.JWT_SECRET = "teste-secret-123"
    const token = signToken({ userId: "u1", role: "operator", empresaId: null })
    const t = token.split(".")
    t[2] = t[2]!.replace(/./g, "x")
    expect(() => verifyToken(t.join("."))).toThrow()
  })
})
