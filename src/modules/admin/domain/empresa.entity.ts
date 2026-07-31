export interface Empresa {
  id: string
  nome: string
  createdAt: string
}

export interface EmpresaComStats extends Empresa {
  totalOperadores: number
  totalClientes: number
  contratosAtivos: number
}