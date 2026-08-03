import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { listarCobrancasDoDia, listarPagamentosHoje, listarParcelasHoje, listarParcelasSemana, ResultadoOperacional, type CobrancaDoDiaResult, type PagamentoDoDiaItem, type CobrancaItem, type ParcelaHojeCliente } from "../services/operacoes.service.js"
import { listGastos, type GastoItem } from "../../gasto/services/gasto.service.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { hasModule } from "../../../shared/modules/modules.js"
import { eventBus } from "../../../shared/events/eventBus.js"
import { ApiError } from "../../../api/client.js"
import { calcularDistancia, sortByDistance, useWatchPosition } from "../../../shared/utils/distance.js"
import { unmask, formatCurrency } from "../../../shared/utils/masks.js"
import { buildMapsUrl } from "../../../shared/utils/maps.js"
import { IndicadoresCards } from "../components/IndicadoresCards.js"
import { CobrancaCard } from "../components/CobrancaCard.js"
import { RotaCobrancaSection } from "../components/RotaCobrancaSection.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { Carousel } from "../../../shared/components/Carousel/Carousel.js"
import { PagamentosHojeModal } from "../components/PagamentosHojeModal.js"
import { ParcelasHojeModal } from "../components/ParcelasHojeModal.js"
import { GastosPeriodoModal } from "../../caixa/components/GastosPeriodoModal.js"
import { SuccessState } from "../../../shared/components/SuccessState/SuccessState.js"
import { totalClientesAtendidos } from "../utils/atendimento.js"
import { getLocalDateString } from "../../../shared/utils/parseDateLocal.js"

export function OperacoesDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const modulos = user?.modulos
  const gastosAtivo = hasModule(modulos, "gastos")
  const rotaAtivo = hasModule(modulos, "rota")
  const cobrancasAtivo = hasModule(modulos, "cobrancas")
  const atendidosAtivo = hasModule(modulos, "atendidos")
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
  }, [t])

  const fetchPagamentos = useCallback(async () => {
    try {
      const result = await listarPagamentosHoje()
      setPagamentosHoje(result)
    } catch {
      setPagamentosHoje([])
    }
  }, [])

  const fetchGastos = useCallback(async () => {
    try {
      const hoje = getLocalDateString(new Date())
      const result = await listGastos({ dataInicio: hoje, dataFim: hoje, limit: 1 })
      setGastosHoje(result.totalPeriodo)
    } catch {
      setGastosHoje(0)
    }
  }, [])

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

  const distanciaTotal = data?.cobrancas.reduce((sum, item) => {
    if (lat && lng && item.clienteLat && item.clienteLng) {
      return sum + calcularDistancia(lat, lng, item.clienteLat, item.clienteLng)
    }
    return sum
  }, 0) ?? 0

  const sortedCobrancas = useMemo(
    () => data ? sortByDistance(data.cobrancas, lat, lng) : [],
    [data, lat, lng],
  )

  const itemsOrdenados = useMemo(
    () => sortedCobrancas.filter((i) => i.resultadoOperacional === ResultadoOperacional.PENDENTE),
    [sortedCobrancas],
  )

  const totalResolvidos = totalClientesAtendidos(sortedCobrancas, pagamentosHoje)

  const navigate = useNavigate()

  function calcularDistanciaParaItem(item: CobrancaItem): number | null {
    return lat && lng && item.clienteLat && item.clienteLng
      ? calcularDistancia(lat, lng, item.clienteLat, item.clienteLng)
      : null
  }

  function handleWhatsApp(item: CobrancaItem) {
    const tel = unmask(item.clienteTelefone)
    const msg = encodeURIComponent(
      t("operacoes.whatsappTemplate", { nome: item.clienteNome, valor: formatCurrency(item.totalPendente) })
    )
    window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank")
  }

  function handleLigar(item: CobrancaItem) {
    window.location.href = `tel:+55${unmask(item.clienteTelefone)}`
  }

  function handleAbrirContrato(item: CobrancaItem) {
    navigate(`/contratos/${item.contratoId}`)
  }

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

  function handleNavegar(item: CobrancaItem) {
    const url = buildMapsUrl(item)
    if (url) window.open(url, "_blank")
  }

  function handleCardClick(item: CobrancaItem) {
    navigate("/rota", { state: { focusKey: `${item.clienteId}-${item.contratoId}` } })
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-3xl font-semibold">{t("operacoes.title")}</h1>

      {error && (
        <ErrorBanner message={error} onRetry={fetch} className="mb-4" />
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-md bg-secondary-light" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-md bg-secondary-light" />
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
          {rotaAtivo && (
            <RotaCobrancaSection
              totalClientes={new Set(itemsOrdenados.map((i) => i.clienteId)).size}
              distanciaTotal={Math.round(distanciaTotal * 10) / 10}
            />
          )}
          {itemsOrdenados.length > 0 || totalResolvidos > 0 ? (
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
                    <CobrancaCard
                      variant="compact"
                      clienteNome={item.clienteNome}
                      totalPendente={item.totalPendente}
                      quantidadeParcelas={item.quantidadeParcelas}
                      situacao={item.situacao}
                      resultadoOperacional={item.resultadoOperacional}
                      distancia={calcularDistanciaParaItem(item)}
                      onCardClick={() => handleCardClick(item)}
                      onNavigate={() => handleNavegar(item)}
                      onWhatsApp={() => handleWhatsApp(item)}
                      onLigar={() => handleLigar(item)}
                      onAbrir={() => handleAbrirContrato(item)}
                    />
                  )}
                />
              ) : (
                <SuccessState
                  title={t("operacoes.todosAtendidos", { total: totalResolvidos })}
                  linkLabel={t("operacoes.verResumo")}
                  onLinkClick={() => navigate("/atendidos")}
                />
              )}
            </div>
          ) : null}
        </>
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
