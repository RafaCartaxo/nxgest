import { useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  descricao?: string
  footer?: ReactNode
  children?: ReactNode
  backdropClose?: boolean
  escapeClose?: boolean
  maxWidth?: string
}

export function Modal({
  open,
  onClose,
  title,
  descricao,
  footer,
  children,
  backdropClose = false,
  escapeClose = true,
  maxWidth = "max-w-sm",
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = ""
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    if (!open || !escapeClose) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose, escapeClose])

  if (!open) return null

  /* portal no body: o modal escapa de qualquer stacking context do ancestor
     (ex.: header sticky com z-index do AppLayout) e fica acima de overlays fixos */
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={backdropClose ? onClose : undefined}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-slide-in-from-bottom relative flex max-h-[90dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-xl border border-border bg-card sm:rounded-xl sm:animate-none`}
      >
        {(title || descricao) && (
          <div className="flex items-start gap-3 border-b border-border px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[18px] font-semibold text-text-primary">{title}</h2>
              {descricao && <p className="mt-0.5 text-sm text-text-secondary">{descricao}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-text-muted hover:bg-surface-hover"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-4 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
