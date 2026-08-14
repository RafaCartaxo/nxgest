import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { Button } from "../../../shared/components/Button.js"
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

function Secao({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">{children}</p>
}

export function OperadorForm({ editing, chefes = [], actorRole, onSubmit, onCancel }: Props) {
  const { t } = useTranslation()
  const [nome, setNome] = useState(editing?.nome ?? "")
  const [email, setEmail] = useState(editing?.email ?? "")
  const [telefone, setTelefone] = useState(editing?.telefone ?? "")
  const [role, setRole] = useState<"admin" | "socio" | "operator">(editing && editing.role !== "super_admin" ? editing.role : "operator")
  const [chefeId, setChefeId] = useState<string>(editing?.chefeId ?? "")
  const [foto, setFoto] = useState<string | null>(editing?.foto ?? null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim() === "" ? null : telefone.trim(),
        role,
        foto: editing ? foto : undefined,
        // Sócio: chefe é ele mesmo; admin/super: chefe selecionado (ou null = sob o admin)
        chefeId: isActorSocio ? undefined : role === "admin" ? null : chefeId || null,
      })
    } finally {
      setLoading(false)
    }
  }

  const showChefe = !isActorSocio && (role === "operator" || role === "socio")

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Secao>{t("admin.secaoDadosPessoais")}</Secao>
        <div className="flex items-start gap-3">
          <AvatarField
            nome={nome}
            foto={foto}
            label={t("avatar.foto")}
            size="lg"
            onChange={(f) => setFoto(f)}
          />
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
      </div>

      <div>
        <Secao>{t("admin.secaoAcesso")}</Secao>
        <Field
          label={t("admin.email")}
          type="email"
          ref={emailRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        {!editing && (
          <p className="mt-2 text-xs text-text-muted">{t("admin.conviteExplicacao")}</p>
        )}
      </div>

      <div>
        <Secao>{t("admin.secaoPermissoes")}</Secao>
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
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          <Check className="size-4" /> {loading ? t("common.saving") : editing ? t("common.save") : t("admin.enviarConvite")}
        </Button>
      </div>
    </form>
  )
}