import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { useTranslation } from "react-i18next"
import { Mail } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { FieldSelect } from "../../../shared/components/Field/FieldSelect.js"
import { AvatarField } from "../../../shared/components/Avatar/Avatar.js"
import type { OperadorRow } from "../services/admin.service.js"

interface FieldErrors {
  nome?: string
  email?: string
}

export interface OperadorFormData {
  nome: string
  email: string
  telefone: string | null
  role: "admin" | "socio" | "operator"
  chefeId?: string | null
  foto?: string | null
}

interface Props {
  editing: OperadorRow | null
  /** Possíveis chefes (admins + sócios da empresa) — apenas para admin/super. */
  chefes?: OperadorRow[]
  /** Role de quem está criando/gerenciando (admin/socio/super_admin). */
  actorRole?: "admin" | "socio" | "super_admin"
  onSubmit: (data: OperadorFormData) => Promise<void>
  onCancel: () => void
}

export interface OperadorFormHandle {
  submit: () => Promise<void>
}

export const OperadorForm = forwardRef<OperadorFormHandle, Props>(function OperadorForm(
  { editing, chefes = [], actorRole, onSubmit }: Props,
  ref,
) {
  const { t } = useTranslation()
  const [nome, setNome] = useState(editing?.nome ?? "")
  const [email, setEmail] = useState(editing?.email ?? "")
  const [telefone, setTelefone] = useState(editing?.telefone ?? "")
  const [role, setRole] = useState<"admin" | "socio" | "operator">(editing && editing.role !== "super_admin" ? editing.role : "operator")
  const [chefeId, setChefeId] = useState<string>(editing?.chefeId ?? "")
  const [foto, setFoto] = useState<string | null>(editing?.foto ?? null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const nomeRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const isActorSocio = actorRole === "socio"

  useEffect(() => {
    const firstKey = (Object.keys(errors) as (keyof FieldErrors)[]).find((k) => errors[k])
    if (!firstKey) return
    const refs: Record<keyof FieldErrors, React.RefObject<HTMLInputElement | null>> = { nome: nomeRef, email: emailRef }
    refs[firstKey]?.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    refs[firstKey]?.current?.focus()
  }, [errors])

  function validate(): boolean {
    const e: FieldErrors = {}
    if (nome.trim().length < 3) e.nome = t("admin.validacao.nomeObrigatorio")
    if (!email.trim() || !email.includes("@")) e.email = t("admin.validacao.emailInvalido")
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    if (!validate()) return
    await onSubmit({
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefone.trim() === "" ? null : telefone.trim(),
      role,
      foto: editing ? foto : undefined,
      // Sócio: chefe é ele mesmo; admin/super: chefe selecionado (ou null = sob o admin)
      chefeId: isActorSocio ? undefined : role === "admin" ? null : chefeId || null,
    })
  }

  // Botões de ação ficam no `Modal.footer` (AdminPage) — expomos submit() via ref.
  useImperativeHandle(ref, () => ({ submit }))

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit()
  }

  const showChefe = !isActorSocio && (role === "operator" || role === "socio")

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <Card.Root tone="success" className="p-4">
        <h2 className="mb-4 pl-2 font-display text-[20px] font-semibold text-text-primary">{t("admin.secaoDadosPessoais")}</h2>
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3 md:pt-1">
            <AvatarField
              nome={nome}
              foto={foto}
              label={t("avatar.foto")}
              size="lg"
              onChange={(f) => setFoto(f)}
            />
          </div>
          <div className="flex-1 space-y-4">
            <Field
              label={t("admin.nome")}
              ref={nomeRef}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              error={errors.nome}
            />
            <Field
              label={t("admin.telefone")}
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder={t("perfil.telefoneOpcional")}
            />
          </div>
        </div>
      </Card.Root>

      <Card.Root tone="info" className="p-4">
        <h2 className="mb-4 pl-2 font-display text-[20px] font-semibold text-text-primary">{t("admin.secaoAcesso")}</h2>
        <Field
          label={t("admin.email")}
          type="email"
          ref={emailRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
      </Card.Root>

      <Card.Root tone="neutral" className="p-4">
        <h2 className="mb-4 pl-2 font-display text-[20px] font-semibold text-text-primary">{t("admin.secaoPermissoes")}</h2>
        <div className="space-y-4">
          {isActorSocio ? (
            <Field label={t("admin.role")} value={t("admin.roleOperator")} disabled />
          ) : (
            <FieldSelect
              label={t("admin.role")}
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "socio" | "operator")}
              options={[
                { value: "operator", label: t("admin.roleOperator") },
                { value: "socio", label: t("admin.roleSocio") },
                { value: "admin", label: t("admin.roleAdmin") },
              ]}
            />
          )}

          {showChefe && (
            <FieldSelect
              label={t("admin.chefe")}
              value={chefeId}
              onChange={(e) => setChefeId(e.target.value)}
              options={[
                { value: "", label: t("admin.chefeSem") },
                ...chefes.map((c) => ({
                  value: c.id,
                  label: `${c.nome} · ${c.role === "socio" ? t("admin.roleSocio") : t("admin.roleAdmin")}`,
                })),
              ]}
            />
          )}

          {!editing && (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-primary-light p-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary-text" aria-hidden />
              <p className="text-xs leading-relaxed text-text-secondary">{t("admin.conviteExplicacao")}</p>
            </div>
          )}
        </div>
      </Card.Root>
    </form>
  )
})
