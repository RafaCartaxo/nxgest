import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "../../../shared/components/Button.js"

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
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{t("superAdmin.nomeEmpresa")}</label>
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-primary" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{t("superAdmin.adminNome")}</label>
        <input type="text" value={adminNome} onChange={(e) => setAdminNome(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-primary" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{t("superAdmin.adminEmail")}</label>
        <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-primary" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{t("superAdmin.adminSenha")}</label>
        <input type="password" value={adminSenha} onChange={(e) => setAdminSenha(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-primary" required minLength={6} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button type="submit">{t("superAdmin.criarEmpresa")}</Button>
      </div>
    </form>
  )
}