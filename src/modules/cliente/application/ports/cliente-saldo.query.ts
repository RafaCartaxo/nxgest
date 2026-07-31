export interface IClienteSaldoQuery {
  sumByClienteId(userId: string, clienteId: string): Promise<number>
}
