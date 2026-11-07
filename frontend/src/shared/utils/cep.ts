export interface ResultadoCep {
  cep: string
  logradouro?: string
  bairro?: string
  cidade?: string
  estado?: string
}

export class CepError extends Error {
  constructor(public readonly tipo: "invalido" | "nao_encontrado" | "indisponivel") {
    super(tipo)
  }
}

export async function consultarCep(cep: string): Promise<ResultadoCep> {
  const normalizado = cep.replace(/\D/g, "")
  if (!/^\d{8}$/.test(normalizado)) throw new CepError("invalido")

  let response: Response
  try {
    response = await fetch(`https://viacep.com.br/ws/${normalizado}/json/`, {
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    throw new CepError("indisponivel")
  }
  if (!response.ok) throw new CepError("indisponivel")

  let data: Record<string, unknown>
  try {
    data = (await response.json()) as Record<string, unknown>
  } catch {
    throw new CepError("indisponivel")
  }
  if (data.erro === true || data.erro === "true") throw new CepError("nao_encontrado")

  return {
    cep: normalizado,
    logradouro: typeof data.logradouro === "string" ? data.logradouro : undefined,
    bairro: typeof data.bairro === "string" ? data.bairro : undefined,
    cidade: typeof data.localidade === "string" ? data.localidade : undefined,
    estado: typeof data.uf === "string" ? data.uf : undefined,
  }
}
