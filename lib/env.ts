import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),

  MEILI_HOST: z.string().url(),
  MEILI_MASTER_KEY: z.string().min(16),

  REDIS_URL: z.string().url(),

  MINIO_ENDPOINT: z.string().url(),
  MINIO_ROOT_USER: z.string().min(3),
  MINIO_ROOT_PASSWORD: z.string().min(8),
  MINIO_BUCKET: z.string().min(1),
});

export const env = envSchema.parse(process.env);