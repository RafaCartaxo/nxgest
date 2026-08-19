import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ChevronRight, ClipboardList } from "lucide-react"
import { ResultadoOperacional, type CobrancaItem } from "../services/operacoes.service.js"
import { totalClientesAtendidos, resumoAtendidos } from "../utils/atendimento.js"
import { useCobrancas, usePagamentosHoje } from "../hooks/useOperacoes.js"
import { ApiError } from "../../../api/client.js"
import { sortByDistance, useWatchPosition } from "../../../shared/utils/distance.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import { CobrancaList } from "../components/CobrancaList.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { SuccessState } from "../../../shared/components/SuccessState/SuccessState.js"
import { Button } from "../../../shared/components/Button.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"

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

  // PLAN-083 Fase 8.1: queries compartilhadas (cache + dedupe). `refetchOnWindowFocus` +
  // invalidação pós-mutação substituem o eventBus e o visibilitychange.
  const cobrancasQuery = useCobrancas(true, () => coordsRef.current)
  const pagamentosQuery = usePagamentosHoje(true)
  const data = cobrancasQuery.data
  const loading = cobrancasQuery.isLoading
  const error = cobrancasQuery.isError
    ? (cobrancasQuery.error instanceof ApiError ? cobrancasQuery.error.message : t("operacoes.error"))
    : null
  const pagamentosHoje = pagamentosQuery.data ?? []
  const [subFiltro, setSubFiltro] = useState("all")

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
    const clientes = new Set(pendentes.map((i) => i.clienteId))
    const total = pendentes.reduce((s, i) => s + i.totalPendente, 0)
    const porResultado = { PENDENTE: new Set<string>(), VISITADO: new Set<string>(), NAO_ENCONTRADO: new Set<string>(), PROMESSA: new Set<string>() }
    for (const i of pendentes) {
      const r = i.resultadoOperacional
      if (r === "PENDENTE" || r === "VISITADO" || r === "NAO_ENCONTRADO" || r === "PROMESSA") porResultado[r].add(i.clienteId)
    }
    return {
      clientes: clientes.size,
      total,
      pendente: porResultado.PENDENTE.size,
      visitado: porResultado.VISITADO.size,
      naoEncontrado: porResultado.NAO_ENCONTRADO.size,
      promessa: porResultado.PROMESSA.size,
    }
  }, [filter, pendentes])

  // Contadores dos chips de situação (pendentes) — clientes distintos por situacao
  const situacaoCounts = useMemo(() => {
    if (filter === "atrasado") return null
    const pendentesSituacao = data?.cobrancas.filter((i) => i.resultadoOperacional === ResultadoOperacional.PENDENTE) ?? []
    const sets = { all: new Set<string>(), venceHoje: new Set<string>(), atrasado: new Set<string>() }
    for (const i of pendentesSituacao) {
      sets.all.add(i.clienteId)
      if (i.situacao === "venceHoje") sets.venceHoje.add(i.clienteId)
      else if (i.situacao === "atrasado") sets.atrasado.add(i.clienteId)
    }
    return { all: sets.all.size, venceHoje: sets.venceHoje.size, atrasado: sets.atrasado.size }
  }, [data, filter])

  // Contadores dos chips de resultado (atrasados) — clientes distintos por subtipo
  const atrasadosCounts = useMemo(() => {
    if (filter !== "atrasado") return null
    const atrasados = data?.cobrancas.filter((i) => i.situacao === "atrasado") ?? []
    const sets = { all: new Set<string>(), VISITADO: new Set<string>(), NAO_ENCONTRADO: new Set<string>(), PROMESSA: new Set<string>() }
    for (const i of atrasados) {
      sets.all.add(i.clienteId)
      const r = i.resultadoOperacional
      if (r === "VISITADO" || r === "NAO_ENCONTRADO" || r === "PROMESSA") sets[r].add(i.clienteId)
    }
    return { all: sets.all.size, VISITADO: sets.VISITADO.size, NAO_ENCONTRADO: sets.NAO_ENCONTRADO.size, PROMESSA: sets.PROMESSA.size }
  }, [data, filter])

  const countFor = (key: string): number => {
    if (filter === "atrasado") {
      return atrasadosCounts?.[key as keyof typeof atrasadosCounts] ?? 0
    }
    return situacaoCounts?.[key as keyof typeof situacaoCounts] ?? 0
  }

  const totalResolvidos = totalClientesAtendidos(data?.cobrancas ?? [], pagamentosHoje)
  const resumo = useMemo(() => resumoAtendidos(data?.cobrancas ?? [], pagamentosHoje), [data, pagamentosHoje])
  const atendidosDetail = t("operacoes.resumoAtendidosDetail", {
    visitado: resumo.visitado,
    naoEncontrado: resumo.naoEncontrado,
    promessa: resumo.promessa,
    pagos: resumo.pagos,
  })

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
      <PageHeader
        icon={ClipboardList}
        title={filter === "atrasado" ? t("operacoes.atrasado") : t("operacoes.cobrancasDoDia")}
        subtitle={t("operacoes.subtitleCobrancas")}
        back={{ onClick: () => navigate(-1), title: t("common.back") }}
        action={!(pendentes.length === 0 && totalResolvidos > 0) ? (
          <Button variant="ghost" size="sm" onClick={() => navigate("/rota")}>
            {t("operacoes.verNaRota")} <ChevronRight className="size-4" />
          </Button>
        ) : undefined}
      />

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
            {t(f.labelKey)} ({countFor(f.key)})
          </button>
        ))}
      </div>

      {atrasadosResumo && atrasadosResumo.clientes > 0 && (
        <div className="mb-4 rounded-xl border border-danger bg-danger-light px-4 py-3">
          <span className="block text-sm font-medium text-danger-text">
            {t("operacoes.atrasadosResumo", {
              clientes: atrasadosResumo.clientes,
              total: formatCurrency(atrasadosResumo.total),
            })}
          </span>
          <span className="mt-1 block text-xs text-danger-text/80">
            {t("operacoes.atrasadosResumoDetail", {
              pendente: atrasadosResumo.pendente,
              visitado: atrasadosResumo.visitado,
              naoEncontrado: atrasadosResumo.naoEncontrado,
              promessa: atrasadosResumo.promessa,
            })}
          </span>
        </div>
      )}

      {error && (
        <ErrorBanner message={error} onRetry={() => cobrancasQuery.refetch()} className="mb-4" />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-md bg-surface-hover" />
          ))}
        </div>
      ) : pendentes.length === 0 && totalResolvidos > 0 ? (
        <SuccessState
          title={t("operacoes.todosAtendidos", { total: totalResolvidos })}
          detail={atendidosDetail}
          linkLabel={t("operacoes.verResumo")}
          onLinkClick={() => navigate("/atendidos")}
        />
      ) : (
        <CobrancaList
          items={pendentes}
          onCardClick={handleCardClick}
        />
      )}
    </div>
  )
}
