import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { listContratos as listContratosApi } from "../services/contrato.service.js"
import type { Contrato } from "../services/contrato.service.js"
import { listClientes } from "../../cliente/services/cliente.service.js"
import type { Cliente } from "../../cliente/services/cliente.service.js"
import { ChevronDown, X, FileText } from "lucide-react"
import { ContratoCard } from "../components/ContratoCard.js"
import { ApiError } from "../../../api/client.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { Button, ButtonLink } from "../../../shared/components/Button.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"

export function ContratoList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const page = Number(searchParams.get("page")) || 1
  const clienteId = searchParams.get("clienteId") || ""

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listContratosApi({
        page,
        limit: 20,
        clienteId: clienteId || undefined,
      })
      setContratos(result.data)
      setTotalPages(result.pagination.pages)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(t("contrato.erroCarregar"))
      }
    } finally {
      setLoading(false)
    }
  }, [page, clienteId])

  const fetchClientes = useCallback(async () => {
    try {
      const result = await listClientes({ limit: 100 })
      setClientes(result.data)
    } catch {
      // silencioso
    }
  }, [])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
        setSearchTerm("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    if (filterOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [filterOpen])

  function handleClienteFilter(value: string) {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set("clienteId", value)
    } else {
      params.delete("clienteId")
    }
    params.set("page", "1")
    setSearchParams(params)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams)
    params.set("page", String(newPage))
    setSearchParams(params)
  }

  const temFiltroCliente = !!clienteId

  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase()
    return (
      c.nome.toLowerCase().includes(term) ||
      (c.comercio && c.comercio.toLowerCase().includes(term))
    )
  })

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={FileText}
        title={t("contrato.title")}
        subtitle={t("contrato.subtitle")}
        back={{ onClick: () => navigate(temFiltroCliente ? `/clientes/${clienteId}` : "/clientes"), title: t("nav.clientes") }}
        action={<ButtonLink to={`/contratos/novo${clienteId ? `?clienteId=${clienteId}` : ""}`} variant="onDark">{t("contrato.novo")}</ButtonLink>}
      />

      <div className="mb-4 flex items-center gap-2">
        <div ref={dropdownRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex w-full items-center justify-between rounded-md border border-border bg-surface p-2 text-sm"
          >
            <span className={clienteId ? "" : "text-text-muted"}>
              {clienteId
                ? clientes.find((c) => c.id === clienteId)?.nome || "..."
                : t("contrato.todosClientes")}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${filterOpen ? "rotate-180" : ""}`}
            />
          </button>
          {filterOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-surface shadow-lg">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("contrato.buscarCliente")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-b border-border-light px-3 py-2 text-base outline-none"
              />
              <div className="max-h-48 overflow-auto">
                <button
                  type="button"
                  onClick={() => { handleClienteFilter(""); setFilterOpen(false); setSearchTerm("") }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary-light"
                >
                  {t("contrato.todosClientes")}
                </button>
                {filteredClientes.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { handleClienteFilter(c.id); setFilterOpen(false); setSearchTerm("") }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-secondary-light ${
                      c.id === clienteId ? "bg-primary-light font-medium" : ""
                    }`}
                  >
                    {c.nome}
                    {c.comercio ? ` — ${c.comercio}` : ""}
                  </button>
                ))}
                {filteredClientes.length === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-text-muted">
                        {t("contrato.nenhumClienteEncontrado")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        {temFiltroCliente && (
          <Button
            variant="ghost"
            onClick={() => handleClienteFilter("")}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            {t("contrato.limpar")}
          </Button>
        )}
      </div>

      <EstadoTela
        loading={loading}
        error={error}
        empty={contratos.length === 0}
        emptyMessage={t("contrato.nenhumEncontrado")}
        emptyAction={!clienteId ? { label: t("contrato.novo"), to: "/contratos/novo" } : undefined}
        onRetry={fetch}
      >
        <div className="space-y-3">
          {contratos.map((c) => (
            <Link key={c.id} to={`/contratos/${c.id}`} className="block">
              <ContratoCard variant="list-item" contrato={c} />
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              {t("contrato.paginacao.anterior")}
            </Button>
            <span className="text-sm text-text-secondary">
              {page} {t("contrato.paginacao.de")} {totalPages}
            </span>
            <Button
              variant="secondary"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              {t("contrato.paginacao.proximo")}
            </Button>
          </div>
        )}
      </EstadoTela>
    </div>
  )
}
