import type { EmpresaComStats } from "../../domain/empresa.entity.js"

export interface IEmpresaRepository {
  findAll(): Promise<EmpresaComStats[]>
  create(input: { nome: string; adminNome: string; adminEmail: string; adminSenhaHash: string }): Promise<{ empresa: EmpresaComStats; admin: { id: string; nome: string; email: string } }>
  findById(id: string): Promise<EmpresaComStats | null>
  updateModulos(id: string, modulos: string[]): Promise<EmpresaComStats | null>
}