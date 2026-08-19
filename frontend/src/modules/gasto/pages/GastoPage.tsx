import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Receipt } from "lucide-react"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { GastoForm } from "../components/GastoForm.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"

export function GastoPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const feedback = useFeedback()

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={Receipt}
        title={t("gasto.title")}
        subtitle={t("gasto.subtitle")}
        back={{ onClick: () => navigate(-1), title: t("common.back") }}
      />

      <p className="mb-4 text-sm text-text-secondary">
        {t("gasto.totalHoje")}
      </p>

      <SectionHeader title={t("gasto.novo")} />
      <GastoForm onSuccess={() => navigate(-1)} />
    </div>
  )
}
