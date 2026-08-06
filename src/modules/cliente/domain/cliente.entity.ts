export interface Address {
  logradouro: string
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

export interface AddressPartial {
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
  comercio: string
  telefone: string
  telefoneComercio?: string
  endereco: Address
  enderecoComercio?: AddressPartial | null
  localizacao?: Location | null
  localizacaoComercio?: Location | null
  foto?: string
  totalContratos?: number
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}
