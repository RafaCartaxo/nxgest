import { describe, expect, it, vi } from "vitest"
import { ConfirmarLeadUseCase } from "./ConfirmarLeadUseCase.js"
import { TokenInvalidoError, TokenExpiradoError } from "../../../../auth/domain/errors/auth.error.js"
import type { IAuthTokenRepository } from "../../../../auth/application/ports/auth-token.repository.js"
import type { ILeadRepository } from "../../ports/lead.repository.js"
import type { Lead } from "../../../domain/lead.entity.js"
import type { AuthToken } from "../../../../auth/domain/auth-token.entity.js"

const lead: Lead = { id: "lead1", nomeResponsavel: "M", empresa: "E", email: "m@e.com", telefone: null, origem: "Site", status: "NOVO", convertidoEmpresaId: null, convertidoEm: null, convertidoPor: null, descartadoEm: null, descartadoPor: null, descarteMotivo: null, createdAt: "x" }

function token(over: Partial<AuthToken> = {}): AuthToken {
  return { id: "t1", subjectId: "lead1", tipo: "lead", hash: "h", expiraEm: new Date(Date.now() + 3600e3).toISOString(), usadoEm: null, createdAt: "x", ...over }
}

function setup(auth: AuthToken | null, leadAtual: Lead | null) {
  const tokenRepo: IAuthTokenRepository = { create: vi.fn(), findByHashAndTipo: vi.fn().mockResolvedValue(auth), marcarUsado: vi.fn().mockResolvedValue(undefined), invalidarPorTipo: vi.fn(), removerPorTipo: vi.fn() }
  const repo: ILeadRepository = { create: vi.fn(), findByEmail: vi.fn(), findById: vi.fn().mockResolvedValue(leadAtual), list: vi.fn(), updateStatus: vi.fn(), marcarConfirmado: vi.fn().mockResolvedValue({ ...lead, status: "EMAIL_CONFIRMADO" }), marcarConvertido: vi.fn(), descartar: vi.fn(), deleteById: vi.fn() }
  const uc = new ConfirmarLeadUseCase(tokenRepo, repo)
  return { uc, tokenRepo, repo }
}

describe("ConfirmarLeadUseCase (PLAN-064 · LD-06/08/07)", () => {
  it("token usado (single-use) → TokenInvalidoError", async () => {
    const { uc } = setup(token({ usadoEm: "2026-01-01" }), lead)
    await expect(uc.execute({ token: "raw" })).rejects.toBeInstanceOf(TokenInvalidoError)
  })

  it("token expirado → TokenExpiradoError", async () => {
    const { uc } = setup(token({ expiraEm: new Date(Date.now() - 1000).toISOString() }), lead)
    await expect(uc.execute({ token: "raw" })).rejects.toBeInstanceOf(TokenExpiradoError)
  })

  it("válido → marca usado + EMAIL_CONFIRMADO", async () => {
    const { uc, tokenRepo, repo } = setup(token(), lead)
    const res = await uc.execute({ token: "raw" })
    expect(tokenRepo.marcarUsado).toHaveBeenCalled()
    expect(repo.marcarConfirmado).toHaveBeenCalledWith("lead1")
    expect(res.status).toBe("EMAIL_CONFIRMADO")
  })
})
