import { describe, expect, it, vi } from "vitest"
import { AtivarContaUseCase } from "./AtivarContaUseCase.js"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { IConviteRepository } from "../../ports/convite.repository.js"
import type { Convite } from "../../../domain/convite.entity.js"
import {
  TokenInvalidoError,
  TokenExpiradoError,
  ConviteRevogadoError,
  ConviteJaUsadoError,
  ConviteSubstituidoError,
  ConviteEmailNaoConfereError,
} from "../../../domain/errors/auth.error.js"

const TOKEN = "abc123"
const HASH = "hash-" + TOKEN
const USUARIO_ID = "u-1"

function convite(partial: Partial<Convite> = {}): Convite {
  return {
    id: "c-1",
    usuarioId: USUARIO_ID,
    emailAlvo: "op@empresa.com",
    criadoPor: null,
    roleAlvo: null,
    idioma: "pt-BR",
    status: "PENDENTE",
    tokenHash: HASH,
    criadoEm: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    expiraEm: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    usadoEm: null,
    revogadoEm: null,
    ...partial,
  }
}

function setup() {
  const authRepo: IAuthRepository = {
    findById: vi.fn(),
    updateSenha: vi.fn(),
  } as unknown as IAuthRepository
  const conviteRepo: IConviteRepository = {
    findByHash: vi.fn(),
    marcarExpirado: vi.fn(),
    marcarUsado: vi.fn(),
  } as unknown as IConviteRepository
  const useCase = new AtivarContaUseCase(authRepo, conviteRepo)
  return { authRepo, conviteRepo, useCase }
}

describe("AtivarContaUseCase — mensagens de falha (PLAN-087)", () => {
  it("token inexistente → TOKEN_INVALID", async () => {
    const { conviteRepo, useCase } = setup()
    vi.mocked(conviteRepo.findByHash).mockResolvedValue(null)
    await expect(useCase.execute({ token: TOKEN, senha: "senha123" })).rejects.toBeInstanceOf(TokenInvalidoError)
  })

  it("convite REVOGADO → CONVITE_REVOGADO", async () => {
    const { conviteRepo, useCase } = setup()
    vi.mocked(conviteRepo.findByHash).mockResolvedValue(convite({ status: "REVOGADO" }))
    await expect(useCase.execute({ token: TOKEN, senha: "senha123" })).rejects.toBeInstanceOf(ConviteRevogadoError)
  })

  it("convite já usado → CONVITE_JA_USADO", async () => {
    const { conviteRepo, useCase } = setup()
    vi.mocked(conviteRepo.findByHash).mockResolvedValue(convite({ usadoEm: new Date().toISOString() }))
    await expect(useCase.execute({ token: TOKEN, senha: "senha123" })).rejects.toBeInstanceOf(ConviteJaUsadoError)
  })

  it("EXPIRADO por substituição (reenvio N2), dentro do prazo → CONVITE_SUBSTITUIDO", async () => {
    const { conviteRepo, useCase } = setup()
    vi.mocked(conviteRepo.findByHash).mockResolvedValue(
      convite({ status: "EXPIRADO", expiraEm: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() }),
    )
    await expect(useCase.execute({ token: TOKEN, senha: "senha123" })).rejects.toBeInstanceOf(ConviteSubstituidoError)
  })

  it("EXPIRADO vencido de verdade → TOKEN_EXPIRED", async () => {
    const { conviteRepo, useCase } = setup()
    vi.mocked(conviteRepo.findByHash).mockResolvedValue(
      convite({ status: "EXPIRADO", expiraEm: new Date(Date.now() - 60 * 1000).toISOString() }),
    )
    await expect(useCase.execute({ token: TOKEN, senha: "senha123" })).rejects.toBeInstanceOf(TokenExpiradoError)
  })

  it("PENDENTE vencido → lazy-expire + TOKEN_EXPIRED", async () => {
    const { conviteRepo, useCase } = setup()
    vi.mocked(conviteRepo.findByHash).mockResolvedValue(
      convite({ status: "PENDENTE", expiraEm: new Date(Date.now() - 60 * 1000).toISOString() }),
    )
    await expect(useCase.execute({ token: TOKEN, senha: "senha123" })).rejects.toBeInstanceOf(TokenExpiradoError)
    expect(conviteRepo.marcarExpirado).toHaveBeenCalledWith("c-1")
  })

  it("usuário inexistente → TOKEN_INVALID", async () => {
    const { authRepo, conviteRepo, useCase } = setup()
    vi.mocked(conviteRepo.findByHash).mockResolvedValue(convite())
    vi.mocked(authRepo.findById).mockResolvedValue(null)
    await expect(useCase.execute({ token: TOKEN, senha: "senha123" })).rejects.toBeInstanceOf(TokenInvalidoError)
  })

  it("e-mail do usuário ≠ emailAlvo → CONVITE_EMAIL_NAO_CONFERE", async () => {
    const { authRepo, conviteRepo, useCase } = setup()
    vi.mocked(conviteRepo.findByHash).mockResolvedValue(convite())
    vi.mocked(authRepo.findById).mockResolvedValue({ id: USUARIO_ID, email: "outro@empresa.com" } as never)
    await expect(useCase.execute({ token: TOKEN, senha: "senha123" })).rejects.toBeInstanceOf(ConviteEmailNaoConfereError)
  })

  it("sucesso: define a senha e marca usado", async () => {
    const { authRepo, conviteRepo, useCase } = setup()
    vi.mocked(conviteRepo.findByHash).mockResolvedValue(convite())
    vi.mocked(authRepo.findById).mockResolvedValue({ id: USUARIO_ID, email: "op@empresa.com" } as never)
    await useCase.execute({ token: TOKEN, senha: "senha123" })
    expect(authRepo.updateSenha).toHaveBeenCalledWith(USUARIO_ID, expect.stringMatching(/^\$2[aby]\$/))
    expect(conviteRepo.marcarUsado).toHaveBeenCalledWith("c-1", expect.any(String))
  })
})