/**
 * Migration de l'identité vers la base dédiée (cloisonnement RGPD).
 *
 * Copie les tables user / session / account / verification depuis la
 * base applicative (DATABASE_URL) vers la base identité
 * (AUTH_DATABASE_URL), en préservant les identifiants existants.
 *
 * Sécurité du processus :
 * - refuse de s'exécuter si AUTH_DATABASE_URL n'est pas définie ;
 * - refuse si source == cible (aucune opération destructrice accidentelle) ;
 * - n'applique AUCUN DROP : les instructions SQL de nettoyage sont
 *   affichées à la fin, pour exécution manuelle après vérification.
 *
 * Usage : pnpm exec tsx --env-file=.env.local scripts/migrate-auth-db.ts
 */

// Clients SQL source (contenu) et cible (identité)
import postgres from "postgres";
import { createHash } from "crypto";

const SOURCE_URL = process.env.DATABASE_URL;
const TARGET_URL = process.env.AUTH_DATABASE_URL;

/** Tables d'identité à copier, dans l'ordre des dépendances FK. */
const TABLES = ["user", "session", "account", "verification"] as const;

async function main() {
  if (!SOURCE_URL || !TARGET_URL) {
    console.error(
      "❌ DATABASE_URL et AUTH_DATABASE_URL sont requis. Configurez d'abord la base identité dédiée.",
    );
    process.exit(1);
  }
  if (
    createHash("sha256").update(SOURCE_URL).digest("hex") ===
    createHash("sha256").update(TARGET_URL).digest("hex")
  ) {
    console.error(
      "❌ La source et la cible sont identiques : configurez un projet Supabase distinct pour l'identité.",
    );
    process.exit(1);
  }

  const source = postgres(SOURCE_URL, { max: 1 });
  const target = postgres(TARGET_URL, { max: 1 });

  try {
    // 0. La cible doit avoir le schéma auth appliqué :
    //    pnpm exec drizzle-kit migrate --config=drizzle.auth.config.ts
    for (const table of TABLES) {
      const [exists] =
        await target`SELECT to_regclass(${`public.${table}`}) AS reg`;
      if (!exists?.reg) {
        console.error(
          `❌ Table "${table}" absente de la cible. Appliquez d'abord les migrations :\n` +
            `   pnpm db:generate:auth && pnpm db:migrate:auth`,
        );
        process.exit(1);
      }
    }

    let totalCopied = 0;
    for (const table of TABLES) {
      const rows = await source`SELECT * FROM ${source(table)}`;
      if (rows.length === 0) {
        console.log(`ℹ️ ${table} : 0 ligne`);
        continue;
      }

      // Copie par lots avec upsert sur la clé primaire (idempotence)
      await target.begin(async (tx) => {
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          await tx`
            INSERT INTO ${tx(table)} ${tx(batch)}
            ON CONFLICT (id) DO NOTHING
          `;
        }
      });
      totalCopied += rows.length;
      console.log(`✅ ${table} : ${rows.length} lignes copiées`);
    }

    console.log(
      `\n✅ Migration terminée (${totalCopied} lignes).\n\n` +
        `Vérifiez ensuite la connexion (sign-in) puis supprimez manuellement ` +
        `les tables de la base CONTENU :\n` +
        TABLES.map((t) => `DROP TABLE IF EXISTS "public"."${t}" CASCADE;`).join(
          "\n",
        ),
    );
  } finally {
    await source.end({ timeout: 5 });
    await target.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("❌ Échec de la migration :", err);
  process.exit(1);
});
