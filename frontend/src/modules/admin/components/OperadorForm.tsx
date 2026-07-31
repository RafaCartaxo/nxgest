import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "../../../shared/components/Button.js"
import type { OperadorRow } from "../services/admin.service.js"

interface FieldErrors {
  nome?: string
  email?: string
  senha?: string
}

interface Props {
  editing: OperadorRow | null
  onSubmit: (data: { nome: string; email: string; role: "admin" | "operator"; senha?: string }) => Promise<void>
  onCancel: () => void
}

export function OperadorForm({ editing, onSubmit, onCancel }: Props) {
  const { t } = useTranslation()
  const [nome, setNome] = useState(editing?.nome ?? "")
  const [email, setEmail] = useState(editing?.email ?? "")
  const [senha, setSenha] = useState("")
  const [role, setRole] = useState<"admin" | "operator">(editing?.role ?? "operator")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const nomeRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const senhaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const firstKey = (Object.keys(errors) as (keyof FieldErrors)[]).find((k) => errors[k])
    if (!firstKey) return
    const refs: Record<keyof FieldErrors, React.RefObject<HTMLInputElement | null>> = { nome: nomeRef, email: emailRef, senha: senhaRef }
    refs[firstKey]?.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    refs[firstKey]?.current?.focus()
  }, [errors])

  function validate(): boolean {
    const e: FieldErrors = {}
    if (nome.trim().length < 3) e.nome = t("admin.validacao.nomeObrigatorio")
    if (!email.trim() || !email.includes("@")) e.email = t("admin.validacao.emailInvalido")
    if (!editing && senha.length < 6) e.senha = t("admin.validacao.senhaCurta")
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({ nome: nome.trim(), email: email.trim(), role, senha: senha || undefined })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h3 className="font-medium text-text-primary text-lg">
        {editing ? t("admin.editarOperador") : t("admin.novoOperador")}
      </h3>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{t("admin.nome")}</label>
        <input
          ref={nomeRef}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={`w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.nome ? "border-red-300" : "border-border"}`}
        />
        {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{t("admin.email")}</label>
        <input
          ref={emailRef}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? "border-red-300" : "border-border"}`}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{t("admin.senha")}</label>
        <input
          ref={senhaRef}
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder={editing ? t("admin.senhaOpcional") : ""}
          className={`w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.senha ? "border-red-300" : "border-border"}`}
        />
        {errors.senha && <p className="text-red-500 text-xs mt-1">{errors.senha}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{t("admin.role")}</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "operator")}
          className="w-full rounded-md border border-border px-3 py-2 text-base"
        >
          <option value="operator">{t("admin.roleOperator")}</option>
          <option value="admin">{t("admin.roleAdmin")}</option>
        </select>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  )
}
