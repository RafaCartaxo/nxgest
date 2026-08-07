import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Building2 } from "lucide-react"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { EmpresaList } from "../components/EmpresaList.js"
import { EmpresaForm } from "../components/EmpresaForm.js"
import { ModulosModal } from "../components/ModulosModal.js"
import { CapacidadesModal } from "../components/CapacidadesModal.js"
import { ImpactConfirmModal } from "../components/ImpactConfirmModal.js"
import {
  listEmpresas,
  createEmpresa,
  updateEmpresa,
  updateEmpresaModulos,
  updateEmpresaModulosForcado,
  updateEmpresaCapacidades,
  getImpactoDesativacao,
  type EmpresaComStats,
  type ImpactoDesativacao,
} from "../services/empresa.service.js"
import { ApiError } from "../../../api/client.js"

export function SuperAdminPage() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const { user } = useAuth()
  const [empresas, setEmpresas] = useState<EmpresaComStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editarTarget, setEditarTarget] = useState<EmpresaComStats | null>(null)
  const [suspensaoPendente, setSuspensaoPendente] = useState<{ empresa: EmpresaComStats; data: { nome: string; documento?: string; nomeFantasia?: string; ativa: boolean } } | null>(null)
  const [modulosTarget, setModulosTarget] = useState<EmpresaComStats | null>(null)
  const [capacidadesTarget, setCapacidadesTarget] = useState<EmpresaComStats | null>(null)
  const [savingModulos, setSavingModulos] = useState(false)
  const [savingCapacidades, setSavingCapacidades] = useState(false)
  const [savingEditar, setSavingEditar] = useState(false)
  const [impactoState, setImpactoState] = useState<{ modulos: string[]; impacto: ImpactoDesativacao } | null>(null)

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

  async function handleCreate(data: { nome: string; documento?: string; nomeFantasia?: string; ativa: boolean; adminNome: string; adminEmail: string; adminSenha: string }) {
    await feedback.run({
      action: async () => { await createEmpresa(data) },
      loading: t("common.saving"),
      success: t("superAdmin.criarSucesso"),
      error: t("superAdmin.erroCriar"),
    })
    setFormOpen(false)
    fetchData()
  }

  async function aplicarEdicao(empresa: EmpresaComStats, data: { nome: string; documento?: string; nomeFantasia?: string; ativa: boolean }) {
    setSavingEditar(true)
    try {
      await updateEmpresa(empresa.id, data)
      feedback.show({ status: "success", message: t("superAdmin.editarSucesso") })
      setEditarTarget(null)
      setSuspensaoPendente(null)
      fetchData()
    } catch (err) {
      feedback.show({ status: "error", message: err instanceof ApiError ? err.message : t("superAdmin.erroEditar") })
    } finally {
      setSavingEditar(false)
    }
  }

  function handleUpdateEmpresa(data: { nome: string; documento?: string; nomeFantasia?: string; ativa: boolean; adminNome: string; adminEmail: string; adminSenha: string }) {
    if (!editarTarget) return
    const ativaAntes = editarTarget.ativa !== false
    if (ativaAntes && !data.ativa) {
      // Suspensão: confirma antes (BR-106) — bloqueia o acesso de toda a empresa.
      setSuspensaoPendente({ empresa: editarTarget, data })
      return
    }
    void aplicarEdicao(editarTarget, data)
  }

  function handleConfirmarSuspensao() {
    if (!suspensaoPendente) return
    void aplicarEdicao(suspensaoPendente.empresa, suspensaoPendente.data)
  }

  async function handleSaveModulos(modulos: string[]) {
    if (!modulosTarget) return
    setSavingModulos(true)
    try {
      const impacto = await getImpactoDesativacao(modulosTarget.id, modulos)
      const temDado = impacto.impacto.some((i) => i.contagem > 0)
      if (impacto.bloqueado || temDado) {
        setImpactoState({ modulos, impacto })
        return
      }
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

  async function handleConfirmImpacto(force: boolean, motivo: string) {
    if (!modulosTarget || !impactoState) return
    setSavingModulos(true)
    try {
      if (force) {
        await updateEmpresaModulosForcado(modulosTarget.id, impactoState.modulos, motivo)
      } else {
        await updateEmpresaModulos(modulosTarget.id, impactoState.modulos)
      }
      feedback.show({ status: "success", message: t("superAdmin.modulosSalvo") })
      setImpactoState(null)
      setModulosTarget(null)
      fetchData()
    } catch (err) {
      feedback.show({ status: "error", message: err instanceof ApiError ? err.message : t("superAdmin.erroModulos") })
    } finally {
      setSavingModulos(false)
    }
  }

  async function handleSaveCapacidades(capacidades: string[] | null) {
    if (!capacidadesTarget) return
    setSavingCapacidades(true)
    try {
      await updateEmpresaCapacidades(capacidadesTarget.id, capacidades)
      feedback.show({ status: "success", message: t("capacidades.salvo") })
      setCapacidadesTarget(null)
      fetchData()
    } catch (err) {
      feedback.show({ status: "error", message: err instanceof ApiError ? err.message : t("capacidades.erro") })
    } finally {
      setSavingCapacidades(false)
    }
  }

  const totalUsuarios = empresas.reduce((acc, e) => acc + e.totalUsuarios, 0)
  const totalClientes = empresas.reduce((acc, e) => acc + e.totalClientes, 0)

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <PageHeader
        icon={Building2}
        title={t("superAdmin.title")}
        subtitle={t("superAdmin.subtitle")}
        action={!formOpen ? <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}><Building2 className="size-4" /> {t("superAdmin.novaEmpresa")}</Button> : undefined}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard title={t("superAdmin.totalEmpresas")} value={empresas.length.toString()} variant="blue" />
        <KpiCard title={t("superAdmin.totalUsuarios")} value={totalUsuarios.toString()} variant="green" />
        <KpiCard title={t("superAdmin.totalClientes")} value={totalClientes.toString()} variant="yellow" />
      </div>

      <SectionHeader title={t("superAdmin.empresas")} />

      {formOpen && (
        <Modal open onClose={() => setFormOpen(false)} title={t("superAdmin.novaEmpresa")} maxWidth="max-w-md">
          <EmpresaForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
        </Modal>
      )}

      {editarTarget && (
        <Modal open onClose={() => setEditarTarget(null)} title={t("superAdmin.editarEmpresa", { empresa: editarTarget.nomeFantasia || editarTarget.nome })} maxWidth="max-w-md">
          <EmpresaForm
            initial={{ nome: editarTarget.nome, documento: editarTarget.documento ?? null, nomeFantasia: editarTarget.nomeFantasia ?? null, ativa: editarTarget.ativa !== false }}
            onSubmit={handleUpdateEmpresa}
            onCancel={() => setEditarTarget(null)}
          />
        </Modal>
      )}

      {suspensaoPendente && (
        <Modal
          open
          onClose={() => setSuspensaoPendente(null)}
          title={t("superAdmin.confirmarSuspensao")}
          descricao={t("superAdmin.suspensaoDesc", { n: suspensaoPendente.empresa.totalUsuarios, empresa: suspensaoPendente.empresa.nomeFantasia || suspensaoPendente.empresa.nome })}
          maxWidth="max-w-md"
          footer={
            <>
              <Button type="button" variant="ghost" onClick={() => setSuspensaoPendente(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" variant="danger" disabled={savingEditar} onClick={handleConfirmarSuspensao}>
                {t("superAdmin.suspender")}
              </Button>
            </>
          }
        />
      )}

      <ModulosModal
        key={modulosTarget?.id ?? "none"}
        open={modulosTarget !== null}
        empresaNome={modulosTarget?.nome ?? ""}
        initial={modulosTarget?.modulos ?? null}
        saving={savingModulos}
        onSave={handleSaveModulos}
        onOpenCapacidades={() => {
          if (!modulosTarget) return
          setCapacidadesTarget(modulosTarget)
          setModulosTarget(null)
        }}
        onClose={() => setModulosTarget(null)}
      />

      <CapacidadesModal
        key={capacidadesTarget?.id ?? "none"}
        open={capacidadesTarget !== null}
        empresaNome={capacidadesTarget?.nome ?? ""}
        initial={capacidadesTarget?.capacidades ?? null}
        modulos={capacidadesTarget?.modulos ?? null}
        saving={savingCapacidades}
        onSave={handleSaveCapacidades}
        onClose={() => setCapacidadesTarget(null)}
      />

      <ImpactConfirmModal
        open={impactoState !== null}
        impacto={impactoState?.impacto ?? null}
        canForce={user?.role === "super_admin"}
        saving={savingModulos}
        onConfirm={handleConfirmImpacto}
        onClose={() => setImpactoState(null)}
      />

      <EstadoTela
        loading={loading}
        error={error}
        onRetry={fetchData}
        empty={!loading && empresas.length === 0}
        emptyMessage={t("superAdmin.emptyMessage")}
      >
        <EmpresaList
          empresas={empresas}
          onConfigurar={setModulosTarget}
          onRecursos={setCapacidadesTarget}
          onEditar={setEditarTarget}
        />
      </EstadoTela>
    </div>
  )
}
