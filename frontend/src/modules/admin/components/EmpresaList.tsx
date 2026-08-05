import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ArrowRight, SlidersHorizontal } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import type { EmpresaComStats } from "../services/empresa.service.js"

interface EmpresaListProps {
  empresas: EmpresaComStats[]
  onConfigurar: (empresa: EmpresaComStats) => void
}

function iniciais(nome: string): string {
  return nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

export function EmpresaList({ empresas, onConfigurar }: EmpresaListProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (empresas.length === 0) {
    return <p className="py-8 text-center text-text-secondary">{t("common.empty")}</p>
  }

  return (
    <div className="space-y-3">
      {empresas.map((empresa) => (
        <Card.Root key={empresa.id} variant="list-item">
          <Card.Header className="flex-wrap">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-light text-sm font-semibold text-primary-text">
              {iniciais(empresa.nome)}
            </span>
            <span className="min-w-0 flex-1 truncate text-base font-semibold">{empresa.nome}</span>
            <StatusBadge variant="info" size="sm" label={t("admin.empresaBadge")} />
            {empresa.modulos == null ? (
              <StatusBadge variant="success" size="sm" label={t("superAdmin.modulosTodos")} />
            ) : (
              <StatusBadge variant="neutral" size="sm" label={t("superAdmin.modulosCount", { n: empresa.modulos.length })} />
            )}
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
            actions={[
              {
                icon: SlidersHorizontal,
                label: t("superAdmin.configurar"),
                onClick: () => onConfigurar(empresa),
              },
              {
                icon: ArrowRight,
                label: t("superAdmin.acessar"),
                onClick: () => navigate(`/admin/empresas/${empresa.id}`),
              },
            ]}
          />
        </Card.Root>
      ))}
    </div>
  )
}
