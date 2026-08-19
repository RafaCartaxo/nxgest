import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Mail, PlayCircle, UserPlus, Trash2 } from "lucide-react"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { Card } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { FieldSelect } from "../../../shared/components/Field/FieldSelect.js"
import { FieldTextarea } from "../../../shared/components/Field/FieldTextarea.js"
import { SearchBar } from "../../../shared/components/SearchBar/SearchBar.js"
import { ConfirmModal } from "../../../shared/components/ConfirmModal.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { listarLeads, iniciarOnboarding, converterLead, descartarLead, type Lead, type LeadStatus } from "../services/leads.service.js"
import { ApiError } from "../../../api/client.js"

const TODOS = "TODOS"

const statusVariant: Record<LeadStatus, "info" | "success" | "warning" | "neutral" | "danger"> = {
  NOVO: "info",
  EMAIL_CONFIRMADO: "success",
  EM_ONBOARDING: "warning",
  CONVERTIDO: "neutral",
  DESCARTADO: "danger",
}

function statusLabel(status: LeadStatus, t: (k: string) => string): string {
  return t(`lead.status.${status}`)
}

function formatData(iso: string, locale: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(locale)
}

export function LeadsAdminPage() {
  const { t, i18n } = useTranslation()
  const feedback = useFeedback()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<string>(TODOS)
  const [busca, setBusca] = useState("")
  const [buscaFiltro, setBuscaFiltro] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [descartarTarget, setDescartarTarget] = useState<Lead | null>(null)
  const [converterTarget, setConverterTarget] = useState<Lead | null>(null)
  const [motivo, setMotivo] = useState("")
  const [saving, setSaving] = useState(false)

  // Debounce da busca (PLAN-083 Fase 6.3): só dispara o fetch quando o usuário para de digitar
  // e volta pra página 1 — `fetchData` depende de `buscaFiltro`, não de `busca`.
  useEffect(() => {
    const h = setTimeout(() => { setBuscaFiltro(busca); setPage(1) }, 300)
    return () => clearTimeout(h)
  }, [busca])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listarLeads(buscaFiltro || undefined, filtro === TODOS ? undefined : filtro, page)
      setLeads(result.data)
      setTotalPages(result.pagination.pages)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("lead.erroCarregar"))
    } finally {
      setLoading(false)
    }
  }, [filtro, buscaFiltro, page, t])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleOnboarding(lead: Lead) {
    await feedback.run({
      action: async () => { await iniciarOnboarding(lead.id) },
      loading: t("common.saving"),
      success: t("lead.onboardingSucesso"),
      error: t("lead.erroCarregar"),
    })
    fetchData()
  }

  async function handleConverter() {
    if (!converterTarget) return
    setSaving(true)
    try {
      await converterLead(converterTarget.id)
      feedback.show({ status: "success", message: t("lead.converterSucesso") })
      setConverterTarget(null)
      fetchData()
    } catch (err) {
      feedback.show({ status: "error", message: err instanceof ApiError ? err.message : t("lead.erroConverter") })
    } finally {
      setSaving(false)
    }
  }

  async function handleDescartar() {
    if (!descartarTarget) return
    if (!motivo.trim()) {
      feedback.show({ status: "error", message: t("lead.motivoObrigatorio") })
      return
    }
    setSaving(true)
    try {
      await descartarLead(descartarTarget.id, motivo.trim())
      feedback.show({ status: "success", message: t("lead.descartarSucesso") })
      setDescartarTarget(null)
      setMotivo("")
      fetchData()
    } catch (err) {
      feedback.show({ status: "error", message: err instanceof ApiError ? err.message : t("lead.erroDescartar") })
    } finally {
      setSaving(false)
    }
  }

  const filtered = leads

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <PageHeader icon={Mail} title={t("lead.painelTitle")} subtitle={t("lead.painelSubtitle")} />

      <SearchBar
        value={busca}
        onChange={setBusca}
        placeholder={t("lead.buscarPlaceholder")}
        onClear={() => setBusca("")}
      />

      <div className="max-w-xs">
        <FieldSelect
          label={t("lead.filtro")}
          value={filtro}
          onChange={(e) => { setFiltro(e.target.value); setPage(1) }}
          options={[
            { value: TODOS, label: t("lead.filtroTodos") },
            { value: "NOVO", label: t("lead.status.NOVO") },
            { value: "EMAIL_CONFIRMADO", label: t("lead.status.EMAIL_CONFIRMADO") },
            { value: "EM_ONBOARDING", label: t("lead.status.EM_ONBOARDING") },
            { value: "CONVERTIDO", label: t("lead.status.CONVERTIDO") },
            { value: "DESCARTADO", label: t("lead.status.DESCARTADO") },
          ]}
        />
      </div>

      <EstadoTela
        loading={loading}
        error={error}
        onRetry={fetchData}
        empty={!loading && filtered.length === 0}
        emptyMessage={t("lead.emptyMessage")}
      >
        <div className="space-y-3">
          {filtered.map((lead) => (
            <Card.Root key={lead.id} variant="list-item">
              <Card.Header className="flex-wrap">
                <span className="min-w-0 flex-1 truncate text-base font-semibold">{lead.nomeResponsavel}</span>
                <StatusBadge variant={statusVariant[lead.status]} size="sm" label={statusLabel(lead.status, t)} />
              </Card.Header>
              <Card.Body>
                <p className="truncate text-sm font-medium text-text-primary">{lead.empresa}</p>
                <p className="truncate text-sm text-text-secondary">
                  {lead.email ?? "—"}
                  {lead.telefone ? ` · ${lead.telefone}` : ""}
                </p>
                <Card.Indicators>
                  <Card.Indicator label={t("lead.origemLabel")} value={t(`lead.origem.${lead.origem}`)} />
                  <Card.Indicator label={t("lead.dataCriacao")} value={formatData(lead.createdAt, i18n.language)} />
                </Card.Indicators>
                {lead.descarteMotivo && (
                  <p className="mt-2 rounded-lg bg-danger-light px-2 py-1 text-xs text-danger-text">
                    {t("lead.motivo")}: {lead.descarteMotivo}
                  </p>
                )}
              </Card.Body>
              <Card.Actions
                actions={[
                  {
                    icon: PlayCircle,
                    label: t("lead.iniciarOnboarding"),
                    onClick: () => handleOnboarding(lead),
                    show: lead.status === "NOVO" || lead.status === "EMAIL_CONFIRMADO",
                  },
                  {
                    icon: UserPlus,
                    label: t("lead.converter"),
                    onClick: () => setConverterTarget(lead),
                    show: lead.status === "EMAIL_CONFIRMADO" || lead.status === "EM_ONBOARDING",
                    variant: "green",
                  },
                  {
                    icon: Trash2,
                    label: t("lead.descartar"),
                    onClick: () => setDescartarTarget(lead),
                    show: lead.status !== "CONVERTIDO",
                    variant: "danger",
                  },
                ]}
              />
            </Card.Root>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <Button type="button" variant="ghost" onClick={() => setPage(page - 1)} disabled={page <= 1}>
              {t("lead.paginacao.anterior")}
            </Button>
            <span className="text-sm text-text-secondary">
              {page} {t("lead.paginacao.de")} {totalPages}
            </span>
            <Button type="button" variant="ghost" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
              {t("lead.paginacao.proximo")}
            </Button>
          </div>
        )}
      </EstadoTela>

      <ConfirmModal
        open={converterTarget !== null}
        title={t("lead.converterConfirmacao")}
        message={t("lead.converterConfirmacaoMessage", { empresa: converterTarget?.empresa ?? "" })}
        confirmLabel={t("lead.converter")}
        onConfirm={handleConverter}
        onCancel={() => setConverterTarget(null)}
      />

      <Modal
        open={descartarTarget !== null}
        onClose={() => { setDescartarTarget(null); setMotivo("") }}
        title={t("lead.descartar")}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">{t("lead.descartarHint")}</p>
          <FieldTextarea
            label={t("lead.motivo")}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder={t("lead.motivoPlaceholder")}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setDescartarTarget(null); setMotivo("") }}>
              {t("common.cancel")}
            </Button>
            <Button type="button" variant="danger" onClick={handleDescartar} disabled={saving}>
              {saving ? t("common.loading") : t("lead.descartar")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
