import { v4 as uuid } from "uuid"
import type { Parcela, Periodicidade } from "../contrato.entity.js"
import { parseDateLocal, getLocalDateString } from "../../../../shared/utils/parseDateLocal.js"

/** Intervalo em dias entre vencimentos — diária = 1, semanal = 7 (PLAN-076). */
export function intervaloDePeriodicidade(periodicidade: Periodicidade): number {
  return periodicidade === "semanal" ? 7 : 1
}

/** Ajusta um vencimento que caiu em domingo para a segunda-feira seguinte (BR-042). */
function ajustarDomingo(data: Date): Date {
  if (data.getDay() === 0) {
    data.setDate(data.getDate() + 1)
  }
  return data
}

export function calcularDataFinal(
  dataInicio: string,
  quantidadeParcelas: number,
  periodicidade: Periodicidade = "diaria"
): string {
  const intervalo = intervaloDePeriodicidade(periodicidade)
  const data = parseDateLocal(dataInicio)
  for (let i = 0; i < quantidadeParcelas; i++) {
    data.setDate(data.getDate() + intervalo)
    ajustarDomingo(data)
  }
  return getLocalDateString(data)
}

export function gerarParcelas(
  contratoId: string,
  valorFinal: number,
  quantidadeParcelas: number,
  dataInicio: string,
  periodicidade: Periodicidade = "diaria"
): Parcela[] {
  const intervalo = intervaloDePeriodicidade(periodicidade)
  const parcelaBase = Math.floor((valorFinal / quantidadeParcelas) * 100) / 100
  const residual =
    Math.round((valorFinal - parcelaBase * quantidadeParcelas) * 100) / 100
  const now = new Date().toISOString()
  const vencimento = parseDateLocal(dataInicio)

  return Array.from({ length: quantidadeParcelas }, (_, i) => {
    const numero = i + 1
    const valorPrevisto =
      numero === quantidadeParcelas
        ? Math.round((parcelaBase + residual) * 100) / 100
        : parcelaBase

    vencimento.setDate(vencimento.getDate() + intervalo)
    ajustarDomingo(vencimento)

    return {
      id: uuid(),
      contratoId,
      numero,
      valorPrevisto,
      valorPago: 0,
      saldoPendente: valorPrevisto,
      estado: "Pendente" as const,
      dataVencimento: getLocalDateString(vencimento),
      dataQuitacao: null,
      createdAt: now,
      updatedAt: now,
    }
  })
}
