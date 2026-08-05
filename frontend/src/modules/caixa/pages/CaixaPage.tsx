import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react"
import { getCaixaStatus, ajustarCaixaBase, listarMovimentacoes, listarAuditoriaCaixa, liquidarSemana, type CaixaStatus, type MovimentacaoItem, type AuditoriaCaixaItem } from "../services/caixa.service.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { hasModule } from "../../../shared/modules/modules.js"
import { listarPagamentosHoje, listarParcelasHoje, type PagamentoDoDiaItem, type ParcelaHojeCliente } from "../../operacoes/services/operacoes.service.js"
import { listContratos, type Contrato } from "../../contrato/services/contrato.service.js"
import { ApiError } from "../../../api/client.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { ConfirmModal } from "../../../shared/components/ConfirmModal.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { ParcelasHojeModal } from "../../operacoes/components/ParcelasHojeModal.js"
import { PagamentosHojeModal } from "../../operacoes/components/PagamentosHojeModal.js"
import { PagamentosPeriodoModal } from "../../operacoes/components/PagamentosPeriodoModal.js"
import { ContratosSemanaModal } from "../components/ContratosSemanaModal.js"
import { maskMonetario, unmaskMonetario, formatCurrency } from "../../../shared/utils/masks.js"
import { Button } from "../../../shared/components/Button.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { GastosPeriodoModal } from "../components/GastosPeriodoModal.js"
import { listGastos, type GastoItem } from "../../gasto/services/gasto.service.js"
import { CATEGORIA_ICONES } from "../../gasto/schemas/gasto.schema.js"
import { getLocalDateString } from "../../../shared/utils/parseDateLocal.js"

