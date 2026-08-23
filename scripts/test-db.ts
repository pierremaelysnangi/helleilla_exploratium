import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const url = new URL(process.env.DATABASE_URL!);
console.log("host :", url.hostname);
console.log("port :", url.port);
console.log("user :", url.username);
console.log("db   :", url.pathname);

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

  const result = await sql`SELECT version()`;
  console.log("✅ Connexion OK :", result[0].version);

  await sql.end();
}

main().catch((err) => {
  console.error("❌ Échec de connexion :", err);
  process.exit(1);
});
