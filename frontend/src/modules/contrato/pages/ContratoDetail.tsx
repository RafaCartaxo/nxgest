import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { getContrato, deleteContrato } from "../services/contrato.service.js"
import type { Contrato, Parcela } from "../services/contrato.service.js"
import { FileText, Share2, MessageCircle, RotateCcw, Pencil } from "lucide-react"
import { ApiError } from "../../../api/client.js"
import { formatarData } from "../../../shared/utils/formatarData.js"
import { formatCurrency, unmask } from "../../../shared/utils/masks.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { Button, ButtonLink } from "../../../shared/components/Button.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { ContratoInfo } from "../components/ContratoInfo.js"
import { ParcelaList } from "../components/ParcelaList.js"
import { PagamentoModal, type PagamentoSuccessData } from "../../pagamento/components/PagamentoModal.js"
import { ConfirmModal } from "../../../shared/components/ConfirmModal.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { hasCapability } from "../../../shared/modules/capacidades.js"
import { getCliente } from "../../cliente/services/cliente.service.js"
import type { Cliente } from "../../cliente/services/cliente.service.js"
import { listPagamentos, estornarPagamento, type PagamentoComDetalhes } from "../../pagamento/services/pagamento.service.js"
import { gerarComprovante } from "../../../shared/utils/comprovante.js"

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

function canvasToFile(canvas: HTMLCanvasElement): File {
  const dataUrl = canvas.toDataURL("image/png")
  const byteString = atob(dataUrl.split(",")[1])
  const array = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i)
  }
  return new File([new Blob([array], { type: "image/png" })], "comprovante.png", { type: "image/png" })
}

/** Texto das parcelas quitadas num pagamento (ex.: "Parcela 3" / "Parcelas 3 e 4"). */
function textoParcelasPagas(parcelas: { numero?: number }[], t: TFunction): string {
  const nums = parcelas
    .map((p) => p.numero)
    .filter((n): n is number => typeof n === "number")
    .sort((a, b) => a - b)
  if (nums.length === 0) return ""
  if (nums.length === 1) return t("pagamento.parcelaSingular", { num: nums[0] })
  return t("pagamento.parcelaPlural", { nums: nums.join(", ") })
}

