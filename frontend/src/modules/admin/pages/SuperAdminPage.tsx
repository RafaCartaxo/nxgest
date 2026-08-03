import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Building2 } from "lucide-react"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { EmpresaList } from "../components/EmpresaList.js"
import { EmpresaForm } from "../components/EmpresaForm.js"
import { ModulosModal } from "../components/ModulosModal.js"
import { listEmpresas, createEmpresa, updateEmpresaModulos, type EmpresaComStats } from "../services/empresa.service.js"
import { ApiError } from "../../../api/client.js"

export function SuperAdminPage() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const [empresas, setEmpresas] = useState<EmpresaComStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [modulosTarget, setModulosTarget] = useState<EmpresaComStats | null>(null)
  const [savingModulos, setSavingModulos] = useState(false)

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

  async function handleSaveModulos(modulos: string[]) {
    if (!modulosTarget) return
    setSavingModulos(true)
    try {
      await updateEmpresaModulos(modulosTarget.id, modulos)
      feedback.show({ status: "success", message: t("superAdmin.modulosSalvo") })
      setModulosTarget(null)
      fetchData()
    } catch (err) {
      feedback.show({ status: "error", message: err instanceof ApiError ? err.message : t("superAdmin.erroModulos") })
    } finally {
      setSavingModulos(false)
    }
  }

  const totalUsuarios = empresas.reduce((acc, e) => acc + e.totalUsuarios, 0)
  const totalClientes = empresas.reduce((acc, e) => acc + e.totalClientes, 0)

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <div className="rounded-lg bg-gradient-accent px-5 py-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 opacity-90" />
          <div>
            <h1 className="text-2xl font-bold">{t("superAdmin.title")}</h1>
            <p className="mt-0.5 text-sm text-white/80">{t("superAdmin.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard title={t("superAdmin.totalEmpresas")} value={empresas.length.toString()} variant="blue" />
        <KpiCard title={t("superAdmin.totalUsuarios")} value={totalUsuarios.toString()} variant="green" />
        <KpiCard title={t("superAdmin.totalClientes")} value={totalClientes.toString()} variant="yellow" />
      </div>

      <SectionHeader
        title={t("superAdmin.empresas")}
        action={!formOpen ? { label: t("superAdmin.novaEmpresa"), onClick: () => setFormOpen(true) } : undefined}
      />

      {formOpen && (
        <Modal open onClose={() => setFormOpen(false)} maxWidth="max-w-md">
          <EmpresaForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
        </Modal>
      )}

      <ModulosModal
        open={modulosTarget !== null}
        empresaNome={modulosTarget?.nome ?? ""}
        initial={modulosTarget?.modulos ?? null}
        saving={savingModulos}
        onSave={handleSaveModulos}
        onClose={() => setModulosTarget(null)}
      />

      <EstadoTela
        loading={loading}
        error={error}
        onRetry={fetchData}
        empty={!loading && empresas.length === 0}
        emptyMessage={t("superAdmin.emptyMessage")}
      >
        <EmpresaList empresas={empresas} onConfigurar={setModulosTarget} />
      </EstadoTela>
    </div>
  )
}
