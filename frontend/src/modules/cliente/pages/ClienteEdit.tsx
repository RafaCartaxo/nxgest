import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { User } from "lucide-react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getCliente, updateCliente } from "../services/cliente.service.js"
import { ApiError } from "../../../api/client.js"
import { Button } from "../../../shared/components/Button.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { maskCpf, maskPhone, unmask } from "../../../shared/utils/masks.js"
import { getClienteSchema, type ClienteFormData } from "../schemas/cliente.schema.js"
import { reverseGeocode } from "../../../shared/utils/geocoding.js"

export function ClienteEdit() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const feedback = useFeedback()
  const [carregando, setCarregando] = useState(true)

  const form = useForm<ClienteFormData>({
    shouldFocusError: true,
    resolver: zodResolver(getClienteSchema(t)),
    defaultValues: {
      nome: "", telefone: "", telefoneComercio: "", cpf: "", comercio: "",
      logradouro: "", numero: "", complemento: "", bairro: "", cidade: "",       estado: "",
      comercioLogradouro: "",
      comercioNumero: "",
      comercioBairro: "",
      comercioCidade: "",
      comercioEstado: "",
      comercioLat: undefined,
      comercioLng: undefined,
    },
  })

  const [comercioExpandido, setComercioExpandido] = useState(false)
  const [geocodingLoading, setGeocodingLoading] = useState(false)
  const cooldownRef = useRef(false)
  const [formLoaded, setFormLoaded] = useState(false)

  const errors = form.formState.errors

  useEffect(() => {
    if (!id) return

    getCliente(id)
      .then((cliente) => {
        form.reset({
          nome: cliente.nome,
          telefone: maskPhone(cliente.telefone),
          telefoneComercio: cliente.telefoneComercio ? maskPhone(cliente.telefoneComercio) : "",
          cpf: cliente.cpf ? maskCpf(cliente.cpf) : "",
          comercio: cliente.comercio ?? "",
          logradouro: cliente.endereco.logradouro,
          numero: cliente.endereco.numero ?? "",
          complemento: cliente.endereco.complemento ?? "",
          bairro: cliente.endereco.bairro ?? "",
          cidade: cliente.endereco.cidade ?? "",
          estado: cliente.endereco.estado ?? "",
          comercioLogradouro: cliente.enderecoComercio?.logradouro ?? "",
          comercioNumero: cliente.enderecoComercio?.numero ?? "",
          comercioBairro: cliente.enderecoComercio?.bairro ?? "",
          comercioCidade: cliente.enderecoComercio?.cidade ?? "",
          comercioEstado: cliente.enderecoComercio?.estado ?? "",
          comercioLat: cliente.localizacaoComercio?.lat,
          comercioLng: cliente.localizacaoComercio?.lng,
        })
        setComercioExpandido(!!cliente.enderecoComercio?.logradouro || !!cliente.localizacaoComercio)
        setFormLoaded(true)
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          feedback.show({ status: "error", message: err.message })
        } else {
          feedback.show({ status: "error", message: t("cliente.erroCarregar") })
        }
      })
      .finally(() => setCarregando(false))
  }, [id])

  async function handleSubmit(data: ClienteFormData) {
    if (!id) return

    await feedback.run({
      loading: t("common.saving"),
      success: "Cliente atualizado.",
      error: t("cliente.erroSalvar"),
      action: async () => {
        try {
          const payload: Record<string, unknown> = {
            nome: data.nome,
            comercio: data.comercio,
            telefone: unmask(data.telefone),
            telefoneComercio: data.telefoneComercio ? unmask(data.telefoneComercio) : undefined,
            endereco: {
              logradouro: data.logradouro,
              numero: data.numero || undefined,
              complemento: data.complemento || undefined,
              bairro: data.bairro || undefined,
              cidade: data.cidade || undefined,
              estado: data.estado || undefined,
            },
            ...(comercioExpandido ? {
              enderecoComercio: data.comercioLogradouro ? {
                logradouro: data.comercioLogradouro,
                numero: data.comercioNumero || undefined,
                bairro: data.comercioBairro || undefined,
                cidade: data.comercioCidade || undefined,
                estado: data.comercioEstado || undefined,
              } : null,
              localizacaoComercio: data.comercioLat != null && data.comercioLng != null ? {
                lat: data.comercioLat,
                lng: data.comercioLng,
              } : null,
            } : {}),
          }

          const cpfDigits = data.cpf ? unmask(data.cpf) : ""
          if (cpfDigits) {
            payload.cpf = cpfDigits
          }

          await updateCliente(id, payload)
          navigate(`/clientes/${id}`)
        } catch (err) {
          if (err instanceof ApiError && err.details) {
            const fieldMap: Record<string, string> = {
              cpf: "cpf",
              telefone: "telefone",
              telefoneComercio: "telefoneComercio",
              nome: "nome",
              comercio: "comercio",
              "endereco.logradouro": "logradouro",
              "endereco.bairro": "bairro",
              "endereco.numero": "numero",
              "endereco.complemento": "complemento",
              "endereco.cidade": "cidade",
              "endereco.estado": "estado",
              "enderecoComercio.logradouro": "comercioLogradouro",
              "enderecoComercio.cidade": "comercioCidade",
              "enderecoComercio.estado": "comercioEstado",
              "enderecoComercio.numero": "comercioNumero",
              "enderecoComercio.bairro": "comercioBairro",
            }
            for (const d of err.details) {
              const formField = fieldMap[d.field]
              if (formField) {
                form.setError(formField as keyof ClienteFormData, { message: d.message })
              }
            }
            const firstField = fieldMap[err.details[0]?.field]
            if (firstField) form.setFocus(firstField as keyof ClienteFormData)
            throw err
          }
          if (err instanceof ApiError) {
            throw new Error(err.message)
          }
          throw err
        }
      },
    })
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <PageHeader
          icon={User}
          title={t("cliente.editar")}
          back={{ onClick: () => navigate(`/clientes/${id}`), title: t("common.back") }}
        />
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-surface-hover" />
          <div className="h-4 w-96 rounded bg-surface-hover" />
          <div className="h-4 w-80 rounded bg-surface-hover" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={User}
        title={t("cliente.editar")}
        back={{ onClick: () => navigate(`/clientes/${id}`), title: t("common.back") }}
      />

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
        <SectionHeader title={t("cliente.dadosCliente")} />

        <Field
          label={t("cliente.nome")}
          required
          autoFocus
          error={errors.nome?.message}
          {...form.register("nome")}
        />

        <Field
          label={t("cliente.telefone")}
          required
          type="tel"
          placeholder={t("cliente.telefonePlaceholder")}
          value={form.watch("telefone")}
          onChange={(e) => { form.setValue("telefone", maskPhone(e.target.value)); form.clearErrors("telefone") }}
          error={errors.telefone?.message}
        />

        <Field
          label={t("cliente.cpf")}
          inputMode="numeric"
          placeholder={t("cliente.cpfPlaceholder")}
          value={form.watch("cpf") ?? ""}
          onChange={(e) => { form.setValue("cpf", maskCpf(e.target.value)); form.clearErrors("cpf") }}
          error={errors.cpf?.message}
        />

        <Field
          label={t("cliente.comercio")}
          required
          placeholder={t("cliente.comercioPlaceholder")}
          error={errors.comercio?.message}
          {...form.register("comercio")}
        />

        <Field
          label={t("cliente.telefoneComercio")}
          type="tel"
          placeholder={t("cliente.telefonePlaceholder")}
          value={form.watch("telefoneComercio") ?? ""}
          onChange={(e) => { form.setValue("telefoneComercio", maskPhone(e.target.value)); form.clearErrors("telefoneComercio") }}
          error={errors.telefoneComercio?.message}
        />

        <SectionHeader title={t("cliente.enderecoComercio")} />

        <div className="mt-2">
          <Button
            type="button"
            disabled={geocodingLoading || cooldownRef.current}
            onClick={async () => {
              if (!navigator.geolocation) {
                feedback.show({ status: "error", message: "GPS não disponível" })
                setComercioExpandido(true)
                return
              }
              if (cooldownRef.current) return
              cooldownRef.current = true
              setGeocodingLoading(true)
              navigator.geolocation.getCurrentPosition(
                async (pos) => {
                  const lat = pos.coords.latitude
                  const lng = pos.coords.longitude
                  form.setValue("comercioLat", lat)
                  form.setValue("comercioLng", lng)
                  try {
                    const end = await reverseGeocode(lat, lng)
                    if (end.logradouro) form.setValue("comercioLogradouro", end.logradouro)
                    if (end.numero) form.setValue("comercioNumero", end.numero)
                    if (end.bairro) form.setValue("comercioBairro", end.bairro)
                    if (end.cidade) form.setValue("comercioCidade", end.cidade)
                    if (end.estado) form.setValue("comercioEstado", end.estado)
                    setComercioExpandido(true)
                    feedback.show({ status: "success", message: "Localização capturada!" })
                  } catch {
                    setComercioExpandido(true)
                    feedback.show({ status: "warning", message: "GPS capturado, mas não foi possível obter o endereço. Preencha manualmente." })
                  } finally {
                    setGeocodingLoading(false)
                    setTimeout(() => { cooldownRef.current = false }, 2000)
                  }
                },
                (err) => {
                  setGeocodingLoading(false)
                  setComercioExpandido(true)
                  cooldownRef.current = false
                  feedback.show({ status: "error", message: err.code === 1 ? "Permissão de localização negada" : "Erro ao obter localização" })
                },
              )
            }}
          >
            {geocodingLoading ? t("pagamento.calculando") : `📍 ${t("cliente.usarLocalAtual")}`}
          </Button>
        </div>

        {comercioExpandido && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Field label={t("cliente.logradouro")} {...form.register("comercioLogradouro")} />
              </div>
              <div>
                <Field label={t("cliente.numero")} {...form.register("comercioNumero")} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <Field label={t("cliente.bairro")} {...form.register("comercioBairro")} />
              </div>
              <div className="col-span-2">
                <Field label={t("cliente.cidade")} {...form.register("comercioCidade")} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Field label={t("cliente.uf")} maxLength={2} placeholder={t("cliente.ufPlaceholder")} {...form.register("comercioEstado")} />
              </div>
            </div>
          </>
        )}
        {!comercioExpandido && (
          <button
            type="button"
            onClick={() => setComercioExpandido(true)}
            className="mt-2 text-sm text-primary hover:underline"
          >
            {t("cliente.expandirEndereco")}
          </button>
        )}

        <SectionHeader title={t("cliente.endereco")} />

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field
              label={t("cliente.logradouro")}
              required
              error={errors.logradouro?.message}
              {...form.register("logradouro")}
            />
          </div>

          <div>
            <Field label={t("cliente.numero")} inputMode="numeric" {...form.register("numero")} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label={t("cliente.bairro")} {...form.register("bairro")} />
          </div>

          <div>
            <Field
              label={t("cliente.complemento")}
              placeholder={t("cliente.complementoPlaceholder")}
              {...form.register("complemento")}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <Field
              label={t("cliente.cidade")}
              error={errors.cidade?.message}
              {...form.register("cidade")}
            />
          </div>

          <div>
            <Field
              label={t("cliente.uf")}
              maxLength={2}
              placeholder={t("cliente.ufPlaceholder")}
              className="uppercase"
              value={form.watch("estado") ?? ""}
              onChange={(e) => { form.setValue("estado", e.target.value.toUpperCase().slice(0, 2)); form.clearErrors("estado") }}
              error={errors.estado?.message}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="flex-1">
            {t("common.save")}
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate(`/clientes/${id}`)}
            className="flex-1"
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  )
}
