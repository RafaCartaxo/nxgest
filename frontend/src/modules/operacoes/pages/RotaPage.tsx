import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { eventBus } from "../../../shared/events/eventBus.js"
import { useTranslation } from "react-i18next"
import { useNavigate, useLocation } from "react-router-dom"
import { Navigation, MessageCircle, Phone, FileText, X, Share2, UserCheck, MapPinOff, CalendarClock, MapPin, Route } from "lucide-react"
import { listarCobrancasDoDia, listarPagamentosHoje, registrarVisita, ResultadoOperacional, type CobrancaItem, type PagamentoDoDiaItem } from "../services/operacoes.service.js"
import { ApiError } from "../../../api/client.js"
import { calcularDistancia, sortByDistance, sortByDistanceOnly, useWatchPosition } from "../../../shared/utils/distance.js"
import { CobrancaCard } from "../components/CobrancaCard.js"
import { unmask, formatCurrency } from "../../../shared/utils/masks.js"
import { gerarComprovante } from "../../../shared/utils/comprovante.js"
import { buildMapsUrl } from "../../../shared/utils/maps.js"
import { Button } from "../../../shared/components/Button.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { QuickActions } from "../../../shared/components/QuickActions/QuickActions.js"
import { getLocalDateString } from "../../../shared/utils/parseDateLocal.js"
import { RouteProgress } from "../components/RouteProgress.js"
import { Card } from "../../../shared/components/Card/Card.js"
import { Carousel } from "../../../shared/components/Carousel/Carousel.js"
import { SuccessState } from "../../../shared/components/SuccessState/SuccessState.js"
import { totalClientesAtendidos, resumoAtendidos } from "../utils/atendimento.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { PagamentoModal, type PagamentoSuccessData } from "../../pagamento/components/PagamentoModal.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"

function formatarParcelasTexto(pagasRange: { inicio: number; fim: number } | null): string {
  if (!pagasRange) return ""
  if (pagasRange.inicio === pagasRange.fim) {
    return `Parcela ${String(pagasRange.inicio).padStart(2, "0")}`
  }
  return `Parcelas ${String(pagasRange.inicio).padStart(2, "0")} a ${String(pagasRange.fim).padStart(2, "0")}`
}

function formatarDataHora(): string {
  const agora = new Date()
  const dia = String(agora.getDate()).padStart(2, "0")
  const mes = String(agora.getMonth() + 1).padStart(2, "0")
  const ano = agora.getFullYear()
  const hora = String(agora.getHours()).padStart(2, "0")
  const min = String(agora.getMinutes()).padStart(2, "0")
  return `${dia}/${mes}/${ano} ${hora}:${min}`
}

function montarTextoComprovante(nome: string, valor: number, parcelasTexto: string, saldoRestante: number, dataTexto: string): string {
  return [
    "Comprovante de Pagamento",
    "",
    `Cliente: ${nome}`,
    `Valor pago: R$ ${valor.toFixed(2).replace(".", ",")}`,
    parcelasTexto,
    `Saldo devedor: R$ ${saldoRestante.toFixed(2).replace(".", ",")}`,
    dataTexto,
    "",
    "Gestão de Cobranças",
  ].join("\n")
}

