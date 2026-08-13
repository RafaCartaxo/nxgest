import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { listarCobrancasDoDia, listarPagamentosHoje, listarParcelasHoje, listarParcelasSemana, ResultadoOperacional, type CobrancaDoDiaResult, type PagamentoDoDiaItem, type CobrancaItem, type ParcelaHojeCliente } from "../services/operacoes.service.js"
import { listGastos, type GastoItem } from "../../gasto/services/gasto.service.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { isWidgetActive } from "../../../shared/modules/modules.js"
import { eventBus } from "../../../shared/events/eventBus.js"
import { ApiError } from "../../../api/client.js"
import { sortByDistance, useWatchPosition } from "../../../shared/utils/distance.js"
import { IndicadoresCards } from "../components/IndicadoresCards.js"
import { CobrancaCard } from "../components/CobrancaCard.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { Carousel } from "../../../shared/components/Carousel/Carousel.js"
import { PagamentosHojeModal } from "../components/PagamentosHojeModal.js"
import { ParcelasHojeModal } from "../components/ParcelasHojeModal.js"
import { GastosPeriodoModal } from "../../caixa/components/GastosPeriodoModal.js"
import { SuccessState } from "../../../shared/components/SuccessState/SuccessState.js"
import { totalClientesAtendidos, resumoAtendidos } from "../utils/atendimento.js"
import { getLocalDateString } from "../../../shared/utils/parseDateLocal.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { QuickActions } from "../../../shared/components/QuickActions/QuickActions.js"
import { LayoutDashboard, Banknote, MapPinned, UserPlus } from "lucide-react"

