import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import type { EmpresaComStats } from "../services/empresa.service.js"

interface EmpresaListProps {
  empresas: EmpresaComStats[]
}

export function EmpresaList({ empresas }: EmpresaListProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (empresas.length === 0) {
    return <p className="text-center text-text-secondary py-8">{t("common.empty")}</p>
  }

  return (
    <div className="space-y-3">
      {empresas.map((empresa) => (
        <Card.Root key={empresa.id} variant="list-item">
          <Card.Header className="flex-wrap">
            <span className="min-w-0 flex-1 truncate text-base font-semibold">{empresa.nome}</span>
            <StatusBadge variant="info" size="sm" label={t("admin.empresaBadge")} />
          </Card.Header>
          <Card.Body>
            <p className="truncate text-sm text-text-secondary">
              {t("superAdmin.admin")}:{" "}
              <span className="font-medium text-text-primary">{empresa.adminNome}</span>
            </p>
            <Card.Indicators>
              <Card.Indicator label={t("superAdmin.totalUsuarios")} value={`${empresa.totalUsuarios}`} />
              <Card.Indicator label={t("superAdmin.totalClientes")} value={`${empresa.totalClientes}`} />
              <Card.Indicator label={t("admin.contratosAtivos")} value={`${empresa.contratosAtivos}`} />
            </Card.Indicators>
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
