import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Users } from "lucide-react"
import { SearchBar } from "../../../shared/components/SearchBar/SearchBar.js"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ClienteCard } from "../components/ClienteCard.js"
import {
  listClientes,
  type Cliente,
} from "../services/cliente.service.js"
import { ApiError } from "../../../api/client.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { ButtonLink } from "../../../shared/components/Button.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { useFab } from "../../../shared/fab/FabContext.js"


export function ClienteList() {
  const { t } = useTranslation()
  const { setFab } = useFab()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const usuarioId = searchParams.get("usuarioId") || ""
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetch = useCallback(async (q?: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await listClientes(q ? { q, usuarioId: usuarioId || undefined } : { usuarioId: usuarioId || undefined })
      setClientes(result.data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(t("cliente.erroCarregar"))
      }
    } finally {
      setLoading(false)
    }
  }, [usuarioId])

  // FAB mobile (PLAN-062): "Novo cliente" — limpa no unmount. Em visão de operador (drill-down) não cria.
  useEffect(() => {
    setFab(!usuarioId ? { label: t("cliente.novo"), to: "/clientes/novo" } : null)
    return () => setFab(null)
  }, [setFab, t, usuarioId])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      fetch(searchTerm || undefined)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchTerm, fetch])

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={Users}
        title={usuarioId ? t("cliente.visaoOperador") : t("cliente.title")}
        subtitle={usuarioId ? t("cliente.visaoOperadorSub") : t("cliente.subtitle")}
        back={{ onClick: () => navigate("/"), title: t("nav.central") }}
        action={!usuarioId ? <ButtonLink to="/clientes/novo" variant="primary" size="sm"><Plus className="size-4" /> {t("cliente.novo")}</ButtonLink> : undefined}
      />

      <div className="mb-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t("cliente.buscarPlaceholder")}
        />
      </div>

      <EstadoTela
        loading={loading}
        error={error}
        empty={clientes.length === 0}
        emptyMessage={t("cliente.nenhumEncontrado")}
        emptyAction={!usuarioId ? { label: t("cliente.novo"), to: "/clientes/novo" } : undefined}
        onRetry={() => fetch(searchTerm || undefined)}
      >
        <div className="space-y-4">
          {clientes.map((cliente) => (
            <Link key={cliente.id} to={`/clientes/${cliente.id}${usuarioId ? `?usuarioId=${usuarioId}` : ""}`} className="block">
              <ClienteCard variant="list-item" cliente={cliente} />
            </Link>
          ))}
        </div>
      </EstadoTela>
    </div>
  )
}
