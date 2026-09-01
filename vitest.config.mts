import { createRequire } from "node:module";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Les tests E2E (serveur réel + services Docker) ont leur config dédiée
    exclude: ["**/node_modules/**", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      include: [
        "lib/actions/**/*.ts",
        "lib/rbac/**/*.ts",
        "lib/validations/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/__tests__/**"],
      // Seuils calés ~5 points sous le mesuré (99,4 / 100 / 100 / 99,4) :
      // une régression est signalée sans qu'un refactor légitime casse la CI.
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
      // `server-only` est un marqueur résolu en interne par le bundler Next :
      // le paquet n'existe PAS dans node_modules. Sans cet alias, Vite échoue
      // à résoudre l'import de lib/actions/auth.ts et password-reset.ts, donc
      // aucun test ne peut les charger (d'où leur 0 % de couverture).
      // On pointe vers le module vide compilé livré par Next ; installer le
      // vrai paquet est exclu, son index.js lève hors contexte react-server.
      "server-only": require.resolve("next/dist/compiled/server-only/empty.js"),
    },
  },
});
