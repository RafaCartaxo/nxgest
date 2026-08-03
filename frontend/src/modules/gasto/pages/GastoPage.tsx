import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Receipt } from "lucide-react"
import { listGastos } from "../services/gasto.service.js"
import { ApiError } from "../../../api/client.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { GastoForm } from "../components/GastoForm.js"
import { getLocalDateString } from "../../../shared/utils/parseDateLocal.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"

export function GastoPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const feedback = useFeedback()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const hoje = getLocalDateString(new Date())
      await listGastos({ dataInicio: hoje, dataFim: hoje })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(t("gasto.erroCriar"))
      }
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetch()
  }, [fetch])

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={Receipt}
        title={t("gasto.title")}
        subtitle={t("gasto.subtitle")}
        back={{ onClick: () => navigate(-1), title: t("common.back") }}
      />

      {error && (
        <ErrorBanner message={error} onRetry={fetch} className="mb-4" />
      )}

      <p className="mb-4 text-sm text-text-secondary">
        {t("gasto.totalHoje")}
      </p>

      <SectionHeader title={t("gasto.novo")} />
      <GastoForm onSuccess={() => navigate(-1)} />
    </div>
  )
}
