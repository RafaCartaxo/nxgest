export interface Address {
  cep?: string | null
  logradouro?: string | null
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
}

export interface Location {
  lat: number
  lng: number
}

export type LocationOrigin = "gps" | "cep_aproximado"

export interface AddressPartial {
  cep?: string | null
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
}

export interface Cliente {
  id: string
  nome: string
  cpf?: string
  documento?: string | null
  comercio: string
  telefone: string
  telefoneComercio?: string
  endereco: Address
  enderecoComercio?: AddressPartial | null
  localizacao?: Location | null
  localizacaoComercio?: Location | null
  localizacaoOrigem?: LocationOrigin | null
  localizacaoComercioOrigem?: LocationOrigin | null
  foto?: string | null
  totalContratos?: number
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}
