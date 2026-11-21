import { afterEach, describe, expect, it, vi } from "vitest"
import type { Request, Response } from "express"
import fs from "node:fs"
import { AnexoController } from "./anexo.controller.js"

afterEach(() => { vi.restoreAllMocks() })

describe("Escopo do anexo dentro do cliente autorizado", () => {
  for (const action of ["getFile", "remove"] as const) {
    it(`${action}: outro cliente não permite ler arquivo nem excluir registro`, async () => {
      const controller = new AnexoController()
      const repo = {
        findById: vi.fn().mockResolvedValue({
          id: "foreign-attachment", clienteId: "another-client", caminho: "another-client/private.pdf",
          mime: "application/pdf", nomeOriginal: "private.pdf",
        }),
        remove: vi.fn(),
      }
      Reflect.set(controller, "verificarAcesso", vi.fn().mockResolvedValue(true))
      Reflect.set(controller, "repo", repo)
      const exists = vi.spyOn(fs, "existsSync").mockReturnValue(true)
      const unlink = vi.spyOn(fs, "unlinkSync").mockImplementation(() => {})
      const response = {
        status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(),
        sendFile: vi.fn(), setHeader: vi.fn(), send: vi.fn(),
      }
      const request = { params: { id: "authorized-client", anexoId: "foreign-attachment" } }
      await controller[action](request as unknown as Request, response as unknown as Response)
      expect(response.status).toHaveBeenCalledWith(404)
      expect(response.json).toHaveBeenCalledWith({ code: "ANEXO_NOT_FOUND", message: "Anexo não encontrado." })
      expect(exists).not.toHaveBeenCalled()
      expect(response.sendFile).not.toHaveBeenCalled()
      expect(unlink).not.toHaveBeenCalled()
      expect(repo.remove).not.toHaveBeenCalled()
    })
  }
})
