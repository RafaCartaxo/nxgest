import { describe, expect, it, vi } from "vitest"
import { ConvidarUseCase } from "./ConvidarUseCase.js"
import type { IConviteRepository } from "../../ports/convite.repository.js"
import type { IMailer } from "../../../../../shared/email/mailer.port.js"

describe("ConvidarUseCase (PLAN-065 · SE-04)", () => {
  it("cria convite com vínculo de posse (email_alvo) + role, envia e-mail de ativação", async () => {
    const create = vi.fn().mockResolvedValue({ id: "c1", status: "PENDENTE", idioma: "pt-BR" })
    const send = vi.fn().mockResolvedValue(undefined)
    const conviteRepo = {
      create,
      findByHash: vi.fn(),
      findValidoPorUsuario: vi.fn(),
      statusPorUsuario: vi.fn(),
      marcarUsado: vi.fn(),
      marcarExpirado: vi.fn(),
      revogar: vi.fn(),
      invalidarAtivos: vi.fn(),
    } as unknown as IConviteRepository
    const mailer = { send } as unknown as IMailer
    const uc = new ConvidarUseCase(conviteRepo, mailer)

    await uc.execute({ subjectId: "u1", nome: "Ana", email: "ana@x.com", role: "admin", lang: "pt-BR", empresaNome: "ACME" })

    expect(create).toHaveBeenCalledTimes(1)
    const criado = create.mock.calls[0]![0]
    expect(criado.usuarioId).toBe("u1")
    expect(criado.emailAlvo).toBe("ana@x.com")
    expect(criado.roleAlvo).toBe("admin")
    expect(criado.empresaNome).toBeUndefined()

    const html = (send.mock.calls[0]![0].html as string) ?? ""
    expect(html).toContain("/ativar?token=")
    expect(html).toContain("ACME")
  })
})
