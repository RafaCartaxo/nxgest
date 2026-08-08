import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2, Receipt } from "lucide-react"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { Button } from "../../../shared/components/Button.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { Card } from "../../../shared/components/Card/Card.js"
import { formatCurrency } from "../../../shared/utils/masks.js"

type Etapa = "resumo" | "confirmar" | "sucesso"

export interface FecharCaixaResumo {
  recebidoHoje: number
  gastosHoje: number
  aReceberHoje: number
  resultadoDoDia: number
}

interface FecharCaixaModalProps {
  open: boolean
  onClose: () => void
  resumo: FecharCaixaResumo
  /** Navega para o fluxo real de fechamento (ex.: `/caixa`). */
  onFechar: () => void
}

/** Fechamento de caixa direto da Central — resumo do dia + confirmação (port do Lovable, PLAN-069). */
export function FecharCaixaModal({ open, onClose, resumo, onFechar }: FecharCaixaModalProps) {
  const { t } = useTranslation()
  const [etapa, setEtapa] = useState<Etapa>("resumo")

  const semMovimento = resumo.recebidoHoje <= 0 && resumo.gastosHoje <= 0

  const encerrar = () => {
    onClose()
    setEtapa("resumo")
  }

  return (
    <Modal
      open={open}
      onClose={encerrar}
      title={t("operacoes.fecharCaixa")}
      descricao={etapa === "confirmar" ? t("caixa.confirmarDesc") : t("caixa.resumoDia")}
      footer={
        etapa === "sucesso" ? (
          <Button variant="primary" onClick={encerrar} className="w-full">
            {t("prefs.concluido")}
          </Button>
        ) : etapa === "confirmar" ? (
          <>
            <Button variant="ghost" onClick={() => setEtapa("resumo")}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEtapa("sucesso")
                onFechar()
              }}
            >
              <Receipt className="size-4" aria-hidden />
              {t("common.confirm")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={encerrar}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" disabled={semMovimento} onClick={() => setEtapa("confirmar")}>
              <Receipt className="size-4" aria-hidden />
              {t("operacoes.fecharCaixa")}
            </Button>
          </>
        )
      }
    >
      {etapa === "sucesso" ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-success-light text-success-text">
            <CheckCircle2 className="size-6" aria-hidden />
          </span>
          <p className="font-semibold">{t("caixa.fechado")}</p>
          <p className="font-display text-xl font-semibold tabular-nums">R$ {formatCurrency(resumo.recebidoHoje)}</p>
        </div>
      ) : semMovimento ? (
        <p className="py-6 text-center text-sm text-text-secondary">{t("caixa.semMovimento")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard title={t("caixa.resultado")} value={`R$ ${formatCurrency(resumo.resultadoDoDia)}`} variant="blue" />
            <KpiCard title={t("caixa.recebidoHoje")} value={`R$ ${formatCurrency(resumo.recebidoHoje)}`} variant="green" />
          </div>
          <Card.Root variant="detail" className="mt-3">
            <Card.Body>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-text-secondary">{t("caixa.gastosHoje")}</span>
                <span className="font-semibold tabular-nums text-danger-text">R$ {formatCurrency(resumo.gastosHoje)}</span>
              </div>
            </Card.Body>
          </Card.Root>
        </>
      )}
    </Modal>
  )
}
