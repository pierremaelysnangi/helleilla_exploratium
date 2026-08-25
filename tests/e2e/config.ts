/**
 * Configuration partagée des tests E2E.
 * Point de référence unique pour : les ports des services Docker
 * (docker-compose.test.yml), les variables d'environnement à injecter
 * dans le serveur Next et les workers BullMQ, et les comptes de test.
 * Importer ce module a un effet de bord volontaire : il renseigne
 * `process.env` pour que les imports ultérieurs de `@/lib/env` valident.
 */

/** Port du serveur Next.js sous test (décalé du 3000 dev). */
export const PORT = 3100;
/** URL de base du serveur sous test. */
export const BASE_URL = `http://localhost:${PORT}`;

// Renseigne l'environnement AVANT tout import de @/lib/env (validation zod).
Object.assign(process.env, {
  DATABASE_URL: "postgresql://e2e:e2e@localhost:5433/e2e",
  DIRECT_URL: "postgresql://e2e:e2e@localhost:5433/e2e",
  REDIS_URL: "redis://localhost:6380",
  MEILI_HOST: "http://localhost:7701",
  MEILI_MASTER_KEY: "e2e_master_key_1234567890",
  MINIO_ENDPOINT: "http://localhost:9002",
  MINIO_ROOT_USER: "e2euser",
  MINIO_ROOT_PASSWORD: "e2epassword",
  MINIO_BUCKET: "e2e-bucket",
  BETTER_AUTH_SECRET: "e2e_secret_at_least_32_characters_long_ok",
  BETTER_AUTH_URL: BASE_URL,
  NEXT_PUBLIC_APP_URL: BASE_URL,
  // Désactive le rate limiter Better Auth : les suites E2E multi-rôles
  // dépassent les plafonds (5 sign-ins / 5 min) depuis l'IP unique de test.
  // Le rate limiting applicatif reste lui actif et testé côté routes.
  BETTER_AUTH_DISABLE_RATE_LIMIT: "1",
});

/** Comptes de test créés par le seed (un par rôle RBAC utile). */
export const TEST_USERS = {
  admin: {
    email: "admin@e2e.test",
    password: "Admin-Passw0rd-e2e",
    name: "Admin E2E",
    role: "admin",
  },
  moderator: {
    email: "moderator@e2e.test",
    password: "Moderator-Passw0rd-e2e",
    name: "Moderator E2E",
    role: "moderator",
  },
  contributor: {
    email: "contributor@e2e.test",
    password: "Contributor-Passw0rd",
    name: "Contributor E2E",
    role: "contributor",
  },
  user: {
    email: "user@e2e.test",
    password: "User-Passw0rd-e2e!",
    name: "User E2E",
    role: "user",
  },
} as const;
