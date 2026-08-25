import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildDocument } from "../lib/api/openapi";

async function main() {
  const out = resolve(process.cwd(), "openapi/openapi.json");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(buildDocument(), null, 2)}\n`, "utf8");
  console.log(`✅ OpenAPI exporté → ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
