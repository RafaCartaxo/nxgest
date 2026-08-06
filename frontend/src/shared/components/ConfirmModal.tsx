import { useTranslation } from "react-i18next"
import { Button } from "./Button.js"
import { Modal } from "./Modal/Modal.js"

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      descricao={message}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmLabel ?? t("common.confirmDelete")}
          </Button>
        </>
      }
    />
  )
}
