import { useCallback, useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, Receipt, Wallet } from "lucide-react"
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
import { maskMonetario, formatCurrency } from "../../../shared/utils/masks.js"
import { Button } from "../../../shared/components/Button.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { GastosPeriodoModal } from "../components/GastosPeriodoModal.js"
import { AjustarCaixaModal } from "../components/AjustarCaixaModal.js"
import { CaixaKpis } from "../components/CaixaKpis.js"
import { AjusteRow } from "../components/AjusteHistorico.js"
import { MovimentacaoRow } from "../components/MovimentacoesList.js"
import { CollapsibleSection } from "../../../shared/components/CollapsibleSection/CollapsibleSection.js"
import { listGastos, type GastoItem } from "../../gasto/services/gasto.service.js"
import { getLocalDateString } from "../../../shared/utils/parseDateLocal.js"

export function CaixaPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const feedback = useFeedback()
  const { user } = useAuth()

  // Ajuste do Caixa Base é exclusivo de admin/super_admin/socio (BR-325: sócio
  // com mesmas funções do admin em escopo de subárvore — backend já aceita).
  const canAdjust = user?.role === "admin" || user?.role === "super_admin" || user?.role === "socio"
  const gastosAtivo = hasModule(user?.modulos, "gastos")

  const [status, setStatus] = useState<CaixaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ajustarModalOpen, setAjustarModalOpen] = useState(false)
  const [liquidarModalOpen, setLiquidarModalOpen] = useState(false)

  // PLAN-083 Fase 8.3: movimentações/auditoria só são buscadas quando a seção está expandida
  // (lazy com `enabled`) — antes rodavam no mount mesmo com as seções `defaultCollapsed`.
  const queryClient = useQueryClient()
  const [movOpen, setMovOpen] = useState(false)
  const [audOpen, setAudOpen] = useState(false)
  const movQuery = useQuery({
    queryKey: ["caixa", "movimentacoes", { limit: 20 }],
    queryFn: () => listarMovimentacoes({ limit: 20 }),
    enabled: movOpen,
  })
  const audQuery = useQuery({
    queryKey: ["caixa", "auditoria", { limit: 20 }],
    queryFn: () => listarAuditoriaCaixa({ limit: 20 }),
    enabled: audOpen,
  })
  const movimentacoes = movQuery.data?.data ?? []
  const auditoria = audQuery.data?.data ?? []

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
      const s = await getCaixaStatus(dataInicio, dataFim)
      setStatus(s)
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

  async function handleAjustar(valor: number, motivo: string) {
    await feedback.run({
      loading: t("common.saving"),
      success: t("caixa.ajustarSucesso"),
      error: t("caixa.ajustarErro"),
      action: async () => {
        await ajustarCaixaBase(valor, motivo)
        setAjustarModalOpen(false)
        queryClient.invalidateQueries({ queryKey: ["caixa", "movimentacoes"] })
        queryClient.invalidateQueries({ queryKey: ["caixa", "auditoria"] })
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
        queryClient.invalidateQueries({ queryKey: ["caixa", "movimentacoes"] })
        queryClient.invalidateQueries({ queryKey: ["caixa", "auditoria"] })
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
        action={<Button variant="primary" size="sm" onClick={() => setLiquidarModalOpen(true)}><Wallet className="size-4" /> {t("caixa.liquidar")}</Button>}
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
          <div className="mb-6">
            <CaixaKpis
              caixa={status}
              kpis={["aReceberHoje", "recebidoSemana", "cobradoHoje"]}
              onKpiClick={{
                aReceberHoje: handleAReceberClick,
                recebidoSemana: handleCobradoSemanaClick,
                cobradoHoje: handleRecebidoHojeClick,
              }}
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
              variant={status.resultadoSemana >= 0 ? "green" : "danger"}
              title={t("caixa.resultadoSemana")}
              value={`R$ ${formatCurrency(Math.abs(status.resultadoSemana))}`}
              valueClassName={status.resultadoSemana >= 0 ? "text-success-text" : "text-danger-text"}
            />
          </div>

          <SectionHeader title={t("caixa.title")} />
          {status.ultimaLiquidacao && (
            <div className="mb-2 rounded-xl bg-surface-secondary px-3 py-2 text-sm">
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
          <div className="mb-6">
            <CaixaKpis caixa={status} kpis={["lucro", "saldoAtual", "caixaBase"]} />
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
                <Receipt className="size-4" /> {t("gasto.registrar")}
              </Button>
            )}
          </div>

          <CollapsibleSection
            title={t("caixa.movimentacoes")}
            count={movimentacoes.length}
            items={movimentacoes}
            renderItem={(m) => <MovimentacaoRow key={m.id} movimentacao={m} />}
            limit={8}
            open={movOpen}
            onToggle={setMovOpen}
          />

          {canAdjust && (
            <div className="mt-8">
              <Button type="button" variant="primary" className="w-full" onClick={() => setAjustarModalOpen(true)}>
                <Wallet className="size-4" /> {t("caixa.ajustar")}
              </Button>
            </div>
          )}

          <div className="mt-6">
            <CollapsibleSection
              title={t("caixa.historicoAjustes")}
              count={auditoria.length}
              items={auditoria}
              renderItem={(a) => <AjusteRow key={a.id} ajuste={a} />}
              limit={8}
              open={audOpen}
              onToggle={setAudOpen}
            />
          </div>

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

      {status && (
        <AjustarCaixaModal
          open={ajustarModalOpen}
          onClose={() => setAjustarModalOpen(false)}
          caixaBase={status.caixaBase}
          saldoAtual={status.saldoAtual}
          title={t("caixa.ajustarTituloModal")}
          onAjustar={handleAjustar}
        />
      )}
    </div>
  )
}
