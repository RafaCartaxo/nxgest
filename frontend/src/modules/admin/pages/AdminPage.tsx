import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useParams, Navigate, useNavigate } from "react-router-dom"
import { Settings, Ban, RefreshCw } from "lucide-react"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { SearchBar } from "../../../shared/components/SearchBar/SearchBar.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { ConfirmModal } from "../../../shared/components/ConfirmModal.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { roleLabel } from "../../../shared/utils/role.js"
import { OperadoresList } from "../components/OperadoresList.js"
import { OperadorForm, type OperadorFormHandle } from "../components/OperadorForm.js"
import { ReassignModal } from "../components/ReassignModal.js"
import { useEditarOperador } from "../hooks/useEditarOperador.js"
import { EquipeModal } from "../components/EquipeModal.js"
import { ContribuicaoModal } from "../components/ContribuicaoModal.js"
import { listOperadores, getOperador, getDashboard, getEquipe, createOperador, deleteOperador, reenviarConvite, revogarConvite, setSuspensao, type OperadorRow, type EquipeResult, type ContribuicaoMetric } from "../services/admin.service.js"
import { getEmpresa, type EmpresaComStats } from "../services/empresa.service.js"
import { ApiError } from "../../../api/client.js"
import { formatCurrency } from "../../../shared/utils/masks.js"

