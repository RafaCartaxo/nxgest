import type { Empresa } from "../../domain/empresa.entity.js"

export interface IEmpresaRepository {
  findAll(): Promise<Empresa[]>
  create(input: { nome: string; adminNome: string; adminEmail: string; adminSenhaHash: string }): Promise<{ empresa: Empresa; admin: { id: string; nome: string; email: string } }>
  findById(id: string): Promise<Empresa | null>
}