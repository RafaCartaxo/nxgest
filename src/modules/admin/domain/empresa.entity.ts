export interface Empresa {
  id: string
  nome: string
  createdAt: string
}

export interface EmpresaComStats extends Empresa {
  totalUsuarios: number
  totalClientes: number
  contratosAtivos: number
}