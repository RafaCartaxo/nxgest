import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { User } from "lucide-react"
import { useParams, useNavigate } from "react-router-dom"
import { getCliente, updateCliente, type Cliente } from "../services/cliente.service.js"
import { ApiError } from "../../../api/client.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { ClienteForm } from "../components/ClienteForm.js"

export function ClienteEdit() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const feedback = useFeedback()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!id) return
    getCliente(id)
      .then(setCliente)
      .catch((err) => {
        if (err instanceof ApiError) {
          feedback.show({ status: "error", message: err.message })
        } else {
          feedback.show({ status: "error", message: t("cliente.erroCarregar") })
        }
      })
      .finally(() => setCarregando(false))
  }, [id, t, feedback])

  async function handleSubmit(payload: Record<string, unknown>) {
    if (!id) return
    await updateCliente(id, payload)
    navigate(`/clientes/${id}`)
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={User}
        title={t("cliente.editar")}
        back={{ onClick: () => navigate(`/clientes/${id}`), title: t("common.back") }}
      />
      {carregando ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-surface-hover" />
          <div className="h-4 w-96 rounded bg-surface-hover" />
          <div className="h-4 w-80 rounded bg-surface-hover" />
        </div>
      ) : (
        <ClienteForm initial={cliente} onSubmit={handleSubmit} onCancel={() => navigate(`/clientes/${id}`)} />
      )}
    </div>
  )
}
