import bcrypt from "bcryptjs"
import { signToken } from "../../../../../shared/utils/jwt.js"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import { CredenciaisInvalidasError, ContaConvidadaError, ContaSuspensaError } from "../../../domain/errors/auth.error.js"

export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(input: { email: string; senha: string }) {
    const usuario = await this.authRepository.findByEmail(input.email)

    if (!usuario) {
      throw new CredenciaisInvalidasError()
    }

    if (usuario.deletedAt) {
      throw new CredenciaisInvalidasError()
    }

    // Conta convidada (senha não definida) → 403 ativação pendente (PLAN-065).
    if (!usuario.senhaHash) {
      throw new ContaConvidadaError()
    }

    const senhaValida = await bcrypt.compare(input.senha, usuario.senhaHash)
    if (!senhaValida) {
      throw new CredenciaisInvalidasError()
    }

    // N3 (PLAN-075): conta suspensa com credencial válida → 403 CONTA_SUSPENSA.
    // Checado DEPOIS da credencial (só quem conhece a senha fica sabendo — não vaza em público).
    if (usuario.suspensoEm) {
      throw new ContaSuspensaError()
    }

    const token = signToken({ userId: usuario.id, role: usuario.role, empresaId: usuario.empresaId })

    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        empresaId: usuario.empresaId,
        chefeId: usuario.chefeId,
        foto: usuario.foto,
        telefone: usuario.telefone,
        emailPendente: usuario.emailPendente,
        // Espelha /me (PLAN-075 N1.8): verificado = senha definida (garantida aqui) e sem pendência.
        emailVerificado: !usuario.emailPendente,
        status: "ativo" as const,
      },
    }
  }
}
