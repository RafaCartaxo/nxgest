import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { FileText } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { createContrato } from "../services/contrato.service.js"
import { listClientes, getCliente } from "../../cliente/services/cliente.service.js"
import { getLocalDateString } from "../../../shared/utils/parseDateLocal.js"
import { ApiError } from "../../../api/client.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { ContratoForm, type ContratoSubmit } from "../components/ContratoForm.js"
import type { ClienteResumoSelect } from "../components/ClienteSelect.js"

export function ContratoNovo() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const feedback = useFeedback()
  const clienteIdParam = searchParams.get("clienteId") || ""

  const [clientes, setClientes] = useState<ClienteResumoSelect[]>([])
  const [clienteFixado, setClienteFixado] = useState<{ id: string; nome: string } | undefined>(
    clienteIdParam ? { id: clienteIdParam, nome: "" } : undefined
  )

  const fetchClientes = useCallback(async () => {
    try {
      const result = await listClientes({ limit: 100 })
      setClientes(result.data.map((c) => ({ id: c.id, nome: c.nome, telefone: c.telefone, bairro: c.endereco.bairro })))
    } catch {
      feedback.show({ status: "error", message: t("cliente.erroCarregar") })
    }
  }, [t, feedback])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  useEffect(() => {
    if (clienteIdParam) {
      getCliente(clienteIdParam)
        .then((c) => setClienteFixado({ id: c.id, nome: c.nome }))
        .catch(() => setClienteFixado({ id: clienteIdParam, nome: t("cliente.naoEncontrado") }))
    }
  }, [clienteIdParam, t])

  async function handleSubmit(data: ContratoSubmit) {
    if (!data.clienteId) return
    await feedback.run({
      loading: t("common.saving"),
      success: "Contrato cadastrado.",
      error: t("contrato.erroCriar"),
      action: async () => {
        try {
          const contrato = await createContrato({
            clienteId: data.clienteId,
            valorBase: data.valorBase,
            percentualJuros: data.percentualJuros,
            quantidadeParcelas: data.quantidadeParcelas,
            periodicidade: data.periodicidade,
            dataInicio: data.dataInicio,
          })
          navigate(`/contratos/${contrato.id}`, { replace: true })
        } catch (err) {
          if (err instanceof ApiError && err.message) {
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
        back={{ onClick: () => navigate(clienteFixado ? `/clientes/${clienteIdParam}` : "/contratos"), title: t("common.back") }}
      />

      <ContratoForm
        mode="novo"
        clientes={clientes}
        clienteFixado={clienteFixado}
        initial={{ dataInicio: getLocalDateString(new Date()) }}
        onSubmit={handleSubmit}
        onCancel={() => navigate(clienteFixado ? `/clientes/${clienteIdParam}` : "/contratos")}
      />
    </div>
  )
}
