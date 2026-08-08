import { describe, expect, it, vi } from "vitest"
import { DescartarLeadUseCase } from "./DescartarLeadUseCase.js"
import { LeadNaoEncontradoError, LeadStatusInvalidoError } from "../../../domain/errors/lead.error.js"
import type { ILeadRepository } from "../../ports/lead.repository.js"
import type { Lead } from "../../../domain/lead.entity.js"

const lead = (status: Lead["status"]): Lead => ({ id: "lead1", nomeResponsavel: "M", empresa: "E", email: "m@e.com", telefone: null, origem: "Site", status, convertidoEmpresaId: null, convertidoEm: null, convertidoPor: null, descartadoEm: null, descartadoPor: null, descarteMotivo: null, createdAt: "x" })

function setup(atual: Lead | null) {
  const repo: ILeadRepository = {
    create: vi.fn(), findByEmail: vi.fn(), findById: vi.fn().mockResolvedValue(atual), list: vi.fn(), updateStatus: vi.fn(),
    marcarConfirmado: vi.fn(), marcarConvertido: vi.fn(),
    descartar: vi.fn().mockImplementation((id: string) => Promise.resolve({ ...lead("NOVO"), id, status: "DESCARTADO", email: `descartado-${id}@descartado.local`, descartadoEm: "x", descartadoPor: "u1", descarteMotivo: "Fora do perfil" })),
    deleteById: vi.fn(),
  }
  const uc = new DescartarLeadUseCase(repo)
  return { uc, repo }
}

describe("DescartarLeadUseCase (PLAN-064 · LD-12/LGPD)", () => {
  it("descarta e anonimiza (LGPD) + motivo/quem/quando", async () => {
    const { uc, repo } = setup(lead("NOVO"))
    const res = await uc.execute({ id: "lead1", por: "super1", motivo: "Fora do perfil" })
    expect(repo.descartar).toHaveBeenCalledWith("lead1", { por: "super1", motivo: "Fora do perfil" })
    expect(res.status).toBe("DESCARTADO")
    expect(res.email).toContain("descartado-")
  })

  it("lead não encontrado → LeadNaoEncontradoError", async () => {
    const { uc } = setup(null)
    await expect(uc.execute({ id: "x", por: "u1", motivo: "m" })).rejects.toBeInstanceOf(LeadNaoEncontradoError)
  })

  it("já convertido → LeadStatusInvalidoError", async () => {
    const { uc } = setup(lead("CONVERTIDO"))
    await expect(uc.execute({ id: "lead1", por: "u1", motivo: "m" })).rejects.toBeInstanceOf(LeadStatusInvalidoError)
  })
})
