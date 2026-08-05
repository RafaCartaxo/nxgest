import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, FileText } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createContrato } from "../services/contrato.service.js"
import { listClientes, getCliente } from "../../cliente/services/cliente.service.js"
import { calcularDataFinal } from "../utils/calcularDataFinal.js"
import { parseDateLocal, getLocalDateString } from "../../../shared/utils/parseDateLocal.js"
import { formatCurrency, maskMonetario, unmaskMonetario } from "../../../shared/utils/masks.js"
import type { Cliente } from "../../cliente/services/cliente.service.js"
import { ApiError } from "../../../api/client.js"
import { Button } from "../../../shared/components/Button.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { getContratoSchema, type ContratoFormData } from "../schemas/contrato.schema.js"

export function ContratoNovo() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const feedback = useFeedback()
  const clienteIdParam = searchParams.get("clienteId") || ""

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState(clienteIdParam)
  const [clienteNome, setClienteNome] = useState("")
  const [clienteBloqueado, setClienteBloqueado] = useState(!!clienteIdParam)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [clienteErro, setClienteErro] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ContratoFormData>({
    shouldFocusError: true,
    resolver: zodResolver(getContratoSchema(t)),
    defaultValues: {
      valorBase: "",
      percentualJuros: "20",
      quantidadeParcelas: "20",
      dataInicio: getLocalDateString(new Date()),
    },
  })

  const errors = form.formState.errors
  const valorBase = form.watch("valorBase")
  const percentualJuros = form.watch("percentualJuros")
  const quantidadeParcelas = form.watch("quantidadeParcelas")
  const dataInicio = form.watch("dataInicio")

  const valorBaseNum = unmaskMonetario(valorBase)
  const jurosNum = parseFloat(percentualJuros.replace(",", ".")) || 0
  const valorFinal = valorBaseNum * (1 + jurosNum / 100)

  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase()
    return (
      c.nome.toLowerCase().includes(term) ||
      (c.comercio && c.comercio.toLowerCase().includes(term))
    )
  })

  const fetchClientes = useCallback(async () => {
    try {
      const result = await listClientes({ limit: 100 })
      setClientes(result.data)
    } catch {
      feedback.show({ status: "error", message: t("cliente.erroCarregar") })
    }
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
        setSearchTerm("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    if (filterOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [filterOpen])

  useEffect(() => {
    if (clienteIdParam) {
      getCliente(clienteIdParam)
        .then((c) => setClienteNome(c.nome))
        .catch(() => setClienteNome("Cliente"))
      setClienteBloqueado(true)
    }
  }, [clienteIdParam])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  async function handleSubmit(data: ContratoFormData) {
    if (!clienteId) {
      setClienteErro(t("contrato.validacao.selecioneCliente"))
      return
    }

    await feedback.run({
      loading: t("common.saving"),
      success: "Contrato cadastrado.",
      error: t("contrato.erroCriar"),
      action: async () => {
        try {
          const vb = unmaskMonetario(data.valorBase)
          const jr = parseFloat(data.percentualJuros.replace(",", ".")) || 0
          const contrato = await createContrato({
            clienteId,
            valorBase: vb,
            percentualJuros: jr,
            quantidadeParcelas: parseInt(data.quantidadeParcelas),
            dataInicio: data.dataInicio,
          })
          navigate(`/contratos/${contrato.id}`, { replace: true })
        } catch (err) {
          if (err instanceof ApiError && err.details) {
            const fieldMap: Record<string, string> = {
              valorBase: "valorBase",
              percentualJuros: "percentualJuros",
              quantidadeParcelas: "quantidadeParcelas",
              dataInicio: "dataInicio",
            }
            for (const d of err.details) {
              const formField = fieldMap[d.field]
              if (formField) {
                form.setError(formField as keyof ContratoFormData, { message: d.message })
              }
            }
            const firstField = fieldMap[err.details[0]?.field]
            if (firstField) form.setFocus(firstField as keyof ContratoFormData)
            throw err
          }
          if (err instanceof ApiError) {
            throw new Error(err.message)
          }
          throw err
        }
      },
    })
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={FileText}
        title={t("contrato.novo")}
        back={{ onClick: () => navigate(clienteBloqueado ? `/clientes/${clienteIdParam}` : "/contratos"), title: t("common.back") }}
      />

      <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-4">
        <SectionHeader title={t("contrato.clienteLabel")} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            {t("contrato.clienteLabel")} <span className="text-danger">*</span>
          </label>
          {clienteBloqueado ? (
            <p className="rounded-xl border bg-surface-secondary px-3.5 py-2 text-sm text-text-primary">
              {clienteNome || t("common.loading")}
            </p>
          ) : (
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex min-h-12 w-full items-center justify-between rounded-xl border border-border-strong bg-surface px-3.5 text-base"
              >
                <span className={clienteId ? "" : "text-text-muted"}>
                  {clienteId
                    ? clientes.find((c) => c.id === clienteId)?.nome || "..."
                    : t("contrato.selecioneCliente")}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${filterOpen ? "rotate-180" : ""}`}
                />
              </button>
              {filterOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-surface shadow-lg">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t("contrato.buscarCliente")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="min-h-12 w-full border-b border-border-light px-3.5 text-base outline-none"
                  />
                  <div className="max-h-48 overflow-auto">
                    {filteredClientes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setClienteId(c.id); setClienteErro(null); setFilterOpen(false); setSearchTerm("") }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-secondary-light ${
                          c.id === clienteId ? "bg-primary-light font-medium" : ""
                        }`}
                      >
                        {c.nome}
                        {c.comercio ? ` — ${c.comercio}` : ""}
                      </button>
                    ))}
                    {filteredClientes.length === 0 && (
                      <p className="px-3 py-4 text-center text-sm text-text-muted">
                        {t("contrato.nenhumClienteEncontrado")}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {clienteErro && (
                <p className="mt-1 text-xs text-danger">{clienteErro}</p>
              )}
            </div>
          )}
        </div>

        <SectionHeader title={t("contrato.condicoes")} />

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
            value={form.watch("percentualJuros")}
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
            value={form.watch("quantidadeParcelas")}
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

        {valorBaseNum > 0 && (
          <div className="rounded-xl bg-surface-secondary p-4 text-center">
            <p className="text-sm text-text-secondary">{t("contrato.totalAReceber")}</p>
            <p className="text-2xl font-bold text-primary">
              R$ {formatCurrency(valorFinal)}
            </p>
            {parseInt(quantidadeParcelas) > 0 && (
              <p className="text-sm text-text-secondary">
                {quantidadeParcelas}x de R${" "}
                {formatCurrency(valorFinal / parseInt(quantidadeParcelas))}
              </p>
            )}
            {dataInicio && parseInt(quantidadeParcelas) > 0 && (
              <p className="text-sm text-text-secondary">
                {t("contrato.termino")}:{" "}
                {parseDateLocal(
                  calcularDataFinal(dataInicio, parseInt(quantidadeParcelas))
                ).toLocaleDateString(i18n.language)}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" className="flex-1">
            {t("common.save")}
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate(clienteBloqueado ? `/clientes/${clienteIdParam}` : "/contratos")}
            className="flex-1"
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  )
}
