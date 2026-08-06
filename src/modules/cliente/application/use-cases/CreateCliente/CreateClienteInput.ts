import { z } from "zod"
import { isValidCpf } from "../../../../../shared/validators/cpf.js"
import { validarFoto } from "../../../../../shared/utils/foto.js"

export const createClienteSchema = z.object({
  nome: z.string().min(3).max(100),
  cpf: z
    .string()
    .length(11, "CPF deve conter 11 dígitos")
    .optional()
    .refine((val) => !val || isValidCpf(val), {
      message: "CPF inválido.",
    }),
  comercio: z.string().min(1, "Campo obrigatório"),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone deve conter 10 ou 11 dígitos"),
  telefoneComercio: z.string().regex(/^\d{10,11}$/, "Telefone deve conter 10 ou 11 dígitos").optional(),
  endereco: z.object({
    logradouro: z.string().min(3).max(150),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().min(2).max(100).optional(),
    estado: z.string().length(2).optional(),
  }),
  enderecoComercio: z.object({
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
  }).optional(),
  // foto: data URL normalizada (processarImagem). Mesma regra do update (P8/PLAN-058).
  foto: z
    .string()
    .max(2_000_000, "Foto muito grande.")
    .refine((v) => validarFoto(v).ok, "Foto inválida (formato/tamanho).")
    .optional(),
  localizacao: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional()
    .nullable(),
  localizacaoComercio: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional()
    .nullable(),
})

export type CreateClienteInput = z.infer<typeof createClienteSchema>
