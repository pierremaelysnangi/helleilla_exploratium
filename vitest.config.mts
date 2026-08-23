import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "lib/actions/**/*.ts",
        "lib/rbac/**/*.ts",
        "lib/validations/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/__tests__/**"],
      thresholds: {
        statements: 70,
        branches: 45,
        functions: 55,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: { "@": import.meta.dirname },
  },
});
