/**
 * Validation des variables d'environnement.
 * Utilise Zod pour vérifier au démarrage que toutes les variables requises
 * (base de données, Meilisearch, Redis, MinIO, Better Auth) sont présentes
 * et bien formées. Le processus plante immédiatement si une variable manque,
 * évitant les erreurs silencieuses en production.
 */

// Bibliothèque de validation de schéma runtime
import { z } from "zod";

// Schéma décrivant toutes les variables d'environnement attendues et leurs contraintes
const envSchema = z.object({
  DATABASE_URL: z.string().url(),

  // meili
  MEILI_HOST: z.string().url(),
  MEILI_MASTER_KEY: z.string().min(16),

  // redis
  REDIS_URL: z.string().url(),

  // minio
  MINIO_ENDPOINT: z.string().url(),
  MINIO_ROOT_USER: z.string().min(3),
  MINIO_ROOT_PASSWORD: z.string().min(8),
  MINIO_BUCKET: z.string().min(1),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // URL publique utilisée par le fetcher RSC et les documents OpenAPI
  // (défaut local pour ne pas casser tests/build sans configuration)
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Secret machine-to-machine du endpoint de révalidation ISR.
  // Optionnel : si absent, POST /api/revalidate répond 503 (désactivé).
  REVALIDATE_SECRET: z.string().min(16).optional(),

  // Service d'embeddings (Ollama local par défaut). Le job échoue
  // proprement (et est retenté) si le service ne répond pas.
  EMBEDDINGS_BASE_URL: z.string().url().default("http://localhost:11434"),
  EMBEDDINGS_MODEL: z.string().min(1).default("nomic-embed-text"),

  // Token API Discogs (photos/bio artistes). Optionnel : le provider
  // dégrade proprement (résultats vides) si absent. https://www.discogs.com/settings/developers
  DISCOGS_TOKEN: z.string().min(8).optional(),

  // Base identité DÉDIÉE (RGPD) : user/session/account/verification dans
  // un projet Supabase séparé du contenu. Prend la priorité sur
  // AUTH_DATABASE_URL (repli mono-base) puis DATABASE_URL.
  IDENTITY_AUTH_DATABASE_URL: z.string().url().optional(),
  AUTH_DATABASE_URL: z.string().url().optional(),

  // Cloudflare Turnstile (CAPTCHA invisible sur l'inscription).
  // Optionnels : sans secret, la vérification est désactivée et
  // l'inscription repose uniquement sur le rate limiting Better Auth.
  TURNSTILE_SECRET_KEY: z.string().min(10).optional(),

  // SMTP transactionnel (emails de réinitialisation de mot de passe).
  // Optionnels : sans configuration, le lien de reset est journalisé en
  // console (mode dev) au lieu d'être envoyé.
  SMTP_HOST: z.string().min(3).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().email().optional(),
});

/**
 * Objet `env` validé et typé, à importer partout dans l'application
 * au lieu de lire directement `process.env`.
 * Lance une erreur (avec le détail des variables manquantes) si la validation échoue.
 */
export const env = envSchema.parse(process.env);
