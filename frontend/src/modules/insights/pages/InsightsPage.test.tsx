// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { InsightsPage } from "./InsightsPage.js"

const { resumoMock, carteiraMock } = vi.hoisted(() => ({ resumoMock: vi.fn(), carteiraMock: vi.fn() }))

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
// masks.ts (via chartFormat) importa a instância do i18n — mockamos para não iniciar o i18next no teste.
vi.mock("../../../i18n/config.js", () => ({ default: { language: "pt-BR" } }))
vi.mock("../hooks/useInsights.js", () => ({ useResumoInsights: () => resumoMock(), useCarteiraInsights: () => carteiraMock() }))

function query(partial: Record<string, unknown>) {
  return { isLoading: false, isError: false, data: null, refetch: vi.fn(), ...partial }
}

const serieComDados = [
  { data: "2026-08-24", recebido: 1200, previsto: 1500 },
  { data: "2026-08-25", recebido: 800, previsto: 900 },
]

describe("InsightsPage (PLAN-080 F1)", () => {
  it("loading → EstadoTela (common.loading)", () => {
    resumoMock.mockReturnValue(query({ isLoading: true }))
    carteiraMock.mockReturnValue(query({ isLoading: true }))
    render(<InsightsPage />)
    expect(screen.getAllByText("common.loading").length).toBeGreaterThan(0)
  })

  it("com dados → renderiza os cards de gráfico (tendência + previsto×recebido)", () => {
    resumoMock.mockReturnValue(query({ data: { periodo: "semana", serie: serieComDados } }))
    carteiraMock.mockReturnValue(query({ data: { carteira: { emAtraso: 10, aVencer: 20, pagas: 30, total: 60 }, gastosPorCategoria: [{ categoria: "Transporte", total: 5 }], contribuicaoOperadores: [{ usuarioId: "u-1", nome: "Ana", recebido: 10 }] } }))
    render(<InsightsPage />)
    expect(screen.getByText("insights.tendencia")).toBeInTheDocument()
    expect(screen.getByText("insights.previstoRecebido")).toBeInTheDocument()
  })

  it("série toda zero → empty-state da página (insights.semDados)", () => {
    resumoMock.mockReturnValue(
      query({ data: { periodo: "semana", serie: [{ data: "2026-08-24", recebido: 0, previsto: 0 }] } }),
    )
    carteiraMock.mockReturnValue(query({ data: { carteira: { emAtraso: 0, aVencer: 0, pagas: 0, total: 0 }, gastosPorCategoria: [], contribuicaoOperadores: [] } }))
    render(<InsightsPage />)
    expect(screen.getAllByText("insights.semDados").length).toBeGreaterThan(0)
  })
})