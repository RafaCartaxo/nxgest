/** Endereço em texto livre (logradouro/numero/bairro/cidade/UF). Todos opcionais (dados reais podem vir incompletos). */
export interface EnderecoTexto {
  logradouro?: string
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
}

/** Coordenadas geográficas (GPS). */
export interface Localizacao {
  lat: number
  lng: number
}

/** Alvo de navegação — a forma que `buildMapsUrl` entende. */
export interface TargetNavegacao {
  lat: number | null
  lng: number | null
  logradouro: string
  numero: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
}

/** Um cliente como fonte de alvo de navegação (regra: comércio padrão → principal fallback). */
export interface AlvoCliente {
  endereco: EnderecoTexto
  localizacao?: Localizacao | null
  enderecoComercio?: EnderecoTexto | null
  localizacaoComercio?: Localizacao | null
}
