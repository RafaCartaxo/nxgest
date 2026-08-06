import { useTranslation } from "react-i18next"
import { UserPlus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { createCliente } from "../services/cliente.service.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { ClienteForm } from "../components/ClienteForm.js"

export function ClienteNovo() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  async function handleSubmit(payload: Record<string, unknown>) {
    const cliente = await createCliente(payload)
    navigate(`/clientes/${cliente.id}`, { replace: true })
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={UserPlus}
        title={t("cliente.novo")}
        back={{ onClick: () => navigate("/clientes"), title: t("common.back") }}
      />
      <ClienteForm onSubmit={handleSubmit} onCancel={() => navigate("/clientes")} />
    </div>
  )
}
