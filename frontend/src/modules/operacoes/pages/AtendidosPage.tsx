import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import { listarCobrancasDoDia, listarPagamentosHoje, ResultadoOperacional, type CobrancaDoDiaResult, type PagamentoDoDiaItem } from "../services/operacoes.service.js"
import { eventBus } from "../../../shared/events/eventBus.js"
import { ApiError } from "../../../api/client.js"
import { sortByDistance, useWatchPosition } from "../../../shared/utils/distance.js"
import { resumoAtendidos } from "../utils/atendimento.js"
import { CobrancaList } from "../components/CobrancaList.js"
import { PagamentoCard } from "../components/PagamentoCard.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"

type Filtro = "all" | "VISITADO" | "NAO_ENCONTRADO" | "PROMESSA" | "PAGOS"

const filtros: { key: Filtro; labelKey: string }[] = [
  { key: "all", labelKey: "operacoes.todosResultados" },
  { key: "VISITADO", labelKey: "operacoes.resultado.visitado" },
  { key: "NAO_ENCONTRADO", labelKey: "operacoes.resultado.naoEncontrado" },
  { key: "PROMESSA", labelKey: "operacoes.resultado.promessa" },
  { key: "PAGOS", labelKey: "operacoes.resumo.pagos" },
]

export function AtendidosPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { lat, lng, gpsAtivo } = useWatchPosition()
  const coordsRef = useRef({ lat, lng, gpsAtivo })
  coordsRef.current = { lat, lng, gpsAtivo }

  const [data, setData] = useState<CobrancaDoDiaResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>("all")
  const [pagamentosHoje, setPagamentosHoje] = useState<PagamentoDoDiaItem[]>([])

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
    const off = eventBus.on("operacao:atualizada", () => { fetch(); fetchPagamentos() })
    return () => off()
  }, [fetch, fetchPagamentos])

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") { fetch(); fetchPagamentos() }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [fetch, fetchPagamentos])

  const completos = useMemo(
    () => data ? sortByDistance(
      data.cobrancas.filter((i) => i.resultadoOperacional !== ResultadoOperacional.PENDENTE),
      lat, lng,
    ) : [],
    [data, lat, lng],
  )

  const filteredItems = useMemo(() => {
    if (filtro === "all") return completos
    return completos.filter((i) => i.resultadoOperacional === filtro)
  }, [completos, filtro])

  const completosSemPagos = useMemo(
    () => {
      const pagosClientes = new Set(pagamentosHoje.map((p) => p.clienteId))
      return completos.filter((i) => !pagosClientes.has(i.clienteId))
    },
    [completos, pagamentosHoje],
  )

  const resumo = useMemo(
    () => resumoAtendidos(data?.cobrancas ?? [], pagamentosHoje),
    [data, pagamentosHoje],
  )

  const countFor = (key: Filtro): number =>
    key === "all" ? resumo.total
      : key === "VISITADO" ? resumo.visitado
      : key === "NAO_ENCONTRADO" ? resumo.naoEncontrado
      : key === "PROMESSA" ? resumo.promessa
      : resumo.pagos

  function renderPagamentos() {
    if (pagamentosHoje.length === 0) return null
    // Agrupa por cliente (jornada de rota: 1 contrato por vez) — soma parcelas pagas do dia.
    const porCliente = new Map<string, { pagamento: PagamentoDoDiaItem; parcelas: number[]; valor: number }>()
    for (const p of pagamentosHoje) {
      const grupo = porCliente.get(p.clienteId) ?? { pagamento: p, parcelas: [], valor: 0 }
      grupo.parcelas = Array.from(new Set([...grupo.parcelas, ...p.parcelasPagas]))
      grupo.valor += p.valor
      porCliente.set(p.clienteId, grupo)
    }
    return (
      <div className="space-y-2">
        {[...porCliente.values()].map((grupo) => (
          <PagamentoCard
            key={grupo.pagamento.clienteId}
            item={{
              ...grupo.pagamento,
              valor: grupo.valor,
              parcelasPagas: grupo.parcelas,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={CheckCircle2}
        title={t("operacoes.atendidosHoje")}
        subtitle={t("operacoes.subtitleAtendidos")}
        back={{ onClick: () => navigate(-1), title: t("common.back") }}
      />

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {filtros.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltro(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filtro === f.key
                ? "bg-primary text-white"
                : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {t(f.labelKey)} ({countFor(f.key)})
          </button>
        ))}
      </div>

      {error && (
        <ErrorBanner message={error} onRetry={fetch} className="mb-4" />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-md bg-surface-hover" />
          ))}
        </div>
      ) : filtro === "PAGOS" ? (
        pagamentosHoje.length === 0 ? (
          <p className="py-8 text-center text-text-secondary">{t("operacoes.nenhumaCobranca")}</p>
        ) : (
          renderPagamentos()
        )
      ) : filtro === "all" ? (
        completosSemPagos.length === 0 && pagamentosHoje.length === 0 ? (
          <p className="py-8 text-center text-text-secondary">{t("operacoes.nenhumAtendimento")}</p>
        ) : (
          <div className="space-y-4">
            {completosSemPagos.length > 0 && (
              <CobrancaList
                items={completosSemPagos}
                emptyMessageKey="operacoes.nenhumAtendimento"
              />
            )}
            {renderPagamentos()}
          </div>
        )
      ) : (
        <CobrancaList
          items={filteredItems}
          emptyMessageKey="operacoes.nenhumAtendimento"
        />
      )}
    </div>
  )
}
