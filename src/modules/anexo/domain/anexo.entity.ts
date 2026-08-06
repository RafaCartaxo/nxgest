export type TipoAnexo = "comprovante-residencia" | "documento" | "outro"

export const TIPOS_ANEXO: TipoAnexo[] = ["comprovante-residencia", "documento", "outro"]

export interface Anexo {
  id: string
  clienteId: string
  tipo: TipoAnexo
  nomeOriginal: string
  mime: string
  tamanho: number
  caminho: string
  criadoPor: string
  createdAt: string
}

/** Metadados expostos na API (sem caminho interno). */
export interface AnexoDto {
  id: string
  nome: string
  tipo: TipoAnexo
  mime: string
  tamanho: number
  createdAt: string
}
