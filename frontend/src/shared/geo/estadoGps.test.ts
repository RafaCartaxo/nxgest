import { describe, it, expect } from "vitest"
import { estadoGpsInicial } from "./estadoGps.js"

describe("estadoGpsInicial (P7 — estado do GPS na edição)", () => {
  it("com coordenadas → capturada (coords preservadas)", () => {
    const r = estadoGpsInicial({ lat: -7.1, lng: -34.86 })
    expect(r.estado).toBe("capturada")
    expect(r.coords).toEqual({ lat: -7.1, lng: -34.86 })
    expect(r.aviso).toBeNull()
  })

  it("null → vazio", () => {
    const r = estadoGpsInicial(null)
    expect(r.estado).toBe("vazio")
    expect(r.coords).toBeNull()
  })

  it("undefined → vazio", () => {
    const r = estadoGpsInicial(undefined)
    expect(r.estado).toBe("vazio")
    expect(r.coords).toBeNull()
  })

  it("objeto sem lat/lng → vazio", () => {
    const r = estadoGpsInicial({} as never)
    expect(r.estado).toBe("vazio")
    expect(r.coords).toBeNull()
  })
})
