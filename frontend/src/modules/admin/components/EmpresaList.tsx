import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { SlidersHorizontal, ArrowRight } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { Avatar } from "../../../shared/components/Avatar/Avatar.js"
import { Button } from "../../../shared/components/Button.js"
import { MODULES } from "../../../shared/modules/modules.js"
import { formatCpfCnpj } from "../../../shared/utils/masks.js"
import type { EmpresaComStats } from "../services/empresa.service.js"

interface EmpresaListProps {
  empresas: EmpresaComStats[]
  onConfigurar: (empresa: EmpresaComStats) => void
}

export function EmpresaList({ empresas, onConfigurar }: EmpresaListProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (empresas.length === 0) {
    return <p className="py-8 text-center text-text-secondary">{t("common.empty")}</p>
  }

  return (
    <div className="space-y-3">
      {empresas.map((empresa) => {
        const total = MODULES.length
        const ativos = empresa.modulos?.length ?? total
        const todos = ativos >= total
        const nomeExibido = empresa.nomeFantasia || empresa.nome
        const ativa = empresa.ativa !== false

        return (
          <Card.Root key={empresa.id} variant="list-item" tone={ativa ? "info" : "neutral"}>
            <div className="flex items-start gap-3">
              <Avatar nome={nomeExibido} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{nomeExibido}</p>
                {empresa.documento && <p className="truncate text-sm text-text-secondary">{formatCpfCnpj(empresa.documento)}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusBadge variant={ativa ? "success" : "neutral"} size="sm" label={ativa ? t("superAdmin.empresaAtiva") : t("superAdmin.empresaInativa")} />
                  <span className="text-xs text-text-muted">
                    {empresa.totalUsuarios} {empresa.totalUsuarios === 1 ? t("superAdmin.operadorUm") : t("superAdmin.operadorOutros")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {todos ? (
                <StatusBadge variant="info" size="sm" label={t("superAdmin.modulosTodos")} />
              ) : (
                empresa.modulos?.map((m) => {
                  const def = MODULES.find((mod) => mod.id === m)
                  return def ? (
                    <span key={m} className="rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-text-secondary">
                      {t(def.labelKey)}
                    </span>
                  ) : null
                })
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onConfigurar(empresa)}>
                <SlidersHorizontal className="size-4" aria-hidden /> {t("superAdmin.modulosButton", { ativos, total })}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/empresas/${empresa.id}`)}>
                <ArrowRight className="size-4" aria-hidden /> {t("superAdmin.acessar")}
              </Button>
            </div>
          </Card.Root>
        )
      })}
    </div>
  )
}
