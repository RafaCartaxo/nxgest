import { describe, expect, it, vi } from "vitest"
import { resolveUsuarioAlvo } from "./scope.js"
import { OperadorNaoEncontradoError } from "../../modules/admin/domain/errors/admin.error.js"
import type { Request } from "express"
import type { IAdminRepository } from "../../modules/admin/application/ports/admin.repository.js"

function req(over: Partial<Request>): Request {
  return { userRole: "operator", userId: "self", query: {}, headers: {}, ...over } as unknown as Request
}

function adminRepo(over: Partial<IAdminRepository>): IAdminRepository {
  return { subarvoreIds: vi.fn().mockResolvedValue([]), findById: vi.fn().mockResolvedValue({ id: "alvo" }), ...over } as unknown as IAdminRepository
}

describe("resolveUsuarioAlvo (PLAN-032 · escopo hierárquico)", () => {
  it("operator ignora ?usuarioId= (bloqueia forgery) → próprio", async () => {
    const r = await resolveUsuarioAlvo(req({ userRole: "operator", query: { usuarioId: "outro" } }), adminRepo({}))
    expect(r).toBe("self")
  })

  it("admin sem ?usuarioId= → próprio", async () => {
    const r = await resolveUsuarioAlvo(req({ userRole: "admin" }), adminRepo({}))
    expect(r).toBe("self")
  })

  it("admin com ?usuarioId= válido → alvo (findById por empresa)", async () => {
    const repo = adminRepo({ findById: vi.fn().mockResolvedValue({ id: "alvo" }) })
    const r = await resolveUsuarioAlvo(req({ userRole: "admin", query: { usuarioId: "alvo" }, empresaId: "e1" }), repo)
    expect(repo.findById).toHaveBeenCalledWith("alvo", "e1")
    expect(r).toBe("alvo")
  })

  it("socio com ?usuarioId= fora da subárvore → OperadorNaoEncontradoError (404)", async () => {
    const repo = adminRepo({ subarvoreIds: vi.fn().mockResolvedValue(["a", "b"]) })
    await expect(resolveUsuarioAlvo(req({ userRole: "socio", query: { usuarioId: "fora" } }), repo)).rejects.toBeInstanceOf(OperadorNaoEncontradoError)
  })

  it("socio com ?usuarioId= na subárvore → alvo", async () => {
    const repo = adminRepo({ subarvoreIds: vi.fn().mockResolvedValue(["self", "sub1"]) })
    const r = await resolveUsuarioAlvo(req({ userRole: "socio", query: { usuarioId: "sub1" } }), repo)
    expect(r).toBe("sub1")
  })

  it("super sem ?usuarioId= → próprio; com → busca por ?empresaId=", async () => {
    const repo = adminRepo({ findById: vi.fn().mockResolvedValue({ id: "x" }) })
    const r = await resolveUsuarioAlvo(req({ userRole: "super_admin", query: { usuarioId: "x", empresaId: "e9" } }), repo)
    expect(repo.findById).toHaveBeenCalledWith("x", "e9")
    expect(r).toBe("x")
  })
})
