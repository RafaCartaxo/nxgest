import { useTranslation } from "react-i18next"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { AjusteCaixaForm } from "./AjusteCaixaForm.js"

interface AjustarCaixaModalProps {
  open: boolean
  onClose: () => void
  caixaBase: number
  saldoAtual: number
  onAjustar: (valor: number, motivo: string) => Promise<void>
}

/** Ajuste da Caixa Total em modal (CaixaPage) — container do form reutilizável. */
export function AjustarCaixaModal({ open, onClose, caixaBase, saldoAtual, onAjustar }: AjustarCaixaModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("caixa.ajustarTituloModal")}
      maxWidth="max-w-md"
      footer={
        <Button variant="ghost" onClick={onClose} className="w-full">
          {t("common.cancel")}
        </Button>
      }
    >
      <AjusteCaixaForm
        caixaBase={caixaBase}
        saldoAtual={saldoAtual}
        onAjustar={onAjustar}
        onSuccess={onClose}
      />
    </Modal>
  )
}
