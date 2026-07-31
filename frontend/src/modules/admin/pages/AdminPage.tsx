import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { SearchBar } from "../../../shared/components/SearchBar/SearchBar.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { ConfirmModal } from "../../../shared/components/ConfirmModal.js"
import { OperadoresList } from "../components/OperadoresList.js"
import { OperadorForm } from "../components/OperadorForm.js"
import { listOperadores, getDashboard, createOperador, updateOperador, deleteOperador, type OperadorRow } from "../services/admin.service.js"
import { ApiError } from "../../../api/client.js"

export function AdminPage() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const { id } = useParams<{ id?: string }>()
  const empresaId = id || undefined
  const [operadores, setOperadores] = useState<OperadorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [stats, setStats] = useState({ totalOperadores: 0, totalClientes: 0, contratosAtivos: 0, recebidoHoje: 0, resultadoDoDia: 0 })
  const [formOpen, setFormOpen] = useState(false)
  const [editingOp, setEditingOp] = useState<OperadorRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  useEffect(() => { fetchData() }, [fetchData])

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

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <SectionHeader title={t("admin.title")} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title={t("admin.totalOperadores")} value={stats.totalOperadores.toString()} variant="blue" />
        <KpiCard title={t("admin.totalClientes")} value={stats.totalClientes.toString()} variant="green" />
        <KpiCard title={t("admin.contratosAtivos")} value={stats.contratosAtivos.toString()} variant="yellow" />
        <KpiCard title={t("admin.resultadoDia")} value={`R$ ${stats.resultadoDoDia.toFixed(2)}`} variant="gray" />
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
          onEdit={(op) => setEditingOp(op)}
          onDelete={(id) => setDeleteId(id)}
        />
      </EstadoTela>

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
