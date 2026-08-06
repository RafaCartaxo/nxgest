import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ApiError } from "../../../api/client.js"
import { Button } from "../../../shared/components/Button.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { maskCpf, maskPhone, unmask } from "../../../shared/utils/masks.js"
import { getClienteSchema, type ClienteFormData } from "../schemas/cliente.schema.js"
import type { Cliente } from "../services/cliente.service.js"
import { useGeolocation, type UseGeolocationReturn } from "../../../shared/geo/hooks.js"
import { CapturaLocalizacao } from "../../../shared/geo/CapturaLocalizacao.js"
import type { EnderecoTexto } from "../../../shared/geo/types.js"

interface ClienteFormProps {
  /** Cliente a editar (null = novo). */
  initial?: Cliente | null
  /** Executa o create/update real (pode lançar ApiError). */
  onSubmit: (payload: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}

const camposComercio = ["comercioLogradouro", "comercioNumero", "comercioBairro", "comercioCidade", "comercioEstado"]
const camposPrincipal = ["logradouro", "numero", "bairro", "cidade", "estado", "complemento"]

const defaultValues: ClienteFormData = {
  nome: "", telefone: "", telefoneComercio: "", cpf: "", comercio: "",
  logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
  comercioLogradouro: "", comercioNumero: "", comercioBairro: "", comercioCidade: "", comercioEstado: "",
  comercioLat: undefined, comercioLng: undefined,
  lat: undefined, lng: undefined,
}

/** Form de cliente compartilhado (PLAN-055) — extrai ClienteNovo/ClienteEdit. */
export function ClienteForm({ initial = null, onSubmit, onCancel }: ClienteFormProps) {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const editing = !!initial

  const form = useForm<ClienteFormData>({
    shouldFocusError: true,
    resolver: zodResolver(getClienteSchema(t)),
    defaultValues,
  })

  const [comercioExpandido, setComercioExpandido] = useState(false)
  const isGeocodingRef = useRef(false)
  const geoComercio = useGeolocation()
  const geoPrincipal = useGeolocation()

  const errors = form.formState.errors

  // Preenche o form quando editando (guarda `isGeocoding` para não disparar o watcher).
  useEffect(() => {
    if (!initial) return
    isGeocodingRef.current = true
    form.reset({
      nome: initial.nome,
      telefone: maskPhone(initial.telefone),
      telefoneComercio: initial.telefoneComercio ? maskPhone(initial.telefoneComercio) : "",
      cpf: initial.cpf ? maskCpf(initial.cpf) : "",
      comercio: initial.comercio ?? "",
      logradouro: initial.endereco.logradouro,
      numero: initial.endereco.numero ?? "",
      complemento: initial.endereco.complemento ?? "",
      bairro: initial.endereco.bairro ?? "",
      cidade: initial.endereco.cidade ?? "",
      estado: initial.endereco.estado ?? "",
      comercioLogradouro: initial.enderecoComercio?.logradouro ?? "",
      comercioNumero: initial.enderecoComercio?.numero ?? "",
      comercioBairro: initial.enderecoComercio?.bairro ?? "",
      comercioCidade: initial.enderecoComercio?.cidade ?? "",
      comercioEstado: initial.enderecoComercio?.estado ?? "",
      comercioLat: initial.localizacaoComercio?.lat,
      comercioLng: initial.localizacaoComercio?.lng,
      lat: initial.localizacao?.lat,
      lng: initial.localizacao?.lng,
    })
    setComercioExpandido(!!initial.enderecoComercio?.logradouro || !!initial.localizacaoComercio)
    isGeocodingRef.current = false
  }, [initial, form])

  // FIX do endereço (PLAN-055): editar o texto do endereço descarta as coordenadas
  // (a localização capturada fica inválida; recapturar depois se quiser).
  useEffect(() => {
    const sub = form.watch((value, { name }) => {
      if (isGeocodingRef.current || !name) return
      if (camposComercio.includes(name)) {
        if (value.comercioLat != null || value.comercioLng != null) {
          form.setValue("comercioLat", undefined)
          form.setValue("comercioLng", undefined)
        }
      } else if (camposPrincipal.includes(name)) {
        if (value.lat != null || value.lng != null) {
          form.setValue("lat", undefined)
          form.setValue("lng", undefined)
        }
      }
    })
    return () => sub.unsubscribe()
  }, [form])

  function aplicarEndereco(
    geo: UseGeolocationReturn,
    aplicarCoords: (lat: number, lng: number) => void,
    aplicarTexto: (end: Partial<EnderecoTexto>) => void,
  ) {
    return async () => {
      const r = await geo.capturar()
      if (!r) return
      isGeocodingRef.current = true
      aplicarCoords(r.localizacao.lat, r.localizacao.lng)
      aplicarTexto(r.endereco)
      isGeocodingRef.current = false
    }
  }

  const capturarComercio = aplicarEndereco(
    geoComercio,
    (lat, lng) => {
      form.setValue("comercioLat", lat)
      form.setValue("comercioLng", lng)
    },
    (end) => {
      if (end.logradouro) form.setValue("comercioLogradouro", end.logradouro)
      if (end.numero) form.setValue("comercioNumero", end.numero)
      if (end.bairro) form.setValue("comercioBairro", end.bairro)
      if (end.cidade) form.setValue("comercioCidade", end.cidade)
      if (end.estado) form.setValue("comercioEstado", end.estado)
      setComercioExpandido(true)
    },
  )

  const capturarPrincipal = aplicarEndereco(
    geoPrincipal,
    (lat, lng) => {
      form.setValue("lat", lat)
      form.setValue("lng", lng)
    },
    (end) => {
      if (end.logradouro) form.setValue("logradouro", end.logradouro)
      if (end.numero) form.setValue("numero", end.numero)
      if (end.bairro) form.setValue("bairro", end.bairro)
      if (end.cidade) form.setValue("cidade", end.cidade)
      if (end.estado) form.setValue("estado", end.estado)
    },
  )

  function buildPayload(data: ClienteFormData): Record<string, unknown> {
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
    }
    const cpfDigits = data.cpf ? unmask(data.cpf) : ""
    if (cpfDigits) payload.cpf = cpfDigits

    payload.enderecoComercio = data.comercioLogradouro
      ? {
          logradouro: data.comercioLogradouro,
          numero: data.comercioNumero || undefined,
          bairro: data.comercioBairro || undefined,
          cidade: data.comercioCidade || undefined,
          estado: data.comercioEstado || undefined,
        }
      : editing
        ? null
        : undefined

    payload.localizacaoComercio =
      data.comercioLat != null && data.comercioLng != null
        ? { lat: data.comercioLat, lng: data.comercioLng }
        : editing
          ? null
          : undefined

    payload.localizacao =
      data.lat != null && data.lng != null
        ? { lat: data.lat, lng: data.lng }
        : editing
          ? null
          : undefined

    return payload
  }

