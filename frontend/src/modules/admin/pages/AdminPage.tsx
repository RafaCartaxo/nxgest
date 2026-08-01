import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useParams, Navigate } from "react-router-dom"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { SearchBar } from "../../../shared/components/SearchBar/SearchBar.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { ConfirmModal } from "../../../shared/components/ConfirmModal.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { OperadoresList } from "../components/OperadoresList.js"
import { OperadorForm } from "../components/OperadorForm.js"
import { listOperadores, getDashboard, createOperador, updateOperador, deleteOperador, type OperadorRow } from "../services/admin.service.js"
import { getEmpresa, type EmpresaComStats } from "../services/empresa.service.js"
import { getCaixaStatus, type CaixaStatus } from "../../caixa/services/caixa.service.js"
import { ApiError } from "../../../api/client.js"
import { formatCurrency } from "../../../shared/utils/masks.js"

type Tab = "equipe" | "meusDados"

export function AdminPage() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const { user } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const empresaId = id || undefined
  const [tab, setTab] = useState<Tab>("equipe")
  const [operadores, setOperadores] = useState<OperadorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [stats, setStats] = useState({ totalAdmins: 0, totalOperadores: 0, totalClientes: 0, contratosAtivos: 0, recebidoHoje: 0, resultadoDoDia: 0 })
  const [empresa, setEmpresa] = useState<EmpresaComStats | null>(null)
  const [meuCaixa, setMeuCaixa] = useState<CaixaStatus | null>(null)
  const [meuCaixaError, setMeuCaixaError] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingOp, setEditingOp] = useState<OperadorRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const isAdminSelf = user?.role === "admin" && !empresaId

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ops, dash] = await Promise.all([listOperadores(empresaId), getDashboard(empresaId)])
      setOperadores(ops)
      setStats(dash)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.erroCarregar"))
    } finally {
      setLoading(false)
    }
  }, [t, empresaId])

  const fetchEmpresa = useCallback(async () => {
    if (!empresaId) return
    try {
      setEmpresa(await getEmpresa(empresaId))
    } catch {
      setEmpresa(null)
    }
  }, [empresaId])

  const fetchMeuCaixa = useCallback(async () => {
    setMeuCaixaError(false)
    try {
      setMeuCaixa(await getCaixaStatus())
    } catch (err) {
      setMeuCaixa(null)
      setMeuCaixaError(true)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchEmpresa() }, [fetchEmpresa])
  useEffect(() => { if (tab === "meusDados") fetchMeuCaixa() }, [tab, fetchMeuCaixa])

  if (user?.role === "super_admin" && !empresaId) {
    return <Navigate to="/admin/empresas" replace />
  }

  const empresaNome = empresa?.nome ?? null
  const tituloHeader = isAdminSelf ? (user?.nome ?? null) : empresaNome
  const escopoNome = isAdminSelf ? (user?.nome ?? null) : empresaNome
  const headerBadge = isAdminSelf ? t("admin.roleAdmin") : t("admin.roleSuperAdmin")

  const filtered = operadores.filter((op) =>
    op.nome.toLowerCase().includes(search.toLowerCase()) ||
    op.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(data: { nome: string; email: string; role: "admin" | "operator"; senha?: string }) {
    if (!data.senha) return
    await feedback.run({
      action: async () => { await createOperador({ nome: data.nome, email: data.email, senha: data.senha!, role: data.role, empresaId }) },
      loading: t("common.saving"),
      success: t("admin.criarSucesso"),
      error: t("admin.erroCarregar"),
    })
    setFormOpen(false)
    fetchData()
  }

  async function handleUpdate(data: { nome?: string; email?: string; role?: "admin" | "operator"; senha?: string }) {
    if (!editingOp) return
    await feedback.run({
      action: async () => { await updateOperador(editingOp.id, data, empresaId) },
      loading: t("common.saving"),
      success: t("admin.editarSucesso"),
      error: t("admin.erroCarregar"),
    })
    setEditingOp(null)
    fetchData()
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

  const emptyMessage = search ? undefined : t("admin.emptyMessage")

  const tabButton = (key: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        tab === key ? "bg-primary text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="mb-2 flex items-center gap-2">
        <h1 className="flex-1 text-3xl font-semibold">{tituloHeader ?? t("admin.title")}</h1>
        {tituloHeader && (
          <StatusBadge variant="info" size="sm" label={headerBadge} />
        )}
      </div>

      {isAdminSelf && (
        <div className="flex gap-1 rounded-md bg-surface-secondary p-1">
          {tabButton("equipe", t("admin.tabEquipe"))}
          {tabButton("meusDados", t("admin.tabMeusDados"))}
        </div>
      )}

      {tab === "equipe" || !isAdminSelf ? (
        <>
          <SectionHeader title={t("admin.secaoEquipe")} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard title={t("admin.totalAdmins")} value={stats.totalAdmins.toString()} variant="blue" />
            <KpiCard title={t("admin.totalOperadores")} value={stats.totalOperadores.toString()} variant="info" />
          </div>

          <SectionHeader title={t("admin.secaoOperacao")} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <KpiCard title={t("admin.totalClientes")} value={stats.totalClientes.toString()} variant="green" subtitle={escopoNome ? t("admin.de", { nome: escopoNome }) : undefined} />
            <KpiCard title={t("admin.contratosAtivos")} value={stats.contratosAtivos.toString()} variant="yellow" subtitle={escopoNome ? t("admin.de", { nome: escopoNome }) : undefined} />
            <KpiCard
              title={t("admin.resultadoDia")}
              value={`R$ ${formatCurrency(Math.abs(stats.resultadoDoDia))}`}
              variant="gray"
              valueClassName={stats.resultadoDoDia >= 0 ? "text-success-text" : "text-danger-text"}
              tooltip={t("admin.resultadoDiaTooltip")}
              subtitle={escopoNome ? t("admin.de", { nome: escopoNome }) : undefined}
            />
          </div>

          <SectionHeader
            title={t("admin.operadores")}
            action={!formOpen && !editingOp ? { label: t("admin.novoOperador"), onClick: () => setFormOpen(true) } : undefined}
          />

          {(formOpen || editingOp) && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/30" onClick={() => { setFormOpen(false); setEditingOp(null) }}>
              <div className="bg-surface rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <OperadorForm
                  editing={editingOp}
                  onSubmit={editingOp ? handleUpdate : handleCreate}
                  onCancel={() => { setFormOpen(false); setEditingOp(null) }}
                />
              </div>
            </div>
          )}

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
            />
          </EstadoTela>
        </>
      ) : (
        <EstadoTela
          loading={!meuCaixa && !meuCaixaError}
          error={meuCaixaError ? t("admin.erroCarregar") : null}
          onRetry={fetchMeuCaixa}
          empty={false}
        >
          {meuCaixa && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <KpiCard title={t("caixa.caixaBase")} value={`R$ ${meuCaixa.caixaBase.toFixed(2)}`} variant="blue" />
              <KpiCard title={t("caixa.saldoAtual")} value={`R$ ${meuCaixa.saldoAtual.toFixed(2)}`} variant="gray" />
              <KpiCard
                title={t("caixa.lucro")}
                value={`R$ ${meuCaixa.lucro.toFixed(2)}`}
                variant={meuCaixa.lucro >= 0 ? "green" : "gray"}
                valueClassName={meuCaixa.lucro >= 0 ? "text-success-text" : "text-danger-text"}
              />
              <KpiCard title={t("caixa.aReceberHoje")} value={`R$ ${meuCaixa.aReceberHoje.toFixed(2)}`} variant="blue" />
              <KpiCard title={t("caixa.recebidoSemana")} value={`R$ ${meuCaixa.recebidoSemana.toFixed(2)}`} variant="green" />
              <KpiCard title={t("caixa.cobradoHoje")} value={`R$ ${meuCaixa.recebidoHoje.toFixed(2)}`} variant="green" />
            </div>
          )}
        </EstadoTela>
      )}

      <ConfirmModal
        open={!!deleteId}
        title={t("admin.removerConfirmacao")}
        message={t("admin.removerConfirmacaoMessage")}
        confirmLabel={t("common.confirmDelete")}
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
