// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { ChartCard } from "./ChartCard.js"

describe("ChartCard (PLAN-080)", () => {
  it("renderiza o título e o conteúdo", () => {
    render(
      <ChartCard title="Tendência de recebimentos">
        <div>conteudo do grafico</div>
      </ChartCard>,
    )
    expect(screen.getByText("Tendência de recebimentos")).toBeInTheDocument()
    expect(screen.getByText("conteudo do grafico")).toBeInTheDocument()
  })

  it("aceita EstadoTela como conteúdo (loading/erro/empty — F1-f1/f2/f6)", () => {
    render(
      <ChartCard title="Previsto × Recebido">
        <div>estado</div>
      </ChartCard>,
    )
    expect(screen.getByText("Previsto × Recebido")).toBeInTheDocument()
  })
})