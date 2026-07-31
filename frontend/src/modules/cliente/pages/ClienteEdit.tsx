import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft } from "lucide-react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getCliente, updateCliente } from "../services/cliente.service.js"
import { ApiError } from "../../../api/client.js"
import { Button } from "../../../shared/components/Button.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
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
        <div className="mb-4 flex items-center gap-2">
          <Link to={`/clientes/${id}`} className="text-text-muted hover:text-text-primary">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-semibold">{t("cliente.editar")}</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-secondary-light" />
          <div className="h-4 w-96 rounded bg-secondary-light" />
          <div className="h-4 w-80 rounded bg-secondary-light" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center gap-2">
        <Link to={`/clientes/${id}`} className="text-text-muted hover:text-text-primary">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-semibold">{t("cliente.editar")}</h1>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
        <SectionHeader title={t("cliente.dadosCliente")} />

        <div>
          <label className="block text-sm font-medium">{t("cliente.nome")} <span className="text-red-500">*</span></label>
          <input
            {...form.register("nome")}
            autoFocus
            className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.nome?.message && <p className="mt-1 text-xs text-red-500">{errors.nome.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">{t("cliente.telefone")} <span className="text-red-500">*</span></label>
          <input
            value={form.watch("telefone")}
            onChange={(e) => { form.setValue("telefone", maskPhone(e.target.value)); form.clearErrors("telefone") }}
            type="tel"
            placeholder={t("cliente.telefonePlaceholder")}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.telefone?.message && <p className="mt-1 text-xs text-red-500">{errors.telefone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">{t("cliente.cpf")}</label>
          <input
            value={form.watch("cpf") ?? ""}
            onChange={(e) => { form.setValue("cpf", maskCpf(e.target.value)); form.clearErrors("cpf") }}
            inputMode="numeric"
            placeholder={t("cliente.cpfPlaceholder")}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.cpf?.message && <p className="mt-1 text-xs text-red-500">{errors.cpf.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">{t("cliente.comercio")} <span className="text-red-500">*</span></label>
          <input
            {...form.register("comercio")}
            placeholder={t("cliente.comercioPlaceholder")}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.comercio?.message && <p className="mt-1 text-xs text-red-500">{errors.comercio.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">{t("cliente.telefoneComercio")}</label>
          <input
            value={form.watch("telefoneComercio") ?? ""}
            onChange={(e) => { form.setValue("telefoneComercio", maskPhone(e.target.value)); form.clearErrors("telefoneComercio") }}
            type="tel"
            placeholder={t("cliente.telefonePlaceholder")}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.telefoneComercio?.message && <p className="mt-1 text-xs text-red-500">{errors.telefoneComercio.message}</p>}
        </div>

        <SectionHeader title={t("cliente.enderecoComercio")} />

        <div className="mt-2">
          <button
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
            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {geocodingLoading ? t("pagamento.calculando") : `📍 ${t("cliente.usarLocalAtual")}`}
          </button>
        </div>

        {comercioExpandido && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium">{t("cliente.logradouro")}</label>
                <input {...form.register("comercioLogradouro")} className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium">{t("cliente.numero")}</label>
                <input {...form.register("comercioNumero")} className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">{t("cliente.bairro")}</label>
                <input {...form.register("comercioBairro")} className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium">{t("cliente.cidade")}</label>
                <input {...form.register("comercioCidade")} className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium">{t("cliente.uf")}</label>
                <input {...form.register("comercioEstado")} maxLength={2} placeholder={t("cliente.ufPlaceholder")} className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </>
        )}
        {!comercioExpandido && (
          <button
            type="button"
            onClick={() => setComercioExpandido(true)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            {t("cliente.expandirEndereco")}
          </button>
        )}

        <SectionHeader title={t("cliente.endereco")} />

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium">{t("cliente.logradouro")} <span className="text-red-500">*</span></label>
            <input
              {...form.register("logradouro")}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.logradouro?.message && <p className="mt-1 text-xs text-red-500">{errors.logradouro.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">{t("cliente.numero")}</label>
            <input
              {...form.register("numero")}
              inputMode="numeric"
              className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium">{t("cliente.bairro")}</label>
            <input
              {...form.register("bairro")}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">{t("cliente.complemento")}</label>
            <input
              {...form.register("complemento")}
              placeholder={t("cliente.complementoPlaceholder")}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <label className="block text-sm font-medium">{t("cliente.cidade")}</label>
            <input
              {...form.register("cidade")}
              onChange={(e) => { form.setValue("cidade", e.target.value); form.clearErrors("cidade") }}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-base   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.cidade?.message && <p className="mt-1 text-xs text-red-500">{errors.cidade.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">{t("cliente.uf")}</label>
            <input
              value={form.watch("estado") ?? ""}
              onChange={(e) => { form.setValue("estado", e.target.value.toUpperCase().slice(0, 2)); form.clearErrors("estado") }}
              maxLength={2}
              placeholder={t("cliente.ufPlaceholder")}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-base   uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.estado?.message && <p className="mt-1 text-xs text-red-500">{errors.estado.message}</p>}
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
