import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { eventBus } from "../../../shared/events/eventBus.js"
import { useTranslation } from "react-i18next"
import { useNavigate, useLocation } from "react-router-dom"
import { Navigation, MessageCircle, Phone, FileText, Share2, UserCheck, MapPinOff, CalendarClock, Route, Loader2 } from "lucide-react"
import { listarCobrancasDoDia, listarPagamentosHoje, registrarVisita, ResultadoOperacional, type CobrancaItem, type PagamentoDoDiaItem } from "../services/operacoes.service.js"
import { ApiError } from "../../../api/client.js"
import { sortByDistance, sortByDistanceOnly, useWatchPosition } from "../../../shared/utils/distance.js"
import { CobrancaCard } from "../components/CobrancaCard.js"
import { unmask, formatCurrency } from "../../../shared/utils/masks.js"
import { gerarComprovante } from "../../../shared/utils/comprovante.js"
import { buildMapsUrl, alvoDeItemCobranca, alvoNavegavel } from "../../../shared/geo/alvo.js"
import { Button } from "../../../shared/components/Button.js"
import { QuickActions } from "../../../shared/components/QuickActions/QuickActions.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
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
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { hasCapability } from "../../../shared/modules/capacidades.js"

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
  const { user } = useAuth()
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
    const url = buildMapsUrl(alvoDeItemCobranca(i))
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

    // Modal fica ABERTO no passo comprovante (sucessoContent) — o refetch acontece ao fechar.
    setComprovante({ canvas, file, waUrl })
  }

  function finalizarPagamento() {
    setPagamentoOpen(false)
    setComprovante(null)
    fetch()
    fetchPagamentos()
    eventBus.emit("operacao:atualizada")
    feedback.show({ status: "success", message: t("cliente.pagamentoSucesso") })
  }

  async function handleCompartilharComprovante() {
    if (!comprovante) return

    if (comprovante.file && navigator.canShare && navigator.canShare({ files: [comprovante.file] })) {
      try {
        await navigator.share({ files: [comprovante.file], title: "Comprovante de pagamento" })
        return
      } catch {}
    }

    try {
      await navigator.share({ text: "Comprovante de pagamento" })
    } catch {}
  }

  function handleWhatsAppComprovante() {
    if (!comprovante) return
    window.open(comprovante.waUrl, "_blank")
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={Route}
        title={t("operacoes.rotaCobranca")}
        subtitle={t("operacoes.subtitleRota")}
        back={{ onClick: () => navigate("/"), title: t("nav.central") }}
        action={
          <StatusBadge
            variant={gpsAtivo ? "success" : "neutral"}
            size="sm"
            label={gpsAtivo ? t("operacoes.gpsAtivo") : t("operacoes.gpsInativo")}
          />
        }
      />

      {!gpsAtivo && items.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-surface-secondary px-3 py-2 text-xs text-text-secondary">
          {t("operacoes.gpsIndisponivel")}
        </div>
      )}

      <EstadoTela loading={loading} error={error} onRetry={fetch} empty={false}>
        {sortedItems.length === 0 && (items.length > 0 || routePagos > 0) ? (
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
          <div className="h-64 animate-pulse rounded-xl bg-surface-hover" />
        ) : (
        <>
          {sortedItems.length > 0 && (
            <p className="mb-2 text-center text-sm font-semibold text-text-primary">
              {t("operacoes.paradaDe", { atual: indiceAtual + 1, total: sortedItems.length })}
            </p>
          )}

          <Carousel
            mode="slide"
            items={sortedItems}
            currentIndex={indiceAtual}
            onIndexChange={setIndiceAtual}
            hideDots
            itemKey={itemKey}
            renderItem={(slideItem) => (
              <div className="space-y-3">
                <CobrancaCard item={slideItem} />

                <Card.Root variant="collection">
                  <div className="border-b border-border-light px-4 py-4">
                    <QuickActions
                      layout="grid"
                      singleRow
                      disabled={operando}
                      actions={[
                        { icon: Navigation, label: t("operacoes.navegar"), onClick: () => handleNavegar(slideItem), variant: "blue", show: hasCapability(user?.capacidades, user?.modulos, "rota:navegar") && alvoNavegavel(alvoDeItemCobranca(slideItem)) },
                        { icon: MessageCircle, label: t("operacoes.whatsapp"), onClick: () => handleWhatsApp(slideItem), variant: "green", show: hasCapability(user?.capacidades, user?.modulos, "rota:whatsapp") },
                        { icon: Phone, label: t("operacoes.ligar"), onClick: () => handleLigar(slideItem), variant: "blue", show: hasCapability(user?.capacidades, user?.modulos, "rota:ligar") },
                        { icon: FileText, label: t("operacoes.abrirContrato"), onClick: () => handleAbrirContrato(slideItem), variant: "gray" },
                      ]}
                    />
                  </div>

                  <div className="px-4 py-4">
                    <Button
                      variant="success"
                      onClick={() => setPagamentoOpen(true)}
                      disabled={operando}
                      className="w-full shadow-sm"
                    >
                      {operando ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Processando…
                        </span>
                      ) : (
                        t("operacoes.registrarPagamento")
                      )}
                    </Button>
                  </div>

                  <div className="border-t border-border-light px-4 py-4">
                    <div className="grid grid-cols-3 gap-2">
                      {slideItem.resultadoOperacional !== ResultadoOperacional.PROMESSA && (
                        <Button variant="outline" size="sm" disabled={operando} onClick={handleAbrirPromessa}>
                          <CalendarClock className="size-4" /> {t("operacoes.promessa")}
                        </Button>
                      )}
                      {slideItem.resultadoOperacional !== ResultadoOperacional.VISITADO && (
                        <Button variant="outline" size="sm" disabled={operando} onClick={() => handleVisitado(slideItem)}>
                          <UserCheck className="size-4" /> {t("operacoes.visitado")}
                        </Button>
                      )}
                      {slideItem.resultadoOperacional !== ResultadoOperacional.NAO_ENCONTRADO && (
                        <Button variant="outline" size="sm" disabled={operando} onClick={() => handleNaoEncontrado(slideItem)}>
                          <MapPinOff className="size-4" /> {t("operacoes.naoEncontrado")}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card.Root>
              </div>
            )}
          />
 
          {items.length > 0 && (
            <Card.Root variant="detail">
              <RouteProgress
                total={routeTotal}
                completed={routeCompleted}
                pending={routePending}
                visitados={routeVisitados}
                promessas={routePromessas}
                naoEncontrados={routeNaoEncontrados}
                pagos={routePagos}
              />
            </Card.Root>
          )}

          <Modal
            open={promessaOpen}
            onClose={() => setPromessaOpen(false)}
            backdropClose
            maxWidth="max-w-sm"
            title={t("operacoes.promessa")}
            footer={
              <div className="flex w-full gap-4">
                <Button
                  variant="ghost"
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
            }
          >
            <Field
              label={t("operacoes.dataPromessa")}
              required
              type="date"
              value={dataPromessa}
              onChange={(e) => setDataPromessa(e.target.value)}
            />
          </Modal>
        </>
        )}
      </EstadoTela>

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
          sucessoContent={(data, fechar) => (
            <>
              <canvas
                ref={(el) => {
                  if (el && comprovante?.canvas) {
                    el.width = comprovante.canvas.width
                    el.height = comprovante.canvas.height
                    el.getContext("2d")?.drawImage(comprovante.canvas, 0, 0)
                  }
                }}
                className="w-full rounded-xl border border-border"
              />
              <div className="mt-4 flex gap-4">
                <Button onClick={handleCompartilharComprovante} className="flex flex-1 items-center justify-center gap-1">
                  <Share2 className="h-4 w-4" /> Compartilhar
                </Button>
                {hasCapability(user?.capacidades, user?.modulos, "pagamento:comprovante_whatsapp") && (
                  <Button variant="secondary" onClick={handleWhatsAppComprovante} className="flex flex-1 items-center justify-center gap-1">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                )}
              </div>
              <Button variant="ghost" onClick={() => { fechar(); finalizarPagamento() }} className="mt-2 w-full">
                {t("common.cancel")}
              </Button>
            </>
          )}
        />
      )}
    </div>
  )
}