export function AdminPage() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const empresaId = id || undefined
  const [operadores, setOperadores] = useState<OperadorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [stats, setStats] = useState({ totalAdmins: 0, totalSocios: 0, totalOperadores: 0 })
  const [equipe, setEquipe] = useState<EquipeResult | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaComStats | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingOp, setEditingOp] = useState<OperadorRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [suspenderAcao, setSuspenderAcao] = useState<"suspender" | "reativar" | null>(null)
  const [equipeModal, setEquipeModal] = useState<"admin" | "operator" | "socio" | null>(null)
  const [contribuicaoMetric, setContribuicaoMetric] = useState<ContribuicaoMetric | null>(null)
  const [savingUpdate, setSavingUpdate] = useState(false)
  const operadorFormRef = useRef<OperadorFormHandle>(null)

  const isAdminSelf = (user?.role === "admin" || user?.role === "socio") && !empresaId

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ops, dash, eq] = await Promise.all([listOperadores(empresaId), getDashboard(empresaId), getEquipe(empresaId)])
      setOperadores(ops)
      setStats({ totalAdmins: dash.totalAdmins, totalSocios: dash.totalSocios, totalOperadores: dash.totalOperadores })
      setEquipe(eq)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.erroCarregar"))
    } finally {
      setLoading(false)
    }
  }, [t, empresaId])

  const { saving: savingReassign, reassignState, handleUpdate: handleUpdateHook, handleReassignConfirm: handleReassignConfirmHook, closeReassign } = useEditarOperador({ empresaId, onSaved: fetchData })

  const fetchEmpresa = useCallback(async () => {
    if (!empresaId) return
    try {
      setEmpresa(await getEmpresa(empresaId))
    } catch {
      setEmpresa(null)
    }
  }, [empresaId])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchEmpresa() }, [fetchEmpresa])

  if (user?.role === "super_admin" && !empresaId) {
    return <Navigate to="/admin/empresas" replace />
  }

  const empresaNome = empresa?.nome ?? null
  const tituloHeader = isAdminSelf ? (user?.nome ?? null) : empresaNome
  const daEquipe = equipe ? t("admin.daEquipe", { n: equipe.operadores.length }) : undefined

  const filtered = operadores.filter((op) =>
    op.nome.toLowerCase().includes(search.toLowerCase()) ||
    op.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(data: { nome: string; email: string; telefone?: string | null; role: "admin" | "socio" | "operator"; chefeId?: string | null }) {
    setSavingUpdate(true)
    await feedback.run({
      action: async () => { await createOperador({ nome: data.nome, email: data.email, telefone: data.telefone, role: data.role, empresaId, chefeId: data.chefeId }) },
      loading: t("common.saving"),
      success: t("admin.criarSucesso"),
      error: t("admin.erroCarregar"),
    })
    setSavingUpdate(false)
    setFormOpen(false)
    fetchData()
  }

  async function handleUpdate(data: { nome?: string; email?: string; role?: "admin" | "socio" | "operator"; chefeId?: string | null; foto?: string | null; telefone?: string | null }) {
    if (!editingOp) return
    const ok = await handleUpdateHook(editingOp, data)
    if (ok) setEditingOp(null)
  }

  async function handleReassignConfirm(novoChefeId: string) {
    await handleReassignConfirmHook(novoChefeId)
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return
    await feedback.run({
      action: async () => { await deleteOperador(deleteId, empresaId) },
      loading: t("common.deleting"),
      success: t("admin.removerSucesso"),
      error: t("admin.erroCarregar"),
    })
    setDeleteId(null)
    fetchData()
  }

  async function handleReenviarConvite(id: string) {
    await feedback.run({
      action: async () => { await reenviarConvite(id, empresaId) },
      loading: t("common.saving"),
      success: t("admin.reenviarSucesso"),
      error: t("admin.erroCarregar"),
    })
  }

  async function onSuspensao(suspender: boolean) {
    if (!editingOp) return
    await feedback.run({
      action: async () => {
        await setSuspensao(editingOp.id, suspender, empresaId)
        await fetchData()
        const atualizado = await getOperador(editingOp.id, empresaId)
        setEditingOp(atualizado)
      },
      loading: t("common.saving"),
      success: suspender ? t("admin.suspenderSucesso") : t("admin.reativarSucesso"),
      error: t("admin.erroSuspender"),
    })
    setSuspenderAcao(null)
  }

  async function onRevogarConvite() {
    if (!editingOp) return
    await feedback.run({
      action: async () => {
        await revogarConvite(editingOp.id, empresaId)
        await fetchData()
        const atualizado = await getOperador(editingOp.id, empresaId)
        setEditingOp(atualizado)
      },
      loading: t("common.saving"),
      success: t("admin.revogarSucesso"),
      error: t("admin.erroRevogar"),
    })
  }

  const emptyMessage = search ? undefined : t("admin.emptyMessage")

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <PageHeader
        icon={Settings}
        title={tituloHeader ?? t("admin.title")}
        subtitle={t("admin.subtitle")}
        back={empresaId ? { onClick: () => navigate("/admin/empresas"), title: t("superAdmin.voltar") } : undefined}
      />

      {empresaId && empresa?.adminNome && (
        <div className="mb-4 rounded-xl bg-surface-secondary px-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">{t("admin.adminDaEmpresa")}:</span>
            <span className="font-medium text-text-primary">{empresa.adminNome}</span>
          </div>
        </div>
      )}

      <SectionHeader title={t("admin.secaoEquipe")} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title={t("admin.totalAdmins")} value={stats.totalAdmins.toString()} variant="info" onClick={() => setEquipeModal("admin")} />
        <KpiCard title={t("admin.totalSocios")} value={stats.totalSocios.toString()} variant="info" onClick={() => setEquipeModal("socio")} />
        <KpiCard title={t("admin.totalOperadores")} value={stats.totalOperadores.toString()} variant="info" onClick={() => setEquipeModal("operator")} />
      </div>

      <SectionHeader title={t("admin.secaoOperacao")} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard title={t("admin.totalClientes")} value={(equipe?.totais.totalClientes ?? 0).toString()} variant="green" subtitle={daEquipe} onClick={() => setContribuicaoMetric("clientes")} />
        <KpiCard title={t("admin.contratosAtivos")} value={(equipe?.totais.contratosAtivos ?? 0).toString()} variant="yellow" subtitle={daEquipe} onClick={() => setContribuicaoMetric("contratos")} />
        <KpiCard
          title={t("admin.recebidoHoje")}
          value={`R$ ${formatCurrency(equipe?.totais.recebidoHoje ?? 0)}`}
          variant="gray"
          subtitle={daEquipe}
          onClick={() => setContribuicaoMetric("recebido")}
        />
      </div>

      <SectionHeader
        title={t("admin.operadores")}
        action={!formOpen && !editingOp ? { label: t("admin.novoOperador"), onClick: () => setFormOpen(true) } : undefined}
      />

      {(formOpen || editingOp) && (
        <Modal
          open
          onClose={() => { setFormOpen(false); setEditingOp(null) }}
          title={editingOp ? t("admin.editarRole", { role: roleLabel(editingOp.role, t) }) : t("admin.novoOperador")}
          maxWidth="max-w-md"
          footer={
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => { setFormOpen(false); setEditingOp(null) }}>
                {t("common.cancel")}
              </Button>
              <Button type="button" disabled={savingUpdate || savingReassign} onClick={() => void operadorFormRef.current?.submit()}>
                {editingOp ? t("common.save") : t("admin.enviarConvite")}
              </Button>
            </div>
          }
        >
          <OperadorForm
            ref={operadorFormRef}
            editing={editingOp}
            chefes={operadores.filter((op) => op.role === "admin" || op.role === "socio")}
            actorRole={user?.role === "socio" ? "socio" : user?.role === "super_admin" ? "super_admin" : "admin"}
            onSubmit={editingOp ? handleUpdate : handleCreate}
            onCancel={() => { setFormOpen(false); setEditingOp(null) }}
            onAlterarStatus={() => setSuspenderAcao(editingOp?.suspensoEm ? "reativar" : "suspender")}
            onReenviarConvite={editingOp ? () => void handleReenviarConvite(editingOp.id) : undefined}
            onRevogarConvite={onRevogarConvite}
          />
        </Modal>
      )}

      <ReassignModal
        open={reassignState !== null}
        reassign={reassignState}
        chefes={operadores.filter((op) => op.role === "admin")}
        saving={savingUpdate || savingReassign}
        onConfirm={handleReassignConfirm}
        onClose={closeReassign}
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t("admin.buscarPlaceholder")}
      />

      <EstadoTela
        loading={loading}
        error={error}
        onRetry={fetchData}
        empty={!loading && filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        <OperadoresList
          operadores={filtered}
          empresaId={empresaId}
          onEdit={(op) => setEditingOp(op)}
          onDelete={(id) => setDeleteId(id)}
          onReenviarConvite={handleReenviarConvite}
        />
      </EstadoTela>

      <EquipeModal
        open={equipeModal !== null}
        role={equipeModal ?? "admin"}
        operadores={operadores}
        empresaId={empresaId}
        onClose={() => setEquipeModal(null)}
      />
      <ContribuicaoModal
        open={contribuicaoMetric !== null}
        metric={contribuicaoMetric ?? "clientes"}
        equipe={equipe}
        empresaId={empresaId}
        onClose={() => setContribuicaoMetric(null)}
      />

      <ConfirmModal
        open={!!deleteId}
        title={t("admin.removerConfirmacao")}
        message={t("admin.removerConfirmacaoMessage")}
        confirmLabel={t("common.confirmDelete")}
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

      {editingOp && (
        <Modal
          open={suspenderAcao !== null}
          onClose={() => setSuspenderAcao(null)}
          title={t("admin.alterarStatus")}
          descricao={suspenderAcao === "suspender" ? t("admin.suspenderConfirmacaoMessage") : t("admin.reativarConfirmacaoMessage")}
          maxWidth="max-w-md"
          footer={
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setSuspenderAcao(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant={suspenderAcao === "suspender" ? "danger" : "primary"}
                onClick={() => onSuspensao(suspenderAcao === "suspender")}
              >
                {suspenderAcao === "suspender" ? <Ban className="size-4" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
                {suspenderAcao === "suspender" ? t("admin.suspender") : t("admin.reativar")}
              </Button>
            </div>
          }
        >
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-secondary p-3 text-sm">
              <span className="shrink-0 whitespace-nowrap text-text-secondary">{t("admin.dadosRole", { role: roleLabel(editingOp.role, t) })}:</span>
              <span className="min-w-0 truncate font-medium text-text-primary">{editingOp.nome}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-text-secondary">{t("perfil.status")}</span>
              {editingOp.suspensoEm ? (
                <StatusBadge variant="danger" size="sm" label={t("admin.statusSuspenso")} />
              ) : (
                <StatusBadge variant="success" size="sm" label={t("admin.statusAtivo")} />
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
