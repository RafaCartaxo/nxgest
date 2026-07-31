export interface IContratoCountQuery {
  countByClienteId(userId: string, clienteId: string): Promise<number>
}