export function RotaPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState<CobrancaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [pagamentoOpen, setPagamentoOpen] = useState(false)
  const feedback = useFeedback()
  const [promessaOpen, setPromessaOpen] = useState(false)
  const [dataPromessa, setDataPromessa] = useState("")
  const [operando, setOperando] = useState(false)
  const [pagamentosHoje, setPagamentosHoje] = useState<PagamentoDoDiaItem[]>([])

  const { lat: operadorLat, lng: operadorLng, gpsAtivo } = useWatchPosition()
  const coordsRef = useRef({ lat: operadorLat, lng: operadorLng, gpsAtivo })
  coordsRef.current = { lat: operadorLat, lng: operadorLng, gpsAtivo }

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const idsAntesFetchRef = useRef<Set<string>>(new Set())
  const itemKeyAntesFetchRef = useRef<string | null>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const initializedRef = useRef(false)


  function itemKey(i: { clienteId: string; contratoId: string }) {
    return `${i.clienteId}-${i.contratoId}`
  }

  const [comprovante, setComprovante] = useState<{
    canvas: HTMLCanvasElement | null
    file: File | null
    waUrl: string
  } | null>(null)

  const comprovanteRef = useRef(comprovante)
  comprovanteRef.current = comprovante

  const fetch = useCallback(async () => {
    const { lat, lng } = coordsRef.current
    idsAntesFetchRef.current = new Set(itemsRef.current.map((i) => itemKey(i)))
    setLoading(true)
    setError(null)
    try {
      const result = await listarCobrancasDoDia(
        typeof lat === "number" ? lat : undefined,
        typeof lng === "number" ? lng : undefined,
      )
      setItems(result.cobrancas)
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
      // pagamentos são exibição adicional, falha não quebra a página
    }
  }, [])

  useEffect(() => {
    fetch()
    fetchPagamentos()
  }, [fetch, fetchPagamentos])

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && !comprovanteRef.current) {
        fetch()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [fetch])

  const pendentes = useMemo(
    () => items.filter((i) => i.resultadoOperacional === ResultadoOperacional.PENDENTE),
    [items],
  )

  const sortedItems = useMemo(
    () => {
      if (gpsAtivo && operadorLat && operadorLng) {
        return sortByDistanceOnly(pendentes, operadorLat, operadorLng)
      }
      return sortByDistance(pendentes, operadorLat, operadorLng)
    },
    [pendentes, operadorLat, operadorLng, gpsAtivo],
  )

  useEffect(() => {
    if (sortedItems.length > 0 && indiceAtual >= sortedItems.length) {
      setIndiceAtual(Math.max(0, sortedItems.length - 1))
    }
  }, [sortedItems, indiceAtual])

  useEffect(() => {
    if (!sortedItems.length || initializedRef.current) return
    const rotaIndice = (location.state as { rotaIndice?: number })?.rotaIndice
    if (rotaIndice !== undefined && rotaIndice >= 0 && rotaIndice < sortedItems.length) {
      setIndiceAtual(rotaIndice)
      window.history.replaceState({}, document.title)
      initializedRef.current = true
      return
    }
    const focusKey = (location.state as { focusKey?: string })?.focusKey
    if (focusKey) {
      const idx = sortedItems.findIndex(
        (i) => `${i.clienteId}-${i.contratoId}` === focusKey,
      )
      if (idx >= 0) setIndiceAtual(idx)
      window.history.replaceState({}, document.title)
      initializedRef.current = true
      return
    }
    initializedRef.current = true
    const primeiroPendente = sortedItems.findIndex(
      (i) => i.resultadoOperacional === ResultadoOperacional.PENDENTE,
    )
    if (primeiroPendente >= 0) setIndiceAtual(primeiroPendente)
  }, [sortedItems])

  const item = sortedItems[indiceAtual]
  const currentKey = item ? itemKey(item) : null
  const routeTotal = items.length
  const routeCompleted = items.filter((i) => i.resultadoOperacional !== ResultadoOperacional.PENDENTE).length
  const routePending = routeTotal - routeCompleted
  const routeVisitados = items.filter((i) => i.resultadoOperacional === ResultadoOperacional.VISITADO).length
  const routePromessas = items.filter((i) => i.resultadoOperacional === ResultadoOperacional.PROMESSA).length
  const routeNaoEncontrados = items.filter((i) => i.resultadoOperacional === ResultadoOperacional.NAO_ENCONTRADO).length
  const routePagos = new Set(pagamentosHoje.map((p) => p.clienteId)).size
  const totalClientesAtendidosHoje = totalClientesAtendidos(items, pagamentosHoje)
  const resumoRota = useMemo(() => resumoAtendidos(items, pagamentosHoje), [items, pagamentosHoje])
  const atendidosDetailRota = t("operacoes.resumoAtendidosDetail", {
    visitado: resumoRota.visitado,
    naoEncontrado: resumoRota.naoEncontrado,
    promessa: resumoRota.promessa,
    pagos: resumoRota.pagos,
  })

  useEffect(() => {
    if (!currentKey) return
    const anterior = itemKeyAntesFetchRef.current
    if (anterior && anterior !== currentKey && idsAntesFetchRef.current.has(anterior)) {
      const aindaExiste = items.some((i) => itemKey(i) === anterior)
      if (!aindaExiste) {
        feedback.show({ status: "success", message: t("operacoes.clienteQuitado") })
        if (indiceAtual >= sortedItems.length) {
          setIndiceAtual(Math.max(0, sortedItems.length - 1))
        }
      }
    }
    itemKeyAntesFetchRef.current = currentKey
  }, [currentKey])

  function getDistancia(i: CobrancaItem): number | null {
    if (operadorLat && operadorLng && i.clienteLat && i.clienteLng) {
      return calcularDistancia(operadorLat, operadorLng, i.clienteLat, i.clienteLng)
    }
    return null
  }

  async function handleVisitado(i: CobrancaItem) {
    setOperando(true)
    try {
      await registrarVisita({ clienteId: i.clienteId, contratoId: i.contratoId, tipo: "visitado" })
    } catch {
      feedback.show({ status: "error", message: t("operacoes.erroRegistrarVisita") })
      setOperando(false)
      return
    }
    try {
      const result = await listarCobrancasDoDia(
        typeof operadorLat === "number" ? operadorLat : undefined,
        typeof operadorLng === "number" ? operadorLng : undefined,
      )
      setItems(result.cobrancas)
      feedback.show({ status: "success", message: t("operacoes.visitadoSucesso") })
      eventBus.emit("operacao:atualizada")
    } catch {
      feedback.show({ status: "error", message: t("operacoes.erroAtualizarLista") })
    } finally {
      setOperando(false)
    }
  }

  async function handleNaoEncontrado(i: CobrancaItem) {
    setOperando(true)
    try {
      await registrarVisita({ clienteId: i.clienteId, contratoId: i.contratoId, tipo: "nao_localizado" })
    } catch {
      feedback.show({ status: "error", message: t("operacoes.erroRegistrarVisita") })
      setOperando(false)
      return
    }
    try {
      const result = await listarCobrancasDoDia(
        typeof operadorLat === "number" ? operadorLat : undefined,
        typeof operadorLng === "number" ? operadorLng : undefined,
      )
      setItems(result.cobrancas)
      feedback.show({ status: "success", message: t("operacoes.naoEncontradoSucesso") })
      eventBus.emit("operacao:atualizada")
    } catch {
      feedback.show({ status: "error", message: t("operacoes.erroAtualizarLista") })
    } finally {
      setOperando(false)
    }
  }

  function handleAbrirPromessa() {
    const hoje = getLocalDateString(new Date())
    setDataPromessa(hoje)
    setPromessaOpen(true)
  }

  async function handleConfirmarPromessa() {
    if (!item) return
    setPromessaOpen(false)
    setOperando(true)
    try {
      await registrarVisita({
        clienteId: item.clienteId,
        contratoId: item.contratoId,
        tipo: "promessa",
        dataPromessa,
      })
    } catch {
      feedback.show({ status: "error", message: t("operacoes.erroRegistrarVisita") })
      setOperando(false)
      return
    }
    try {
      const result = await listarCobrancasDoDia(
        typeof operadorLat === "number" ? operadorLat : undefined,
        typeof operadorLng === "number" ? operadorLng : undefined,
      )
      setItems(result.cobrancas)
      feedback.show({ status: "success", message: t("operacoes.promessaSucesso") })
      eventBus.emit("operacao:atualizada")
    } catch {
      feedback.show({ status: "error", message: t("operacoes.erroAtualizarLista") })
    } finally {
      setOperando(false)
    }
  }

  function handleWhatsApp(i: CobrancaItem) {
    const tel = unmask(i.clienteTelefone)
    const msg = encodeURIComponent(
      t("operacoes.whatsappTemplate", { nome: i.clienteNome, valor: formatCurrency(i.totalPendente) })
    )
    window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank")
  }

  function handleLigar(i: CobrancaItem) {
    window.location.href = `tel:+55${unmask(i.clienteTelefone)}`
  }

  function handleNavegar(i: CobrancaItem) {
    const url = buildMapsUrl(i)
    if (url) window.open(url, "_blank")
  }

  function handleAbrirContrato(i: CobrancaItem) {
    window.history.replaceState(
      { ...window.history.state, rotaIndice: indiceAtual },
      document.title,
    )
    navigate(`/contratos/${i.contratoId}`)
  }

  function canvasToFile(canvas: HTMLCanvasElement): File {
    const dataUrl = canvas.toDataURL("image/png")
    const byteString = atob(dataUrl.split(",")[1])
    const array = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; i++) {
      array[i] = byteString.charCodeAt(i)
    }
    return new File([new Blob([array], { type: "image/png" })], "comprovante.png", { type: "image/png" })
  }

  async function handlePagamentoSuccess(data: PagamentoSuccessData) {
    setPagamentoOpen(false)
    if (!item) return

    feedback.show({ status: "loading", message: t("operacoes.gerandoComprovante") })

    const parcelasTexto = formatarParcelasTexto(data.pagasRange)
    const dataTexto = formatarDataHora()

    const canvas = gerarComprovante({
      nome: item.clienteNome,
      valor: data.valor,
      parcelasTexto,
      saldoRestante: data.saldoRestante,
      dataTexto,
    })

    const file = canvasToFile(canvas)
    const tel = unmask(item.clienteTelefone)
    const texto = montarTextoComprovante(item.clienteNome, data.valor, parcelasTexto, data.saldoRestante, dataTexto)
    const waUrl = `https://api.whatsapp.com/send?phone=55${tel}&text=${encodeURIComponent(texto)}`

    setComprovante({ canvas, file, waUrl })
    feedback.show({ status: "success", message: t("cliente.pagamentoSucesso") })

    fetch()
    fetchPagamentos()
    eventBus.emit("operacao:atualizada")
  }

  async function handleCompartilharComprovante() {
    if (!comprovante) return

    if (comprovante.file && navigator.canShare && navigator.canShare({ files: [comprovante.file] })) {
      try {
        await navigator.share({ files: [comprovante.file], title: "Comprovante de pagamento" })
        setComprovante(null)
        return
      } catch {}
    }

    try {
      await navigator.share({ text: "Comprovante de pagamento" })
      setComprovante(null)
    } catch {}
  }

  function handleWhatsAppComprovante() {
    if (!comprovante) return
    window.open(comprovante.waUrl, "_blank")
    setComprovante(null)
  }

  useEffect(() => {
    if (!comprovante?.canvas || !canvasRef.current) return
    const display = canvasRef.current
    display.width = comprovante.canvas.width
    display.height = comprovante.canvas.height
    const ctx = display.getContext("2d")
    if (ctx) ctx.drawImage(comprovante.canvas, 0, 0)
  }, [comprovante])

  useEffect(() => {
    const locked = promessaOpen || !!comprovante
    if (locked) {
      document.documentElement.style.overflow = "hidden"
      document.body.style.overflow = "hidden"
    } else {
      document.documentElement.style.overflow = ""
      document.body.style.overflow = ""
    }
    return () => {
      document.documentElement.style.overflow = ""
      document.body.style.overflow = ""
    }
  }, [promessaOpen, comprovante])

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={Route}
        title={t("operacoes.rotaCobranca")}
        subtitle={t("operacoes.subtitleRota")}
        back={{ onClick: () => navigate("/"), title: t("nav.central") }}
        action={
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${gpsAtivo ? "bg-success-light text-success-text" : "bg-surface-secondary text-text-secondary"}`}>
              <MapPin className="h-3 w-3" />
              {"GPS"}
            </span>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
              title={t("operacoes.rotaCobranca")}
              aria-label={t("operacoes.rotaCobranca")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        }
      />

      {!gpsAtivo && items.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-surface-secondary px-3 py-2 text-xs text-text-secondary">
          {t("operacoes.gpsIndisponivel")}
        </div>
      )}

      {error && (
        <ErrorBanner message={error} onRetry={fetch} className="mb-4" />
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-md bg-surface-hover" />
      ) : sortedItems.length === 0 && (items.length > 0 || routePagos > 0) ? (
        <SuccessState
          title={t("operacoes.todosAtendidos", { total: totalClientesAtendidosHoje })}
          detail={atendidosDetailRota}
          linkLabel={t("operacoes.verResumo")}
          onLinkClick={() => navigate("/atendidos")}
        />
      ) : sortedItems.length === 0 ? (
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-text-secondary">{t("operacoes.nenhumaCobranca")}</p>
        </div>
      ) : !item ? (
        <div className="h-64 animate-pulse rounded-md bg-surface-hover" />
      ) : (
        <>
          <Carousel
            mode="slide"
            items={sortedItems}
            currentIndex={indiceAtual}
            onIndexChange={setIndiceAtual}
            hideDots
            itemKey={itemKey}
            renderItem={(slideItem) => (
              <Card.Root variant="collection" tone={slideItem.situacao === "atrasado" ? "danger" : "info"}>
                {operando && <div className="h-1 animate-pulse bg-primary" />}

                <CobrancaCard
                  variant="detail"
                  clienteNome={slideItem.clienteNome}
                  totalPendente={slideItem.totalPendente}
                  quantidadeParcelas={slideItem.quantidadeParcelas}
                  situacao={slideItem.situacao}
                  resultadoOperacional={slideItem.resultadoOperacional}
                  distancia={getDistancia(slideItem)}
                />

                <div className="border-b border-border-light px-6 py-4">
                  <QuickActions
                    layout="vertical"
                    disabled={operando}
                    actions={[
                      { icon: Navigation, label: t("operacoes.navegar"), onClick: () => handleNavegar(slideItem), variant: "blue", show: !!buildMapsUrl(slideItem) },
                      { icon: MessageCircle, label: t("operacoes.whatsapp"), onClick: () => handleWhatsApp(slideItem), variant: "green" },
                      { icon: Phone, label: t("operacoes.ligar"), onClick: () => handleLigar(slideItem), variant: "blue" },
                      { icon: FileText, label: t("operacoes.abrir"), onClick: () => handleAbrirContrato(slideItem), variant: "gray" },
                    ]}
                  />
                </div>

                <div className="px-6 py-4">
                  <Button
                    onClick={() => setPagamentoOpen(true)}
                    disabled={operando}
                    className="w-full bg-success text-white hover:bg-success-hover shadow-sm"
                  >
                    {t("operacoes.pagar")}
                  </Button>
                </div>

                <div className="border-t border-border-light px-6 py-4">
                  <QuickActions
                    layout="vertical"
                    disabled={operando}
                    actions={[
                      { icon: UserCheck, label: t("operacoes.visitado"), onClick: () => handleVisitado(slideItem), variant: "gray", show: slideItem.resultadoOperacional !== ResultadoOperacional.VISITADO },
                      { icon: MapPinOff, label: t("operacoes.naoEncontrado"), onClick: () => handleNaoEncontrado(slideItem), variant: "gray", show: slideItem.resultadoOperacional !== ResultadoOperacional.NAO_ENCONTRADO },
                      { icon: CalendarClock, label: t("operacoes.promessa"), onClick: handleAbrirPromessa, variant: "warning", show: slideItem.resultadoOperacional !== ResultadoOperacional.PROMESSA },
                    ]}
                  />
                </div>
              </Card.Root>
            )}
          />
 
          {items.length > 0 && (
            <RouteProgress
              total={routeTotal}
              completed={routeCompleted}
              pending={routePending}
              visitados={routeVisitados}
              promessas={routePromessas}
              naoEncontrados={routeNaoEncontrados}
              pagos={routePagos}
            />
          )}

          <Modal open={promessaOpen} onClose={() => setPromessaOpen(false)} backdropClose maxWidth="max-w-sm">
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">{t("operacoes.promessa")}</h3>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                {t("operacoes.dataPromessa")}
              </label>
              <input
                type="date"
                value={dataPromessa}
                onChange={(e) => setDataPromessa(e.target.value)}
                className="mb-4 min-h-12 w-full appearance-none rounded-xl border border-border-strong bg-surface px-3.5 text-base text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={() => setPromessaOpen(false)}
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleConfirmarPromessa}
                  className="flex-1"
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}

      {pagamentoOpen && item && (
        <PagamentoModal
          contratoId={item.contratoId}
          valorSugerido={item.proximaParcela > 0 ? item.proximaParcela : item.totalPendente}
          saldoDevedor={item.saldoTotal}
          parcelaLabel={item.proximoNumeroParcela > 0
            ? t("contrato.parcelaTemplate", { num: String(item.proximoNumeroParcela).padStart(2, "0"), total: item.totalParcelasContrato })
            : undefined}
          onClose={() => setPagamentoOpen(false)}
          onSuccess={handlePagamentoSuccess}
        />
      )}

      {comprovante && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/40"
          onClick={() => setComprovante(null)}
        >
          <div
            className="flex min-h-screen items-center justify-center p-4"
          >
            <div
              className="mx-auto w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
            <canvas
              ref={canvasRef}
              className="w-full rounded-xl border border-border"
            />

            <div className="mt-4 flex gap-4">
              <Button
                onClick={handleCompartilharComprovante}
                className="flex flex-1 items-center justify-center gap-1"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
              <Button
                variant="secondary"
                onClick={handleWhatsAppComprovante}
                className="flex flex-1 items-center justify-center gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
            <Button
               variant="secondary"
               onClick={() => setComprovante(null)}
               className="mt-2 w-full"
             >
               {t("common.cancel")}
             </Button>
           </div>
         </div>
       </div>
       )}
    </div>
  )
}
