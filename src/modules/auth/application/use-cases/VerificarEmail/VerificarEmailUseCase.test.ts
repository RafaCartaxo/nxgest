import { describe, expect, it, vi } from "vitest"
import { VerificarEmailUseCase } from "./VerificarEmailUseCase.js"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../ports/auth-token.repository.js"
import type { AuthToken } from "../../../domain/auth-token.entity.js"
import { TokenInvalidoError, TokenExpiradoError } from "../../../domain/errors/auth.error.js"

function makeToken(overrides: Partial<AuthToken> = {}): AuthToken {
  return {
    id: "t-1",
    subjectId: "u-1",
    tipo: "email",
    hash: "abc",
    expiraEm: new Date(Date.now() + 60_000).toISOString(),
    usadoEm: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function setup(token: AuthToken | null) {
  const authRepo = {
    findByEmail: vi.fn(),
    findById: vi.fn().mockResolvedValue({ id: "u-1" }),
    emailEmUso: vi.fn(),
    setEmailPendente: vi.fn(),
    confirmarEmail: vi.fn().mockResolvedValue(undefined),
    invalidarPorTipo: vi.fn(),
  } as unknown as IAuthRepository
  const tokenRepo = {
    create: vi.fn(),
    findByHashAndTipo: vi.fn().mockResolvedValue(token),
    marcarUsado: vi.fn().mockResolvedValue(undefined),
    invalidarPorTipo: vi.fn(),
    removerPorTipo: vi.fn(),
  } as unknown as IAuthTokenRepository
  const uc = new VerificarEmailUseCase(authRepo, tokenRepo)
  return { uc, authRepo, tokenRepo }
}

describe("VerificarEmailUseCase (PLAN-075 F4)", () => {
  it("token válido do próprio usuário → promove email + marca usado", async () => {
    const { uc, authRepo, tokenRepo } = setup(makeToken())
    await uc.execute({ userId: "u-1", token: "raw-token" })
    expect(authRepo.confirmarEmail).toHaveBeenCalledWith("u-1")
    expect(tokenRepo.marcarUsado).toHaveBeenCalledWith("t-1", expect.any(String))
  })

  it("token inexistente → TokenInvalidoError", async () => {
    const { uc, authRepo, tokenRepo } = setup(null)
    await expect(uc.execute({ userId: "u-1", token: "raw" })).rejects.toBeInstanceOf(TokenInvalidoError)
    expect(authRepo.confirmarEmail).not.toHaveBeenCalled()
    expect(tokenRepo.marcarUsado).not.toHaveBeenCalled()
  })

  it("token já usado → TokenInvalidoError", async () => {
    const { uc, authRepo, tokenRepo } = setup(makeToken({ usadoEm: "2026-01-01T00:00:00Z" }))
    await expect(uc.execute({ userId: "u-1", token: "raw" })).rejects.toBeInstanceOf(TokenInvalidoError)
    expect(authRepo.confirmarEmail).not.toHaveBeenCalled()
  })

  it("token de OUTRO usuário → TokenInvalidoError (CT-28)", async () => {
    const { uc, authRepo, tokenRepo } = setup(makeToken({ subjectId: "u-outro" }))
    await expect(uc.execute({ userId: "u-1", token: "raw" })).rejects.toBeInstanceOf(TokenInvalidoError)
    expect(authRepo.confirmarEmail).not.toHaveBeenCalled()
  })

  it("token expirado → TokenExpiradoError", async () => {
    const { uc, authRepo, tokenRepo } = setup(makeToken({ expiraEm: new Date(Date.now() - 1).toISOString() }))
    await expect(uc.execute({ userId: "u-1", token: "raw" })).rejects.toBeInstanceOf(TokenExpiradoError)
    expect(authRepo.confirmarEmail).not.toHaveBeenCalled()
  })
})