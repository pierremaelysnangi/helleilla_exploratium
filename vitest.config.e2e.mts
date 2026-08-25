/**
 * Configuration Vitest dédiée aux tests E2E.
 * Séparée de vitest.config.mts : pas de mocks (vitest.setup.ts exclu),
 * timeouts larges (build + serveur), exécution séquentielle (une seule
 * instance pour ne pas corrompre l'état partagé DB/Meili).
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/e2e/**/*.test.ts"],
    // Exécution séquentielle : les specs partagent le même serveur et
    // la même base ; pas de parallélisme inter-fichiers.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 300_000,
    teardownTimeout: 30_000,
    globalSetup: ["./tests/e2e/setup/global-setup.ts"],
  },
  resolve: {
    alias: { "@": import.meta.dirname },
  },
});
