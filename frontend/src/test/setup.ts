import "@testing-library/jest-dom"

// jsdom não implementa canvas (comprovante da Rota/PagamentoModal). Stub mínimo
// para os testes de componente não quebrarem ao montar telas que tocam canvas.
if (typeof HTMLCanvasElement !== "undefined" && !HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext = function () {
    return {
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(0) }),
      fillRect: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
    } as unknown as CanvasRenderingContext2D
  } as never
}

// jsdom não tem ResizeObserver — o Recharts (ResponsiveContainer, PLAN-080) e o
// Modal/sheet dependem dele. Mock único no setup (compartilhado com PLAN-082).
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
