import { useTranslation } from "react-i18next"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { AjusteCaixaForm } from "./AjusteCaixaForm.js"

interface AjustarCaixaModalProps {
  open: boolean
  onClose: () => void
  caixaBase: number
  saldoAtual: number
  /** Título contextual (ex.: "Ajustar Caixa Total" no caixa próprio · "Ajustar caixa base do operador" no operador). */
  title: string
  onAjustar: (valor: number, motivo: string) => Promise<void>
}

/** Ajuste da Caixa (Total/base) em modal — form único reutilizado (CaixaPage e OperadorDetail). */
export function AjustarCaixaModal({ open, onClose, caixaBase, saldoAtual, title, onAjustar }: AjustarCaixaModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
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
