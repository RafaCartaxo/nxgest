import { describe, expect, it, vi } from "vitest"
import { ConvidarUseCase } from "./ConvidarUseCase.js"
import type { IAuthTokenRepository } from "../../ports/auth-token.repository.js"
import type { IMailer } from "../../../../../shared/email/mailer.port.js"

describe("ConvidarUseCase (PLAN-065 · SE-04)", () => {
  it("reenvio invalida token anterior do mesmo tipo ANTES de criar o novo", async () => {
    const create = vi.fn().mockResolvedValue(undefined)
    const invalidar = vi.fn().mockResolvedValue(undefined)
    const send = vi.fn().mockResolvedValue(undefined)
    const tokenRepo = {
      create,
      findByHashAndTipo: vi.fn(),
      marcarUsado: vi.fn(),
      invalidarPorTipo: invalidar,
      removerPorTipo: vi.fn(),
    } as unknown as IAuthTokenRepository
    const mailer = { send } as unknown as IMailer
    const uc = new ConvidarUseCase(tokenRepo, mailer)

    await uc.execute({ subjectId: "u1", nome: "Ana", email: "ana@x.com", lang: "pt-BR" })

    expect(invalidar).toHaveBeenCalledWith("u1", "convite")
    expect(create).toHaveBeenCalledTimes(1)
    const criado = create.mock.calls[0]![0]
    expect(criado.tipo).toBe("convite")

    const html = (send.mock.calls[0]![0].html as string) ?? ""
    expect(html).toContain("/ativar?token=")
  })
})
