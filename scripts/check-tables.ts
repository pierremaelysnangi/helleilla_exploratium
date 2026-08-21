import postgres from 'postgres';

const sql = postgres(process.env.DIRECT_URL!, { prepare: false });

async function main() {
  const rows = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `;
  console.log(rows);
  await sql.end();
}

main();