export function ContratoDetail() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const usuarioId = searchParams.get("usuarioId") || undefined
  const empresaId = searchParams.get("empresaId") || undefined
  const isAdminContext = !!usuarioId
  const navigate = useNavigate()
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const feedback = useFeedback()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pagamentosAnteriores, setPagamentosAnteriores] = useState<PagamentoComDetalhes[]>([])
  const [estornandoId, setEstornandoId] = useState<string | null>(null)
  const [estornoMotivo, setEstornoMotivo] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [comprovante, setComprovante] = useState<{
    canvas: HTMLCanvasElement | null
    file: File | null
    waUrl: string
  } | null>(null)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    setCliente(null)
    try {
      const result = await getContrato(id, usuarioId)
      setContrato(result)
      const c = await getCliente(result.clienteId, usuarioId)
      setCliente(c)
      listPagamentos(id, usuarioId).then(setPagamentosAnteriores).catch(() => {})
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(t("contrato.erroCarregarContrato"))
      }
    } finally {
      setLoading(false)
    }
  }, [id, usuarioId, t])

  useEffect(() => {
    fetch()
  }, [fetch])

  function handleDeleteClick() {
    setConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!id) return
    setConfirmOpen(false)

    await feedback.run({
      loading: t("common.deleting"),
      success: "Contrato excluído.",
      error: t("cliente.erroExcluirContrato"),
      action: async () => {
        try {
          await deleteContrato(id)
          navigate(`/clientes/${contrato?.clienteId}`, { replace: true })
        } catch (err) {
          if (err instanceof ApiError) {
            throw new Error(err.message)
          }
          throw err
        }
      },
    })
  }

  const [pagandoParcela, setPagandoParcela] = useState<Parcela | null>(null)

  async function handleEstornar() {
    if (!estornandoId) return
    const motivo = estornoMotivo.trim()
    if (!motivo) {
      feedback.show({ status: "error", message: t("caixa.motivoObrigatorio") })
      return
    }
    await feedback.run({
      loading: t("common.saving"),
      success: t("pagamento.estornarSucesso"),
      error: t("pagamento.estornarErro"),
      action: async () => {
        await estornarPagamento(estornandoId, motivo, usuarioId)
        setEstornandoId(null)
        setEstornoMotivo("")
        await fetch()
      },
    })
  }

  const temPagamentos =
    contrato?.parcelas?.some((p) => p.valorPago > 0) ?? false

  const saldoDevedor =
    contrato?.parcelas?.reduce((s, p) => s + p.saldoPendente, 0) ?? 0

  const valorSugerido = pagandoParcela?.saldoPendente ?? saldoDevedor

  const parcelaLabel = pagandoParcela && contrato
    ? t("contrato.parcelaTemplate", { num: String(pagandoParcela.numero).padStart(2, "0"), total: contrato.quantidadeParcelas })
    : undefined

  function handleSuccess(data: PagamentoSuccessData) {
    setPagandoParcela(null)
    if (!cliente) return

    const parcelasTexto = formatarParcelasTexto(data.pagasRange)
    const dataTexto = formatarDataHora()

    const canvas = gerarComprovante({
      nome: cliente.nome,
      valor: data.valor,
      parcelasTexto,
      saldoRestante: data.saldoRestante,
      dataTexto,
    })

    const file = canvasToFile(canvas)
    const texto = montarTextoComprovante(cliente.nome, data.valor, parcelasTexto, data.saldoRestante, dataTexto)
    const waUrl = `https://api.whatsapp.com/send?phone=55${unmask(cliente.telefone)}&text=${encodeURIComponent(texto)}`

    setComprovante({ canvas, file, waUrl })
    feedback.show({ status: "success", message: t("cliente.pagamentoSucesso") })
    fetch()
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
    const locked = !!comprovante
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
  }, [comprovante])

  return (
    <div className="mx-auto max-w-2xl p-4">
      {cliente && (
        <PageHeader
          icon={FileText}
          title={cliente.nome}
          back={{
            onClick: () => navigate(
              isAdminContext
                ? `/admin/operadores/${usuarioId}${empresaId ? `?empresaId=${empresaId}` : ""}`
                : contrato
                  ? `/clientes/${contrato.clienteId}`
                  : "/contratos"
            ),
            title: t("common.back"),
          }}
          action={!isAdminContext && contrato && !temPagamentos ? (
            <ButtonLink to={`/contratos/${contrato.id}/editar`} variant="primary" size="sm">
              <Pencil className="size-4" /> {t("common.edit")}
            </ButtonLink>
          ) : undefined}
        />
      )}

      <EstadoTela
        loading={loading}
        error={error}
        empty={!contrato}
        emptyMessage={t("contrato.naoEncontrado")}
        onRetry={fetch}
      >
        {contrato && (
          <>
            <div className="mb-6">
              <ContratoInfo contrato={contrato} />
            </div>

            <div className="mb-6">
              <SectionHeader title={t("contrato.parcelasLabel")} />
              <ParcelaList
                parcelas={contrato.parcelas || []}
                onPagar={isAdminContext ? undefined : setPagandoParcela}
              />
            </div>

            {pagamentosAnteriores.length > 0 && (
              <div className="mb-6">
                <SectionHeader title={t("cliente.pagamentos")} />
                <div className="space-y-2">
                  {pagamentosAnteriores.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm"
                    >
                      <span className="text-text-secondary">{formatarData(p.data, t)}</span>
                      <span className={p.estornadoEm ? "line-through opacity-60" : ""}>
                        <span className="text-sm font-medium text-text-secondary">R$</span>{" "}
                        <span className="font-semibold text-text-primary">{formatCurrency(p.valor)}</span>
                      </span>
                      <div className="flex flex-col items-end gap-1">
                        {p.estornadoEm ? (
                          <>
                            <span className="rounded-full bg-warning-light px-2 py-0.5 text-xs font-medium text-warning-text">
                              {t("pagamento.estornado")}
                            </span>
                            {p.estornoMotivo && (
                              <span className="text-xs text-text-muted">
                                {t("pagamento.estornadoMotivo", { motivo: p.estornoMotivo })}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-text-muted">{textoParcelasPagas(p.parcelas, t)}</span>
                            {isAdminContext && (
                              <button
                                type="button"
                                onClick={() => { setEstornandoId(p.id); setEstornoMotivo("") }}
                                className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-hover"
                              >
                                <RotateCcw className="h-3 w-3" />
                                {t("pagamento.estornar")}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isAdminContext && !temPagamentos && (
              <Button variant="danger" onClick={handleDeleteClick}>
                {t("common.delete")}
              </Button>
            )}

            <ConfirmModal
              open={confirmOpen}
              title={t("cliente.excluirContratoTitle")}
              message={t("cliente.excluirContratoMessage")}
              confirmLabel={t("common.confirmDelete")}
              danger
  
              onConfirm={handleDeleteConfirm}
              onCancel={() => setConfirmOpen(false)}
            />

            <Modal
              open={!!estornandoId}
              onClose={() => setEstornandoId(null)}
              title={t("pagamento.estornarTitle")}
              descricao={t("pagamento.estornarMessage")}
              footer={
                <div className="flex w-full gap-3">
                  <Button variant="ghost" onClick={() => setEstornandoId(null)} className="flex-1">
                    {t("common.cancel")}
                  </Button>
                  <Button variant="danger" onClick={handleEstornar} className="flex-1">
                    {t("pagamento.estornar")}
                  </Button>
                </div>
              }
            >
              <input
                type="text"
                value={estornoMotivo}
                onChange={(e) => setEstornoMotivo(e.target.value)}
                placeholder={t("caixa.motivoPlaceholder")}
                autoFocus
                className="min-h-12 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </Modal>

            {pagandoParcela && contrato && (
              <PagamentoModal
                contratoId={contrato.id}
                valorSugerido={valorSugerido}
                saldoDevedor={saldoDevedor}
                parcelaLabel={parcelaLabel}
                onClose={() => setPagandoParcela(null)}
                onSuccess={handleSuccess}
              />
            )}


          </>
        )}
      </EstadoTela>

      {comprovante && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/40"
          onClick={() => setComprovante(null)}
        >
          <div className="flex min-h-screen items-center justify-center p-4">
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
                {hasCapability(user?.capacidades, user?.modulos, "pagamento:comprovante_whatsapp") && (
                  <Button
                    variant="secondary"
                    onClick={handleWhatsAppComprovante}
                    className="flex flex-1 items-center justify-center gap-1"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
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
