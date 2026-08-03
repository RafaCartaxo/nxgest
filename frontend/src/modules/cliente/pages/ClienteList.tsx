import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"
import { SearchBar } from "../../../shared/components/SearchBar/SearchBar.js"
import { Link, useNavigate } from "react-router-dom"
import { ClienteCard } from "../components/ClienteCard.js"
import {
  listClientes,
  type Cliente,
} from "../services/cliente.service.js"
import { ApiError } from "../../../api/client.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { ButtonLink } from "../../../shared/components/Button.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"


export function ClienteList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetch = useCallback(async (nome?: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await listClientes(nome ? { nome } : undefined)
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
  }, [])

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
        title={t("cliente.title")}
        subtitle={t("cliente.subtitle")}
        back={{ onClick: () => navigate("/"), title: t("nav.central") }}
        action={<ButtonLink to="/clientes/novo" variant="onDark">{t("cliente.novo")}</ButtonLink>}
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
        emptyAction={{ label: t("cliente.novo"), to: "/clientes/novo" }}
        onRetry={() => fetch(searchTerm || undefined)}
      >
        <div className="space-y-4">
          {clientes.map((cliente) => (
            <Link key={cliente.id} to={`/clientes/${cliente.id}`} className="block">
              <ClienteCard variant="list-item" cliente={cliente} />
            </Link>
          ))}
        </div>
      </EstadoTela>
    </div>
  )
}