export function CaixaPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const feedback = useFeedback()
  const { user } = useAuth()

  const canAdjust = user?.role === "admin" || user?.role === "super_admin"
  const gastosAtivo = hasModule(user?.modulos, "gastos")

  const [status, setStatus] = useState<CaixaStatus | null>(null)
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoItem[]>([])
  const [auditoria, setAuditoria] = useState<AuditoriaCaixaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ajusteValor, setAjusteValor] = useState("")
  const [ajusteMotivo, setAjusteMotivo] = useState("")
  const [liquidarModalOpen, setLiquidarModalOpen] = useState(false)

  const [parcelasHoje, setParcelasHoje] = useState<ParcelaHojeCliente[]>([])
  const [parcelasModalOpen, setParcelasModalOpen] = useState(false)

  const [pagamentosPeriodo, setPagamentosPeriodo] = useState<PagamentoDoDiaItem[]>([])
  const [pagamentosPeriodoModalOpen, setPagamentosPeriodoModalOpen] = useState(false)

  const [contratosSemana, setContratosSemana] = useState<Contrato[]>([])
  const [contratosSemanaModalOpen, setContratosSemanaModalOpen] = useState(false)

  const [gastosPeriodo, setGastosPeriodo] = useState<GastoItem[]>([])
  const [gastosPeriodoModalOpen, setGastosPeriodoModalOpen] = useState(false)

  const [parcelasHojeLoading, setParcelasHojeLoading] = useState(false)
  const [pagamentosPeriodoLoading, setPagamentosPeriodoLoading] = useState(false)
  const [contratosSemanaLoading, setContratosSemanaLoading] = useState(false)
  const [gastosPeriodoLoading, setGastosPeriodoLoading] = useState(false)

  const [pagamentosHoje, setPagamentosHoje] = useState<PagamentoDoDiaItem[]>([])
  const [pagamentosHojeModalOpen, setPagamentosHojeModalOpen] = useState(false)
  const [pagamentosHojeLoading, setPagamentosHojeLoading] = useState(false)

  const [semanaOffset, setSemanaOffset] = useState(0)
  const [semanaLoading, setSemanaLoading] = useState(false)

  function calcularSemana(offset: number) {
    const hoje = new Date()
    const diaSemana = hoje.getDay()
    const domingo = new Date(hoje)
    domingo.setDate(hoje.getDate() + (7 - diaSemana) % 7 + offset * 7)
    const segunda = new Date(domingo)
    segunda.setDate(domingo.getDate() - 6)
    return {
      dataInicio: getLocalDateString(segunda),
      dataFim: getLocalDateString(domingo),
    }
  }

  const fetch = useCallback(async (offset?: number) => {
    const isSemanaChange = offset !== undefined
    if (isSemanaChange) {
      setSemanaOffset(offset)
      setSemanaLoading(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const { dataInicio, dataFim } = calcularSemana(offset ?? 0)
      const [s, m, aud] = await Promise.all([
        getCaixaStatus(dataInicio, dataFim),
        listarMovimentacoes({ limit: 20 }),
        listarAuditoriaCaixa({ limit: 20 }),
      ])
      setStatus(s)
      setMovimentacoes(m.data)
      setAuditoria(aud.data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(t("caixa.erroCarregar"))
      }
    } finally {
      if (isSemanaChange) setSemanaLoading(false)
      else setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function handleAReceberClick() {
    setParcelasHojeLoading(true)
    setParcelasModalOpen(true)
    listarParcelasHoje()
      .then(setParcelasHoje)
      .catch(() => setParcelasHoje([]))
      .finally(() => setParcelasHojeLoading(false))
  }

  async function handleRecebidoHojeClick() {
    setPagamentosHojeLoading(true)
    setPagamentosHojeModalOpen(true)
    listarPagamentosHoje()
      .then(setPagamentosHoje)
      .catch(() => setPagamentosHoje([]))
      .finally(() => setPagamentosHojeLoading(false))
  }

  async function handleCobradoSemanaClick() {
    if (!status) return
    const { dataInicio, dataFim } = calcularSemana(semanaOffset)
    setPagamentosPeriodoLoading(true)
    setPagamentosPeriodoModalOpen(true)
    listarPagamentosHoje(dataInicio, dataFim)
      .then(setPagamentosPeriodo)
      .catch(() => setPagamentosPeriodo([]))
      .finally(() => setPagamentosPeriodoLoading(false))
  }

  async function handleVendasSemanaClick() {
    if (!status) return
    const { dataInicio, dataFim } = calcularSemana(semanaOffset)
    setContratosSemanaLoading(true)
    setContratosSemanaModalOpen(true)
    listContratos({ dataInicio, dataFim, limit: 100 })
      .then((r) => setContratosSemana(r.data))
      .catch(() => setContratosSemana([]))
      .finally(() => setContratosSemanaLoading(false))
  }

  async function handleGastosSemanaClick() {
    if (!status) return
    const { dataInicio, dataFim } = calcularSemana(semanaOffset)
    setGastosPeriodoLoading(true)
    setGastosPeriodoModalOpen(true)
    listGastos({ dataInicio, dataFim, limit: 100 })
      .then((r) => setGastosPeriodo(r.data))
      .catch(() => setGastosPeriodo([]))
      .finally(() => setGastosPeriodoLoading(false))
  }

  async function handleAjustar() {
    const valor = unmaskMonetario(ajusteValor)
    const motivo = ajusteMotivo.trim()
    if (valor <= 0) return
    if (!motivo) {
      feedback.show({ status: "error", message: t("caixa.motivoObrigatorio") })
      return
    }
    await feedback.run({
      loading: t("common.saving"),
      success: t("caixa.ajustarSucesso"),
      error: t("caixa.erroCarregar"),
      action: async () => {
        await ajustarCaixaBase(valor, motivo)
        setAjusteValor("")
        setAjusteMotivo("")
        await fetch()
      },
    })
  }

  async function handleLiquidar() {
    await feedback.run({
      loading: t("common.saving"),
      success: t("caixa.liquidarSucesso"),
      error: t("caixa.erroCarregar"),
      action: async () => {
        await liquidarSemana()
        setLiquidarModalOpen(false)
        await fetch()
      },
    })
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={Wallet}
        title={t("caixa.title")}
        subtitle={t("caixa.subtitle")}
        back={{ onClick: () => navigate(-1), title: t("common.back") }}
        action={<Button variant="onDark" onClick={() => setLiquidarModalOpen(true)}>{t("caixa.liquidar")}</Button>}
      />

      {error && (
        <ErrorBanner message={error} onRetry={fetch} className="mb-4" />
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="h-5 w-16 animate-pulse rounded bg-surface-hover" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-md bg-surface-hover" />
            ))}
          </div>

          <div className="h-5 w-20 animate-pulse rounded bg-surface-hover" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-md bg-surface-hover" />
            ))}
          </div>

          <div className="h-5 w-14 animate-pulse rounded bg-surface-hover" />
          <div className="h-4 w-64 animate-pulse rounded bg-surface-hover" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-md bg-surface-hover" />
            ))}
          </div>

          <div className="h-5 w-48 animate-pulse rounded bg-surface-hover" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-surface-hover" />
            ))}
          </div>
        </div>
      ) : status ? (
        <>
          <SectionHeader title={t("caixa.hoje")} />
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <KpiCard
              variant="blue"
              title={t("caixa.aReceberHoje")}
              value={`R$ ${formatCurrency(status.aReceberHoje)}`}
              onClick={handleAReceberClick}
            />
            <KpiCard
              variant="green"
              title={t("caixa.recebidoSemana")}
              value={`R$ ${formatCurrency(status.recebidoSemana)}`}
              onClick={handleCobradoSemanaClick}
            />
            <KpiCard
              variant="green"
              title={t("caixa.cobradoHoje")}
              value={`R$ ${formatCurrency(status.recebidoHoje)}`}
              onClick={handleRecebidoHojeClick}
            />
          </div>

          <div className="mt-6 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetch(semanaOffset - 1)}
                className="rounded p-1 text-text-muted hover:text-text-primary"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold text-text-primary">{t("caixa.semana")}</h2>
              {semanaOffset < 0 && (
                <button
                  type="button"
                  onClick={() => fetch(semanaOffset + 1)}
                  className="rounded p-1 text-text-muted hover:text-text-primary"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
            <span className="text-sm text-text-muted">
              {(() => {
                const { dataInicio, dataFim } = calcularSemana(semanaOffset)
                return `${new Date(dataInicio + "T00:00:00").toLocaleDateString("pt-BR")} a ${new Date(dataFim + "T00:00:00").toLocaleDateString("pt-BR")}`
              })()}
            </span>
          </div>
          <div className={`mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 transition-opacity duration-200 ${semanaLoading ? "opacity-50" : "opacity-100"}`}>
            <KpiCard
              variant="yellow"
              title={t("caixa.vendasSemana")}
              value={`R$ ${formatCurrency(status.vendasSemana)}`}
              onClick={handleVendasSemanaClick}
            />
            {gastosAtivo && (
              <KpiCard
                variant="yellow"
                title={t("caixa.gastosSemana")}
                value={`R$ ${formatCurrency(status.gastosSemana)}`}
                onClick={handleGastosSemanaClick}
              />
            )}
            <KpiCard
              variant="gray"
              title={t("caixa.resultadoSemana")}
              value={`R$ ${formatCurrency(Math.abs(status.resultadoSemana))}`}
              valueClassName={status.resultadoSemana >= 0 ? "text-success-text" : "text-danger-text"}
            />
          </div>

          <SectionHeader title={t("caixa.title")} />
          {status.ultimaLiquidacao && (
            <div className="mb-2 rounded-md bg-surface-secondary px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">{t("caixa.ultimoFechamento")}:</span>
                <span className="font-medium text-text-primary">
                  {new Date(status.ultimaLiquidacao + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              </div>
              {status.caixaUltimaLiquidacao != null && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-text-secondary">{t("caixa.caixaNoFechamento")}:</span>
                  <span className="font-medium text-text-primary">
                    R$ {formatCurrency(status.caixaUltimaLiquidacao)}
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <KpiCard
              variant={status.lucro >= 0 ? "green" : "gray"}
              title={t("caixa.lucro")}
              value={`R$ ${formatCurrency(status.lucro)}`}
              valueClassName={status.lucro >= 0 ? "text-success-text" : "text-danger-text"}
            />
            <KpiCard
              variant="gray"
              title={t("caixa.saldoAtual")}
              value={`R$ ${formatCurrency(status.saldoAtual)}`}
            />
            <KpiCard
              variant="gray"
              title={t("caixa.caixaBase")}
              value={`R$ ${formatCurrency(status.caixaBase)}`}
            />
          </div>
        </>
      ) : null}

      {!loading && status ? (
        <>
          <div className="mt-8">
            {gastosAtivo && (
              <Button
                onClick={() => navigate("/gastos")}
                className="w-full"
              >
                {t("gasto.registrar")}
              </Button>
            )}
          </div>

          <SectionHeader title={t("caixa.historicoAjustes")} />

          {auditoria.length === 0 ? (
            <p className="mt-2 text-text-secondary">{t("caixa.ajusteSemRegistros")}</p>
          ) : (
            <div className="mt-2 space-y-1">
              {auditoria.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-border-light bg-surface px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-text-primary">
                      R$ {a.valorAnterior.toFixed(2)} → R$ {a.valorNovo.toFixed(2)}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {a.adminNome ? `${t("caixa.ajustePor")} ${a.adminNome}` : ""}
                    </span>
                    <span className="text-xs text-text-muted">{a.motivo}</span>
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <SectionHeader title={t("caixa.movimentacoes")} />

          {movimentacoes.length === 0 ? (
            <p className="mt-4 text-text-secondary">{t("caixa.nenhumaMovimentacao")}</p>
          ) : (
            <div className="mt-2 space-y-1">
              {movimentacoes.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border-light bg-surface px-3 py-2"
                >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className={`shrink-0 text-sm font-medium ${m.tipo === "entrada" ? "text-success-text" : "text-danger-text"}`}>
                  {m.tipo === "entrada" ? "+" : "-"} R$ {formatCurrency(m.valor)}
                </span>
                <span className="shrink-0 text-xs text-text-secondary">{m.origem}</span>
                {m.origem === "Cancelamento" && (
                  <span className="shrink-0 rounded bg-warning/20 px-1.5 py-0.5 text-xs font-medium text-warning">
                    {t("caixa.estornoLabel")}
                  </span>
                )}
                {m.origem === "Gasto" && m.categoria && (
                  <span className="shrink-0 text-xs text-text-muted">
                    {CATEGORIA_ICONES[m.categoria] ?? "📋"} {m.categoria}
                  </span>
                )}
                {m.clienteNome && (
                  <span className="truncate text-xs text-text-muted">{m.clienteNome}</span>
                )}
                {m.descricao && (
                  <span className="truncate text-xs text-text-muted">{m.descricao}</span>
                )}
              </div>
                  <span className="shrink-0 text-xs text-text-muted">
                    {new Date(m.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {canAdjust && (
            <div className="mt-8">
              <SectionHeader title={t("caixa.ajustar")} />
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={ajusteValor}
                  onChange={(e) => setAjusteValor(maskMonetario(e.target.value))}
                  placeholder="R$ 0,00"
                  className="block w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAjustar}
                  className="flex-shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                >
                  {t("caixa.ajustarSalvar")}
                </button>
              </div>
              <input
                type="text"
                value={ajusteMotivo}
                onChange={(e) => setAjusteMotivo(e.target.value)}
                placeholder={t("caixa.ajustarMotivoPlaceholder")}
                className="mt-2 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
          )}

        </>
      ) : null}

      <ParcelasHojeModal
        open={parcelasModalOpen}
        items={parcelasHoje}
        loading={parcelasHojeLoading}
        onClose={() => setParcelasModalOpen(false)}
      />
      <PagamentosHojeModal
        open={pagamentosHojeModalOpen}
        items={pagamentosHoje}
        loading={pagamentosHojeLoading}
        onClose={() => setPagamentosHojeModalOpen(false)}
      />
      <PagamentosPeriodoModal
        open={pagamentosPeriodoModalOpen}
        items={pagamentosPeriodo}
        dataInicio={calcularSemana(semanaOffset).dataInicio}
        dataFim={calcularSemana(semanaOffset).dataFim}
        loading={pagamentosPeriodoLoading}
        onClose={() => setPagamentosPeriodoModalOpen(false)}
      />
      <ContratosSemanaModal
        open={contratosSemanaModalOpen}
        items={contratosSemana}
        loading={contratosSemanaLoading}
        onClose={() => setContratosSemanaModalOpen(false)}
      />
      {gastosAtivo && (
        <GastosPeriodoModal
          open={gastosPeriodoModalOpen}
          items={gastosPeriodo}
          dataInicio={calcularSemana(semanaOffset).dataInicio}
          dataFim={calcularSemana(semanaOffset).dataFim}
          loading={gastosPeriodoLoading}
          onClose={() => setGastosPeriodoModalOpen(false)}
        />
      )}

      <ConfirmModal
        open={liquidarModalOpen}
        title={t("caixa.liquidar")}
        message={t("caixa.liquidarConfirmacao")}
        onConfirm={handleLiquidar}
        onCancel={() => setLiquidarModalOpen(false)}
      />
    </div>
  )
}
