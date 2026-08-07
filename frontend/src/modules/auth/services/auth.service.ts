import { apiRequest } from "../../../api/client.js"

interface UsuarioComum {
  id: string
  nome: string
  email: string
  role: "super_admin" | "admin" | "socio" | "operator"
  empresaId?: string | null
  empresaNome?: string | null
  modulos?: string[] | null
  capacidades?: string[] | null
  chefeId?: string | null
  foto?: string | null
  /** PLAN-065: "convidado" = conta sem senha definida (aguardando ativação). */
  status?: "convidado" | "ativo"
}

export interface LoginResponse {
  token: string
  usuario: UsuarioComum
}

export interface MeResponse extends UsuarioComum {}

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

/** PLAN-065: define a senha da conta convidada (link /ativar?token=). */
export async function ativarConta(token: string, senha: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("POST", "/auth/ativar", { token, senha })
}

/** PLAN-065: pedido de recuperação de senha — resposta SEMPRE genérica 200. */
export async function esquecerSenha(email: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("POST", "/auth/forgot", { email })
}

/** PLAN-065: redefine a senha via token de reset (link /resetar-senha?token=). */
export async function redefinirSenha(token: string, senha: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("POST", "/auth/reset", { token, senha })
}
