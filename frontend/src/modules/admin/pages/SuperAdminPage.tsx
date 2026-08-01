import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { EmpresaList } from "../components/EmpresaList.js"
import { EmpresaForm } from "../components/EmpresaForm.js"
import { listEmpresas, createEmpresa, type EmpresaComStats } from "../services/empresa.service.js"
import { ApiError } from "../../../api/client.js"

export function SuperAdminPage() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const [empresas, setEmpresas] = useState<EmpresaComStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listEmpresas()
      setEmpresas(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("superAdmin.erroCarregar"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCreate(data: { nome: string; adminNome: string; adminEmail: string; adminSenha: string }) {
    await feedback.run({
      action: async () => { await createEmpresa(data) },
      loading: t("common.saving"),
      success: t("superAdmin.criarSucesso"),
      error: t("superAdmin.erroCriar"),
    })
    setFormOpen(false)
    fetchData()
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <SectionHeader title={t("superAdmin.title")} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard title={t("superAdmin.totalEmpresas")} value={empresas.length.toString()} variant="blue" />
        <KpiCard title={t("superAdmin.totalUsuarios")} value={empresas.reduce((acc, e) => acc + e.totalUsuarios, 0).toString()} variant="green" />
        <KpiCard title={t("superAdmin.totalClientes")} value={empresas.reduce((acc, e) => acc + e.totalClientes, 0).toString()} variant="yellow" />
      </div>

      <SectionHeader
        title={t("superAdmin.empresas")}
        action={!formOpen ? { label: t("superAdmin.novaEmpresa"), onClick: () => setFormOpen(true) } : undefined}
      />

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/30" onClick={() => setFormOpen(false)}>
          <div className="bg-surface rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <EmpresaForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
          </div>
        </div>
      )}

      <EstadoTela
        loading={loading}
        error={error}
        onRetry={fetchData}
        empty={!loading && empresas.length === 0}
        emptyMessage={t("superAdmin.emptyMessage")}
      >
        <EmpresaList empresas={empresas} />
      </EstadoTela>
    </div>
  )
}