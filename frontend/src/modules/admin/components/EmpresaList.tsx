import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { Button } from "../../../shared/components/Button.js"
import type { EmpresaComStats } from "../services/empresa.service.js"

interface EmpresaListProps {
  empresas: EmpresaComStats[]
}

export function EmpresaList({ empresas }: EmpresaListProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="space-y-3">
      {empresas.map((empresa) => (
        <Card.Root key={empresa.id} variant="list-item">
          <Card.Header>
            <span className="font-medium text-text-primary">{empresa.nome}</span>
          </Card.Header>
          <Card.Body>
            <span className="text-sm text-text-secondary">{t("superAdmin.usuarios")}: {empresa.totalUsuarios}</span>
            <span className="text-sm text-text-secondary">{t("superAdmin.clientes")}: {empresa.totalClientes}</span>
            <span className="text-sm text-text-secondary">{t("superAdmin.contratosAtivos")}: {empresa.contratosAtivos}</span>
          </Card.Body>
          <Card.Actions
            actions={[{
              icon: ArrowRight,
              label: t("superAdmin.acessar"),
              onClick: () => navigate(`/admin/empresas/${empresa.id}`),
            }]}
          />
        </Card.Root>
      ))}
    </div>
  )
}