import path from "path"
import { readFileSync, writeFileSync } from "fs"
import { createHash } from "crypto"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import basicSsl from "@vitejs/plugin-basic-ssl"
import type { Plugin } from "vite"

const apiTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:3000"

// PLAN-079 (F1): cache-busting automático do service worker. A cada build, injeta
// no dist/sw.js um hash do index.html gerado — o `activate` do SW apaga caches
// antigos, eliminando a mistura de hashes de chunks que causava o erro
// "text/html is not a valid JavaScript MIME type" pós-code-splitting.
function cacheBustingSw(): Plugin {
  return {
    name: "nxgest-cache-busting-sw",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist")
      const htmlPath = path.join(dist, "index.html")
      const swPath = path.join(dist, "sw.js")
      let html: string
      try {
        html = readFileSync(htmlPath, "utf8")
      } catch {
        this.warn("[cacheBustingSw] index.html não encontrado em dist/ — pulando")
        return
      }
      const hash = createHash("sha1").update(html).digest("hex").slice(0, 12)
      try {
        const sw = readFileSync(swPath, "utf8")
        if (!sw.includes("__NXGEST_CACHE_VERSION__")) {
          this.warn("[cacheBustingSw] placeholder __NXGEST_CACHE_VERSION__ ausente no sw.js — pulando")
          return
        }
        writeFileSync(swPath, sw.replace("__NXGEST_CACHE_VERSION__", `nxgest-${hash}`), "utf8")
        this.info(`[cacheBustingSw] CACHE do SW versionado: nxgest-${hash}`)
      } catch {
        this.warn("[cacheBustingSw] sw.js não encontrado em dist/ — pulando")
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), basicSsl(), cacheBustingSw()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    https: true,
    host: "0.0.0.0",
    proxy: {
      "/api": apiTarget,
    },
  },
  build: {
    // PLAN-077 (performance): isola o vendor (react/react-router/i18n) do app —
    // primeiro load menor e cache do vendor estável entre deploys.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          vendor: ["react-i18next", "i18next", "lucide-react"],
        },
      },
    },
  },
})
