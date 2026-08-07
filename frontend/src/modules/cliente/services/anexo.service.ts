import { apiRequest, ApiError } from "../../../api/client.js"

export type TipoAnexo = "comprovante-residencia" | "documento" | "outro"

export interface AnexoDto {
  id: string
  nome: string
  tipo: TipoAnexo
  mime: string
  tamanho: number
  createdAt: string
}

const BASE = (clienteId: string) => `/clientes/${clienteId}/anexos`

export async function listarAnexos(clienteId: string): Promise<AnexoDto[]> {
  return apiRequest<AnexoDto[]>("GET", BASE(clienteId))
}

/** Upload multipart (campo `arquivo` + opcional `tipo`). */
export async function enviarAnexo(clienteId: string, file: File, tipo?: TipoAnexo): Promise<AnexoDto> {
  const form = new FormData()
  form.append("arquivo", file)
  if (tipo) form.append("tipo", tipo)

  const token = localStorage.getItem("nxgestao_token")
  const response = await fetch(`/api${BASE(clienteId)}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.message ?? "Erro ao enviar anexo."
    throw new ApiError(response.status, data?.code ?? "UNKNOWN", message)
  }
  return data as AnexoDto
}

export async function excluirAnexo(clienteId: string, anexoId: string): Promise<void> {
  return apiRequest<void>("DELETE", `${BASE(clienteId)}/${anexoId}`)
}

/**
 * Baixa o arquivo (autenticado) como Blob para exibição in-app (P10a).
 * O Blob URL é criado e revogado pelo componente que exibe (ciclo de vida controlado).
 */
export async function baixarAnexoBlob(clienteId: string, anexoId: string): Promise<Blob> {
  const token = localStorage.getItem("nxgestao_token")
  const response = await fetch(`/api${BASE(clienteId)}/${anexoId}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) throw new ApiError(response.status, "ANEXO_ERRO", "Não foi possível abrir o anexo.")
  return response.blob()
}
