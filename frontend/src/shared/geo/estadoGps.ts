import type { GpsEstado } from "./GpsControl.js"
import type { Localizacao } from "./types.js"

export interface BlocoGpsInicial {
  coords: Localizacao | null
  estado: GpsEstado
  aviso: string | null
}

/**
 * Estado inicial do controle de GPS a partir da localização salva (P7).
 * Com coords → `capturada`; sem coords → `vazio`. Usado no reset do form de edição.
 */
export function estadoGpsInicial(localizacao?: Localizacao | null): BlocoGpsInicial {
  if (localizacao && localizacao.lat != null && localizacao.lng != null) {
    return { coords: { lat: localizacao.lat, lng: localizacao.lng }, estado: "capturada", aviso: null }
  }
  return { coords: null, estado: "vazio", aviso: null }
}
