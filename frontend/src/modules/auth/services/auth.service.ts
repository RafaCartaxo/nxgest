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
  status?: "convidado" | "ativo" | "suspenso"
  /** PLAN-075: dados de contato, troca de e-mail e e-mail verificado (derivado). */
  telefone?: string | null
  emailPendente?: string | null
  emailVerificado?: boolean
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

/** PLAN-075 F3: atualiza nome/telefone do próprio perfil (PATCH /me). */
export async function atualizarPerfil(data: { nome?: string; telefone?: string | null }): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("PATCH", "/auth/me", data)
}

/** PLAN-075 F4: inicia troca de e-mail (novo e-mail + senha atual) → email_pendente. */
export async function trocarEmail(novoEmail: string, senhaAtual: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("POST", "/auth/me/email", { novoEmail, senhaAtual })
}

/** PLAN-075 F4: confirma a troca pelo link (token). */
export async function verificarEmail(token: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("POST", "/auth/me/email/verificar", { token })
}

/** PLAN-075 P-03: cancela troca de e-mail pendente (senha atual obrigatória). */
export async function cancelarTrocaEmail(senhaAtual: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("DELETE", "/auth/me/email", { senhaAtual })
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
