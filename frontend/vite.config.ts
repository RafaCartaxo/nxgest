import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import basicSsl from "@vitejs/plugin-basic-ssl"

const apiTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:3000"

export default defineConfig({
  plugins: [react(), basicSsl()],
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
