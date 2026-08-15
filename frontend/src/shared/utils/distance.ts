import { useEffect, useRef, useState } from "react"

export function calcularDistancia(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const km = R * c
  return Math.round(km * 10) / 10
}

export interface SortableItem {
  situacao: "atrasado" | "venceHoje"
  clienteLat: number | null
  clienteLng: number | null
}

export function sortByDistance<T extends SortableItem>(
  items: T[],
  operadorLat: number | null,
  operadorLng: number | null,
): T[] {
  return [...items].sort((a, b) => {
    const situOrder = a.situacao === "atrasado" && b.situacao !== "atrasado" ? -1
      : b.situacao === "atrasado" && a.situacao !== "atrasado" ? 1
      : 0

    if (situOrder !== 0) return situOrder

    const da = (operadorLat && operadorLng && a.clienteLat && a.clienteLng)
      ? calcularDistancia(operadorLat, operadorLng, a.clienteLat, a.clienteLng)
      : Infinity
    const db = (operadorLat && operadorLng && b.clienteLat && b.clienteLng)
      ? calcularDistancia(operadorLat, operadorLng, b.clienteLat, b.clienteLng)
      : Infinity

    return da - db
  })
}

export function sortByDistanceOnly<T extends SortableItem>(
  items: T[],
  operadorLat: number | null,
  operadorLng: number | null,
): T[] {
  return [...items].sort((a, b) => {
    const da = (operadorLat && operadorLng && a.clienteLat && a.clienteLng)
      ? calcularDistancia(operadorLat, operadorLng, a.clienteLat, a.clienteLng)
      : Infinity
    const db = (operadorLat && operadorLng && b.clienteLat && b.clienteLng)
      ? calcularDistancia(operadorLat, operadorLng, b.clienteLat, b.clienteLng)
      : Infinity

    return da - db
  })
}

export function useWatchPosition() {
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [gpsAtivo, setGpsAtivo] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return

    // PLAN-077 (performance): throttling por distância mínima (30m). O watchPosition
    // com enableHighAccuracy dispara continuamente em movimento; sem filtro, cada tick
    // atualizava estado → re-render + re-sort de todas as cobranças a cada tick.
    const MIN_MOVE_KM = 0.03

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const last = lastPosRef.current
        if (last) {
          const moved = calcularDistancia(last.lat, last.lng, next.lat, next.lng)
          if (moved < MIN_MOVE_KM) return
        }
        lastPosRef.current = next
        setLat(next.lat)
        setLng(next.lng)
        setGpsAtivo(true)
      },
      () => {
        setGpsAtivo(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { lat, lng, gpsAtivo }
}
