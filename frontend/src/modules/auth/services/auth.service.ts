import { apiRequest } from "../../../api/client.js"

export interface LoginResponse {
  token: string
  usuario: {
    id: string
    nome: string
    email: string
    role: "super_admin" | "admin" | "socio" | "operator"
    empresaId?: string | null
    empresaNome?: string | null
    modulos?: string[] | null
    chefeId?: string | null
    foto?: string | null
  }
}

export interface MeResponse {
  id: string
  nome: string
  email: string
  role: "super_admin" | "admin" | "socio" | "operator"
  empresaId?: string | null
  empresaNome?: string | null
  modulos?: string[] | null
  chefeId?: string | null
  foto?: string | null
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("POST", "/auth/login", { email, senha })
}

export async function getMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>("GET", "/auth/me")
}

export async function alterarSenha(senhaAtual: string, novaSenha: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("PATCH", "/auth/senha", { senhaAtual, novaSenha })
}

export async function alterarFoto(foto: string | null): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("PATCH", "/auth/foto", { foto })
}
