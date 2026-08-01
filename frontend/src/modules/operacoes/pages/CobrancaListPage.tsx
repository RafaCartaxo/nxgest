import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { listarCobrancasDoDia, listarPagamentosHoje, listarHistoricoAtrasos, ResultadoOperacional, type CobrancaDoDiaResult, type CobrancaItem, type PagamentoDoDiaItem, type SnapshotAtraso } from "../services/operacoes.service.js"
import { eventBus } from "../../../shared/events/eventBus.js"
import { ApiError } from "../../../api/client.js"
import { sortByDistance, useWatchPosition } from "../../../shared/utils/distance.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import { formatarData } from "../../../shared/utils/formatarData.js"
import { CobrancaList } from "../components/CobrancaList.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { SuccessState } from "../../../shared/components/SuccessState/SuccessState.js"

const filtrosResultado = [
  { key: "all", labelKey: "operacoes.todosResultados" },
  { key: "VISITADO", labelKey: "operacoes.resultado.visitado" },
  { key: "NAO_ENCONTRADO", labelKey: "operacoes.resultado.naoEncontrado" },
  { key: "PROMESSA", labelKey: "operacoes.resultado.promessa" },
]

const filtrosSituacao = [
  { key: "all", labelKey: "operacoes.todosResultados" },
  { key: "venceHoje", labelKey: "status.venceHoje" },
  { key: "atrasado", labelKey: "status.atrasado" },
]

export function CobrancaListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const filter = searchParams.get("filter")

  const { lat, lng, gpsAtivo } = useWatchPosition()
  const coordsRef = useRef({ lat, lng, gpsAtivo })
  coordsRef.current = { lat, lng, gpsAtivo }

  const [data, setData] = useState<CobrancaDoDiaResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagamentosHoje, setPagamentosHoje] = useState<PagamentoDoDiaItem[]>([])
  const [subFiltro, setSubFiltro] = useState("all")
  const [historico, setHistorico] = useState<SnapshotAtraso[]>([])
  const [historicoLoading, setHistoricoLoading] = useState(false)

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

  useEffect(() => {
    fetch()
    fetchPagamentos()
  }, [fetch, fetchPagamentos])

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        fetch()
        fetchPagamentos()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [fetch, fetchPagamentos])

  useEffect(() => {
    const off = eventBus.on("operacao:atualizada", () => { fetch(); fetchPagamentos() })
    return () => off()
  }, [fetch, fetchPagamentos])

  useEffect(() => {
    if (filter !== "atrasado") return
    setHistoricoLoading(true)
    listarHistoricoAtrasos(30)
      .then(setHistorico)
      .catch(() => setHistorico([]))
      .finally(() => setHistoricoLoading(false))
  }, [filter])

  const pendentes = useMemo(
    () => data ? (filter === "atrasado"
      ? data.cobrancas.filter(
          (i) => i.situacao === "atrasado" && (subFiltro === "all" || i.resultadoOperacional === subFiltro),
        )
      : sortByDistance(data.cobrancas, lat, lng).filter(
          (i) => i.resultadoOperacional === ResultadoOperacional.PENDENTE && (subFiltro === "all" || i.situacao === subFiltro),
        )
    ) : [],
    [data, lat, lng, filter, subFiltro],
  )

  const atrasadosResumo = useMemo(() => {
    if (filter !== "atrasado") return null
    const clientes = new Set(pendentes.map((i) => i.clienteId)).size
    const total = pendentes.reduce((s, i) => s + i.totalPendente, 0)
    return { clientes, total }
  }, [filter, pendentes])

  const completos = useMemo(
    () => data?.cobrancas.filter((i) => i.resultadoOperacional !== ResultadoOperacional.PENDENTE) ?? [],
    [data],
  )

  const pagosCount = useMemo(
    () => new Set(pagamentosHoje.map((p) => p.clienteId)).size,
    [pagamentosHoje],
  )

  const totalResolvidos = completos.length + pagosCount

  function handleCardClick(item: CobrancaItem) {
    if (filter === "atrasado") {
      navigate(`/contratos/${item.contratoId}`)
    } else {
      navigate("/rota", { state: { focusKey: `${item.clienteId}-${item.contratoId}` } })
    }
  }

  const filtrosAtivos = filter === "atrasado" ? filtrosResultado : filtrosSituacao

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-text-muted hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-3xl font-semibold">{filter === "atrasado" ? t("operacoes.atrasado") : t("operacoes.cobrancasDoDia")}</h1>
        {!(pendentes.length === 0 && totalResolvidos > 0) && (
          <button
            type="button"
            onClick={() => navigate("/rota")}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("operacoes.verNaRota")} →
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {filtrosAtivos.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setSubFiltro(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              subFiltro === f.key
                ? "bg-primary text-white"
                : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {atrasadosResumo && atrasadosResumo.clientes > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-danger bg-danger-light px-4 py-3">
          <span className="text-sm font-medium text-danger-text">
            {t("operacoes.atrasadosResumo", {
              clientes: atrasadosResumo.clientes,
              total: formatCurrency(atrasadosResumo.total),
            })}
          </span>
        </div>
      )}

      {error && (
        <ErrorBanner message={error} onRetry={fetch} className="mb-4" />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-md bg-secondary-light" />
          ))}
        </div>
      ) : pendentes.length === 0 && totalResolvidos > 0 ? (
        <SuccessState
          title={t("operacoes.todosAtendidos", { total: totalResolvidos })}
          linkLabel={t("operacoes.verResumo")}
          onLinkClick={() => navigate("/atendidos")}
        />
      ) : (
        <CobrancaList
          items={pendentes}
          operadorLat={lat}
          operadorLng={lng}
          onCardClick={handleCardClick}
        />
      )}

      {filter === "atrasado" && (
        <div className="mt-6">
          <h2 className="mb-2 text-xl font-semibold text-text-primary">{t("operacoes.historicoAtrasos")}</h2>
          {historicoLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-md bg-secondary-light" />
              ))}
            </div>
          ) : historico.length === 0 ? (
            <p className="rounded-md border border-border-light p-8 text-center text-sm text-text-muted">
              {t("operacoes.semHistoricoAtrasos")}
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-border-light">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light bg-surface-secondary text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                    <th className="px-4 py-2">{t("operacoes.historicoData")}</th>
                    <th className="px-4 py-2 text-right">{t("operacoes.historicoClientes")}</th>
                    <th className="px-4 py-2 text-right">{t("operacoes.historicoContratos")}</th>
                    <th className="px-4 py-2 text-right">{t("operacoes.historicoValor")}</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((h) => (
                    <tr key={h.data} className="border-b border-border-light last:border-b-0">
                      <td className="px-4 py-2">{formatarData(h.data, t)}</td>
                      <td className="px-4 py-2 text-right">{h.clientesAtrasados}</td>
                      <td className="px-4 py-2 text-right">{h.contratosAtrasados}</td>
                      <td className="px-4 py-2 text-right font-medium text-danger-text">
                        R$ {formatCurrency(h.valorAtrasado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
