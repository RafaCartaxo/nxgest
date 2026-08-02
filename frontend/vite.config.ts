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
})
