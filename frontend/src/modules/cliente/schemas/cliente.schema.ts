import { z } from "zod"
import type { TFunction } from "i18next"
import { unmask } from "../../../shared/utils/masks.js"

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const

function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false

  const calc = (base: number[]): number => {
    const sum = base.reduce((acc, d, i) => acc + d * (base.length + 1 - i), 0)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  const nums = digits.split("").map(Number)
  if (calc(nums.slice(0, 9)) !== nums[9]) return false
  if (calc(nums.slice(0, 10)) !== nums[10]) return false
  return true
}

export function getClienteSchema(t: TFunction) {
  return z.object({
    nome: z
      .string({ required_error: t("cliente.validacao.required") })
      .min(1, t("cliente.validacao.required"))
      .min(3, t("cliente.validacao.nomeMinimo")),
    telefone: z
      .string({ required_error: t("cliente.validacao.required") })
      .min(1, t("cliente.validacao.required"))
      .refine(
        (val) => {
          const digits = val.replace(/\D/g, "")
          return digits.length >= 10 && digits.length <= 11
        },
        t("cliente.validacao.telefoneInvalido"),
      ),
    telefoneComercio: z
      .string()
      .optional()
      .refine(
        (val) => !val || (val.replace(/\D/g, "").length >= 10 && val.replace(/\D/g, "").length <= 11),
        t("cliente.validacao.telefoneInvalido"),
      ),
    cpf: z
      .string()
      .optional()
      .refine(
        (val) => !val || isValidCpf(val),
        t("cliente.validacao.cpfInvalido"),
      ),
    comercio: z
      .string({ required_error: t("cliente.validacao.required") })
      .min(1, t("cliente.validacao.required")),
    logradouro: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.length >= 3,
        t("cliente.validacao.enderecoInvalido"),
      ),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.length >= 2,
        t("cliente.validacao.cidadeMinimo"),
      ),
    estado: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.length === 2,
        t("cliente.validacao.ufInvalida"),
      ),
    comercioLogradouro: z.string().optional(),
    comercioNumero: z.string().optional(),
    comercioBairro: z.string().optional(),
    comercioCidade: z.string().optional(),
    comercioEstado: z.string().optional(),
    comercioLat: z.number().optional(),
    comercioLng: z.number().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    foto: z.string().optional(),
  })
}

export type ClienteFormData = z.infer<ReturnType<typeof getClienteSchema>>
