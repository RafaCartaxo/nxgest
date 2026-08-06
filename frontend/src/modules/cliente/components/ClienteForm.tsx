import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, UserRound, Store } from "lucide-react"
import { AvatarField } from "../../../shared/components/Avatar/Avatar.js"
import { ApiError } from "../../../api/client.js"
import { Button } from "../../../shared/components/Button.js"
import { Card } from "../../../shared/components/Card/Card.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { FieldSelect } from "../../../shared/components/Field/FieldSelect.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { maskCpf, maskPhone, unmask } from "../../../shared/utils/masks.js"
import { getClienteSchema, UFS, type ClienteFormData } from "../schemas/cliente.schema.js"
import type { Cliente } from "../services/cliente.service.js"
import { useGeolocation, type UseGeolocationReturn } from "../../../shared/geo/hooks.js"
import { GpsControl, type GpsEstado } from "../../../shared/geo/GpsControl.js"
import { estadoGpsInicial } from "../../../shared/geo/estadoGps.js"
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
  lat: undefined, lng: undefined, foto: undefined,
}

type BlocoGps = {
  coords: { lat: number; lng: number } | null
  estado: GpsEstado
  aviso: string | null
}

/**
 * Form de cliente compartilhado (PLAN-055/056) — 4 Cards (Identificação · Comércio ·
 * Localização do comércio · Endereço residencial), controle de GPS por bloco e o fix:
 * editar o texto do endereço descarta as coordenadas daquele bloco.
 */
