import { useState } from "react"
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "../../../shared/components/Button.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { FieldSelect } from "../../../shared/components/Field/FieldSelect.js"
import { maskCpfCnpj } from "../../../shared/utils/masks.js"

interface EmpresaFormData {
  nome: string
  documento?: string
  nomeFantasia?: string
  ativa: boolean
  adminNome: string
  adminEmail: string
  adminSenha?: string
}

export interface EmpresaFormInitial {
  nome: string
  documento?: string | null
  nomeFantasia?: string | null
  ativa: boolean
}

interface EmpresaFormProps {
  onSubmit: (data: EmpresaFormData) => void
  onCancel: () => void
  /** Presente = modo edição (esconde os campos de admin). */
  initial?: EmpresaFormInitial
}

export function EmpresaForm({ onSubmit, onCancel, initial }: EmpresaFormProps) {
  const { t } = useTranslation()
  const editing = !!initial
  const [nome, setNome] = useState(initial?.nome ?? "")
  const [nomeFantasia, setNomeFantasia] = useState(initial?.nomeFantasia ?? "")
  const [documento, setDocumento] = useState(initial?.documento?.replace(/\D/g, "") ?? "")
  const [ativa, setAtiva] = useState<"ativa" | "inativa">(initial ? (initial.ativa ? "ativa" : "inativa") : "ativa")
  const [adminNome, setAdminNome] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminSenha, setAdminSenha] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      nome,
      nomeFantasia: nomeFantasia.trim() || undefined,
      documento: documento.trim() || undefined,
      ativa: ativa === "ativa",
      adminNome,
      adminEmail,
      adminSenha,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label={t("superAdmin.nomeEmpresa")}
        required
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label={t("superAdmin.nomeFantasia")}
          value={nomeFantasia}
          onChange={(e) => setNomeFantasia(e.target.value)}
        />
        <Field
          label={t("superAdmin.documento")}
          placeholder={t("superAdmin.documentoPlaceholder")}
          value={maskCpfCnpj(documento)}
          onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <FieldSelect
        label={t("superAdmin.situacao")}
        value={ativa}
        onChange={(e) => setAtiva(e.target.value as "ativa" | "inativa")}
        options={[
          { value: "ativa", label: t("superAdmin.empresaAtiva") },
          { value: "inativa", label: t("superAdmin.empresaInativa") },
        ]}
      />
      {!editing && (
        <>
          <Field
            label={t("superAdmin.adminNome")}
            required
            value={adminNome}
            onChange={(e) => setAdminNome(e.target.value)}
          />
          <Field
            label={t("superAdmin.adminEmail")}
            type="email"
            required
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
          <Field
            label={t("superAdmin.adminSenha")}
            type="password"
            hint={t("superAdmin.adminSenhaHint")}
            value={adminSenha}
            onChange={(e) => setAdminSenha(e.target.value)}
          />
        </>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit"><Check className="size-4" /> {editing ? t("superAdmin.salvarEmpresa") : t("superAdmin.criarEmpresa")}</Button>
      </div>
    </form>
  )
}
