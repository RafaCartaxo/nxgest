import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "../../../shared/components/Button.js"
import { Field } from "../../../shared/components/Field/Field.js"
import type { OperadorRow } from "../services/admin.service.js"

interface FieldErrors {
  nome?: string
  email?: string
  senha?: string
}

interface Props {
  editing: OperadorRow | null
  /** Possíveis chefes (admins + sócios da empresa) — apenas para admin/super. */
  chefes?: OperadorRow[]
  /** Role de quem está criando/gerenciando (admin/socio/super_admin). */
  actorRole?: "admin" | "socio" | "super_admin"
  onSubmit: (data: { nome: string; email: string; role: "admin" | "socio" | "operator"; senha?: string; chefeId?: string | null }) => Promise<void>
  onCancel: () => void
}

export function OperadorForm({ editing, chefes = [], actorRole, onSubmit, onCancel }: Props) {
  const { t } = useTranslation()
  const [nome, setNome] = useState(editing?.nome ?? "")
  const [email, setEmail] = useState(editing?.email ?? "")
  const [senha, setSenha] = useState("")
  const [role, setRole] = useState<"admin" | "socio" | "operator">(editing && editing.role !== "super_admin" ? editing.role : "operator")
  const [chefeId, setChefeId] = useState<string>(editing?.chefeId ?? "")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const nomeRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const senhaRef = useRef<HTMLInputElement>(null)

  const isActorSocio = actorRole === "socio"

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
      await onSubmit({
        nome: nome.trim(),
        email: email.trim(),
        role,
        senha: senha || undefined,
        // Sócio: chefe é ele mesmo; admin/super: chefe selecionado (ou null = sob o admin)
        chefeId: isActorSocio ? undefined : role === "admin" ? null : chefeId || null,
      })
    } finally {
      setLoading(false)
    }
  }

  const showChefe = !isActorSocio && (role === "operator" || role === "socio")

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h3 className="font-medium text-text-primary text-lg">
        {editing ? t("admin.editarOperador") : t("admin.novoOperador")}
      </h3>

      <Field
        label={t("admin.nome")}
        ref={nomeRef}
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        error={errors.nome}
      />

      <Field
        label={t("admin.email")}
        type="email"
        ref={emailRef}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <Field
        label={t("admin.senha")}
        type="password"
        ref={senhaRef}
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder={editing ? t("admin.senhaOpcional") : ""}
        error={errors.senha}
      />

      {isActorSocio ? (
        <Field label={t("admin.role")} value={t("admin.roleOperator")} disabled />
      ) : (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">{t("admin.role")}</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "socio" | "operator")}
            className="min-h-12 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="operator">{t("admin.roleOperator")}</option>
            <option value="socio">{t("admin.roleSocio")}</option>
            <option value="admin">{t("admin.roleAdmin")}</option>
          </select>
        </div>
      )}

      {showChefe && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">{t("admin.chefe")}</label>
          <select
            value={chefeId}
            onChange={(e) => setChefeId(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("admin.chefeSem")}</option>
            {chefes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} · {c.role === "socio" ? t("admin.roleSocio") : t("admin.roleAdmin")}
              </option>
            ))}
          </select>
        </div>
      )}

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
