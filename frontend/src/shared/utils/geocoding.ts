interface GeocodingResult {
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  /** Código UF (2 letras, ex.: "SP") — preferido o ISO3166-2-lvl4 do Nominatim. */
  estado?: string
}

/** Fallback: nome do estado → UF (caso o Nominatim não traga o código ISO). */
const UF_POR_NOME: Record<string, string> = {
  Acre: "AC", Alagoas: "AL", "Amapá": "AP", Amazonas: "AM", Bahia: "BA",
  Ceará: "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", Goiás: "GO",
  Maranhão: "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
  Pará: "PA", Paraíba: "PB", Paraná: "PR", Pernambuco: "PE", Piauí: "PI",
  "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS",
  Rondônia: "RO", Roraima: "RR", "Santa Catarina": "SC", "São Paulo": "SP",
  Sergipe: "SE", Tocantins: "TO",
}

function ufDoEndereco(addr: Record<string, unknown>): string {
  const iso = typeof addr["ISO3166-2-lvl4"] === "string" ? addr["ISO3166-2-lvl4"] : ""
  if (iso) return iso.replace(/^BR-/i, "").toUpperCase()
  const nome = typeof addr.state === "string" ? addr.state : ""
  return UF_POR_NOME[nome] ?? ""
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`
  const resp = await fetch(url, {
    headers: { "User-Agent": "GestaoCobrancas/1.0" },
  })
  if (!resp.ok) throw new Error("Erro ao consultar endereço")
  const data = await resp.json()
  const addr = (data.address ?? {}) as Record<string, unknown>
  return {
    logradouro: typeof addr.road === "string" ? addr.road : undefined,
    numero: typeof addr.house_number === "string" ? addr.house_number : undefined,
    bairro: typeof addr.suburb === "string" ? addr.suburb : typeof addr.neighbourhood === "string" ? addr.neighbourhood : undefined,
    cidade: typeof addr.city === "string" ? addr.city : typeof addr.town === "string" ? addr.town : typeof addr.village === "string" ? addr.village : undefined,
    estado: ufDoEndereco(addr) || undefined,
  }
}
