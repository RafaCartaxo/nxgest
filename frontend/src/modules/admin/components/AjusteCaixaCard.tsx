import { useTranslation } from "react-i18next"
import { Card } from "../../../shared/components/Card/Card.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { AjusteCaixaForm } from "../../caixa/components/AjusteCaixaForm.js"

interface AjusteCaixaCardProps {
  caixaBase: number
  saldoAtual: number
  onAjustar: (valor: number, motivo: string) => Promise<void>
}

/** Ajuste da caixa base do operador — container que reusa o `AjusteCaixaForm` (mesmo form do modal). */
export function AjusteCaixaCard({ caixaBase, saldoAtual, onAjustar }: AjusteCaixaCardProps) {
  const { t } = useTranslation()

  return (
    <section className="space-y-4">
      <SectionHeader title={t("admin.ajustarCaixaOperador")} />
      <Card.Root variant="detail">
        <Card.Body>
          <AjusteCaixaForm
            caixaBase={caixaBase}
            saldoAtual={saldoAtual}
            onAjustar={onAjustar}
          />
        </Card.Body>
      </Card.Root>
    </section>
  )
}