  async function handleSubmit(data: ClienteFormData) {
    await feedback.run({
      loading: t("common.saving"),
      success: editing ? "Cliente atualizado." : "Cliente cadastrado.",
      error: editing ? t("cliente.erroSalvar") : t("cliente.erroCriar"),
      action: async () => {
        try {
          await onSubmit(buildPayload(data))
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

  const comercioCapturada = form.watch("comercioLat") != null
  const principalCapturada = form.watch("lat") != null

  return (
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

      <CapturaLocalizacao
        capturando={geoComercio.capturando}
        capturada={comercioCapturada}
        onCapturar={capturarComercio}
        onRecapturar={capturarComercio}
        erro={geoComercio.erro}
      />

      {comercioExpandido && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Field label={t("cliente.logradouro")} {...form.register("comercioLogradouro")} />
            </div>
            <div>
              <Field label={t("cliente.numero")} {...form.register("comercioNumero")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Field label={t("cliente.bairro")} {...form.register("comercioBairro")} />
            </div>
            <div className="col-span-2">
              <Field label={t("cliente.cidade")} {...form.register("comercioCidade")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
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

      <CapturaLocalizacao
        capturando={geoPrincipal.capturando}
        capturada={principalCapturada}
        onCapturar={capturarPrincipal}
        onRecapturar={capturarPrincipal}
        erro={geoPrincipal.erro}
      />

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
        <Button variant="secondary" type="button" onClick={onCancel} className="flex-1">
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  )
}
