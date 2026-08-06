import { Check, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { createPagamento, previewPagamento, type PreviewDistribuicao } from "../services/pagamento.service.js"
import { ApiError } from "../../../api/client.js"
import { Button } from "../../../shared/components/Button.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { formatCurrency, maskMonetario, unmaskMonetario } from "../../../shared/utils/masks.js"

export interface PagamentoSuccessData {
  valor: number
  pagasRange: { inicio: number; fim: number } | null
  saldoRestante: number
}

interface PagamentoModalProps {
  contratoId: string
  valorSugerido: number
  saldoDevedor: number
  parcelaLabel?: string
  onClose: () => void
  onSuccess: (data: PagamentoSuccessData) => void
}

export function PagamentoModal({
  contratoId,
  valorSugerido,
  saldoDevedor,
  parcelaLabel,
  onClose,
  onSuccess,
}: PagamentoModalProps) {
  const { t } = useTranslation()
  const [rawValor, setRawValor] = useState(() => String(Math.round(valorSugerido * 100)))
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewDistribuicao | null>(null)
  const [carregandoPreview, setCarregandoPreview] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const previewRef = useRef<PreviewDistribuicao | null>(null)

  const valor = unmaskMonetario(rawValor)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (valor <= 0) {
      setPreview(null)
      return
    }

    setCarregandoPreview(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await previewPagamento({ contratoId, valor })
        setPreview(result)
        previewRef.current = result
      } catch {
        setPreview(null)
      } finally {
        setCarregandoPreview(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [contratoId, valor])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (valor <= 0) {
      setErro(t("pagamento.validacao.valorPositivo"))
      return
    }

    if (valor > saldoDevedor) {
      setErro(t("pagamento.validacao.valorExcede"))
      return
    }

    setEnviando(true)
    try {
      await createPagamento({ contratoId, valor })

      const lastPreview = previewRef.current
      let pagasRange: { inicio: number; fim: number } | null = null
      if (lastPreview) {
        const pagas = lastPreview.parcelas.filter((p) => p.valorAplicado > 0)
        if (pagas.length > 0) {
          pagasRange = { inicio: pagas[0].numero, fim: pagas[pagas.length - 1].numero }
        }
      }

      onSuccess({ valor, pagasRange, saldoRestante: Math.max(0, saldoDevedor - valor) })
    } catch (err) {
      setEnviando(false)
      if (err instanceof ApiError) {
        setErro(err.message)
      } else {
        setErro(t("pagamento.erroRegistrar"))
      }
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      backdropClose
      title={t("pagamento.title")}
      descricao={t("pagamento.infoAplicacao")}
      footer={
        <div className="flex w-full gap-4">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="flex-1"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="pagamento-form"
            disabled={enviando}
            className="flex-1"
          >
            <Check className="size-4" /> {t("pagamento.confirmar")}
          </Button>
        </div>
      }
    >
      {parcelaLabel && (
        <p className="text-sm font-medium text-text-primary">{parcelaLabel}</p>
      )}

      <p className="mt-1 text-2xl font-bold">
        R$ {formatCurrency(Math.max(0, saldoDevedor - valor))}
      </p>
      <p className="text-xs text-text-muted">
        Saldo restante do contrato após o pagamento.
      </p>

      <form id="pagamento-form" onSubmit={handleSubmit} className="mt-4">
        <label className="block text-sm font-medium text-text-primary">
          {t("pagamento.label")}
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={maskMonetario(rawValor)}
          onChange={(e) => setRawValor(e.target.value.replace(/\D/g, ""))}
          autoFocus
          className="mt-1 min-h-12 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-lg font-semibold text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {erro && (
          <p className="mt-2 text-sm text-danger">{erro}</p>
        )}

        {(preview || carregandoPreview || valor > 0) ? (
          <div className="mt-4 rounded-xl bg-surface-secondary p-3 text-sm">
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {t("pagamento.previa")}
              </p>
              {carregandoPreview && (
                <Loader2 className="h-3 w-3 animate-spin text-text-muted" />
              )}
            </div>

            {preview ? (
              <div className="space-y-1">
                {(() => {
                  const afetadas = preview.parcelas.filter((p) => p.valorAplicado > 0)
                  const pagas = afetadas.filter((p) => p.estadoPrevisto === "Paga")
                  const parciais = afetadas.filter((p) => p.estadoPrevisto !== "Paga")

                  return (
                    <>
                      {pagas.length > 0 && (
                        <p className="flex items-center gap-1.5 text-text-primary">
                          <span className="inline-block h-2 w-2 rounded-full bg-success" />
                          {pagas.length === 1
                            ? t("pagamento.parcelaQuitada", { num: String(pagas[0].numero).padStart(2, "0") })
                            : t("pagamento.parcelasQuitadas", { inicio: String(pagas[0].numero).padStart(2, "0"), fim: String(pagas[pagas.length - 1].numero).padStart(2, "0") })}
                        </p>
                      )}
                      {parciais.map(({ numero, saldoRestante }) => (
                        <p key={numero} className="flex items-center gap-1.5 text-text-primary">
                          <span className="inline-block h-2 w-2 rounded-full bg-warning" />
                          {t("pagamento.parcelaParcial", { num: String(numero).padStart(2, "0"), saldo: formatCurrency(saldoRestante) })}
                        </p>
                      ))}
                    </>
                  )
                })()}

                {preview.saldoExcedente > 0 && (
                  <p className="pt-1 text-sm font-medium text-warning">
                    {t("pagamento.saldoExcedente", { valor: formatCurrency(preview.saldoExcedente) })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-text-muted">{t("pagamento.calculando")}</p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-xs text-text-muted">
            {t("pagamento.infoPrevia")}
          </p>
        )}
      </form>
    </Modal>
  )
}
