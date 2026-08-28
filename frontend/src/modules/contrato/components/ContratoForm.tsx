import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card } from "../../../shared/components/Card/Card.js"
import { Button } from "../../../shared/components/Button.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { ClienteSelect, type ClienteResumoSelect } from "./ClienteSelect.js"
import { getContratoSchema, type ContratoFormData } from "../schemas/contrato.schema.js"
import { calcularDataFinal } from "../utils/calcularDataFinal.js"
import type { Periodicidade } from "../services/contrato.service.js"
import { parseDateLocal } from "../../../shared/utils/parseDateLocal.js"
import { formatCurrency, maskMonetario, unmaskMonetario } from "../../../shared/utils/masks.js"

export interface ContratoSubmit {
  clienteId?: string
  valorBase: number
  percentualJuros: number
  quantidadeParcelas: number
  periodicidade: Periodicidade
  dataInicio: string
}

interface ContratoFormProps {
  mode: "novo" | "editar"
  /** Lista p/ o seletor buscável (novo). */
  clientes?: ClienteResumoSelect[]
  /** Cliente fixado (edit ou novo via ?clienteId=) — exibido em Card read-only. */
  clienteFixado?: { id: string; nome: string }
  initial?: Partial<ContratoFormData>
  onSubmit: (data: ContratoSubmit) => Promise<void>
  onCancel: () => void
}

