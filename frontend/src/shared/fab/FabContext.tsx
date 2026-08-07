import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface FabState {
  label: string
  to: string
}

interface FabContextType {
  fab: FabState | null
  setFab: (fab: FabState | null) => void
}

const FabContext = createContext<FabContextType | null>(null)

export function FabProvider({ children }: { children: ReactNode }) {
  const [fab, setFab] = useState<FabState | null>(null)
  const setFabCb = useCallback((f: FabState | null) => setFab(f), [])
  return <FabContext.Provider value={{ fab, setFab: setFabCb }}>{children}</FabContext.Provider>
}

export function useFab(): FabContextType {
  const ctx = useContext(FabContext)
  if (!ctx) throw new Error("useFab deve ser usado dentro de FabProvider")
  return ctx
}
