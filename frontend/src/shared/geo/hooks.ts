import { useCallback, useRef, useState } from "react"
import { reverseGeocode } from "../utils/geocoding.js"
import type { EnderecoTexto, Localizacao } from "./types.js"

export interface ResultadoCaptura {
  localizacao: Localizacao
  endereco: Partial<EnderecoTexto>
  /** `reverse` = endereço preenchido pelo reverse geocode; `gps` = só coords (preencher manualmente). */
  origem: "reverse" | "gps"
}

export interface UseGeolocationReturn {
  capturando: boolean
  erro: string | null
  capturar: () => Promise<ResultadoCaptura | null>
}

/**
 * Captura da localização (getCurrentPosition + reverse geocode Nominatim),
 * com estados `capturando`/`erro` e cooldown de 2s entre capturas.
 * Comportamento (decisões PLAN-055): permissão negada → `erro` e nada gravado;
 * reverse geocode falha → coords mantidas (origem `gps`, usuário preenche o texto).
 */
export function useGeolocation(): UseGeolocationReturn {
  const [capturando, setCapturando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const cooldownRef = useRef(false)

  const capturar = useCallback(async () => {
    if (cooldownRef.current) return null
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setErro("geo.indisponivel")
      return null
    }

    cooldownRef.current = true
    setCapturando(true)
    setErro(null)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      })
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      const localizacao: Localizacao = { lat, lng }
      try {
        const endereco = await reverseGeocode(lat, lng)
        return { localizacao, endereco, origem: "reverse" as const }
      } catch {
        return { localizacao, endereco: {}, origem: "gps" as const }
      }
    } catch {
      setErro("geo.erroPermissao")
      return null
    } finally {
      setCapturando(false)
      setTimeout(() => {
        cooldownRef.current = false
      }, 2000)
    }
  }, [])

  return { capturando, erro, capturar }
}
