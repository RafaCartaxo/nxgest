import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { FileText, ImageIcon, Paperclip, Trash2, ExternalLink, Check } from "lucide-react"
import { Button } from "../../../shared/components/Button.js"
import { Card } from "../../../shared/components/Card/Card.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { processarAnexo, formatarBytes, type ErroAnexo } from "../../../shared/utils/processarAnexo.js"
import { listarAnexos, enviarAnexo, excluirAnexo, abrirAnexo, type AnexoDto } from "../services/anexo.service.js"

interface Props {
  clienteId: string
}

function tipoLabel(t: (k: string) => string, tipo: AnexoDto["tipo"]): string {
  if (tipo === "comprovante-residencia") return t("anexos.tipoComprovante")
  if (tipo === "documento") return t("anexos.tipoDocumento")
  return t("anexos.tipoOutro")
}

function AnexoRow({ anexo, clienteId, onRemover }: { anexo: AnexoDto; clienteId: string; onRemover: (id: string) => void }) {
  const { t } = useTranslation()
  const [confirmando, setConfirmando] = useState(false)
  const [abrindo, setAbrindo] = useState(false)
  const isPdf = anexo.mime === "application/pdf"

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-text-muted">
        {isPdf ? <FileText className="size-5" /> : <ImageIcon className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{anexo.nome}</p>
        <p className="mt-0.5 truncate text-xs text-text-muted">
          {formatarBytes(anexo.tamanho)} · {new Date(anexo.createdAt).toLocaleDateString()}
        </p>
        <span className="mt-1.5 inline-block rounded-lg bg-muted px-1.5 py-0.5 text-xs font-medium text-text-secondary">
          {tipoLabel(t, anexo.tipo)}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={t("anexos.abrir")}
          disabled={abrindo}
          onClick={() => {
            setAbrindo(true)
            abrirAnexo(clienteId, anexo).catch(() => undefined).finally(() => setAbrindo(false))
          }}
          className="grid size-11 place-items-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <ExternalLink className="size-4" />
        </button>
        <button
          type="button"
          aria-label={t("anexos.remover")}
          onClick={() => {
            if (confirmando) onRemover(anexo.id)
            else setConfirmando(true)
          }}
          onBlur={() => setConfirmando(false)}
          className={`grid size-11 place-items-center rounded-lg transition-colors ${
            confirmando ? "bg-danger text-white" : "text-text-muted hover:bg-danger-soft hover:text-danger-text"
          }`}
        >
          {confirmando ? <Check className="size-4" /> : <Trash2 className="size-4" />}
        </button>
      </div>
    </li>
  )
}

export function AnexosSection({ clienteId }: Props) {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const input = useRef<HTMLInputElement>(null)
  const [lista, setLista] = useState<AnexoDto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [erroUpload, setErroUpload] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setLista(await listarAnexos(clienteId))
    } catch {
      setErro(t("anexos.erroCarregar"))
    } finally {
      setCarregando(false)
    }
  }, [clienteId, t])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function selecionar(file: File | undefined) {
    if (!file || enviando) return
    setErroUpload(null)
    const r = await processarAnexo(file)
    if (!r.ok) {
      const msgs: Record<ErroAnexo, string> = {
        ANEXO_TIPO: t("anexos.tipoErro"),
        ANEXO_LIMITE: t("anexos.limiteErro"),
        FALHA: t("anexos.falha"),
      }
      setErroUpload(msgs[r.erro])
      return
    }
    setEnviando(true)
    try {
      const novo = await enviarAnexo(clienteId, new File([await fileParaBlob(file, r)], r.nome, { type: r.mime }))
      setLista((l) => [novo, ...l])
      feedback.show({ status: "success", message: t("anexos.anexado") })
    } catch {
      setErroUpload(t("anexos.erroServidor"))
    } finally {
      setEnviando(false)
      if (input.current) input.current.value = ""
    }
  }

  async function fileParaBlob(file: File, r: { thumb: string | null }): Promise<Blob> {
    if (r.thumb) {
      const res = await fetch(r.thumb)
      return res.blob()
    }
    return file
  }

  async function remover(anexoId: string) {
    try {
      await excluirAnexo(clienteId, anexoId)
      setLista((l) => l.filter((a) => a.id !== anexoId))
      feedback.show({ status: "success", message: t("anexos.removido") })
    } catch {
      feedback.show({ status: "error", message: t("anexos.erroServidor") })
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-[22px] font-semibold text-text-primary">{t("anexos.title")}</h2>
        <Button type="button" variant="soft" size="sm" onClick={() => input.current?.click()} disabled={enviando}>
          <Paperclip className="size-4" aria-hidden />
          {enviando ? t("anexos.preparando") : t("anexos.anexar")}
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => void selecionar(e.target.files?.[0])}
      />

      {erroUpload && (
        <p className="mb-3 rounded-xl border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger-text">
          {erroUpload}
        </p>
      )}

      {carregando ? (
        <div className="h-24 animate-pulse rounded-xl bg-surface-hover" />
      ) : erro ? (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-text-secondary">{erro}</p>
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-8 text-center">
          <p className="font-semibold text-text-primary">{t("anexos.vazio")}</p>
          <p className="max-w-sm text-sm text-text-secondary">{t("anexos.vazioDescricao")}</p>
          <Button variant="soft" size="sm" className="mt-1" onClick={() => input.current?.click()}>
            <Paperclip className="size-4" aria-hidden /> {t("anexos.anexar")}
          </Button>
        </div>
      ) : (
        <Card.Root>
          <ul className="divide-y divide-border">
            {lista.map((a) => (
              <AnexoRow key={a.id} anexo={a} clienteId={clienteId} onRemover={remover} />
            ))}
          </ul>
        </Card.Root>
      )}

      <p className="mt-2 text-xs text-text-muted">{t("anexos.hint")}</p>
    </section>
  )
}
