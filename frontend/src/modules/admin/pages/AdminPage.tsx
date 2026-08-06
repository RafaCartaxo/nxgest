import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useParams, Navigate, useNavigate } from "react-router-dom"
import { Settings, User } from "lucide-react"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { SearchBar } from "../../../shared/components/SearchBar/SearchBar.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { Tabs } from "../../../shared/components/Tabs/Tabs.js"
import { ConfirmModal } from "../../../shared/components/ConfirmModal.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { roleLabel } from "../../../shared/utils/role.js"
import { OperadoresList } from "../components/OperadoresList.js"
import { OperadorForm } from "../components/OperadorForm.js"
import { EquipeModal } from "../components/EquipeModal.js"
import { ContribuicaoModal } from "../components/ContribuicaoModal.js"
import { listOperadores, getDashboard, getEquipe, createOperador, updateOperador, deleteOperador, type OperadorRow, type EquipeResult, type ContribuicaoMetric } from "../services/admin.service.js"
import { getEmpresa, type EmpresaComStats } from "../services/empresa.service.js"
import { getCaixaStatus, type CaixaStatus } from "../../caixa/services/caixa.service.js"
import { ApiError } from "../../../api/client.js"
import { formatCurrency } from "../../../shared/utils/masks.js"

type Tab = "equipe" | "meusDados"

export function AdminPage() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const empresaId = id || undefined
  const [tab, setTab] = useState<Tab>("equipe")
  const [operadores, setOperadores] = useState<OperadorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [stats, setStats] = useState({ totalAdmins: 0, totalSocios: 0, totalOperadores: 0 })
  const [equipe, setEquipe] = useState<EquipeResult | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaComStats | null>(null)
  const [meuCaixa, setMeuCaixa] = useState<CaixaStatus | null>(null)
  const [meuCaixaError, setMeuCaixaError] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingOp, setEditingOp] = useState<OperadorRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [equipeModal, setEquipeModal] = useState<"admin" | "operator" | "socio" | null>(null)
  const [contribuicaoMetric, setContribuicaoMetric] = useState<ContribuicaoMetric | null>(null)

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
  const headerBadge = isAdminSelf ? roleLabel(user?.role, t) : t("admin.roleSuperAdmin")
  const daEquipe = equipe ? t("admin.daEquipe", { n: equipe.operadores.length }) : undefined

  const filtered = operadores.filter((op) =>
    op.nome.toLowerCase().includes(search.toLowerCase()) ||
    op.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(data: { nome: string; email: string; role: "admin" | "socio" | "operator"; senha?: string; chefeId?: string | null }) {
    if (!data.senha) return
    await feedback.run({
      action: async () => { await createOperador({ nome: data.nome, email: data.email, senha: data.senha!, role: data.role, empresaId, chefeId: data.chefeId }) },
      loading: t("common.saving"),
      success: t("admin.criarSucesso"),
      error: t("admin.erroCarregar"),
    })
    setFormOpen(false)
    fetchData()
  }

  async function handleUpdate(data: { nome?: string; email?: string; role?: "admin" | "socio" | "operator"; senha?: string; chefeId?: string | null; foto?: string | null }) {
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

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <PageHeader
        icon={Settings}
        title={tituloHeader ?? t("admin.title")}
        subtitle={t("admin.subtitle")}
        back={empresaId ? { onClick: () => navigate("/admin/empresas"), title: t("superAdmin.voltar") } : undefined}
        action={tituloHeader ? <StatusBadge variant="info" size="sm" label={headerBadge} /> : undefined}
      />

      {empresaId && empresa?.adminNome && (
        <div className="mb-4 rounded-xl bg-surface-secondary px-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">{t("admin.adminDaEmpresa")}:</span>
            <span className="font-medium text-text-primary">{empresa.adminNome}</span>
          </div>
        </div>
      )}

      {isAdminSelf && (
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "equipe", label: t("admin.tabEquipe") },
            { value: "meusDados", label: t("admin.tabMeusDados") },
          ]}
        />
      )}

      {tab === "equipe" || !isAdminSelf ? (
        <>
          <SectionHeader title={t("admin.secaoEquipe")} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard title={t("admin.totalAdmins")} value={stats.totalAdmins.toString()} variant="blue" onClick={() => setEquipeModal("admin")} />
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
              title={editingOp ? t("admin.editarOperador") : t("admin.novoOperador")}
              maxWidth="max-w-md"
            >
                <OperadorForm
                  editing={editingOp}
                  chefes={operadores.filter((op) => op.role === "admin" || op.role === "socio")}
                  actorRole={user?.role === "socio" ? "socio" : user?.role === "super_admin" ? "super_admin" : "admin"}
                  onSubmit={editingOp ? handleUpdate : handleCreate}
                  onCancel={() => { setFormOpen(false); setEditingOp(null) }}
                />
            </Modal>
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
          <div className="mt-6">
            <Button type="button" variant="soft" className="w-full" onClick={() => navigate("/perfil")}>
              <User className="size-4" /> {t("perfil.title")}
            </Button>
          </div>
        </EstadoTela>
      )}

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
    </div>
  )
}
