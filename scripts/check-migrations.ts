import postgres from 'postgres';

const sql = postgres(process.env.DIRECT_URL!, { prepare: false });

async function main() {
  const rows = await sql`SELECT * FROM drizzle.__drizzle_migrations`;
  console.log(rows);
  await sql.end();
}

main();