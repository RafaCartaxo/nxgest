import { useEffect, type ReactNode } from "react"

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  backdropClose?: boolean
  escapeClose?: boolean
  maxWidth?: string
  className?: string
}

export function Modal({
  open,
  onClose,
  children,
  backdropClose = false,
  escapeClose = true,
  maxWidth = "max-w-sm",
  className,
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

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/40 ${className ?? ""}`}
      onClick={backdropClose ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className={`mx-auto w-full ${maxWidth} rounded-md bg-surface shadow-lg`}>{children}</div>
      </div>
    </div>
  )
}