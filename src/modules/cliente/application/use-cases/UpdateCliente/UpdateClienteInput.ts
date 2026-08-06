import { z } from "zod"
import { isValidCpf } from "../../../../../shared/validators/cpf.js"

export const updateClienteSchema = z.object({
  nome: z.string().min(3).max(100).optional(),
  cpf: z
    .string()
    .length(11, "CPF deve conter 11 dígitos")
    .optional()
    .refine((val) => !val || isValidCpf(val), {
      message: "CPF inválido.",
    }),
  comercio: z.string().optional(),
  telefone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone deve conter 10 ou 11 dígitos")
    .optional(),
  telefoneComercio: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone deve conter 10 ou 11 dígitos")
    .optional(),
  endereco: z
    .object({
      logradouro: z.string().min(3).max(150).optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      cidade: z.string().min(2).max(100).optional(),
      estado: z.string().length(2).optional(),
    })
    .optional(),
  enderecoComercio: z.object({
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
  }).optional().nullable(),
  foto: z.string().optional(),
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

export type UpdateClienteInput = z.infer<typeof updateClienteSchema>
