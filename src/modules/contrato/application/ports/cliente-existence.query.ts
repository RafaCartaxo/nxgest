export interface IClienteExistenceQuery {
  exists(userId: string, clienteId: string): Promise<boolean>
}
