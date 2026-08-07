import type { EmpresaComStats } from "../../domain/empresa.entity.js"

export interface IEmpresaRepository {
  findAll(): Promise<EmpresaComStats[]>
  create(input: { nome: string; documento?: string | null; nomeFantasia?: string | null; ativa?: boolean; adminNome: string; adminEmail: string; adminSenhaHash: string | null }): Promise<{ empresa: EmpresaComStats; admin: { id: string; nome: string; email: string } }>
  findById(id: string): Promise<EmpresaComStats | null>
  updateModulos(id: string, modulos: string[]): Promise<EmpresaComStats | null>
  updateCapacidades(id: string, capacidades: string[] | null): Promise<EmpresaComStats | null>
  update(id: string, data: { nome?: string; documento?: string | null; nomeFantasia?: string | null; ativa?: boolean }): Promise<EmpresaComStats | null>
}