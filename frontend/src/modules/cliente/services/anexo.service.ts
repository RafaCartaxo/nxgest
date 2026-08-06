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
 * Abre o arquivo numa nova aba. O endpoint exige Bearer, então é preciso buscar
 * com o token e servir via Blob URL (window.open simples não envia o header).
 */
export async function abrirAnexo(clienteId: string, anexo: AnexoDto): Promise<string> {
  const token = localStorage.getItem("nxgestao_token")
  const response = await fetch(`/api${BASE(clienteId)}/${anexo.id}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) throw new ApiError(response.status, "ANEXO_ERRO", "Não foi possível abrir o anexo.")
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return url
}