export function ContratoForm({ mode, clientes = [], clienteFixado, initial, onSubmit, onCancel }: ContratoFormProps) {
  const { t, i18n } = useTranslation()
  const [clienteId, setClienteId] = useState<string | null>(clienteFixado?.id ?? null)
  const [clienteErro, setClienteErro] = useState<string | null>(null)

  // Periodicidade inicial (criação: diária pré-selecionada; edição: a do contrato).
  const periodicidadeInicial = initial?.periodicidade ?? "diaria"

  // Default de parcelas por periodicidade (diária=20, alternada=10, semanal=3) — PLAN-076/085.
  const defaultParcelasPorPeriodicidade: Record<Periodicidade, string> = {
    diaria: "20",
    alternada: "10",
    semanal: "3",
  }

  const form = useForm<ContratoFormData>({
    shouldFocusError: true,
    resolver: zodResolver(getContratoSchema(t)),
    defaultValues: {
      valorBase: initial?.valorBase ?? "",
      percentualJuros: initial?.percentualJuros ?? "20",
      // Default de parcelas deriva da periodicidade inicial (diária=20, alternada=10, semanal=3);
      // na edição mantém o valor salvo do contrato. O seletor também aplica o default ao clicar.
      quantidadeParcelas: initial?.quantidadeParcelas ?? defaultParcelasPorPeriodicidade[periodicidadeInicial],
      periodicidade: periodicidadeInicial,
      dataInicio: initial?.dataInicio ?? "",
    },
  })

  const errors = form.formState.errors
  const valorBase = form.watch("valorBase")
  const percentualJuros = form.watch("percentualJuros")
  const quantidadeParcelas = form.watch("quantidadeParcelas")
  const periodicidade = form.watch("periodicidade")
  const dataInicio = form.watch("dataInicio")

  const valorBaseNum = unmaskMonetario(valorBase)
  const jurosNum = parseFloat(percentualJuros.replace(",", ".")) || 0
  const valorFinal = valorBaseNum * (1 + jurosNum / 100)
  const qtd = parseInt(quantidadeParcelas)
  const rotuloPeriodicidade: Record<Periodicidade, string> = {
    diaria: t("contrato.porDia"),
    alternada: t("contrato.porAlternada"),
    semanal: t("contrato.porSemana"),
  }

  async function handleSubmit(data: ContratoFormData) {
    if (mode === "novo" && !clienteId) {
      setClienteErro(t("contrato.validacao.selecioneCliente"))
      return
    }
    await onSubmit({
      clienteId: clienteId ?? undefined,
      valorBase: unmaskMonetario(data.valorBase),
      percentualJuros: parseFloat(data.percentualJuros.replace(",", ".")) || 0,
      quantidadeParcelas: parseInt(data.quantidadeParcelas),
      periodicidade: data.periodicidade,
      dataInicio: data.dataInicio,
    })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-4">
      <Card.Root variant="detail">
        <Card.Header>
          <Card.Title className="text-base font-semibold">{t("contrato.clienteLabel")}</Card.Title>
        </Card.Header>
        <Card.Body className="pt-2">
          {clienteFixado ? (
            <div className="rounded-xl border border-border-strong bg-surface px-3.5 py-3 text-sm text-text-primary">
              {clienteFixado.nome}
            </div>
          ) : (
            <ClienteSelect
              value={clienteId}
              onChange={(id) => { setClienteId(id); setClienteErro(null) }}
              clientes={clientes}
              error={clienteErro ?? undefined}
            />
          )}
        </Card.Body>
      </Card.Root>

      <Card.Root variant="detail">
        <Card.Header>
          <Card.Title className="text-base font-semibold">{t("contrato.condicoes")}</Card.Title>
        </Card.Header>
        <Card.Body className="space-y-4 pt-2">
          <div className="space-y-2">
            <span className="text-sm font-medium text-text-primary">{t("contrato.periodicidade")}</span>
            <div className="grid grid-cols-3 gap-2">
              {(["diaria", "alternada", "semanal"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    form.setValue("periodicidade", p)
                    // Default de parcelas do tipo (diária=20, alternada=10, semanal=3) — pode editar depois.
                    form.setValue("quantidadeParcelas", defaultParcelasPorPeriodicidade[p])
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    periodicidade === p
                      ? "border-primary bg-primary-light text-primary-text"
                      : "border-border-strong bg-surface text-text-secondary hover:bg-surface-hover"
                  }`}
                >
                  {t(`contrato.periodicidadeOpcoes.${p}`)}
                </button>
              ))}
            </div>
          </div>

          <Field
            label={t("contrato.valorEmprestado")}
            required
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={maskMonetario(valorBase)}
            onChange={(e) => {
              form.setValue("valorBase", e.target.value.replace(/\D/g, ""))
              form.clearErrors("valorBase")
            }}
            error={errors.valorBase?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Field
              label={t("contrato.juros")}
              required
              type="text"
              inputMode="decimal"
              placeholder="20"
              value={percentualJuros}
              onChange={(e) => {
                form.setValue("percentualJuros", e.target.value.replace(/[^0-9.,]/g, ""))
                form.clearErrors("percentualJuros")
              }}
              error={errors.percentualJuros?.message}
            />

            <Field
              label={t("contrato.quantidadeParcelas")}
              required
              type="text"
              inputMode="numeric"
              placeholder="12"
              value={quantidadeParcelas}
              onChange={(e) => {
                form.setValue("quantidadeParcelas", e.target.value.replace(/\D/g, ""))
                form.clearErrors("quantidadeParcelas")
              }}
              error={errors.quantidadeParcelas?.message}
            />
          </div>

          <Field
            label={t("contrato.dataInicio")}
            required
            type="date"
            error={errors.dataInicio?.message}
            {...form.register("dataInicio")}
          />
        </Card.Body>
      </Card.Root>

      <Card.Root variant="detail">
        <Card.Header>
          <Card.Title className="text-base font-semibold">{t("contrato.resumo")}</Card.Title>
        </Card.Header>
        <Card.Body className="pt-2">
          <div className="rounded-xl bg-surface-secondary px-4 py-3 text-center">
            <p className="text-sm text-text-secondary">{t("contrato.totalAReceber")}</p>
            <p className="text-2xl font-bold text-primary">R$ {formatCurrency(valorFinal)}</p>
            {qtd > 0 && (
              <p className="text-sm text-text-secondary">
                {qtd}x de R$ {formatCurrency(valorFinal / qtd)}{" "}
                {rotuloPeriodicidade[periodicidade]}
              </p>
            )}
            {dataInicio && qtd > 0 && (
              <p className="text-sm text-text-secondary">
                {t("contrato.termino")}:{" "}
                {parseDateLocal(calcularDataFinal(dataInicio, qtd, periodicidade)).toLocaleDateString(i18n.language)}
              </p>
            )}
          </div>
        </Card.Body>
      </Card.Root>

      <div className="flex gap-4 pt-1">
        <Button type="submit" className="flex-1">
          <Check className="size-4" /> {t("common.save")}
        </Button>
        <Button variant="ghost" type="button" onClick={onCancel} className="flex-1">
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  )
}