export function ClienteForm({ initial = null, onSubmit, onCancel }: ClienteFormProps) {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const editing = !!initial

  const form = useForm<ClienteFormData>({
    shouldFocusError: true,
    resolver: zodResolver(getClienteSchema(t)),
    defaultValues,
  })

  const [gpsComercio, setGpsComercio] = useState<BlocoGps>({ coords: null, estado: "vazio", aviso: null })
  const [gpsPrincipal, setGpsPrincipal] = useState<BlocoGps>({ coords: null, estado: "vazio", aviso: null })
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
      foto: initial.foto ?? undefined,
    })
    // P7: o GpsControl é controlado — refletir a localização salva no estado do bloco.
    setGpsComercio(estadoGpsInicial(initial.localizacaoComercio))
    setGpsPrincipal(estadoGpsInicial(initial.localizacao))
    isGeocodingRef.current = false
  }, [initial, form])

  // FIX do endereço (PLAN-055): editar o texto descarta as coordenadas daquele bloco.
  useEffect(() => {
    const sub = form.watch((value, { name }) => {
      if (isGeocodingRef.current || !name) return
      if (camposComercio.includes(name)) {
        if (value.comercioLat != null || value.comercioLng != null) {
          form.setValue("comercioLat", undefined)
          form.setValue("comercioLng", undefined)
          setGpsComercio((p) => ({ ...p, coords: null, estado: "invalidada" }))
        }
      } else if (camposPrincipal.includes(name)) {
        if (value.lat != null || value.lng != null) {
          form.setValue("lat", undefined)
          form.setValue("lng", undefined)
          setGpsPrincipal((p) => ({ ...p, coords: null, estado: "invalidada" }))
        }
      }
    })
    return () => sub.unsubscribe()
  }, [form])

  async function capturarBloco(
    geo: UseGeolocationReturn,
    aplicarCoords: (lat: number, lng: number) => void,
    aplicarTexto: (end: Partial<EnderecoTexto>) => void,
    setBloco: (updater: (p: BlocoGps) => BlocoGps) => void,
  ) {
    const r = await geo.capturar()
    if (!r) return
    isGeocodingRef.current = true
    aplicarCoords(r.localizacao.lat, r.localizacao.lng)
    aplicarTexto(r.endereco)
    isGeocodingRef.current = false
    setBloco(() => ({
      coords: r.localizacao,
      estado: "capturada",
      aviso: r.origem === "gps" ? t("gps.avisoGeocode") : null,
    }))
  }

  const capturarComercio = () =>
    capturarBloco(
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
      },
      setGpsComercio,
    )

  const capturarPrincipal = () =>
    capturarBloco(
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
      setGpsPrincipal,
    )

  function buildPayload(data: ClienteFormData): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      foto: data.foto || (editing ? null : undefined),
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

  function blocoComercio(prefix: "comercio" | ""): Record<"logradouro" | "numero" | "bairro" | "cidade" | "uf", keyof ClienteFormData> {
    return {
      logradouro: prefix ? "comercioLogradouro" : "logradouro",
      numero: prefix ? "comercioNumero" : "numero",
      bairro: prefix ? "comercioBairro" : "bairro",
      cidade: prefix ? "comercioCidade" : "cidade",
      uf: prefix ? "comercioEstado" : "estado",
    }
  }

  function EnderecoFields({ prefix, comComplemento }: { prefix: "comercio" | ""; comComplemento: boolean }) {
    const f = blocoComercio(prefix)
    return (
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label={t("cliente.logradouro")}
            required={!prefix}
            error={!prefix ? errors.logradouro?.message : undefined}
            {...form.register(f.logradouro)}
          />
        </div>
        <Field label={t("cliente.numero")} inputMode="numeric" {...form.register(f.numero)} />
        {comComplemento && <Field label={t("cliente.complemento")} placeholder={t("cliente.complementoPlaceholder")} {...form.register("complemento")} />}
        <Field label={t("cliente.bairro")} {...form.register(f.bairro)} />
        <Field
          label={t("cliente.cidade")}
          error={!prefix ? errors.cidade?.message : undefined}
          {...form.register(f.cidade)}
        />
        <FieldSelect
          label={t("cliente.uf")}
          placeholder={t("cliente.ufPlaceholder")}
          options={UFS.map((u) => ({ value: u, label: u }))}
          error={!prefix ? errors.estado?.message : undefined}
          {...form.register(f.uf)}
        />
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
      <Card.Root variant="detail">
        <Card.Header className="border-b border-border-light pb-3">
          <UserRound className="size-4 text-primary-text" aria-hidden />
          <Card.Title>{t("cliente.identificacao")}</Card.Title>
        </Card.Header>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AvatarField
              nome={form.watch("nome") || ""}
              foto={form.watch("foto") ?? null}
              onChange={(f) => form.setValue("foto", f ?? undefined)}
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label={t("cliente.nome")}
              required
              autoFocus
              error={errors.nome?.message}
              {...form.register("nome")}
            />
          </div>
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
        </div>
      </Card.Root>

      <Card.Root variant="detail">
        <Card.Header className="border-b border-border-light pb-3">
          <Store className="size-4 text-primary-text" aria-hidden />
          <Card.Title>{t("cliente.comercio")}</Card.Title>
        </Card.Header>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field
            label={t("cliente.nomeComercio")}
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
        </div>
      </Card.Root>

      <Card.Root variant="detail">
        <Card.Header className="border-b border-border-light pb-3">
          <Store className="size-4 text-primary-text" aria-hidden />
          <Card.Title>{t("cliente.enderecoComercio")}</Card.Title>
        </Card.Header>
        <div className="p-4">
          <GpsControl
            coords={gpsComercio.coords}
            estado={gpsComercio.estado}
            capturando={geoComercio.capturando}
            erro={geoComercio.erro ? t(geoComercio.erro) : null}
            aviso={gpsComercio.aviso}
            onCapturar={capturarComercio}
          />
          <EnderecoFields prefix="comercio" comComplemento={false} />
        </div>
      </Card.Root>

      <Card.Root variant="detail">
        <Card.Header className="border-b border-border-light pb-3">
          <UserRound className="size-4 text-primary-text" aria-hidden />
          <Card.Title>{t("cliente.endereco")}</Card.Title>
        </Card.Header>
        <div className="p-4">
          <GpsControl
            coords={gpsPrincipal.coords}
            estado={gpsPrincipal.estado}
            capturando={geoPrincipal.capturando}
            erro={geoPrincipal.erro ? t(geoPrincipal.erro) : null}
            aviso={gpsPrincipal.aviso}
            onCapturar={capturarPrincipal}
          />
          <EnderecoFields prefix="" comComplemento />
        </div>
      </Card.Root>

      <div className="flex gap-4">
        <Button type="submit" className="flex-1">
          <Check className="size-4" /> {t("common.save")}
        </Button>
        <Button variant="ghost" type="button" onClick={onCancel} className="flex-1">
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  )
}
