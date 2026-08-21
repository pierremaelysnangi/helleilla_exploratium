import { z } from "zod";

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
});

export const env = envSchema.parse(process.env);