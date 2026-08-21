import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

const sql = postgres(process.env.DIRECT_URL!, { prepare: false });

const migrationSQL = readFileSync('db/migrations/0000_grey_luckman.sql', 'utf-8');
const hash = createHash('sha256').update(migrationSQL).digest('hex');

async function main() {
  await sql`
    CREATE SCHEMA IF NOT EXISTS drizzle;
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `;
  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash}, ${Date.now()});
  `;
  console.log('Migration marked as applied:', hash);
  await sql.end();
}

main();