/**
 * Routes /api/profile — profil de l'utilisateur connecté.
 *
 * Lit la projection publique (`profiles`, base contenu) plutôt que la base
 * identité : c'est exactement ce à quoi elle sert, et cela évite d'ouvrir
 * un accès aux données sensibles pour un besoin qui ne les requiert pas.
 *
 * L'écriture, elle, passe par Better Auth : ses `databaseHooks` répliquent
 * alors le nom vers `profiles`. Écrire directement dans la projection
 * laisserait `user.name` en arrière, et les deux valeurs divergeraient.
 */

import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations/profile";
import { getProfileByUserId } from "@/db/queries/profiles";

/** GET /api/profile — profil public de l'appelant. */
export const GET = route(
  { auth: true, rateLimit: { limit: 60, window: 60 } },
  async ({ session }) => {
    const profile = await getProfileByUserId(session!.user.id);
    if (!profile) return fail("NOT_FOUND", "Profil introuvable");
    return ok(profile);
  },
);

/**
 * PATCH /api/profile — met à jour le nom affiché.
 *
 * @returns 200 avec le profil à jour.
 */
export const PATCH = route(
  {
    auth: true,
    body: updateProfileSchema,
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ body, session }) => {
    // Passage par Better Auth : ses hooks synchronisent `profiles`
    await auth.api.updateUser({
      body: { name: body.displayName },
      headers: await headers(),
    });

    const profile = await getProfileByUserId(session!.user.id);
    if (!profile) return fail("NOT_FOUND", "Profil introuvable");
    return ok(profile);
  },
);