export function OperacoesDashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const modulos = user?.modulos
  const contratosAtivo = isWidgetActive(modulos, "aReceberHoje")
  const gastosAtivo = isWidgetActive(modulos, "gastosHoje")
  const rotaAtivo = isWidgetActive(modulos, "minhaRota")
  const cobrancasAtivo = isWidgetActive(modulos, "pendentesDia")
  const atendidosAtivo = isWidgetActive(modulos, "atendidosHoje")
  const [data, setData] = useState<CobrancaDoDiaResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pagamentosHoje, setPagamentosHoje] = useState<PagamentoDoDiaItem[]>([])
  const [pagamentosModalOpen, setPagamentosModalOpen] = useState(false)

  const [parcelasHoje, setParcelasHoje] = useState<ParcelaHojeCliente[]>([])
  const [parcelasModalOpen, setParcelasModalOpen] = useState(false)
  const [parcelasHojeLoading, setParcelasHojeLoading] = useState(false)
  const [pagamentosHojeLoading, setPagamentosHojeLoading] = useState(false)

  const [parcelasSemana, setParcelasSemana] = useState<ParcelaHojeCliente[]>([])
  const [parcelasSemanaModalOpen, setParcelasSemanaModalOpen] = useState(false)
  const [parcelasSemanaLoading, setParcelasSemanaLoading] = useState(false)

  const [gastosHoje, setGastosHoje] = useState(0)
  const [gastosHojeItems, setGastosHojeItems] = useState<GastoItem[]>([])
  const [gastosHojeModalOpen, setGastosHojeModalOpen] = useState(false)
  const [gastosHojeLoading, setGastosHojeLoading] = useState(false)

  const { lat, lng, gpsAtivo } = useWatchPosition()
  const coordsRef = useRef({ lat, lng, gpsAtivo })
  coordsRef.current = { lat, lng, gpsAtivo }

  const fetch = useCallback(async () => {
    if (!contratosAtivo) {
      setData(null)
      setLoading(false)
      return
    }
    const { lat: refLat, lng: refLng, gpsAtivo: refGps } = coordsRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await listarCobrancasDoDia(
        refGps && typeof refLat === "number" ? refLat : undefined,
        refGps && typeof refLng === "number" ? refLng : undefined,
      )
      setData(result)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(t("operacoes.error"))
      }
    } finally {
      setLoading(false)
    }
  }, [t, contratosAtivo])

  const fetchPagamentos = useCallback(async () => {
    if (!contratosAtivo) return
    try {
      const result = await listarPagamentosHoje()
      setPagamentosHoje(result)
    } catch {
      setPagamentosHoje([])
    }
  }, [contratosAtivo])

  const fetchGastos = useCallback(async () => {
    if (!gastosAtivo) return
    try {
      const hoje = getLocalDateString(new Date())
      const result = await listGastos({ dataInicio: hoje, dataFim: hoje, limit: 1 })
      setGastosHoje(result.totalPeriodo)
    } catch {
      setGastosHoje(0)
    }
  }, [gastosAtivo])

  useEffect(() => {
    fetch()
    fetchPagamentos()
    fetchGastos()
  }, [fetch, fetchPagamentos, fetchGastos])

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        fetch()
        fetchPagamentos()
        fetchGastos()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [fetch, fetchPagamentos, fetchGastos])

  useEffect(() => {
    const off = eventBus.on("operacao:atualizada", () => { fetch(); fetchPagamentos(); fetchGastos() })
    return () => off()
  }, [fetch, fetchPagamentos, fetchGastos])

  const resultadoDoDia = data
    ? data.indicadores.recebidoHoje - data.indicadores.aReceberHoje
    : 0

  const sortedCobrancas = useMemo(
    () => data ? sortByDistance(data.cobrancas, lat, lng) : [],
    [data, lat, lng],
  )

  const itemsOrdenados = useMemo(
    () => sortedCobrancas.filter((i) => i.resultadoOperacional === ResultadoOperacional.PENDENTE),
    [sortedCobrancas],
  )

  const totalResolvidos = totalClientesAtendidos(sortedCobrancas, pagamentosHoje)
  const resumo = useMemo(() => resumoAtendidos(sortedCobrancas, pagamentosHoje), [sortedCobrancas, pagamentosHoje])
  const atendidosDetail = t("operacoes.resumoAtendidosDetail", {
    visitado: resumo.visitado,
    naoEncontrado: resumo.naoEncontrado,
    promessa: resumo.promessa,
    pagos: resumo.pagos,
  })

  const navigate = useNavigate()

  function handleGastosHojeClick() {
    const hoje = getLocalDateString(new Date())
    setGastosHojeLoading(true)
    setGastosHojeModalOpen(true)
    listGastos({ dataInicio: hoje, dataFim: hoje, limit: 100 })
      .then((r) => setGastosHojeItems(r.data))
      .catch(() => setGastosHojeItems([]))
      .finally(() => setGastosHojeLoading(false))
  }

  function handleAReceberClick() {
    setParcelasHojeLoading(true)
    setParcelasModalOpen(true)
    listarParcelasHoje()
      .then(setParcelasHoje)
      .catch(() => setParcelasHoje([]))
      .finally(() => setParcelasHojeLoading(false))
  }

  function handleAVencerClick() {
    setParcelasSemanaLoading(true)
    setParcelasSemanaModalOpen(true)
    listarParcelasSemana()
      .then(setParcelasSemana)
      .catch(() => setParcelasSemana([]))
      .finally(() => setParcelasSemanaLoading(false))
  }

  function handleCardClick(item: CobrancaItem) {
    navigate("/rota", { state: { focusKey: `${item.clienteId}-${item.contratoId}` } })
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={LayoutDashboard}
        title={t("operacoes.title")}
        subtitle={t("operacoes.subtitle")}
        eyebrow={new Date()
          .toLocaleDateString(i18n.language === "en" ? "en-US" : i18n.language === "es" ? "es-ES" : "pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })
          .replace(/^\w/, (c) => c.toUpperCase())}
      />

      {error && (
        <ErrorBanner message={error} onRetry={fetch} className="mb-4" />
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-md bg-surface-hover" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-md bg-surface-hover" />
        </div>
      ) : data ? (
        <>
          <IndicadoresCards
            aReceberHoje={data.indicadores.aReceberHoje}
            recebidoHoje={data.indicadores.recebidoHoje}
            clientesParaCobrar={data.indicadores.clientesParaCobrar}
            resultadoDoDia={resultadoDoDia}
            atrasado={data.indicadores.atrasado}
            aVencer={data.indicadores.aVencer}
            gastosHoje={gastosHoje}
            hideGastos={!gastosAtivo}
            hideCobrancas={!cobrancasAtivo}
            onRecebidoClick={() => {
              setPagamentosHojeLoading(true)
              setPagamentosModalOpen(true)
              fetchPagamentos().finally(() => setPagamentosHojeLoading(false))
            }}
            onAReceberClick={handleAReceberClick}
            onPendentesClick={cobrancasAtivo ? () => navigate("/cobrancas") : undefined}
            onAtrasadoClick={cobrancasAtivo ? () => navigate("/cobrancas?filter=atrasado") : undefined}
            onAVencerClick={handleAVencerClick}
            onGastosClick={gastosAtivo ? handleGastosHojeClick : undefined}
          />

          <div className="mb-6">
            <h2 className="mb-3 font-display text-[18px] font-semibold">{t("operacoes.acoesRapidas")}</h2>
            <QuickActions
              layout="grid"
              actions={[
                { icon: Banknote, label: t("operacoes.receber"), onClick: () => navigate("/cobrancas"), variant: "green", show: cobrancasAtivo },
                { icon: MapPinned, label: t("operacoes.minhaRota"), onClick: () => navigate("/rota"), variant: "blue", show: rotaAtivo },
                { icon: UserPlus, label: t("operacoes.novoCliente"), onClick: () => navigate("/clientes/novo"), variant: "blue", show: isWidgetActive(modulos, "novoCliente") },
              ]}
            />
          </div>

          {cobrancasAtivo && (itemsOrdenados.length > 0 || totalResolvidos > 0) ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">{t("operacoes.cobrancasDoDia")}</h2>
                <div className="flex items-center gap-3">
                  {atendidosAtivo && (
                    <button
                      type="button"
                      onClick={() => navigate("/atendidos")}
                      className="text-sm font-medium text-text-secondary hover:text-text-primary hover:underline"
                    >
                      {t("operacoes.atendidosHoje")}
                      {totalResolvidos > 0 && (
                        <span className="ml-1 rounded-full bg-surface-hover px-1.5 py-0.5 text-xs">
                          {totalResolvidos}
                        </span>
                      )}
                      →
                    </button>
                  )}
                  {cobrancasAtivo && (
                    <button
                      type="button"
                      onClick={() => navigate("/cobrancas")}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t("operacoes.verPendentes")}
                    </button>
                  )}
                </div>
              </div>
              {itemsOrdenados.length > 0 ? (
                <Carousel
                  mode="scroll"
                  items={itemsOrdenados}
                  maxDots={5}
                  renderItem={(item) => (
                    <CobrancaCard item={item} onClick={() => handleCardClick(item)} />
                  )}
                />
              ) : (
                <SuccessState
                  title={t("operacoes.todosAtendidos", { total: totalResolvidos })}
                  detail={atendidosDetail}
                  linkLabel={atendidosAtivo ? t("operacoes.verResumo") : undefined}
                  onLinkClick={atendidosAtivo ? () => navigate("/atendidos") : undefined}
                />
              )}
            </div>
          ) : null}
        </>
      ) : !contratosAtivo ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-text-secondary">
          <p className="text-sm">{t("operacoes.centralVazia")}</p>
        </div>
      ) : null}
      <PagamentosHojeModal
        open={pagamentosModalOpen}
        items={pagamentosHoje}
        loading={pagamentosHojeLoading}
        onClose={() => setPagamentosModalOpen(false)}
      />
      <ParcelasHojeModal
        open={parcelasModalOpen}
        items={parcelasHoje}
        loading={parcelasHojeLoading}
        onClose={() => setParcelasModalOpen(false)}
      />
      <ParcelasHojeModal
        open={parcelasSemanaModalOpen}
        items={parcelasSemana}
        loading={parcelasSemanaLoading}
        title={t("operacoes.aVencer")}
        onClose={() => setParcelasSemanaModalOpen(false)}
      />
      <GastosPeriodoModal
        open={gastosHojeModalOpen}
        items={gastosHojeItems}
        dataInicio={getLocalDateString(new Date())}
        dataFim={getLocalDateString(new Date())}
        loading={gastosHojeLoading}
        onClose={() => setGastosHojeModalOpen(false)}
      />
    </div>
  )
}
