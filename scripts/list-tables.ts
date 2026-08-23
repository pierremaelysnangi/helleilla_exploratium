import { sql } from "drizzle-orm";
import { db } from "@/db";

async function main() {
  const r = await db.execute(sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' ORDER BY table_name
  `);
  console.table(r);
  process.exit(0);
}

main();
