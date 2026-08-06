import { useState } from "react"
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "../../../shared/components/Button.js"
import { Field } from "../../../shared/components/Field/Field.js"

interface EmpresaFormProps {
  onSubmit: (data: { nome: string; adminNome: string; adminEmail: string; adminSenha: string }) => void
  onCancel: () => void
}

export function EmpresaForm({ onSubmit, onCancel }: EmpresaFormProps) {
  const { t } = useTranslation()
  const [nome, setNome] = useState("")
  const [adminNome, setAdminNome] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminSenha, setAdminSenha] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ nome, adminNome, adminEmail, adminSenha })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label={t("superAdmin.nomeEmpresa")}
        required
        value={nome}
        onChange={(e) => setNome(e.target.value)}
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
