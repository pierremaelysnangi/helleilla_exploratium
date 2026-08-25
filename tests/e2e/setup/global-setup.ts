/**
 * Setup global des tests E2E (hook `globalSetup` de Vitest).
 * Séquence exécutée une fois avant toute la suite :
 * 1. création de l'extension pgvector + migrations Drizzle sur la DB e2e ;
 * 2. seed des comptes de test (un par rôle) via Better Auth + SQL direct ;
 * 3. build Next.js (sauf si E2E_SKIP_BUILD=1) ;
 * 4. démarrage du serveur (`next start`) et des workers BullMQ ;
 * 5. attente de disponibilité HTTP.
 * Le teardown arrête les processus enfants ; la base n'est PAS nettoyée
 * (docker compose down -v s'en charge côté script npm).
 */

// Exécution de commandes shell (build, attente compose)
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";

// Constantes partagées + effet de bord : process.env renseigné
import { BASE_URL, PORT, TEST_USERS } from "../config";

/** Client postgres paresseux (chargé dynamiquement après config env). */
async function importPg() {
  const mod = await import("postgres");
  // Interop ESM/CJS : le constructeur vit dans le default export
  return mod.default;
}

/** Enfants à tuer au teardown. */
const children: ChildProcess[] = [];

/** Attend qu'une URL HTTP réponde sans exception (polling simple). */
async function waitForHttp(url: string, timeoutMs = 60_000, label = url) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = String(err);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timeout en attendant ${label} (${url}) : ${lastError}`);
}

export default async function globalSetup() {
  // 1. Base de données : extension pgvector puis migrations Drizzle
  const postgres = await importPg();
  const sql = postgres(process.env.DIRECT_URL!, { max: 1 });
  // Extensions requises par le schéma : pgvector (embeddings),
  // pg_trgm (index trigrammes de recherche), unaccent
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
  await sql`CREATE EXTENSION IF NOT EXISTS unaccent`;

  const [{ drizzle }, migrator] = await Promise.all([
    import("drizzle-orm/postgres-js"),
    import("drizzle-orm/postgres-js/migrator"),
  ]);
  const db = drizzle(sql);
  await migrator.migrate(db, { migrationsFolder: "./db/migrations" });

  // 2. Seed des comptes : signUp via Better Auth puis rôle forcé en SQL
  //    (le champ role est interdit en entrée côté API Better Auth).
  const { auth } = await import("@/lib/auth");
  const { user } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  for (const u of Object.values(TEST_USERS)) {
    try {
      await auth.api.signUpEmail({
        body: { email: u.email, password: u.password, name: u.name },
      });
    } catch {
      // Compte déjà présent (relance sur base existante) : on ignore
    }
    await db.update(user).set({ role: u.role }).where(eq(user.email, u.email));
  }

  // 3. Build de production (skippable en local pour itérer vite)
  if (!existsSync(".next/BUILD_ID") || !process.env.E2E_SKIP_BUILD) {
    if (!process.env.E2E_SKIP_BUILD) {
      await new Promise<void>((resolve, reject) => {
        console.info("[e2e] next build...");
        const build = spawn("pnpm", ["exec", "next", "build"], {
          stdio: "inherit",
        });
        build.on("exit", (code) =>
          code === 0 ? resolve() : reject(new Error(`next build: ${code}`)),
        );
      });
    }
  }

  // 3b. Initialisation des index Meilisearch (bands/albums/tracks) :
  //     multiSearch renvoie une erreur si un index n'existe pas encore,
  //     et le premier job d'indexation n'arrive qu'après une création.
  await new Promise<void>((resolve, reject) => {
    const init = spawn("./node_modules/.bin/tsx", ["scripts/init-meili.ts"], {
      env: process.env,
      stdio: "inherit",
    });
    init.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`init-meili: ${code}`)),
    );
  });

  // 4a. Workers BullMQ (indexation Meilisearch asynchrone)
  // Binaires directs (.bin) : le signal de teardown atteint le process
  // réel et non une enveloppe npm/pnpm qui le masquerait.
  const workers = spawn(
    "./node_modules/.bin/tsx",
    ["scripts/start-workers.ts"],
    {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  workers.stdout?.on("data", (d: Buffer) =>
    process.stdout.write(`[workers] ${d}`),
  );
  workers.stderr?.on("data", (d: Buffer) =>
    process.stderr.write(`[workers] ${d}`),
  );
  children.push(workers);

  // 4b. Serveur Next.js sous test
  const server = spawn(
    "./node_modules/.bin/next",
    ["start", "-p", String(PORT)],
    {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stdout?.on("data", (d: Buffer) => process.stdout.write(`[next] ${d}`));
  server.stderr?.on("data", (d: Buffer) => process.stderr.write(`[next] ${d}`));
  children.push(server);

  // 5. Disponibilité : serveur + Meilisearch + Redis
  await waitForHttp(`${BASE_URL}/api/openapi.json`, 90_000, "serveur Next");
  await waitForHttp(`${process.env.MEILI_HOST!}/health`, 30_000, "Meilisearch");

  // Teardown retourné à Vitest : SIGTERM puis SIGKILL après grâce,
  // fermeture du pool SQL et destruction des flux stdio qui maintiennent
  // l'event loop du processus Vitest.
  return async () => {
    for (const child of children) {
      child.kill("SIGTERM");
      child.stdout?.destroy();
      child.stderr?.destroy();
    }
    await new Promise((r) => setTimeout(r, 3_000));
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGKILL");
      }
    }
    await sql.end({ timeout: 5 });
  };
}
