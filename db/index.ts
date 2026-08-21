import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// prepare: false → obligatoire avec le transaction pooler (pgbouncer)
const client = postgres(connectionString, {
  prepare: false,
  max: 10,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;