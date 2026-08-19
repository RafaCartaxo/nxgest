import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { I18nextProvider } from "react-i18next"
import { ThemeProvider } from "./shared/theme/ThemeProvider.js"
import { App } from "./App.js"
import i18n from "./i18n/config.js"
import "./index.css"

// PLAN-083 Fase 8.0: defaults globais do React Query.
// - staleTime 30s: cache server-state em memória; telas operacionais são quase-em-tempo-real,
//   então 30s equilibra frescor x quantidade de requests.
// - refetchOnWindowFocus + staleTime: ao voltar à aba só refaz se o dado estiver velho
//   (substitui os handlers manuais de visibilitychange — Fase 8.2).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

// SW registrado SÓ em produção: em dev (cert auto-assinado / IP local) o SW
// cachearia assets e atrapalharia o teste — e o Chrome Android não instala PWA
// fora de HTTPS válido. PWA é melhoria progressiva; falha não bloqueia o app.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // silencioso — instalabilidade é progressiva
    })
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </I18nextProvider>
    </ThemeProvider>
  </StrictMode>
)
