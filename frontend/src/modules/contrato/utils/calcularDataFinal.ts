import { parseDateLocal, getLocalDateString } from "../../../shared/utils/parseDateLocal.js"
import type { Periodicidade } from "../services/contrato.service.js"

/** Intervalo em dias entre vencimentos — diária = 1, semanal = 7 (PLAN-076). */
export function intervaloDePeriodicidade(periodicidade: Periodicidade): number {
  return periodicidade === "semanal" ? 7 : 1
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
    if (data.getDay() === 0) {
      data.setDate(data.getDate() + 1)
    }
  }
  return getLocalDateString(data)
}
