import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    // Uma única cópia de React (root = 18.3.1, alinhado ao frontend). Evita
    // "invalid hook call / element from an older version of react".
    dedupe: ["react", "react-dom"],
  },
  test: {
    // Default: node (unit backend). Componentes usam docblock `// @vitest-environment jsdom`.
    environment: "node",
    globals: true,
    setupFiles: ["frontend/src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // PLAN-067 F4: REPORTAR sem bloquear no início (meta sobe gradual com a rotina de testes).
      thresholds: { statements: 0 },
    },
  },
})
