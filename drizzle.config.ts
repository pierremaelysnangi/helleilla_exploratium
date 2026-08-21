import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.env.local' });

export default defineConfig({
  schema: './db/schema/index.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Session pooler (5432) — nécessaire pour le DDL
    url: process.env.DIRECT_URL!,
  },
  verbose: true,
  strict: true,
});