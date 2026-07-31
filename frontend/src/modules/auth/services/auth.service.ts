import { apiRequest } from "../../../api/client.js"

export interface LoginResponse {
  token: string
  usuario: {
    id: string
    nome: string
    email: string
    role: "super_admin" | "admin" | "operator"
    empresaId?: string | null
    empresaNome?: string | null
  }
}

export interface MeResponse {
  id: string
  nome: string
  email: string
  role: "super_admin" | "admin" | "operator"
  empresaId?: string | null
  empresaNome?: string | null
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("POST", "/auth/login", { email, senha })
}

export async function getMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>("GET", "/auth/me")
}
