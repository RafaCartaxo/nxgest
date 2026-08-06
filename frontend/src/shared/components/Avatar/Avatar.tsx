import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Camera, Trash2 } from "lucide-react"
import { Button } from "../Button.js"
import { Modal } from "../Modal/Modal.js"
import { formatarBytes, MAX_LADO, processarImagem } from "../../utils/processarImagem.js"

export type AvatarSize = "sm" | "md" | "lg" | "xl"

const sizeClass: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
}

/** tons derivados do nome — sempre tokens, nunca cor fixa da paleta */
const tons = [
  "bg-primary-light text-primary-text",
  "bg-accent-light text-accent-text",
  "bg-info-light text-info-text",
  "bg-success-light text-success-text",
  "bg-warning-light text-warning-text",
]

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  const primeira = partes[0]?.[0] ?? ""
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : ""
  return (primeira + ultima).toUpperCase()
}

function tomDoNome(nome: string): string {
  let soma = 0
  for (const ch of nome) soma += ch.charCodeAt(0)
  return tons[soma % tons.length] ?? tons[0]!
}

interface AvatarProps {
  foto?: string | null
  nome: string
  size?: AvatarSize
  className?: string
  /** Clicar abre a foto ampliada (lightbox — PLAN-058). Só ativo quando há foto. */
  ampliar?: boolean
}

/** Avatar do usuário/cliente — foto (data URL) ou iniciais com tom derivado do nome. */
export function Avatar({ foto, nome, size = "md", className = "", ampliar = false }: AvatarProps) {
  const { t } = useTranslation()
  const [aberto, setAberto] = useState(false)

  const img = foto ? (
    <img
      src={foto}
      alt={`Foto de ${nome}`}
      loading="lazy"
      className={`shrink-0 rounded-full border border-border object-cover ${sizeClass[size]} ${className}`}
    />
  ) : (
    <span
      aria-label={nome}
      role="img"
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${sizeClass[size]} ${tomDoNome(nome)} ${className}`}
    >
      {iniciais(nome)}
    </span>
  )

  if (ampliar && foto) {
    return (
      <>
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label={t("avatar.verFoto")}
          title={t("avatar.verFoto")}
          className="shrink-0 rounded-full transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {img}
        </button>
        <Modal
          open={aberto}
          onClose={() => setAberto(false)}
          backdropClose
          maxWidth="max-w-lg"
          title={nome}
        >
          <img src={foto} alt={`Foto de ${nome}`} className="mx-auto max-h-[75vh] w-auto rounded-xl" />
        </Modal>
      </>
    )
  }

  return img
}

interface AvatarFieldProps {
  nome: string
  foto: string | null
  onChange: (foto: string | null) => void
  label?: string
  size?: AvatarSize
}

/** Campo de foto: prévia + adicionar/trocar + remover (usa processarImagem). */
export function AvatarField({ nome, foto, onChange, label, size = "xl" }: AvatarFieldProps) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function selecionar(file: File | undefined) {
    if (!file) return
    setErro(null)
    setInfo(null)
    const r = await processarImagem(file)
    if (!r.ok) {
      setErro(t(`avatar.${r.erro}`))
      return
    }
    onChange(r.dataUrl)
    setInfo(t("avatar.otimizada", { px: MAX_LADO, bytes: formatarBytes(r.bytes) }))
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-text-secondary">{label ?? t("avatar.foto")}</span>
      <div className="flex items-center gap-4">
        <Avatar foto={foto} nome={nome} size={size} ampliar />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
            <Camera className="size-4" aria-hidden />
            {foto ? t("avatar.trocar") : t("avatar.adicionar")}
          </Button>
          {foto && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(null)
                setInfo(null)
                setErro(null)
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              {t("avatar.remover")}
            </Button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void selecionar(e.target.files?.[0])}
      />
      <p className="mt-2 text-xs text-text-muted">{t("avatar.hint", { kb: 500, px: MAX_LADO })}</p>
      {info && <p className="mt-1 text-xs text-success-text">{info}</p>}
      {erro && <p className="mt-1 text-xs font-medium text-danger-text">{erro}</p>}
    </div>
  )
}
