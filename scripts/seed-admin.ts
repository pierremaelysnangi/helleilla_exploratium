/**
 * Script de seed : crée le compte administrateur initial.
 * Lit ADMIN_EMAIL / ADMIN_PASSWORD depuis l'environnement, crée l'utilisateur
 * via l'API Better Auth s'il n'existe pas, puis force son rôle "admin"
 * en SQL direct (le champ rôle étant interdit en entrée côté client).
 */

import { auth } from "@/lib/auth"; // Serveur Better Auth (pour signUpEmail)
import { authDb } from "@/lib/auth-db"; // Base IDENTITÉ dédiée (RGPD)
import { db } from "@/db"; // Base CONTENU (profils publics)
import { user } from "@/db/schema";
import { profiles } from "@/db/schema/profiles";
import { eq } from "drizzle-orm"; // Opérateur de comparaison SQL

// Identifiants de l'admin fournis par les variables d'environnement
const EMAIL = process.env.ADMIN_EMAIL!;
const PASSWORD = process.env.ADMIN_PASSWORD!;

/**
 * Point d'entrée du script : vérifie les variables requises, crée le compte
 * admin si absent, force le rôle "admin" puis termine le processus.
 */
async function main() {
  if (!EMAIL || !PASSWORD)
    throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD requis");

  const existing = await authDb.query.user.findFirst({
    where: eq(user.email, EMAIL),
  });
  if (!existing) {
    await auth.api.signUpEmail({
      body: { email: EMAIL, password: PASSWORD, name: "Admin" },
    });
  }

  // Le rôle est en input:false → on le force en SQL direct
  await authDb.update(user).set({ role: "admin" }).where(eq(user.email, EMAIL));
  // Synchronise la projection publique (profiles) dans la base contenu
  const [updated] = await authDb
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, EMAIL));
  await db
    .update(profiles)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(profiles.userId, updated.id));
  console.log(`✅ Admin: ${EMAIL} (rôle synchronisé dans profiles)`);
  process.exit(0);
}

main();
