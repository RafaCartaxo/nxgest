import bcrypt from "bcryptjs"
import { signToken } from "../../../../../shared/utils/jwt.js"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import { CredenciaisInvalidasError } from "../../../domain/errors/auth.error.js"

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

    const senhaValida = await bcrypt.compare(input.senha, usuario.senhaHash)
    if (!senhaValida) {
      throw new CredenciaisInvalidasError()
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
      },
    }
  }
}
