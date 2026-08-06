import { useState } from "react"
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "../../../shared/components/Button.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { FieldSelect } from "../../../shared/components/Field/FieldSelect.js"

interface EmpresaFormData {
  nome: string
  documento?: string
  nomeFantasia?: string
  ativa: boolean
  adminNome: string
  adminEmail: string
  adminSenha: string
}

interface EmpresaFormProps {
  onSubmit: (data: EmpresaFormData) => void
  onCancel: () => void
}

export function EmpresaForm({ onSubmit, onCancel }: EmpresaFormProps) {
  const { t } = useTranslation()
  const [nome, setNome] = useState("")
  const [nomeFantasia, setNomeFantasia] = useState("")
  const [documento, setDocumento] = useState("")
  const [ativa, setAtiva] = useState<"ativa" | "inativa">("ativa")
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
          placeholder="00.000.000/0000-00"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
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
        required
        minLength={6}
        value={adminSenha}
        onChange={(e) => setAdminSenha(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit"><Check className="size-4" /> {t("superAdmin.criarEmpresa")}</Button>
      </div>
    </form>
  )
}
