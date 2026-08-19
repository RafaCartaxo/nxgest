import { describe, expect, it, vi } from "vitest"
import { EditarOperadorUseCase } from "./EditarOperadorUseCase.js"
import type { IAdminRepository, OperadorContexto, OperadorRow } from "../../ports/admin.repository.js"
import { NaoPodeAutoModificarError } from "../../../domain/errors/admin.error.js"
import { EmailDuplicadoError } from "../../../../auth/domain/errors/auth.error.js"

const operador: OperadorRow = {
  id: "u-1",
  nome: "Ana",
  email: "ana@x.com",
  role: "operator",
  empresaId: null,
  status: "ativo",
  suspensoEm: null,
  totalClientes: 0,
  contratosAtivos: 0,
  conviteStatus: null,
  createdAt: new Date().toISOString(),
  deletedAt: null,
  telefone: null,
  foto: null,
  emailPendente: null,
  chefeId: null,
}

const contexto: OperadorContexto = {
  id: "u-1",
  email: "ana@x.com",
  role: "operator",
  emailPendente: null,
  status: "ativo",
}

function setup(repoOverrides: Partial<IAdminRepository> = {}) {
  const repo: IAdminRepository = {
    findById: vi.fn().mockResolvedValue(operador),
    getOperadorContexto: vi.fn().mockResolvedValue(contexto),
    emailEmUso: vi.fn().mockResolvedValue(false),
    update: vi.fn().mockResolvedValue(operador),
    ...repoOverrides,
  } as unknown as IAdminRepository
  const uc = new EditarOperadorUseCase(repo)
  return { uc, repo }
}

describe("EditarOperadorUseCase (PLAN-075 · R4)", () => {
  it("suspender/reativar a PRÓPRIA conta → NaoPodeAutoModificarError", async () => {
    const { uc, repo } = setup()
    await expect(uc.execute("u-1", { suspensoEm: new Date().toISOString() }, "u-1"))
      .rejects.toBeInstanceOf(NaoPodeAutoModificarError)
    await expect(uc.execute("u-1", { suspensoEm: null }, "u-1"))
      .rejects.toBeInstanceOf(NaoPodeAutoModificarError)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it("suspender OUTRO usuário → passa update com suspensoEm (não bloqueia admin)", async () => {
    const { uc, repo } = setup()
    await uc.execute("u-1", { suspensoEm: "2026-08-01T00:00:00Z" }, "u-admin")
    expect(repo.update).toHaveBeenCalledWith("u-1", { suspensoEm: "2026-08-01T00:00:00Z" }, "u-admin", undefined, undefined, contexto)
  })

  it("e-mail duplicado → EmailDuplicadoError antes de escrever", async () => {
    const { uc, repo } = setup({ emailEmUso: vi.fn().mockResolvedValue(true) })
    await expect(uc.execute("u-1", { email: "outro@x.com" }, "u-admin"))
      .rejects.toBeInstanceOf(EmailDuplicadoError)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it("operador inexistente → descarta com erro (não chega ao update)", async () => {
    const { uc, repo } = setup({ getOperadorContexto: vi.fn().mockResolvedValue(null) })
    await expect(uc.execute("u-x", { nome: "Zé" }, "u-admin")).rejects.toThrow()
    expect(repo.update).not.toHaveBeenCalled()
  })
})