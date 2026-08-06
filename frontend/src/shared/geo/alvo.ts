import type { AlvoCliente, EnderecoTexto, Localizacao, TargetNavegacao } from "./types.js"
import { buildMapsUrl } from "./maps.js"

export { buildMapsUrl } from "./maps.js"

/**
 * Item de cobrança navegável (shape vindo do backend nas operações) — forma estrutural,
 * sem importar o serviço (mantém o módulo geo desacoplado).
 */
export interface ItemCobrancaNavegavel {
  clienteLat: number | null
  clienteLng: number | null
  clienteLogradouro: string
  clienteNumero: string | null
  clienteBairro: string | null
  clienteCidade: string | null
  clienteEstado: string | null
}

/** Adapta um item de cobrança (CobrancaItem) para o alvo de navegação canônico. */
export function alvoDeItemCobranca(item: ItemCobrancaNavegavel): TargetNavegacao {
  return {
    lat: item.clienteLat ?? null,
    lng: item.clienteLng ?? null,
    logradouro: item.clienteLogradouro ?? "",
    numero: item.clienteNumero ?? null,
    bairro: item.clienteBairro ?? null,
    cidade: item.clienteCidade ?? null,
    estado: item.clienteEstado ?? null,
  }
}

/**
 * Monta o alvo de navegação a partir de um endereço + localização.
 * Regra: coordenadas têm prioridade sobre o texto (quando presentes); nunca mistura
 * um endereço com as coordenadas de outro.
 */
export function montarAlvo(endereco: EnderecoTexto, localizacao?: Localizacao | null): TargetNavegacao {
  return {
    lat: localizacao?.lat ?? null,
    lng: localizacao?.lng ?? null,
    logradouro: endereco.logradouro ?? "",
    numero: endereco.numero ?? null,
    bairro: endereco.bairro ?? null,
    cidade: endereco.cidade ?? null,
    estado: endereco.estado ?? null,
  }
}

/**
 * Resolve o alvo de navegação de um cliente (decisão de produto):
 * comércio por padrão (onde o operador cobra) → fallback: endereço principal.
 */
export function resolveAlvoCliente(cliente: AlvoCliente): TargetNavegacao {
  if (cliente.enderecoComercio) {
    return montarAlvo(cliente.enderecoComercio, cliente.localizacaoComercio)
  }
  return montarAlvo(cliente.endereco, cliente.localizacao)
}

/** O alvo é navegável (gera URL do Google Maps)? Controla a exibição do botão "Navegar". */
export function alvoNavegavel(alvo: TargetNavegacao | null | undefined): boolean {
  if (!alvo) return false
  return buildMapsUrl(alvo) !== null
}
