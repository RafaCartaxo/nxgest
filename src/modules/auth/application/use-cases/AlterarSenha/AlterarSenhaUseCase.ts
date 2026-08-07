import bcrypt from "bcryptjs"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import { SenhaAtualIncorretaError, UsuarioNaoEncontradoError } from "../../../domain/errors/auth.error.js"

export class AlterarSenhaUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(input: { userId: string; senhaAtual: string; novaSenha: string }) {
    const usuario = await this.authRepository.findById(input.userId)

    if (!usuario) {
      throw new UsuarioNaoEncontradoError()
    }

    const senhaAtualValida = await bcrypt.compare(input.senhaAtual, usuario.senhaHash ?? "")
    if (!senhaAtualValida) {
      throw new SenhaAtualIncorretaError()
    }

    const novaSenhaHash = await bcrypt.hash(input.novaSenha, 10)
    await this.authRepository.updateSenha(usuario.id, novaSenhaHash)

    return { ok: true }
  }
}
