import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown, Search } from "lucide-react"
import { fieldControl } from "../../../shared/components/Field/fieldClasses.js"

export interface ClienteResumoSelect {
  id: string
  nome: string
  telefone?: string
  bairro?: string
}

interface ClienteSelectProps {
  value: string | null
  onChange: (id: string) => void
  clientes: ClienteResumoSelect[]
  error?: string
}

/** Seletor de cliente buscável (port do Lovable `ClienteSelect.tsx` — PLAN-056). */
export function ClienteSelect({ value, onChange, clientes, error }: ClienteSelectProps) {
  const { t } = useTranslation()
  const [busca, setBusca] = useState("")
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // O dropdown usa position:fixed p/ escapar de ancestrais com overflow-hidden
  // (ex.: Card) — P5. Fecha em scroll/resize p/ não "flutuar" fora do lugar.
  useEffect(() => {
    if (!aberto) return
    const fechar = () => setAberto(false)
    window.addEventListener("scroll", fechar, true)
    window.addEventListener("resize", fechar)
    return () => {
      window.removeEventListener("scroll", fechar, true)
      window.removeEventListener("resize", fechar)
    }
  }, [aberto])

  const selecionado = clientes.find((c) => c.id === value) ?? null

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter((c) =>
      `${c.nome} ${c.telefone ?? ""} ${c.bairro ?? ""}`.toLowerCase().includes(q),
    )
  }, [busca, clientes])

  function alternar() {
    if (aberto) {
      setAberto(false)
      return
    }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    setAberto(true)
  }

  const escolher = (c: ClienteResumoSelect) => {
    onChange(c.id)
    setBusca("")
    setAberto(false)
  }

  return (
    <div
      ref={boxRef}
      className="relative"
      onBlur={(e) => {
        if (!boxRef.current?.contains(e.relatedTarget as Node)) setAberto(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={alternar}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className={`${fieldControl} flex items-center justify-between gap-2 text-left`}
      >
        <span className={selecionado ? "text-text-primary" : "text-text-muted"}>
          {selecionado ? selecionado.nome : t("contrato.selecionarCliente")}
        </span>
        <ChevronDown className="size-4 shrink-0 text-text-muted" aria-hidden />
      </button>

      {error && <span className="mt-1 block text-xs font-medium text-danger-text">{error}</span>}

      {aberto && pos && (
        <div
          role="listbox"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 50 }}
          className="rounded-xl border border-border bg-card p-1 shadow-lg"
        >
          <div className="relative p-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={t("contrato.buscarCliente")}
              aria-label={t("contrato.buscarCliente")}
              className={`${fieldControl} pl-9`}
            />
          </div>

          {filtrados.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-text-muted">
              {t("contrato.nenhumClienteEncontrado")}
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtrados.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.id === value}
                    onClick={() => escolher(c)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text-primary">{c.nome}</span>
                      <span className="block truncate text-xs text-text-muted">
                        {[c.bairro, c.telefone].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {c.id === value && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
