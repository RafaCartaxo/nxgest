import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2, Wallet } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { FieldTextarea } from "../../../shared/components/Field/FieldTextarea.js"
import { Button } from "../../../shared/components/Button.js"
import { maskMonetario, unmaskMonetario, formatCurrency } from "../../../shared/utils/masks.js"

interface AjusteCaixaCardProps {
  caixaBase: number
  saldoAtual: number
  onAjustar: (valor: number, motivo: string) => Promise<void>
  saving?: boolean
}

/** Ajuste da caixa base do operador — port do Lovable (PLAN-069), ligado à API real. */
export function AjusteCaixaCard({ caixaBase, saldoAtual, onAjustar, saving = false }: AjusteCaixaCardProps) {
  const { t } = useTranslation()
  const [valor, setValor] = useState(maskMonetario(caixaBase.toFixed(2)))
  const [motivo, setMotivo] = useState("")
  const [erros, setErros] = useState<{ valor?: string; motivo?: string }>({})
  const [salvo, setSalvo] = useState(false)

  async function salvar() {
    const centavos = unmaskMonetario(valor)
    const proximos: { valor?: string; motivo?: string } = {}
    if (centavos <= 0) proximos.valor = t("admin.valorInvalido")
    if (!motivo.trim()) proximos.motivo = t("caixa.motivoObrigatorio")
    setErros(proximos)
    if (Object.keys(proximos).length > 0) {
      setSalvo(false)
      return
    }
    setSalvo(false)
    try {
      await onAjustar(centavos, motivo.trim())
      setSalvo(true)
    } catch {
      setSalvo(false)
    }
  }

  return (
    <section className="space-y-4">
      <SectionHeader title={t("admin.ajustarCaixaOperador")} />
      <Card.Root variant="detail">
        <Card.Body>
          <dl className="grid grid-cols-2 gap-3">
            {[
              { label: t("caixa.caixaBase"), valor: `R$ ${formatCurrency(salvo ? caixaBase : caixaBase)}` },
              { label: t("caixa.saldoAtual"), valor: `R$ ${formatCurrency(saldoAtual)}` },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-surface p-3">
                <dt className="truncate text-xs text-text-muted">{k.label}</dt>
                <dd className="font-display mt-0.5 text-base font-semibold tabular-nums">{k.valor}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 space-y-4">
            <Field
              label={t("admin.novoValor")}
              inputMode="numeric"
              value={valor}
              onChange={(e) => setValor(maskMonetario(e.target.value))}
              error={erros.valor}
            />
            <FieldTextarea
              label={t("caixa.motivo")}
              placeholder={t("caixa.motivoPlaceholder")}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              error={erros.motivo}
              rows={2}
            />
          </div>

          {salvo && (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-success-light px-3 py-2 text-sm font-medium text-success-text">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              {t("admin.ajusteSalvo")}
            </p>
          )}

          <div className="mt-4 sm:flex sm:justify-end">
            <Button type="button" variant="soft" size="block" className="sm:w-auto sm:min-h-11" onClick={salvar} disabled={saving}>
              <Wallet className="size-4" aria-hidden />
              {saving ? t("common.saving") : t("admin.salvarAjuste")}
            </Button>
          </div>
        </Card.Body>
      </Card.Root>
    </section>
  )
}
